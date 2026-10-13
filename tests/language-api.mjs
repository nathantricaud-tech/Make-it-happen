import assert from 'node:assert/strict';
import ts from 'typescript';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {chatHistory} from '../lib/ai-formats.ts';
const require=createRequire(import.meta.url);let reservations=0,refunds=0,calls=[],denied=false,fail=false;
const server={identity:async()=>{if(denied)throw new Error('UNAUTHORIZED');return {userId:'test-user'}},runtimeEnv:()=>({GROQ_API_KEY:'test-not-a-key'}),json:(d)=>Response.json(d),failure:e=>Response.json({error:e.message},{status:400}),reserve:async()=>{reservations++;return async()=>{refunds++}}};
const code=ts.transpileModule(fs.readFileSync(new URL('../app/api/language/route.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const out={exports:{}};new Function('require','exports','module',code)(n=>n==='@/lib/uploads'?{consumeUpload:async(f,k)=>f.get(k),uploadTypes:['audio/webm']}:n==='@/lib/language-topics'?{languageTopics:{daily:'Everyday life'}}:n==='@/lib/learning-generation'?{languageRule:()=>'',languageMismatch:()=>false}:n==='@/lib/server'?server:n==='@/lib/ai-formats'?{chatHistory}:require(n),out.exports,out);
globalThis.fetch=async(url,options)=>{calls.push({url,options});if(fail)return new Response('',{status:429});return Response.json(url.includes('transcriptions')?{text:'Hello, how are you?'}:{choices:[{message:{content:JSON.stringify({reply:'I am well. What did you do today?',correction:''})}}]})};
function request(audio=false){const f=new FormData();Object.entries({lang:'en',ui:'fr',level:'B1',scenario:'daily',history:'[]'}).forEach(([k,v])=>f.set(k,v));if(audio)f.set('audio',new File(['sample'],'speech.webm',{type:'audio/webm;codecs=opus'}));else f.set('text','Hello');return new Request('https://example.test/api/language',{method:'POST',body:f})}
let r=await out.exports.POST(request());assert.equal((await r.json()).transcript,'Hello');assert.equal(reservations,1);assert.equal(calls.length,1);
r=await out.exports.POST(request(true));assert.equal((await r.json()).transcript,'Hello, how are you?');assert.equal(reservations,2);assert.equal(calls.length,3);assert.equal(calls[1].options.body.get('language'),'en');
fail=true;r=await out.exports.POST(request());assert.equal((await r.json()).error,'AI_RATE_LIMIT');assert.equal(refunds,1);
denied=true;const before=calls.length;r=await out.exports.POST(request());assert.equal((await r.json()).error,'UNAUTHORIZED');assert.equal(calls.length,before);
console.log('Passed: text and audio conversation, single quota reservation per exchange, provider error refund and auth guard.');
