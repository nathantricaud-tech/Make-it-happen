import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import ts from 'typescript';
const require=createRequire(import.meta.url),sqlite=new DatabaseSync(':memory:');sqlite.exec('CREATE TABLE records(id TEXT PRIMARY KEY,owner TEXT,kind TEXT,payload TEXT,created TEXT)');
const db={prepare(sql){let args;return {bind(...v){args=v;return this},async first(){return sqlite.prepare(sql).get(...args)||null},async run(){const r=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}}}}}};
let unlimited=false;const deletedFiles=[];const server={identity:async()=>({userId:'alice'}),runtimeEnv:()=>({DB:db,BUCKET:{delete:async key=>deletedFiles.push(key)}}),str:(v)=>{if(typeof v!=='string'||!v.trim())throw new Error('INVALID');return v},id:()=>crypto.randomUUID(),json:d=>Response.json(d),failure:e=>Response.json({error:e.message},{status:400})};
const out={exports:{}};const code=ts.transpileModule(fs.readFileSync(new URL('../app/api/data/route.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
new Function('require','exports','module',code)(n=>n==='@/lib/import-limits'?{MAX_COURSE_TEXT:500000}:n==='@/lib/server'?server:n==='@/lib/plans'?{unlimitedAccess:async()=>unlimited}:n==='@/lib/unlimited'?{hasUnlimited:async()=>false}:n==='@/lib/calendar'?{validDay:()=>true,localDate:()=>''}:n==='@/lib/progress'?{validHighlights:()=>[]}:require(n),out.exports,out);
const call=body=>out.exports.POST(new Request('https://example.test/api/data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}));
for(let i=0;i<40;i++)assert.equal((await call({action:'save',kind:'course',payload:{title:'Course',subject:'Math',text:'Content'}})).status,200);
let r=await call({action:'save',id:'chosen-arbitrary-id',kind:'course',payload:{title:'Course',subject:'Math',text:'Content'}});assert.equal(r.status,200);
for(const kind of ['course','artifact','folder','session','attempt','file']){const key='delete-'+kind;sqlite.prepare('INSERT INTO records VALUES(?,?,?,?,?)').run(key,'alice',kind,JSON.stringify({fileKey:'owned-file'}),'');const result=await (await call({action:'delete',id:key})).json();assert.equal(result.id,key);assert.equal(result.deleted,true);assert.equal(sqlite.prepare('SELECT * FROM records WHERE id=?').get(key),undefined);assert.equal((await (await call({action:'delete',id:key})).json()).deleted,false);}
assert.deepEqual(deletedFiles,['owned-file']);
sqlite.prepare('INSERT INTO records VALUES(?,?,?,?,?)').run('entitlement','alice','entitlement','{}','');r=await call({action:'delete',id:'entitlement'});assert.equal((await r.json()).error,'FORBIDDEN');
sqlite.prepare('INSERT INTO records VALUES(?,?,?,?,?)').run('bob-course','bob','course','{}','');r=await call({action:'move',id:'bob-course',folderId:null});assert.equal((await r.json()).error,'NOT_FOUND');
r=await call({action:'delete',id:'bob-course'});assert.equal((await r.json()).deleted,false);assert.equal(sqlite.prepare('SELECT owner FROM records WHERE id=?').get('bob-course').owner,'bob');
for(const kind of ['subscription','billing_customer','onboarding']){sqlite.prepare('INSERT INTO records VALUES(?,?,?,?,?)').run(kind,'alice',kind,'{}','');assert.equal((await (await call({action:'delete',id:kind})).json()).error,'FORBIDDEN');}
console.log('Passed: 40+ free courses, persisted resource deletion and idempotency, file cleanup, protected access records and owner isolation.');
