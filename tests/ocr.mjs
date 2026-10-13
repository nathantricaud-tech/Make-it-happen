import assert from 'node:assert/strict';
import {createWorker} from 'tesseract.js';
import {scanType} from '../lib/scan-course.ts';
assert.equal(scanType({name:'scan.PDF',type:''}),'application/pdf');
assert.equal(scanType({name:'photo.jpeg',type:''}),'image/jpeg');
assert.equal(scanType({name:'course.heic',type:'image/heic'}),'');
for(const [lang,word] of Object.entries({fra:'dilution',eng:'concentration',deu:'Konzentration',spa:'concentración'})){
 const worker=await createWorker(lang,1,{langPath:new URL('../public/ocr/data/',import.meta.url).pathname,cacheMethod:'none'});
 try{const result=await worker.recognize(new URL('./fixtures/ocr-'+lang+'.png',import.meta.url).pathname);assert.ok(result.data.text.includes(word),lang+': '+result.data.text);console.log(lang+': OCR verified')}finally{await worker.terminate()}
}
