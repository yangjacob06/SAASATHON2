import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import { readFile, readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
const defaultDirectory=process.platform==='darwin'?path.join(os.homedir(),'Library/Application Support/Mandate/development-data'):'.data/mandate';
export async function openDatabase({ directory = process.env.DATA_DIR || defaultDirectory, url = process.env.DATABASE_URL } = {}) {
  let driver;
  if (url) driver = new pg.Pool({connectionString:url, max:6});
  else { if(directory !== ':memory:') await mkdir(directory,{recursive:true}); driver = new PGlite(directory === ':memory:' ? undefined : directory); await driver.waitReady; }
  let queue = Promise.resolve();
  const transaction = fn => {
    const run = async () => {
      if (!url) return driver.transaction(fn);
      const client = await driver.connect();
      try { await client.query('BEGIN'); const value = await fn(client); await client.query('COMMIT'); return value; }
      catch(error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
    };
    // PGlite is a single connection; serialize entire transactions, including identity context.
    if (url) return run();
    const p = queue.then(run,run); queue = p.catch(()=>{}); return p;
  };
  return {
    admin: transaction,
    tenant: (user,fn) => transaction(async tx => {
      await tx.query('SET LOCAL ROLE mandate_app');
      await tx.query("SELECT set_config('mandate.organisation',$1,true)",[user.organisation_id]);
      return fn(tx);
    }),
    async migrate() {
      await transaction(async tx => {
        await tx.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz DEFAULT now())');
        const dir = new URL('./migrations/',import.meta.url);
        for(const name of (await readdir(dir)).filter(n=>n.endsWith('.sql')).sort()) {
          if(!(await tx.query('SELECT name FROM schema_migrations WHERE name=$1',[name])).rows.length) {
            const sql=await readFile(new URL(name,dir),'utf8');
            if(tx.exec) await tx.exec(sql); else await tx.query(sql);
            await tx.query('INSERT INTO schema_migrations(name) VALUES($1)',[name]);
          }
        }
      });
    },
    async close() { await queue; if(url) await driver.end(); else await driver.close(); }
  };
}
