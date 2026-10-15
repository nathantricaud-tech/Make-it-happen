import {francAll} from 'franc-min';
import type {Lang} from './i18n';
export const languageNames={fr:'français',en:'English',de:'Deutsch',es:'español'};
export function languageRule(lang:Lang){return `OUTPUT LANGUAGE: ${languageNames[lang]}. Every user-visible title, heading, instruction, question, example, explanation, answer, and marking criterion MUST be entirely in ${languageNames[lang]}. The course's language, previous chat language and JSON field names do not change this requirement. Translate the content when needed. Only mathematical symbols, proper names and explicitly quoted foreign expressions may remain unchanged. No bilingual headings or English boilerplate.`;}
const iso={fr:'fra',en:'eng',de:'deu',es:'spa'};
function wrongLanguage(text:string,lang:Lang){const natural=text.replace(/\$\$?[\s\S]*?\$\$?/g,' ').replace(/\\[a-z]+|[0-9_={}<>^+*/]/gi,' ').trim();if(natural.length<150)return false;const scores=francAll(natural,{minLength:150});const [top,runner]=scores;return !!top&&Object.values(iso).includes(top[0])&&top[0]!==iso[lang]&&top[1]-(runner?.[1]||0)>.07;}
export function languageMismatch(value:any,lang:Lang):boolean{if(typeof value==='string'){if(wrongLanguage(value,lang))return true;return value.split(/\n\s*\n/).some(part=>wrongLanguage(part,lang));}if(Array.isArray(value))return value.some(v=>languageMismatch(v,lang));if(value&&typeof value==='object')return Object.entries(value).filter(([k])=>!['language','kind','type','courseId'].includes(k)).some(([,v])=>languageMismatch(v,lang));return false;}
export function studyPrompt(mode:string,lang:Lang,custom=''){
 const common=languageRule(lang);
 const prompts:Record<string,string>={
 sheet:'Create a REVISION SHEET, not an essay. Return JSON {language,title,summary,sections:[{kind,heading,items}]}. language must be the requested two-letter code. Summary: 1-2 short sentences. Use 6-7 ordered sections with kinds essentials,definitions,formulas (only if supported),method,example,mistakes,recall. All section headings must be translated. Each section has 2-6 concise meaningful items, normally 1-2 sentences each. Essentials: prioritized ideas and relationships, never an exhaustive paraphrase. Definitions: term plus precise definition. Formulas: readable Unicode formulas plus variable meanings and units, validity conditions, no invented equations. Method: numbered actionable steps suited to the subject (problem solving, argumentation or analysis). Example: one fully worked course-based example, with data, substitutions, result and interpretation where relevant. Mistakes: concrete pitfalls and how to avoid them. Recall: 3-5 short active-recall questions with concise answers. Ground all content in the supplied course and cover its main parts. No Markdown tables, no code fences, no essay paragraphs. Use plain text with Unicode mathematics in each item. Never invent missing material.',
 exam:'Create a rigorous ORIGINAL written mock exam from the course, never a multiple-choice quiz. Return JSON {title,instructions,duration,questions:[{question,points,answer}]}. Exactly 5 open-ended questions worth 4 points each, total 20. Respect the chosen difficulty and duration. Provide progressive questions: knowledge and explanations, application using new data or a modified course example, justified reasoning, synthesis or a supported edge case. Number any subquestions. Include every datum needed, define symbols and units, avoid an ambiguous or unsolvable question. For each answer give a detailed worked solution with intermediate reasoning, the final conclusion, and an explicit 4-point marking scheme allocating each point. Check the arithmetic, units and consistency of the answer before finalizing. For non-numerical subjects provide expected arguments, evidence from the course and acceptable alternatives. No facts outside the supplied course, no claims that this is official or sourced online. Use readable LaTeX within $ or $$ when helpful; never code blocks. All answers and marking schemes must be in the requested language.',
 quiz:'Generate 5 meaningful multiple-choice questions, with 4 plausible distinct options each and exactly one correct answer. Return JSON {title,questions:[{question,options:[four strings],answer:zero-based correct index,explanation}]}. Explanations must justify the answer in the requested language, including calculation steps when relevant. Ground questions in the course.',
 slides:'Create exactly 5 pedagogical slides: core idea, process, worked example, common mistake, recap. Titles under 55 characters, text under 180, narration under 450. Return JSON {title,slides:[{title,text,narration}]}. Use exact facts from the course.'};
 return (mode==='chat'?custom:(prompts[mode]||''))+'\n'+(mode==='sheet'?`Required language code: ${lang}.\n`:'')+(mode==='exam'&&custom?'Exam preferences: '+custom+'\n':'')+common;
}

// Select bounded, distributed excerpts; never imply that every page was read.
export function courseContext(text:string,max=8000){
 const clean=text.replace(/\r\n/g,'\n').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();
 if(clean.length<=max)return clean;
 const notice='[Selected excerpts distributed across the course, NOT the complete document. Cover the supported concepts only; do not claim exhaustive coverage.]\n';
 const count=8,size=Math.max(1,Math.floor((max-notice.length-240)/count));
 const excerpts=Array.from({length:count},(_,i)=>{
  const position=Math.floor(i*(clean.length-size)/(count-1));
  const boundary=i?clean.indexOf('\n',position):-1;
  const start=boundary>=position&&boundary<position+150?boundary+1:position;
  return `[Excerpt ${i+1}/${count}]\n`+clean.slice(start,start+size);
 });
 return (notice+excerpts.join('\n\n')).slice(0,max);
}

export function detectCourseLanguage(text:string,fallback:Lang):Lang{
 const clean=text.replace(/\$[^$]*\$/g,' ').replace(/\\[a-zA-Z]+|[0-9_={}<>^+*/]/g,' ');
 if(clean.trim().length<80)return fallback;
 const votes:Partial<Record<Lang,number>>={};
 for(let i=0;i<5;i++){
  const start=Math.floor(i*Math.max(0,clean.length-1800)/4);
  const top=francAll(clean.slice(start,start+1800),{minLength:80})[0]?.[0];
  const lang=(Object.keys(iso) as Lang[]).find(k=>iso[k]===top);
  if(lang)votes[lang]=(votes[lang]||0)+1;
 }
 const winner=(Object.entries(votes) as [Lang,number][]).sort((a,b)=>b[1]-a[1])[0];
 return winner&&winner[1]>=3?winner[0]:fallback;
}

// Keep overview coverage and add query-relevant passages within the same provider budget.
export function focusedCourseContext(text:string,query:string,max=8000){
 if(text.length<=max||!query.trim())return courseContext(text,max);
 const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const stop=new Set('avec dans pour que qui les des une est sont sur par this that what which with from explain explique comment pourquoi how why der die das und ein eine ist mit para como que los las del por'.split(' '));
 const words=[...new Set(normalize(query).match(/[a-z]{3,}/g)||[])].filter(w=>!stop.has(w)).slice(0,24);
 if(!words.length)return courseContext(text,max);
 const chunks=[];for(let start=0;start<text.length;start+=900){const value=text.slice(start,start+1100);const normalized=normalize(value);let score=0;for(const word of words){const matches=normalized.split(word).length-1;score+=Math.min(matches,4)}if(score)chunks.push({start,value,score})}
 const selected=chunks.sort((a,b)=>b.score-a.score||a.start-b.start).slice(0,3).sort((a,b)=>a.start-b.start);
 if(!selected.length)return courseContext(text,max);
 const relevant='\n\n[Passages selected for the question; excerpts, not the full document]\n'+selected.map(c=>c.value).join('\n[…]\n');
 return (courseContext(text,Math.max(1000,max-relevant.length))+relevant).slice(0,max);
}
