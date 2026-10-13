import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source=fs.readFileSync('lib/server.ts','utf8');const out={exports:{}};
new Function('require','exports','module',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(name=>name==='./database'?{database:new Proxy({},{get(){throw Error('Free AI access must not query entitlements or usage')}})}:name==='next/headers'?{}:name==='./email-auth'?{}:null,out.exports,out);
for(let i=0;i<50;i++){const done=await out.exports.reserve('ordinary-student');await done()}
for(const p of ['app/api/billing/checkout/route.ts','app/api/billing/portal/route.ts','app/api/billing/webhook/route.ts','app/api/access/route.ts','lib/billing.ts'])assert.equal(fs.existsSync(p),false);
assert.doesNotMatch(fs.readFileSync('app/klivo.tsx','utf8'),/startBilling|setModal\('plus'\)|10-used|ownerCode/);
assert.equal(JSON.parse(fs.readFileSync('package.json')).dependencies.stripe,undefined);
console.log('Passed: 50 AI actions with no daily quota/entitlement query; billing and owner-code endpoints removed; no paywall UI or Stripe dependency.');
