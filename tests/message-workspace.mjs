import assert from 'node:assert/strict';
import {messageParts} from '../lib/message-format.ts';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import {createRequire} from 'node:module';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
function compile(file,imports){const out={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;new Function('require','exports','module',code)(n=>imports[n]||require(n),out.exports,out);return out.exports;}
const {AIMessage}=compile(new URL('../app/ai-message.tsx',import.meta.url),{'@/lib/message-format':{messageParts}});
assert.equal(messageParts('Energy: \\(E=mc^2\\)').find(p=>p.kind==='math').text,'E=mc^2');
assert.equal(messageParts('```latex\n\\frac{a}{b}\n```')[0].kind,'math');
assert.equal(messageParts('```python\nprint(1)\n```')[0].kind,'code');
const html=renderToStaticMarkup(React.createElement(AIMessage,{content:'$$\\frac{F}{m}$$ <script>alert(1)</script>'}));assert.ok(html.includes('<mfrac>'));assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));
const unsafe=renderToStaticMarkup(React.createElement(AIMessage,{content:'$\\href{javascript:alert(1)}{bad}$'}));assert.ok(!unsafe.includes('href="javascript:'));
const {StudyWorkspace,clampSplit}=compile(new URL('../app/study-workspace.tsx',import.meta.url),{'@/lib/i18n':{translate:(_,k)=>k}});assert.equal(clampSplit(-10),25);assert.equal(clampSplit(99),65);const workspace=renderToStaticMarkup(React.createElement(StudyWorkspace,{lang:'fr'},React.createElement('section',null,'Course'),React.createElement('section',null,'Coach')));assert.ok(workspace.includes('aria-orientation="vertical"'));assert.ok(workspace.includes('course-pane'));assert.ok(workspace.includes('coach-pane'));
console.log('Passed: formula delimiters/code fences, actual fractions, escaped HTML/unsafe URLs, bounded resizer and both workspace panes.');
