import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),ocrRequire=createRequire(require.resolve('tesseract.js'));
const roots={pdf:path.dirname(require.resolve('pdfjs-dist/package.json')),ocr:path.dirname(require.resolve('tesseract.js/package.json')),core:path.dirname(ocrRequire.resolve('tesseract.js-core/package.json'))};
const manifest=JSON.parse(fs.readFileSync(new URL('./assets-manifest.json',import.meta.url),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const item of manifest){
 if(fs.existsSync(item.target)&&hash(fs.readFileSync(item.target))===item.sha256)continue;
 let bytes;
 if(item.url){const r=await fetch(item.url,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error('Asset download failed: '+item.target);bytes=Buffer.from(await r.arrayBuffer())}
 else bytes=fs.readFileSync(path.join(roots[item.package],item.source));
 if(hash(bytes)!==item.sha256)throw Error('Asset integrity mismatch: '+item.target);
 fs.mkdirSync(path.dirname(item.target),{recursive:true});fs.writeFileSync(item.target,bytes);
}
console.log('OCR and PDF assets ready; all SHA-256 checks passed.');
