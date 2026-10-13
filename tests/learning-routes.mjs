import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {createRequire} from 'node:module';
import * as formats from '../lib/ai-formats.ts';
import * as generation from '../lib/learning-generation.ts';
import * as limits from '../lib/import-limits.ts';
const require=createRequire(import.meta.url);
function route(path,dependencies){const out={exports:{}};new Function('require','exports','module',ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(name=>dependencies[name]||require(name),out.exports,out);return out.exports;}
let reserved=0,refunded=0,saved=[],calls=[];const course='La dilution diminue la concentration en ajoutant du solvant. Le soluté est conservé : C₁V₁=C₂V₂.';let queue=[];
const server={identity:async()=>({userId:'alice'}),runtimeEnv:()=>({GROQ_API_KEY:'test-fixture-only',DB:{prepare(sql){let args;return{bind(...value){args=value;return this},async first(){return {payload:JSON.stringify({title:'Dilution',text:course})}},async run(){saved.push(args)}}}}}),json:d=>Response.json(d),failure:e=>Response.json({error:e.message},{status:400}),id:()=>crypto.randomUUID(),str:v=>v,reserve:async()=>{reserved++;return async()=>refunded++}};
const originalFetch=globalThis.fetch;globalThis.fetch=async(url,options)=>{calls.push(JSON.parse(options.body));return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(queue.shift())}}]})};
try{const ai=route('app/api/ai/route.ts',{'@/lib/server':server,'@/lib/ai-formats':formats,'@/lib/learning-generation':generation});
const english='The amount of solute stays the same during dilution. To calculate the volume, multiply the final concentration by the final volume and divide by the initial concentration. Check that all units are consistent before performing the calculation.';
const french='La quantité de soluté reste constante pendant la dilution. Pour déterminer le volume à prélever, on multiplie la concentration finale par le volume final, puis on divise par la concentration initiale. Il faut vérifier la cohérence des unités avant de calculer.';
const exam=answer=>({title:'Sujet de dilution',instructions:'Justifie tes réponses.',duration:60,questions:Array.from({length:5},()=>({question:'Explique la dilution.',points:4,answer}))});queue=[exam(english),exam(french)];let response=await ai.POST(new Request('https://example.test/api/ai',{method:'POST',body:JSON.stringify({mode:'exam',lang:'fr',courseId:'course',examOptions:{duration:30,difficulty:'challenge'}})}));assert.equal(response.status,200);let data=await response.json();assert.equal(data.content.duration,30);assert.equal(data.content.questions[0].answer,french);assert.equal(calls.length,2);assert.equal(reserved,1);assert.equal(refunded,0);assert.equal(JSON.parse(saved[0][3]).lang,'fr');assert.match(calls[0].messages.at(-1).content,/challenge/);
queue=[{language:'fr',title:'Incomplete',summary:'Incomplete',sections:[]},{language:'fr',title:'Incomplete',summary:'Incomplete',sections:[]}];response=await ai.POST(new Request('https://example.test/api/ai',{method:'POST',body:JSON.stringify({mode:'sheet',lang:'fr',courseId:'course'})}));assert.equal((await response.json()).error,'AI_FORMAT');assert.equal(refunded,1);assert.equal(saved.length,1);
}finally{globalThis.fetch=originalFetch}
console.log('Passed: generation route repairs language, validates output and respects exam settings.');
