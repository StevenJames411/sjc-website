import { readFileSync, writeFileSync } from 'node:fs';
import pg from 'pg';
const env = Object.fromEntries(readFileSync(process.argv[2],'utf8').split('\n')
  .filter(l=>l.includes('=')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i), l.slice(i+1).replace(/^"|"$/g,'')];}));
const c = new pg.Client({ connectionString: env.DATABASE_URL, ssl:{rejectUnauthorized:false} });
await c.connect();
const r = await c.query(process.argv[3]);
const out = JSON.stringify(r.rows);
if (process.argv[4]) { writeFileSync(process.argv[4], out); console.log('wrote', out.length, 'bytes'); }
else console.log(out.slice(0,7000));
await c.end();
