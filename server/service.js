import { createHash } from 'node:crypto';
import { id, fail, STATUSES, DECLINES, history, cents, readField, writeField, activeRecords, coverage, participationIssues } from './domain.js';
import { cleanProfile, validate, z, shortText, dateSchema } from './validation.js';
import { compareAll, legacyAnalysis, extractCSV, attachCSV, facilities } from './analysis.js';
import { searchPackages } from './packages.js';
const json=x=>JSON.stringify(x);
const sameDate=(a,b)=>(a?new Date(a).getTime():null)===(b?new Date(b).getTime():null);
const pick=(o,keys)=>Object.fromEntries(keys.filter(k=>o?.[k]!==undefined).map(k=>[k,o[k]]));
export class Workspace {
 constructor(db){this.db=db;}
 async mutation(user,key,body,fn){
  if(!key||key.length>180)fail('A request identifier is required.',400);
  const hash=createHash('sha256').update(json(body)).digest('hex');
  return this.db.tenant(user,async tx=>{
   await tx.query('SELECT pg_advisory_xact_lock(hashtext($1))',[user.organisation_id+key]);
   const old=(await tx.query('SELECT * FROM requests WHERE key=$1',[key])).rows[0];
   if(old){if(old.fingerprint!==hash)fail('This request identifier was already used for another change.',409);return old.response;}
   const response=await fn(tx);
   await tx.query('INSERT INTO requests(organisation_id,key,fingerprint,response) VALUES($1,$2,$3,$4)',[user.organisation_id,key,hash,json(response)]);return response;
  });
 }
 async event(tx,u,dealId,type,metadata={},match=null,previous=null,next=null,occurredAt=null){
  await tx.query('UPDATE deals SET updated_at=now() WHERE id=$1',[dealId]);
  await tx.query('INSERT INTO deal_events(id,organisation_id,deal_id,deal_match_id,provider_id,actor_user_id,event_type,metadata,previous_status,new_status,occurred_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,coalesce($11::timestamptz,now()))',[id(),u.organisation_id,dealId,match?.id||null,match?.provider_id||null,u.id,type,json(metadata),previous,next,occurredAt]);
 }
 async deal(tx,dealId,version){const d=(await tx.query('SELECT * FROM deals WHERE id=$1 FOR UPDATE',[dealId])).rows[0];if(!d)fail('Deal not found.',404);if(version!==undefined&&version!==d.version)fail('Another change was saved. Refresh and review before retrying.',409);return d;}
 async match(tx,dealId,matchId,version){const m=(await tx.query('SELECT * FROM deal_matches WHERE id=$1 AND deal_id=$2 FOR UPDATE',[matchId,dealId])).rows[0];if(!m)fail('Provider relationship not found.',404);if(version!==undefined&&version!==m.version)fail('This provider changed. Refresh before retrying.',409);return m;}
 async providers(tx,at=new Date()){
  const rows=(await tx.query('SELECT p.*, m.id AS mandate_id,m.effective_from,m.data AS mandate_data FROM capital_providers p JOIN LATERAL (SELECT * FROM provider_mandates m WHERE m.provider_id=p.id AND m.organisation_id=p.organisation_id AND m.effective_from <= $1 ORDER BY effective_from DESC,created_at DESC,id DESC LIMIT 1) m ON true ORDER BY p.name',[at])).rows;
  return rows.map(p=>({...p,mandate:{id:p.mandate_id,effective_from:p.effective_from,data:p.mandate_data}}));
 }
 async bootstrap(u){return this.db.tenant(u,async tx=>{
  const out={user:u,providers:await this.providers(tx)};
  for(const t of ['users','deals','deal_matches','deal_events','funding_records','tasks'])out[t]=(await tx.query('SELECT * FROM '+t)).rows;
  out.deal_events.sort((a,b)=>new Date(b.occurred_at)-new Date(a.occurred_at)||Number(b.sequence)-Number(a.sequence));
  out.organisation=(await tx.query('SELECT * FROM organisations')).rows[0];return out;
 });}
 async workspace(u,dealId){return this.db.tenant(u,async tx=>{
  const deal=await this.deal(tx,dealId),out={deal,providers:await this.providers(tx)};
  for(const t of ['profile_versions','documents','matching_runs','deal_matches','deal_events','deal_notes','packages','funding_records','tasks','reports','source_records'])out[t]=(await tx.query('SELECT * FROM '+t+' WHERE deal_id=$1',[dealId])).rows;
  out.documents=out.documents.map(({content,...d})=>d);
  out.match_results=(await tx.query('SELECT r.* FROM match_results r JOIN matching_runs m ON m.id=r.run_id WHERE m.deal_id=$1',[dealId])).rows;
  out.deal_events.sort((a,b)=>new Date(b.occurred_at)-new Date(a.occurred_at)||Number(b.sequence)-Number(a.sequence));out.coverage=coverage(out.funding_records);out.participation_issues=participationIssues(out.funding_records,out.deal_matches);return out;
 });}
 async providerHistory(tx,providerId,excludeDealId){
  const matches=(await tx.query('SELECT m.*,r.result->\'history_profile\' AS history_profile FROM deal_matches m LEFT JOIN match_results r ON r.id=m.original_result_id WHERE m.provider_id=$1',[providerId])).rows;
  const events=(await tx.query('SELECT * FROM deal_events WHERE provider_id=$1',[providerId])).rows;
  const deals=(await tx.query('SELECT * FROM deals')).rows;return history(matches,events,deals,excludeDealId);
 }
 async create(tx,u,b){const name=validate(shortText,b.deal_name),profile=cleanProfile(b.profile),dealId=id();
  await tx.query('INSERT INTO deals(id,organisation_id,created_by_user_id,assigned_user_id,deal_name,profile) VALUES($1,$2,$3,$3,$4,$5)',[dealId,u.organisation_id,u.id,name,json(profile)]);
  await this.snapshot(tx,u,dealId,1,profile);await this.event(tx,u,dealId,'DEAL_CREATED');return {id:dealId};
 }
 async snapshot(tx,u,dealId,version,profile){await tx.query('INSERT INTO profile_versions(id,organisation_id,deal_id,version,profile,actor_user_id) VALUES($1,$2,$3,$4,$5,$6)',[id(),u.organisation_id,dealId,version,json(profile),u.id]);}
 async updateProfile(tx,u,d,p,type='PROFILE_UPDATED',metadata={}){
  const profile=cleanProfile(p);profile.summary={...(profile.summary||{}),status:'needs_review'};if(d.profile.financials.ebitda.amount!==profile.financials.ebitda.amount||d.profile.funding.amount!==profile.funding.amount)profile.ratios={...profile.ratios,leverage:null,leverageType:null};
  await tx.query('UPDATE deals SET profile=$1,profile_version=profile_version+1,confirmed_version=null,version=version+1,updated_at=now() WHERE id=$2',[json(profile),d.id]);
  await this.snapshot(tx,u,d.id,d.profile_version+1,profile);await this.event(tx,u,d.id,type,metadata);return {id:d.id};
 }
 async action(tx,u,dealId,action,b){
  const d=await this.deal(tx,dealId,validate(z.number().int().positive(),b.version));
  if(action==='profile'){
   const p=cleanProfile(b.profile);p.documents=d.profile.documents;p.review=d.profile.review;if(p.financials.ebitda.amount!==d.profile.financials.ebitda.amount||p.funding.amount!==d.profile.funding.amount)p.ratios={...p.ratios,leverage:null,leverageType:null};return this.updateProfile(tx,u,d,p);
  }
  if(action==='confirm'){
   if(d.profile.review?.conflicts?.length)fail('Resolve the document conflicts before confirming.');
   if(!d.profile.company.name||!d.profile.funding.amount||!d.profile.funding.purpose)fail('Complete borrower, funding amount and purpose first.');
   if(Object.values(d.profile.review?.fields||{}).some(f=>f.status!=='confirmed'))fail('Review the extracted fields before confirming the profile.');
   await tx.query('UPDATE deals SET confirmed_version=profile_version,overall_stage=\'ready_to_send\',version=version+1,updated_at=now() WHERE id=$1',[dealId]);await this.event(tx,u,dealId,'PROFILE_CONFIRMED',{profile_version:d.profile_version});return {id:dealId};
  }
  if(action==='workflow'){
   const stage=validate(z.enum(['draft','adviser_review','ready_to_send','sent_to_lender','more_information_needed','terms_review','due_diligence','documentation','funded','closed','withdrawn','archived','decision_received']),b.stage);
   const assigned=validate(z.string(),b.assigned_user_id||d.assigned_user_id);
   if(!(await tx.query('SELECT id FROM users WHERE id=$1',[assigned])).rows.length)fail('Choose a broker from this organisation.');
   if(['funded','closed'].includes(stage)&&!b.outcome_note?.trim())fail('Record the closing outcome or funding evidence.');
   await tx.query('UPDATE deals SET overall_stage=$1,assigned_user_id=$2,version=version+1,updated_at=now() WHERE id=$3',[stage,assigned,dealId]);await this.event(tx,u,dealId,stage==='closed'?'DEAL_CLOSED':'DEAL_STAGE_CHANGED',{from:d.overall_stage,to:stage,assigned_user_id:assigned,note:b.outcome_note||null});return {id:dealId};
  }
  if(action==='upload'){
   const files=validate(z.array(z.object({name:shortText,content:z.string().max(1048576)})).min(1).max(5),b.files);
   const p=structuredClone(d.profile);
   for(const file of files){if(!file.name.toLowerCase().endsWith('.csv'))fail('Only the supported synthetic CSV format can be read.');
    let facts;try{facts=extractCSV(file.content);}catch(e){fail(e.message);}if(!facts.length)fail('No supported fields were found.');
    for(const f of facts){if(['funding.amount','financials.annualRevenue'].includes(f.field))cents(f.value);if(f.field==='funding.termMonths'&&(!Number.isInteger(f.value)||f.value<=0))fail('Term must be a positive whole number of months.');if(f.currency&&f.currency!=='NZD')fail('This reader supports NZD only.');}
    const record=attachCSV(p,file.name,facts);
    await tx.query('INSERT INTO documents(id,organisation_id,deal_id,filename,content,facts) VALUES($1,$2,$3,$4,$5,$6)',[record.id,u.organisation_id,dealId,file.name,file.content,json(facts)]);
   }
   return this.updateProfile(tx,u,d,p,'DOCUMENTS_ADDED',{filenames:files.map(f=>f.name)});
  }
  if(action==='resolve'){
   const p=structuredClone(d.profile),field=validate(z.enum(['company.name','company.industry','company.location','funding.amount','funding.purpose','funding.termMonths','funding.security','financials.annualRevenue','financials.ebitda']),b.field);
   const path=field.startsWith('financials.')?field+'.amount':field;let value=readField(p,path),sources=[];
   if(b.document_id){const doc=(await tx.query('SELECT * FROM documents WHERE id=$1 AND deal_id=$2',[b.document_id,dealId])).rows[0];const fact=doc?.facts.find(f=>f.field===field&&(b.row==null||f.row===b.row));if(!fact)fail('Source field not found.');value=fact.value;sources=[doc.id];if(field.startsWith('financials.')){writeField(p,field+'.currency',fact.currency||'NZD');writeField(p,field+'.periodEnd',fact.periodEnd);} }
   if(value==null||value===''||Array.isArray(value)&&!value.length)fail('Enter or choose a value before confirming.');writeField(p,path,value);
   p.review.fields[field]={status:'confirmed',sourceIds:sources};p.review.confirmedFields=[...new Set([...(p.review.confirmedFields||[]),field])];p.review.conflicts=(p.review.conflicts||[]).filter(c=>c.field!==field);
   return this.updateProfile(tx,u,d,p,'FIELD_CONFIRMED',{field,value,sourceIds:sources});
  }
  if(action==='analyze'){
   if(d.confirmed_version!==d.profile_version)fail('Confirm the current Deal Profile before comparing lenders.');
   const providers=await this.providers(tx),runId=id(),results=compareAll(d.profile,providers),legacy=legacyAnalysis(d.profile);
   await tx.query('INSERT INTO matching_runs(id,organisation_id,deal_id,profile_version,snapshot,engine_version) VALUES($1,$2,$3,$4,$5,$6)',[runId,u.organisation_id,dealId,d.profile_version,json({profile:d.profile,legacy,provider_count:providers.length}),'mandate-criteria-v1 + unchanged legacy comparator']);
   for(const result of results)await tx.query('INSERT INTO match_results(id,organisation_id,run_id,provider_id,mandate_id,result) VALUES($1,$2,$3,$4,$5,$6)',[id(),u.organisation_id,runId,result.provider_id,result.mandate_id,json({...result,rank:results.indexOf(result)+1,history_profile:d.profile})]);
   await this.event(tx,u,dealId,'MATCHING_COMPLETED',{run_id:runId,providers:results.length});return {id:runId};
  }
  if(action==='save-matches'){
   const run=(await tx.query('SELECT * FROM matching_runs WHERE id=$1 AND deal_id=$2 FOR UPDATE',[b.run_id,dealId])).rows[0];if(!run)fail('Matching run not found.',404);if(run.saved_at)return {id:dealId,run_id:run.id};if(run.profile_version!==d.profile_version)fail('This matching run is stale. Compare the updated profile first.',409);
   const results=(await tx.query('SELECT * FROM match_results WHERE run_id=$1',[run.id])).rows;
   for(const r of results){let m=(await tx.query('SELECT * FROM deal_matches WHERE deal_id=$1 AND provider_id=$2',[dealId,r.provider_id])).rows[0];if(m){await tx.query('UPDATE deal_matches SET latest_result_id=$1 WHERE id=$2',[r.id,m.id]);}else{m={id:id(),provider_id:r.provider_id};await tx.query('INSERT INTO deal_matches(id,organisation_id,deal_id,provider_id,original_result_id,latest_result_id,assigned_user_id) VALUES($1,$2,$3,$4,$5,$5,$6)',[m.id,u.organisation_id,dealId,r.provider_id,r.id,u.id]);await this.event(tx,u,dealId,'PROVIDER_MATCHED',{run_id:run.id},m,null,'NOT_CONTACTED');}}
   await tx.query('UPDATE matching_runs SET saved_at=now() WHERE id=$1',[run.id]);await this.event(tx,u,dealId,'MATCHES_SAVED',{run_id:run.id,count:results.length});return {id:dealId,run_id:run.id};
  }
  if(action==='note'){
   const note=validate(z.string().trim().min(1).max(10000),b.note_text),m=b.match_id?await this.match(tx,dealId,b.match_id):null,noteId=id();
   await tx.query('INSERT INTO deal_notes(id,organisation_id,deal_id,deal_match_id,user_id,note_text) VALUES($1,$2,$3,$4,$5,$6)',[noteId,u.organisation_id,dealId,m?.id||null,u.id,note]);await this.event(tx,u,dealId,'NOTE_ADDED',{note_id:noteId},m);return {id:noteId};
  }
  if(action==='provider'){
   const m=await this.match(tx,dealId,b.match_id,validate(z.number().int().positive(),b.match_version));
   const status=validate(z.enum(STATUSES),b.status||m.status),reason=status==='DECLINED'?validate(z.enum(DECLINES).nullable(),b.decline_reason??null):null;
   const selection=validate(z.enum(['considering','shortlisted','dismissed']),b.selection||m.selection);
   const contact=b.last_contacted_at===undefined?(status==='CONTACTED'&&m.status!==status?new Date():m.last_contacted_at):validate(dateSchema,b.last_contacted_at),follow=b.next_follow_up_at===undefined?m.next_follow_up_at:validate(dateSchema,b.next_follow_up_at);
   if(contact&&new Date(contact)>new Date())fail('A contact date cannot be in the future.');
   const assigned=b.assigned_user_id||m.assigned_user_id;if(!(await tx.query('SELECT id FROM users WHERE id=$1',[assigned])).rows.length)fail('Choose a broker from this organisation.');
   const note=validate(z.string().max(10000),b.note||''),followNote=validate(z.string().max(10000),b.follow_up_note??m.follow_up_note??'');
   const changed=status!==m.status||reason!==m.decline_reason||selection!==m.selection||!sameDate(contact,m.last_contacted_at)||!sameDate(follow,m.next_follow_up_at)||followNote!==(m.follow_up_note||'')||assigned!==m.assigned_user_id||!!note;
   if(!changed)return {id:m.id};
   await tx.query('UPDATE deal_matches SET status=$1,decline_reason=$2,selection=$3,last_contacted_at=$4,next_follow_up_at=$5,follow_up_note=$6,assigned_user_id=$7,version=version+1,updated_at=now() WHERE id=$8',[status,reason,selection,contact,follow,followNote,assigned,m.id]);
   if(status!==m.status)await this.event(tx,u,dealId,'STATUS_CHANGED',{decline_reason:reason},m,m.status,status,b.occurred_at?validate(dateSchema,b.occurred_at):null);
   if(status==='CONTACTED'&&m.status!==status||contact&&!sameDate(contact,m.last_contacted_at))await this.event(tx,u,dealId,'PROVIDER_CONTACTED',{},m,null,null,contact);
   if(!sameDate(contact,m.last_contacted_at))await this.event(tx,u,dealId,'CONTACT_DATE_CHANGED',{previous:m.last_contacted_at,next:contact},m);
   if(!sameDate(follow,m.next_follow_up_at)||followNote!==(m.follow_up_note||''))await this.event(tx,u,dealId,'FOLLOW_UP_SET',{previous:m.next_follow_up_at,next:follow,note:followNote},m);
   if(reason!==m.decline_reason&&status==='DECLINED')await this.event(tx,u,dealId,'DECLINE_RECORDED',{decline_reason:reason},m,null,'DECLINED');
   if(selection!==m.selection||assigned!==m.assigned_user_id)await this.event(tx,u,dealId,'PROVIDER_UPDATED',{selection,assigned_user_id:assigned},m);
   if(note){const n=id();await tx.query('INSERT INTO deal_notes(id,organisation_id,deal_id,deal_match_id,user_id,note_text) VALUES($1,$2,$3,$4,$5,$6)',[n,u.organisation_id,dealId,m.id,u.id,note]);await this.event(tx,u,dealId,'NOTE_ADDED',{note_id:n},m);}
   return {id:m.id};
  }
  if(action==='choose-package'){
   const p=(await tx.query('SELECT * FROM packages WHERE id=$1 AND deal_id=$2',[b.package_id,dealId])).rows[0],alternative=validate(z.number().int().nonnegative(),b.alternative),reason=validate(shortText,b.reason);
   if(!p||p.profile_version!==d.profile_version||!p.snapshot.alternatives[alternative])fail('Choose an option from a current scenario.');
   const providers=await this.providers(tx),matches=(await tx.query('SELECT * FROM deal_matches WHERE deal_id=$1',[dealId])).rows;
   const issues=participationIssues((await tx.query('SELECT * FROM funding_records WHERE deal_id=$1',[dealId])).rows,matches);
   if(p.snapshot.alternatives[alternative].allocations.some(a=>issues.some(i=>i.provider_id===a.provider_id&&i.facility_id===a.facility_id)))fail('Participation evidence was withdrawn or expired. Renew the evidence and create an updated scenario.');
   for(const a of p.snapshot.alternatives[alternative].allocations){const provider=providers.find(x=>x.id===a.provider_id),match=matches.find(x=>x.provider_id===a.provider_id);if(!provider||provider.mandate.id!==a.mandate_id||['DECLINED','WITHDRAWN'].includes(match?.status)||provider.mandate.data.validUntil&&new Date(provider.mandate.data.validUntil)<=new Date())fail('A participant changed or expired. Create an updated scenario.');}
   await tx.query('UPDATE deals SET preferred_package_id=$1,preferred_alternative=$2,version=version+1,updated_at=now() WHERE id=$3',[p.id,alternative,dealId]);await this.event(tx,u,dealId,'PREFERRED_PACKAGE_SET',{package_id:p.id,alternative,reason});return {id:p.id};
  }
  if(action==='choose-terms'){
   const rows=(await tx.query('SELECT * FROM funding_records WHERE deal_id=$1',[dealId])).rows,r=activeRecords(rows).find(r=>r.id===b.record_id&&r.kind==='terms');if(!r)fail('Choose current, unexpired terms.');const reason=validate(shortText,b.reason);
   await tx.query('UPDATE deals SET preferred_terms_id=$1,version=version+1,updated_at=now() WHERE id=$2',[r.id,dealId]);await this.event(tx,u,dealId,'PREFERRED_TERMS_SET',{record_id:r.id,reason});return {id:r.id};
  }
  if(action==='package'){
   const run=(await tx.query('SELECT * FROM matching_runs WHERE id=$1 AND deal_id=$2 AND saved_at IS NOT NULL',[b.run_id,dealId])).rows[0];if(!run||run.profile_version!==d.profile_version)fail('Save matching results for the current profile first.');
   const providers=await this.providers(tx),matches=(await tx.query('SELECT * FROM deal_matches WHERE deal_id=$1',[dealId])).rows;
   const results=(await tx.query('SELECT * FROM match_results WHERE run_id=$1',[run.id])).rows;
   const issues=participationIssues((await tx.query('SELECT * FROM funding_records WHERE deal_id=$1',[dealId])).rows,matches);
   for(const p of providers){p.status=matches.find(m=>m.provider_id===p.id)?.status;p.participationIssues=Object.fromEntries(issues.filter(i=>i.provider_id===p.id).map(i=>[i.facility_id,i.reason]));if(results.find(r=>r.provider_id===p.id)?.mandate_id!==p.mandate.id)fail('Lender mandates changed after this comparison. Compare and save again before building a package.',409);} 
   const options=validate(z.object({excluded:z.array(z.string()).default([]),pinned:z.array(z.string()).default([]),locks:z.record(z.string(),z.number().nonnegative()).default({})}),b.options||{});
   const result=searchPackages(d.profile,providers,options),packageId=id();
   await tx.query('INSERT INTO packages(id,organisation_id,deal_id,run_id,profile_version,name,snapshot) VALUES($1,$2,$3,$4,$5,$6,$7)',[packageId,u.organisation_id,dealId,run.id,d.profile_version,validate(shortText,b.name||'Funding options'),json({...result,options,providers,profile:d.profile})]);await this.event(tx,u,dealId,'PACKAGE_CREATED',{package_id:packageId});return {id:packageId};
  }
  if(action==='funding'){
   const m=await this.match(tx,dealId,b.match_id),record=validate(z.object({kind:z.enum(['indication','terms','commitment','funding']),amount:z.number().nonnegative(),facility_id:z.string(),state:z.enum(['indicative','conditional','active','withdrawn','funded']),expires_at:dateSchema.optional(),supersedes_id:z.string().nullable().optional(),data:z.object({source:z.string().trim().min(1).max(1000)}).passthrough()}),b);
   const f=facilities(d.profile).find(f=>f.id===record.facility_id);if(!f)fail('Facility not found.');if(record.kind==='funding'&&!['funded','withdrawn'].includes(record.state)||record.kind==='commitment'&&!['conditional','active','withdrawn'].includes(record.state)||['terms','indication'].includes(record.kind)&&!['indicative','conditional','withdrawn'].includes(record.state))fail('Choose a state appropriate to this record type.');
   if(record.kind==='funding'&&record.expires_at)fail('Funds already received do not expire. Record a correction as a revision.');
   if(cents(record.amount)>cents(f.amount))fail('The recorded amount exceeds the facility limit.');
   if(record.supersedes_id){const old=(await tx.query('SELECT * FROM funding_records WHERE id=$1 AND deal_id=$2',[record.supersedes_id,dealId])).rows[0];if(!old||old.deal_match_id!==m.id||old.facility_id!==record.facility_id||old.kind!==record.kind)fail('Revision must refer to the same provider, facility and record type.');}
   const rows=(await tx.query('SELECT * FROM funding_records WHERE deal_id=$1',[dealId])).rows;
   if(record.kind!=='funding'&&activeRecords(rows).some(r=>r.deal_match_id===m.id&&r.facility_id===record.facility_id&&r.kind===record.kind&&r.id!==record.supersedes_id))fail('Revise the existing record instead of duplicating this participation.');
   if(['funding','commitment'].includes(record.kind)&&record.state!=='withdrawn'&&(!record.expires_at||new Date(record.expires_at)>new Date())&&activeRecords(rows).filter(r=>r.kind===record.kind&&r.facility_id===record.facility_id&&r.id!==record.supersedes_id).reduce((n,r)=>n+Number(r.amount_cents),0)+cents(record.amount)>cents(f.amount))fail('Recorded '+record.kind+' exceeds this facility limit. Record economic participations once; keep alternative offers as terms.');
   const rid=id();await tx.query('INSERT INTO funding_records(id,organisation_id,deal_id,deal_match_id,facility_id,kind,amount_cents,state,expires_at,supersedes_id,data) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',[rid,u.organisation_id,dealId,m.id,record.facility_id,record.kind,cents(record.amount),record.state,record.expires_at||null,record.supersedes_id||null,json(record.data)]);await this.event(tx,u,dealId,record.state==='withdrawn'?'EVIDENCE_WITHDRAWN':record.kind==='terms'?'TERMS_RECEIVED':'FUNDING_RECORDED',{record_id:rid,kind:record.kind,amount_cents:cents(record.amount)},m);
   if(record.kind==='terms'&&record.state!=='withdrawn'&&m.status!=='TERMS_RECEIVED'){await tx.query("UPDATE deal_matches SET status='TERMS_RECEIVED',version=version+1,updated_at=now() WHERE id=$1",[m.id]);await this.event(tx,u,dealId,'STATUS_CHANGED',{},m,m.status,'TERMS_RECEIVED');}return {id:rid};
  }
  if(action==='task'){
   const title=validate(shortText,b.title),assignee=b.assigned_user_id||u.id;if(!(await tx.query('SELECT id FROM users WHERE id=$1',[assignee])).rows.length)fail('Assignee not found.');
   if(b.id){const old=(await tx.query('SELECT * FROM tasks WHERE id=$1 AND deal_id=$2',[b.id,dealId])).rows[0];if(!old)fail('Task not found.',404);if(old.version!==b.task_version)fail('Task changed. Refresh and try again.',409);if(b.completed&&!b.evidence?.trim())fail('Record completion evidence.');await tx.query('UPDATE tasks SET title=$1,assigned_user_id=$2,due_at=$3,completed=$4,evidence=$5,version=version+1 WHERE id=$6',[title,assignee,b.due_at?validate(dateSchema,b.due_at):null,!!b.completed,b.evidence||null,b.id]);}
   else {b.id=id();await tx.query('INSERT INTO tasks(id,organisation_id,deal_id,title,assigned_user_id,due_at) VALUES($1,$2,$3,$4,$5,$6)',[b.id,u.organisation_id,dealId,title,assignee,b.due_at?validate(dateSchema,b.due_at):null]);}await this.event(tx,u,dealId,'TASK_UPDATED',{task_id:b.id,title,completed:!!b.completed});return {id:b.id};
  }
  if(action==='report'){
   const r=(await tx.query('SELECT r.*,m.profile_version,m.created_at AS analyzed_at FROM match_results r JOIN matching_runs m ON m.id=r.run_id WHERE r.id=$1 AND m.deal_id=$2',[b.result_id,dealId])).rows[0];if(!r)fail('Match result not found.',404);
   const audience=validate(z.enum(['internal','shareable']),b.audience||'shareable');
   const snapshot={result:r.result,deal_name:d.deal_name,profile_version:r.profile_version,analysis_date:r.analyzed_at,profile:r.result.history_profile,synthetic:true,disclaimer:'Fictional demonstration. Criteria comparison is not an offer or commitment.'};
   // Whitelist export fields; the reviewed profile may itself carry internal notes.
   const hp=r.result.history_profile;
   snapshot.profile={company:pick(hp.company,['name','alias','industry','location']),funding:pick(hp.funding,['amount','currency','purpose','purposes','termMonths','security','targetBasis','desiredCloseDate']),financials:{annualRevenue:pick(hp.financials.annualRevenue,['amount','currency','periodEnd']),ebitda:pick(hp.financials.ebitda,['amount','currency','periodEnd','basis'])}};
   delete snapshot.result.history_profile;
   // Export only compared evidence; internal provider metadata is not a public report field.
   snapshot.result.mandate_snapshot={id:r.result.mandate_id,effective_from:r.result.mandate_snapshot?.effective_from,data:pick(r.result.mandate_snapshot?.data,['source','currency','sectors','security','participationMin','participationMax','amountScope'])};
   const current=(await this.providers(tx)).find(p=>p.id===r.provider_id);snapshot.stale_at_creation=r.profile_version!==d.profile_version||current?.mandate.id!==r.mandate_id;
   if(d.preferred_package_id){const p=(await tx.query('SELECT * FROM packages WHERE id=$1 AND deal_id=$2 AND run_id=$3',[d.preferred_package_id,dealId,r.run_id])).rows[0];snapshot.allocations=p?.snapshot.alternatives[d.preferred_alternative]?.allocations.filter(a=>a.provider_id===r.provider_id)||[];snapshot.roles=p?.snapshot.profile.funding.roles||null;}
   if(audience==='internal')snapshot.history=await this.providerHistory(tx,r.provider_id,dealId);
   const terms=(await tx.query("SELECT f.* FROM funding_records f JOIN deal_matches m ON m.id=f.deal_match_id WHERE f.deal_id=$1 AND m.provider_id=$2 AND f.kind='terms'",[dealId,r.provider_id])).rows;
   snapshot.terms=activeRecords(terms).map(t=>({amount_cents:t.amount_cents,state:t.state,expires_at:t.expires_at,data:{rate:t.data.rate??null,benchmark:t.data.benchmark??null,margin:t.data.margin??null,fees:t.data.fees??null,repayment:t.data.repayment??null,security:t.data.security??null,conditions:t.data.conditions??null}}));
   const reportId=id();await tx.query('INSERT INTO reports(id,organisation_id,deal_id,provider_id,audience,snapshot) VALUES($1,$2,$3,$4,$5,$6)',[reportId,u.organisation_id,dealId,r.provider_id,audience,json(snapshot)]);await this.event(tx,u,dealId,'REPORT_SAVED',{report_id:reportId,audience});return {id:reportId};
  }
  fail('Unknown action.',404);
 }
}
