import {del} from '@vercel/blob';
import {handleUpload,type HandleUploadBody} from '@vercel/blob/client';
import {identity,json,failure,runtimeEnv} from '@/lib/server';
import {pendingUpload} from '@/lib/uploads';
export async function POST(request:Request){try{
 const body=await request.json() as HandleUploadBody;
 const result=await handleUpload({request,body,onBeforeGenerateToken:async(pathname,clientPayload)=>{
  const user=await identity(request);const row=await pendingUpload(clientPayload||'',user.userId);
  if(row.pathname!==pathname)throw new Error('FORBIDDEN');
  return {allowedContentTypes:[row.type],maximumSizeInBytes:row.size,validUntil:row.expires,addRandomSuffix:false,allowOverwrite:false};
 },onUploadCompleted:async({blob})=>{
  const db=runtimeEnv().DB;
  const pending=await db.prepare('SELECT id FROM uploads WHERE pathname=? AND expires>?').bind(blob.pathname,Date.now()).first();
  const saved=await db.prepare("SELECT id FROM records WHERE kind='file' AND json_extract(payload,'$.fileKey')=?").bind(blob.pathname).first();
  if(!pending&&!saved)await del(blob.pathname);
 }});return json(result);
}catch(e){return failure(e)}}
