import {MAX_COURSE_FILE,MAX_STORAGE_BYTES} from '@/lib/import-limits';
import {identity,runtimeEnv,json,failure,id,str} from '@/lib/server';
import {uploadTypes,pendingUpload,verifyUpload,cleanupUploads} from '@/lib/uploads';
import {issueSignedToken,presignUrl,del} from '@vercel/blob';
export async function POST(req:Request){try{
 const u=await identity(req),db=runtimeEnv().DB,b=await req.json();
 if(b.action==='prepare'){
  const name=str(b.name,255),type=str(b.type,200),size=b.size;
  if(/[\x00-\x1f]/.test(name)||!uploadTypes.includes(type)||!Number.isSafeInteger(size)||size<=0||size>MAX_COURSE_FILE)throw new Error('INVALID');
  await cleanupUploads(u.userId);
  const key=id(),pathname=`${u.userId}/${key}/${name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
  const result=await db.prepare(`INSERT INTO uploads(id,owner,pathname,name,type,size,expires)
   SELECT ?,?,?,?,?,?,? WHERE
   COALESCE((SELECT SUM(CAST(json_extract(payload,'$.size') AS INTEGER)) FROM records WHERE owner=? AND kind='file'),0)
   +COALESCE((SELECT SUM(size) FROM uploads WHERE owner=?),0)+?<=?`).bind(key,u.userId,pathname,name,type,size,Date.now()+900000,u.userId,u.userId,size,MAX_STORAGE_BYTES).run();
  if(!result.meta.changes)throw new Error('STORAGE_LIMIT');return json({id:key,pathname});
 }
 if(b.action==='cancel'){
  const row=await db.prepare('SELECT * FROM uploads WHERE id=? AND owner=?').bind(str(b.id),u.userId).first();
  if(row)await del(row.pathname);return json({ok:true});
 }
 if(b.action==='complete'){
  const row=await pendingUpload(str(b.id),u.userId);await verifyUpload(row);
  const payload=JSON.stringify({fileKey:row.pathname,name:row.name,type:row.type,size:row.size});
  await db.batch([
   db.prepare("INSERT OR IGNORE INTO records(id,owner,kind,payload,created) SELECT id,owner,'file',?,? FROM uploads WHERE id=? AND owner=?").bind(payload,new Date().toISOString(),row.id,u.userId),
   db.prepare('DELETE FROM uploads WHERE id=? AND owner=?').bind(row.id,u.userId)
  ]);return json({id:row.id,name:row.name,type:row.type});
 }
 throw new Error('INVALID');
}catch(e){return failure(e)}}
export async function GET(req:Request){try{
 const u=await identity(req),key=str(new URL(req.url).searchParams.get('id'));
 const row=await runtimeEnv().DB.prepare("SELECT payload FROM records WHERE id=? AND owner=? AND kind='file'").bind(key,u.userId).first();if(!row)throw new Error('NOT_FOUND');
 const {fileKey}=JSON.parse(String(row.payload));const validUntil=Date.now()+300000;
 const token=await issueSignedToken({pathname:fileKey,operations:['get'],validUntil});
 const {presignedUrl}=await presignUrl(token,{access:'private',pathname:fileKey,operation:'get',validUntil});
 return new Response(null,{status:307,headers:{Location:presignedUrl,'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
}catch(e){return failure(e)}}
