import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
let reserved=0,refunded=0,submitted;let result={text:'La quantité de matière est conservée.',segments:[{avg_logprob:-0.1,no_speech_prob:0.01,compression_ratio:1.3}]};
const dependencies={'@/lib/uploads':{uploadTypes:['audio/webm'],consumeUpload:async()=>new File(['fixture'],'recording.webm',{type:'audio/webm'})},'@/lib/server':{identity:async()=>({userId:'test'}),runtimeEnv:()=>({GROQ_API_KEY:'fixture'}),json:Response.json,failure:e=>Response.json({error:e.message},{status:400}),reserve:async()=>{reserved++;return async()=>refunded++}}};
const out={exports:{}};new Function('require','exports','module',ts.transpileModule(fs.readFileSync('app/api/audio/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(n=>dependencies[n],out.exports,out);
const previous=globalThis.fetch;globalThis.fetch=async(u,o)=>{submitted=o.body;return Response.json(result)};
async function request(language='fr'){const f=new FormData();f.set('language',language);f.set('context','titrage, équivalence');return out.exports.POST(new Request('https://example.test/api/audio',{method:'POST',body:f}))}
try{
let r=await request();assert.equal(r.status,200);assert.equal(submitted.get('language'),'fr');assert.equal(submitted.get('model'),'whisper-large-v3');assert.equal(submitted.get('response_format'),'verbose_json');assert.equal(submitted.get('prompt'),'titrage, équivalence');assert.equal((await r.json()).uncertain,false);
result={text:'Passage peu audible',segments:[{avg_logprob:-1.5}]};r=await request('auto');assert.equal(submitted.has('language'),false);assert.equal((await r.json()).uncertain,true);
result={text:'  '};r=await request();assert.equal((await r.json()).error,'AUDIO_EMPTY');assert.equal(refunded,1);
result={text:'Invented sentence',segments:[{text:'Invented sentence',no_speech_prob:0.97,avg_logprob:-1.4}]};r=await request();assert.equal((await r.json()).error,'AUDIO_EMPTY');assert.equal(refunded,2);
result={text:'Hello fake outro',segments:[{text:'Hello',no_speech_prob:0.01,avg_logprob:-0.1},{text:'fake outro',no_speech_prob:0.98,avg_logprob:-1.5}]};r=await request();const filtered=await r.json();assert.equal(filtered.text,'Hello');assert.equal(filtered.uncertain,true);
r=await request('invalid');assert.equal((await r.json()).error,'INVALID');assert.equal(reserved,5);
console.log('Passed: transcription language, vocabulary, quality metadata, empty output refund and validation.');
}finally{globalThis.fetch=previous}
