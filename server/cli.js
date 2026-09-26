import { openDatabase } from './db.js';
import { seed } from './seed.js';
try{process.loadEnvFile?.();}catch{}
const db=await openDatabase();
try{await db.migrate();if(process.argv[2]==='seed')console.log(await seed(db,{allow:process.env.AUTH_MODE!=='supabase'&&process.env.NODE_ENV!=='production'}));else console.log('Migrations applied.');}catch(e){console.error(e.message);process.exitCode=1;}finally{await db.close();}
