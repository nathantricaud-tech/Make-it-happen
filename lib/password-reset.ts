import type {AppDatabase} from './database';
import {randomBytes} from 'node:crypto';
import {digest,hashPassword,normalizeEmail,validatePassword} from './email-auth';
export type MailConfig={RESEND_API_KEY?:string;MAIL_FROM?:string;APP_ORIGIN?:string};
export function resetConfigured(env:MailConfig){try{const u=new URL(env.APP_ORIGIN||'');return !!env.RESEND_API_KEY&&!!env.MAIL_FROM&&u.protocol==='https:'&&u.origin===env.APP_ORIGIN}catch{return false}}
const messages={
 fr:['Réinitialise ton mot de passe','Tu as demandé à réinitialiser ton mot de passe Make it happen.','Choisir un nouveau mot de passe','Ce lien est valable 20 minutes et ne peut être utilisé qu’une fois. Si tu n’es pas à l’origine de cette demande, ignore cet e-mail.'],
 en:['Reset your password','You requested a password reset for Make it happen.','Choose a new password','This link expires in 20 minutes and can only be used once. If you did not request it, ignore this email.'],
 de:['Passwort zurücksetzen','Du hast das Zurücksetzen deines Passworts für Make it happen angefordert.','Neues Passwort wählen','Dieser Link gilt 20 Minuten und kann nur einmal verwendet werden. Wenn du dies nicht angefordert hast, ignoriere diese E-Mail.'],
 es:['Restablece tu contraseña','Has solicitado restablecer tu contraseña de Make it happen.','Elegir nueva contraseña','Este enlace caduca en 20 minutos y solo puede usarse una vez. Si no lo solicitaste, ignora este correo.']
};
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export async function handlePasswordReset(req:Request,db:AppDatabase,env:MailConfig,send:typeof fetch=fetch){
 const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
 try{
  if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'AUTH_FORBIDDEN'},403);
  if(!req.headers.get('content-type')?.startsWith('application/json'))return reply({error:'AUTH_INVALID'},400);
  const raw=await req.text();if(raw.length>4096)return reply({error:'AUTH_INVALID'},400);const b=JSON.parse(raw),now=Math.floor(Date.now()/1000);
  if(!['request','reset'].includes(b.action))return reply({error:'AUTH_INVALID'},400);
  const throttle=async(key:string,limit:number)=>{const row=await db.prepare('INSERT INTO auth_attempts(key,window,count) VALUES(?,?,1) ON CONFLICT(key,window) DO UPDATE SET count=count+1 WHERE count<? RETURNING count').bind(digest('reset:'+key),Math.floor(now/900)*900,limit).first();if(!row)throw Error('AUTH_LIMIT')};
  await throttle(req.headers.get('x-vercel-forwarded-for')||'unknown',20);
  await db.prepare('DELETE FROM password_resets WHERE expires<=?').bind(now).run();
  if(b.action==='request'){
   if(!resetConfigured(env))return reply({error:'MAIL_UNAVAILABLE'},503);
   const email=normalizeEmail(b.email);await throttle(email,3);
   const account=await db.prepare('SELECT id,password_hash FROM email_accounts WHERE email=?').bind(email).first<{id:string;password_hash:string}>();
   // Same public result for unknown accounts and provider failures; never log addresses or tokens.
   if(account){
    const token=randomBytes(32).toString('hex'),hash=digest(token),lang=Object.hasOwn(messages,b.lang)?b.lang as keyof typeof messages:'fr';
    await db.prepare('INSERT INTO password_resets(token_hash,account_id,password_snapshot,expires) VALUES(?,?,?,?)').bind(hash,account.id,account.password_hash,now+1200).run();
    const m=messages[lang],url=env.APP_ORIGIN+'/reset-password#token='+token+'&lang='+lang;
    try{const result=await send('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'reset-'+hash},body:JSON.stringify({from:env.MAIL_FROM,to:[email],subject:'Make it happen — '+m[0],text:m[1]+'\n\n'+url+'\n\n'+m[3],html:`<div style="background:#111;color:#f5f5f5;padding:40px;font-family:Arial,sans-serif;line-height:1.7"><p>MAKE IT HAPPEN ↗</p><h1>${m[0]}</h1><p>${m[1]}</p><p><a style="display:inline-block;background:#fff;color:#111;padding:14px 22px;border-radius:16px" href="${escape(url)}">${m[2]}</a></p><p>${m[3]}</p></div>`}),signal:AbortSignal.timeout(12000)});if(!result.ok)throw Error('MAIL_SEND_FAILED')}catch{await db.prepare('DELETE FROM password_resets WHERE token_hash=?').bind(hash).run();console.error('PASSWORD_RESET_DELIVERY_FAILED')}
   }
   return reply({ok:true});
  }
  validatePassword(b.password);if(typeof b.token!=='string'||!/^[a-f0-9]{64}$/.test(b.token))return reply({error:'RESET_INVALID'},400);
  const tokenHash=digest(b.token),row=await db.prepare('SELECT r.account_id,r.password_snapshot FROM password_resets r JOIN email_accounts a ON a.id=r.account_id AND a.password_hash=r.password_snapshot WHERE r.token_hash=? AND r.expires>?').bind(tokenHash,now).first<{account_id:string;password_snapshot:string}>();
  if(!row)return reply({error:'RESET_INVALID'},400);
  const nextHash=await hashPassword(b.password),recovery=randomBytes(32).toString('hex');
  // D1 batch is transactional: single-use redemption and revocation are committed together.
  const changes=await db.batch([
   db.prepare('UPDATE email_accounts SET password_hash=?,recovery_hash=? WHERE id=? AND password_hash=? AND EXISTS(SELECT 1 FROM password_resets WHERE token_hash=? AND account_id=? AND expires>?)').bind(nextHash,digest(recovery),row.account_id,row.password_snapshot,tokenHash,row.account_id,Math.floor(Date.now()/1000)),
   db.prepare('DELETE FROM email_sessions WHERE account_id=? AND EXISTS(SELECT 1 FROM email_accounts WHERE id=? AND password_hash=?)').bind(row.account_id,row.account_id,nextHash),
   db.prepare('DELETE FROM password_resets WHERE account_id=? AND EXISTS(SELECT 1 FROM email_accounts WHERE id=? AND password_hash=?)').bind(row.account_id,row.account_id,nextHash)
  ]);
  if(!changes[0].meta.changes)return reply({error:'RESET_INVALID'},400);
  return reply({ok:true,recoveryCode:recovery});
 }catch(e){const code=e instanceof Error?e.message:'';return reply({error:['AUTH_LIMIT','AUTH_PASSWORD','AUTH_INVALID','AUTH_BUSY'].includes(code)?code:'AUTH_ERROR'},code==='AUTH_LIMIT'||code==='AUTH_BUSY'?429:code==='AUTH_PASSWORD'||code==='AUTH_INVALID'?400:500)}
}
