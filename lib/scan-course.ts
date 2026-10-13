import {MAX_COURSE_FILE,MAX_COURSE_TEXT,MAX_PDF_PAGES} from './import-limits';
import {prepareCourseImage} from './course-image';
import type {Lang} from './i18n';
export const officeTypes={docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation'};
export function scanType(file:{name:string;type:string}){if(file.type==='application/pdf'||/\.pdf$/i.test(file.name))return 'application/pdf';if(file.type.startsWith('text/')||/\.txt$/i.test(file.name))return 'text/plain';if(['image/png','image/jpeg','image/webp'].includes(file.type))return file.type;const ext=file.name.split('.').pop()?.toLowerCase();return ({...officeTypes,png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp'} as Record<string,string>)[ext||'']||'';}
export async function scanCourse(file:File,lang:Lang,onProgress:(n:number)=>void){
 const type=scanType(file);if(!type)throw new Error('SCAN_TYPE');if(file.size>MAX_COURSE_FILE)throw new Error('SCAN_SIZE');
 let worker:Awaited<ReturnType<typeof import('tesseract.js').createWorker>>|undefined;
 let timer:ReturnType<typeof setTimeout>|undefined;let expired=false;
 const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{expired=true;void worker?.terminate();reject(new Error('SCAN_TIMEOUT'))},600000)});
 const run=async()=>{
 const recognize=async(image:string|HTMLCanvasElement)=>{if(expired)throw new Error('SCAN_TIMEOUT');if(!worker){const {createWorker}=await import('tesseract.js');worker=await createWorker({fr:'fra',en:'eng',de:'deu',es:'spa'}[lang],1,{workerPath:'/ocr/worker.min.js',corePath:'/ocr/core',langPath:'/ocr/data',workerBlobURL:false});if(expired){await worker.terminate();throw new Error('SCAN_TIMEOUT')}}return (await worker.recognize(image)).data.text;};
 if(type==='text/plain')return file.text();if(Object.values(officeTypes).includes(type)){const {extractOffice}=await import('./office-import');const text=extractOffice(new Uint8Array(await file.arrayBuffer()),lang);onProgress(100);return text;}
 if(type==='application/pdf'){
  const pdfjs=await import('pdfjs-dist');pdfjs.GlobalWorkerOptions.workerSrc='/pdf.worker.min.mjs';const task=pdfjs.getDocument({data:await file.arrayBuffer()});const pdf=await task.promise;
  try{if(pdf.numPages>MAX_PDF_PAGES)throw new Error('SCAN_PAGES');const pages:string[]=[];for(let i=1;i<=pdf.numPages;i++){if(expired)throw new Error('SCAN_TIMEOUT');const page=await pdf.getPage(i);const data=await page.getTextContent();let text=data.items.map((item:any)=>item.str?(item.str+(item.hasEOL?'\n':' ')):'').join('');if(text.trim().length<30){const base=page.getViewport({scale:1});const viewport=page.getViewport({scale:Math.min(2,2200/Math.max(base.width,base.height))});const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);const ctx=canvas.getContext('2d');if(!ctx)throw new Error('SCAN_FAILED');await page.render({canvas,canvasContext:ctx,viewport}).promise;text=await recognize(canvas);canvas.width=canvas.height=0;}if(text.trim())pages.push(`[${i}]\n${text.trim()}`);page.cleanup();onProgress(Math.round(i/pdf.numPages*100));}return pages.join('\n\n');}finally{await task.destroy();}
 }
 const url=URL.createObjectURL(await prepareCourseImage(file));try{const text=await recognize(url);onProgress(100);return text;}finally{URL.revokeObjectURL(url)};
 };
 try{const text=(await Promise.race([run(),timeout])).trim();if(!text)throw new Error('SCAN_EMPTY');if(text.length>MAX_COURSE_TEXT)throw new Error('SCAN_LENGTH');return {text,type};}finally{clearTimeout(timer);if(worker)await worker.terminate().catch(()=>{});}
}
