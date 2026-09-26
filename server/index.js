import { openDatabase } from './db.js';
import { createApp } from './app.js';
try{process.loadEnvFile?.();}catch{}
if(process.env.NODE_ENV==='production'&&!process.env.DATABASE_URL)throw new Error('Production requires a PostgreSQL DATABASE_URL.');
const db=await openDatabase();await db.migrate();
const port=Number(process.env.PORT||4310),production=process.env.NODE_ENV==='production';
const server=createApp(db).listen(port,production?'0.0.0.0':'127.0.0.1',async error=>{
  if(error){console.error(`Mandate could not start: ${error.code||error.message}`);await db.close();process.exitCode=1;return;}
  console.log(`Mandate workspace: ${process.env.APP_ORIGIN||'http://127.0