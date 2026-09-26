import express from 'express';
import { randomBytes,createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Workspace } from './service.js';
import { fail } from './domain.js';
import { z,validate,mandateSchema } from './validation.js';
import { providerReportPDF } from './report-pdf.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const hash=t=>createHash('sha256').update(t).digest('hex');
export function createApp(db,{authMode=process.env.AUTH_MODE||'demo',origin=process.env.APP_ORIGIN||'http://127.0.0.1:4310',production=process.env.NODE_ENV==='production'}={}){
 if(production&&authMode==='demo')throw new Error('Demo authentication cannot run in production.');
 if(!['demo','supabase'].includes(authMode))throw new Error('Unsupported AUTH_MODE.');
 if(authMode==='supabase'&&(!process.env.SUPABASE_URL||!process.env.SUPABASE_PUBLISHABLE_KEY))throw new Error('Supabase authentication requires its URL and publishable key.');
 const hostedClient=async()=>{const {createClient}=await import('@supabase/supabase-js');return createClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});};
 const app=express(),service=new Workspace(db),attempts=new Map();
 app.disable('x-powered-by');
 app.use((req,res,next)=>{res.set({'X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','X-Frame-Options':'DENY','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'"});next();});
 app.use(express.json({limit:'6mb'}));
 app.use('/api',(req,res,next)=>{if(!['GET','HEAD'].includes(req.method)&&req.get('origin')!==origin)return res.status(403).json({error:'Request origin is not allowed.'});next();});
 const cookie=(res,token)=>res.set('Set-Cookie',`mandate_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${token?28800:0}${production?'; Secure':''}`);
 const token=req=>(req.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('mandate_session='))?.slice(16);
 app.get('/api/auth/config',async(req,res)=>res.json({mode:authMode,synthetic:authMode==='demo',accounts:authMode==='demo'?(await db.admin(tx=>tx.query('SELECT id,name,organisation_id FROM users ORDER BY id'))).rows:[]}));
 app.post('/api/login',async(req,res)=>{
  const key=req.ip,old=attempts.get(key)||{n:0,until:Date.now()+60000};if(old.until<Date.now()){old.n=0;old.until=Date.now()+60000;}if(++old.n>15)fail('Too many sign-in attempts. Try again in a minute.',429);attempts.set(key,old);
  if(authMode==='demo'){
   const uid=validate(z.string(),req.body.user_id),user=(await db.admin(tx=>tx.query('SELECT * FROM users WHERE id=$1',[uid]))).rows[0];if(!user)fail('Unknown fictional account.',401);
   const t=randomBytes(32).toString('base64url');await db.admin(tx=>tx.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '8 hours')",[hash(t),uid]));cookie(res,t);res.json({ok:true});
  }else{
   const credentials=validate(z.object({email:z.email(),password:z.string().min(1).max(256)}),req.body);const {data,error}=await (await hostedClient()).auth.signInWithPassword(credentials);if(error)fail('Sign-in failed. Check your details.',401);cookie(res,data.session.access_token);res.json({ok:true});
  }
 });
 app.post('/api/logout',async(req,res)=>{if(authMode==='demo'&&token(req))await db.admin(tx=>tx.query('DELETE FROM sessions WHERE token_hash=$1',[hash(token(req))]));cookie(res,'');res.json({ok:true});});
 app.use('/api',async(req,res,next)=>{
  const t=token(req);if(!t)fail('Please sign in.',401);let user;
  if(authMode==='demo')user=(await db.admin(tx=>tx.query('SELECT u.* FROM users u JOIN sessions s ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()',[hash(t)]))).rows[0];
  else{const {data,error}=await (await hostedClient()).auth.getUser(t);if(error||!data.user)fail('Session expired. Please sign in again.',401);user=(await db.admin(tx=>tx.query('SELECT * FROM users WHERE auth_id=$1',[data.user.id]))).rows[0];}
  if(!user)fail('No authorised brokerage membership was found.',401);req.user=user;next();
 });
 app.get('/api/bootstrap',async(req,res)=>res.json(await service.bootstrap(req.user)));
 app.get('/api/deals/:id',async(req,res)=>res.json(await service.workspace(req.user,req.params.id)));
 app.post('/api/deals',async(req,res)=>res.json(await service.mutation(req.user,req.get('Idempotency-Key'),{route:'create',...req.body},tx=>service.create(tx,req.user,req.body))));
 app.post('/api/deals/:id/:action',async(req,res)=>res.json(await service.mutation(req.user,req.get('Idempotency-Key'),{route:req.path,...req.body},tx=>service.action(tx,req.user,req.params.id,req.params.action,req.body))));
 app.get('/api/providers/:id/history',async(req,res)=>res.json(await db.tenant(req.user,async tx=>{if(!(await tx.query('SELECT id FROM capital_providers WHERE id=$1',[req.params.id])).rows.length)fail('Provider not found.',404);return service.providerHistory(tx,req.params.id,req.query.exclude_deal_id);}))); 
 app.post('/api/providers/:id/mandates',async(req,res)=>res.json(await service.mutation(req.user,req.get('Idempotency-Key'),{route:req.path,...req.body},async tx=>{
  const p=(await tx.query('SELECT id FROM capital_providers WHERE id=$1',[req.params.id])).rows[0];if(!p)fail('Provider not found.',404);
  const body=validate(z.object({id:z.string().min(1).max(180),effective_from:z.string().datetime({offset:true}),data:mandateSchema}),req.body);
  await tx.query('INSERT INTO provider_mandates(id,organisation_id,provider_id,effective_from,data) VALUES($1,$2,$3,$4,$5)',[body.id,req.user.organisation_id,p.id,body.effective_from,JSON.stringify(body.data)]);return {id:body.id};
 })));
 app.get('/api/documents/:id',async(req,res)=>{const d=await db.tenant(req.user,async tx=>(await tx.query('SELECT * FROM documents WHERE id=$1',[req.params.id])).rows[0]);if(!d)fail('Document not found.',404);res.type('text/csv').attachment(d.filename.replace(/[^a-zA-Z0-9._-]/g,'_')).send(d.content);});
 app.get('/api/reports/:id.pdf',async(req,res)=>{const r=await db.tenant(req.user,async tx=>(await tx.query('SELECT * FROM reports WHERE id=$1',[req.params.id])).rows[0]);if(!r)fail('Report not found.',404);const pdf=providerReportPDF(r),filename=`mandate-${r.audience}-provider-report.pdf`;res.set({'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${filename}"`,'Content-Length':pdf.length}).send(pdf);});
 app.get('/api/reports/:id',async(req,res)=>{const r=await db.tenant(req.user,async tx=>(await tx.query('SELECT * FROM reports WHERE id=$1',[req.params.id])).rows[0]);if(!r)fail('Report not found.',404);res.json(r);});
 app.use('/api',(req,res)=>res.status(404).json({error:'Not found.'}));
 app.use('/prototype',express.static(path.join(root,'MODEL/prototype'),{dotfiles:'deny'}));
 app.use(express.static(path.join(root,'MODEL/workspace'),{dotfiles:'deny'}));
 app.use((error,req,res,next)=>{const status=error.status||(['23503','23514','23505','42501'].includes(error.code)?422:500);if(status===500)console.error('Request failed:',error.code||error.name);res.status(status).json({error:status===500?'Unable to save this change. Please retry.':error.message});});
 return app;
}
