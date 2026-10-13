import {get,del,head} from '@vercel/blob';
import {database as db} from './database';
export const uploadTypes=['application/pdf','image/png','image/jpeg','image/webp','audio/webm','audio/mp4','audio/mpeg','audio/ogg','audio/wav','audio/x-wav','audio/x-m4a','audio/m4a','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.presentationml.presentation'];
export async function pendingUpload(id:string,owner:string){const row=await db.prepare('SELECT * FROM uploads WHERE id=? AND owner=? AND expires>?').bind(id,owner,Date.now()).first();if(!row)throw new Error('NOT_FOUND');return row;}
export async function verifyUpload(row:Record<string,any>){const blob=await head(row.pathname);if(blob.size!==row.size||blob.contentType.split(';')[0]!==row.type)throw new Error('INVALID');return blob;}
export async function consumeUpload(form:FormData,field:string,owner:string,maxSize:number,allowed:string[]){
 const id=form.get(field+'Id');if(typeof id!=='string')return null;
 const row=await pendingUpload(id,owner);if(row.size>maxSize||!allowed.includes(row.type))throw new Error('INVALID');
 await verifyUpload(row);const blob=await get(row.pathname,{access:'private'});if(!blob||blob.statusCode!==200)throw new Error('NOT_FOUND');
 const bytes=await new Response(blob.stream).arrayBuffer();
 // Keep the reservation until the upload token expires, preventing quota reuse.
 await del(row.pathname);
 return new File([bytes],row.name,{type:row.type});
}
export async function cleanupUploads(owner:string){
 const rows=await db.prepare('SELECT id,pathname FROM uploads WHERE owner=? AND expires<? LIMIT 50').bind(owner,Date.now()-3600000).all();
 for(const r of rows.results){await del(r.pathname);await db.prepare('DELETE FROM uploads WHERE id=? AND owner=?').bind(r.id,owner).run();}
}
