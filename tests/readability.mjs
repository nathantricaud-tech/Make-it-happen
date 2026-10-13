import assert from 'node:assert/strict';
import {openMicrophone,microphoneIssue} from '../lib/microphone.ts';
import fs from 'node:fs';
import ts from 'typescript';
import {createRequire} from 'node:module';
import {renderToStaticMarkup} from 'react-dom/server';
import React from 'react';
const require=createRequire(import.meta.url),out={exports:{}};
const compiled=ts.transpileModule(fs.readFileSync(new URL('../app/readable-sheet.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
new Function('require','exports','module',compiled)(require,out.exports,out);
const text='## TITLE\n\nA **key idea** here.\n• One useful example.\n';
const html=renderToStaticMarkup(React.createElement(out.exports.ReadableSheet,{content:text,marks:[{start:4,end:30,color:'yellow'}]}));
assert.equal(html.replace(/<[^>]*>/g,''),text,'Rendered text must keep exact selection/highlight offsets');
assert.ok(html.includes('sheet-heading'));assert.ok(html.includes('highlight-yellow'));
assert.equal(microphoneIssue(true,false,true),'MIC_EMBEDDED');assert.equal(microphoneIssue(false,true,true),'MIC_INSECURE');assert.equal(microphoneIssue(true,true,true),null);
let released=false;await assert.rejects(openMicrophone({getUserMedia:()=>new Promise(resolve=>setTimeout(()=>resolve({getTracks:()=>[{stop(){released=true}}]}),15))},2),/MIC_TIMEOUT/);await new Promise(r=>setTimeout(r,25));assert.equal(released,true,'Late permission grants must release microphone');
const luminance=h=>{const c=h.replace('#','').match(/../g).map(n=>parseInt(n,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722};
for(const [fg,bg] of [['#123d74','#e7f0ff'],['#f0f7ff','#173b60'],['#155b32','#e8f7ee'],['#902222','#fff0f0'],['#5e5e58','#fdfcf9'],['#bebeb5','#1c1c1b']]){const a=luminance(fg),b=luminance(bg);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5);}
console.log('Passed: sheet/highlight text integrity, mic permission diagnostics/timeout cleanup, and light/dark text contrast >=4.5:1.');
