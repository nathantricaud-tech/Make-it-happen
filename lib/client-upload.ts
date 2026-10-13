'use client';
import {upload} from '@vercel/blob/client';
async function action(body:unknown){const r=await fetch('/api/files',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw new Error(data.error);return data;}
export async function uploadPrivateFile(file:File,type=file.type,temporary=false){
 const normalized=type.split(';')[0];const pending=await action({action:'prepare',name:file.name,type:normalized,size:file.size});
 try{
  await upload(pending.pathname,file,{access:'private',handleUploadUrl:'/api/files/upload',clientPayload:pending.id,contentType:normalized,multipart:file.size>5*1024*1024});
  return temporary?pending:await action({action:'complete',id:pending.id});
 }catch(e){await action({action:'cancel',id:pending.id}).catch(()=>{});throw e;}
}
export async function uploadForm(url:string,form:FormData,signal?:AbortSignal){
 const pending:string[]=[];
 try{
  for(const [field,value] of Array.from(form.entries()))if(value instanceof File){const result=await uploadPrivateFile(value,value.type,true);pending.push(result.id);form.delete(field);form.set(field+'Id',result.id);}
  return await fetch(url,{method:'POST',body:form,signal});
 }finally{await Promise.all(pending.map(id=>action({action:'cancel',id}).catch(()=>{})));}
}
