import type {AppDatabase} from './database';
import {randomBytes,scrypt,timingSafeEqual,createHash} from 'node:crypto';
export const SESSION_COOKIE='__Host-mih_session';
const SESSION_SECONDS=30*24*60*60;
const options={N:16384,r:8,p:5,maxmem:32*1024*1024};
let hashing=false;
async function derive(password:string,salt:string):Promise<Buffer>{
 if(hashing)throw new Error('AUTH_BUSY');hashing=true;
 try{return await new Promise((resolve,reject)=>scrypt(password,salt,32,options,(e,value)=>e?reject(e):resolve(value)))}finally{hashing=false}
}
export const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
export function normalizeEmail(v:unknown){if(typeof v!=='string'||v.length>254)throw new Error('AUTH_INVALID');const email=v.trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('AUTH_INVALID');return email;}
export function validatePassword(v:unknown):asserts v is string{if(typeof v!=='string'||v.length<12||v.length>128)throw new Error('AUTH_PASSWORD');}
export async function hashPassword(password:string){validatePassword(password);const salt=randomBytes(16).toString('hex');const hash=await derive(password,salt);return `scrypt:16384:8:5:${salt}:${hash.toString('hex')}`;}
export async function verifyPassword(password:string,encoded:string){const parts=encoded.split(':');if(parts.length!==6||parts.slice(0,4).join(':')!=='scrypt:16384:8:5'||! /^[a-f0-9]{32}$/.test(parts[4])||! /^[a-f0-9]{64}$/.test(parts[5]))return false;const actual=await derive(password,parts[4]);return timingSafeEqual(actual,Buffer.from(parts[5],'hex'));}
export function sessionToken(cookie:string|null){const value=(cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(SESSION_COOKIE+'='))?.slice(SESSION_COOKIE.length+1);return value&&/^[a-f0-9]{64}$/.test(value)?value:null;}
export async function emailIdentity(db:AppDatabase,cookie:string|null){const token=sessionToken(cookie);if(!token)return null;const account=await db.prepare('SELECT a.user_id,a.email,a.name FROM email_sessions s JOIN email_accounts a ON a.id=s.account_id WHERE s.token_hash=? AND s.expires>?').bind(digest(token),Math.floor(Date.now()/1000)).first<{user_id:string;email:string;name:string}>();return account?{userId:account.user_id,email:account.email,fullName:account.name,displayName:account.name}:null;}
function cookie(token:string,age=SESSION_SECONDS){return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;}
const response=(data:unknown,status=200,session?:string)=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...(session?{'Set-Cookie':session}:{})}});
async function throttle(db:AppDatabase,key:string,limit:number,seconds:number){const now=Math.floor(Date.now()/1000),window=Math.floor(now/seconds)*seconds;const result=await db.prepare('INSERT INTO auth_attempts(key,window,count) VALUES(?,?,1) ON CONFLICT(key,window) DO UPDATE SET count=count+1 WHERE count<? RETURNING count').bind(digest(key),window,limit).first();if(!result)throw new Error('AUTH_LIMIT');}
async function newSession(db:AppDatabase,accountId:string){const token=randomBytes(32).toString('hex');await db.prepare('INSERT INTO email_sessions(token_hash,account_id,expires) VALUES(?,?,?)').bind(digest(token),accountId,Math.floor(Date.now()/1000)+SESSION_SECONDS).run();return token;}
type PlatformUser={userId:string;email:string;fullName:string|null}|null;
export async function handleEmailAuth(req:Request,db:AppDatabase,getPlatform:()=>Promise<PlatformUser>){
 try{
  if(req.headers.get('origin')!==new URL(req.url).origin)throw new Error('AUTH_FORBIDDEN');
  if(!req.headers.get('content-type')?.startsWith('application/json'))throw new Error('AUTH_INVALID');
  const body=await req.text();if(body.length>4096)throw new Error('AUTH_INVALID');const b=JSON.parse(body);
  if(!['register','login','logout','recover','password'].includes(b.action))throw new Error('AUTH_INVALID');
  if(b.action==='logout'){const token=sessionToken(req.headers.get('cookie'));if(token)await db.prepare('DELETE FROM email_sessions WHERE token_hash=?').bind(digest(token)).run();return response({ok:true},200,cookie('',0));}
  const current=await emailIdentity(db,req.headers.get('cookie'));
  const email=b.action==='password'?current?.email:normalizeEmail(b.email);if(!email)throw new Error('AUTH_CREDENTIALS');
  const platform=await getPlatform();
  const ip=req.headers.get('x-vercel-forwarded-for')||'unknown';
  await throttle(db,`ip:${ip}`,30,900);await throttle(db,`email:${email}`,10,900);
  await db.prepare('DELETE FROM auth_attempts WHERE window<?').bind(Math.floor(Date.now()/1000)-7200).run();
  await db.prepare('DELETE FROM email_sessions WHERE expires<=?').bind(Math.floor(Date.now()/1000)).run();
  if(b.action==='register'){
   await throttle(db,`registration:${ip}`,5,3600);
   if(current)throw new Error('AUTH_INVALID');validatePassword(b.password);
   if(typeof b.name!=='string'||!b.name.trim()||b.name.trim().length>40)throw new Error('AUTH_INVALID');
   // Linking is an explicit action authorized by the existing platform session, never by matching an e-mail.
   if(b.linkCurrent&&!platform)throw new Error('AUTH_FORBIDDEN');
   const userId=b.linkCurrent?platform!.userId:crypto.randomUUID();
   if(await db.prepare('SELECT 1 FROM email_accounts WHERE email=? OR user_id=?').bind(email,userId).first())throw new Error('AUTH_REGISTER');
   const accountId=crypto.randomUUID(),passwordHash=await hashPassword(b.password),recoveryCode=randomBytes(32).toString('hex'),token=randomBytes(32).toString('hex');
   const result=await db.batch([
    db.prepare('INSERT OR IGNORE INTO email_accounts(id,user_id,email,name,password_hash,recovery_hash,created) VALUES(?,?,?,?,?,?,?)').bind(accountId,userId,email,b.name.trim(),passwordHash,digest(recoveryCode),Math.floor(Date.now()/1000)),
    db.prepare('INSERT INTO email_sessions(token_hash,account_id,expires) SELECT ?,id,? FROM email_accounts WHERE id=?').bind(digest(token),Math.floor(Date.now()/1000)+SESSION_SECONDS,accountId)
   ]);
   if(!result[0].meta.changes)throw new Error('AUTH_REGISTER');
   return response({ok:true,recoveryCode},201,cookie(token));
  }
  const account=await db.prepare('SELECT * FROM email_accounts WHERE email=?').bind(email).first<{id:string;password_hash:string;recovery_hash:string|null}>();
  if(b.action==='recover'){
   validatePassword(b.password);
   const recovery=typeof b.recoveryCode==='string'?b.recoveryCode.replaceAll(' ','').trim():'';
   if(!account||! /^[a-f0-9]{64}$/.test(recovery)||!account.recovery_hash||!timingSafeEqual(Buffer.from(digest(recovery),'hex'),Buffer.from(account.recovery_hash,'hex')))throw new Error('AUTH_CREDENTIALS');
   const passwordHash=await hashPassword(b.password),nextCode=randomBytes(32).toString('hex');
   const changed=await db.prepare('UPDATE email_accounts SET password_hash=?,recovery_hash=? WHERE id=? AND recovery_hash=?').bind(passwordHash,digest(nextCode),account.id,account.recovery_hash).run();if(!changed.meta.changes)throw new Error('AUTH_CREDENTIALS');
   await db.prepare('DELETE FROM email_sessions WHERE account_id=?').bind(account.id).run();
   return response({ok:true,recoveryCode:nextCode},200,cookie('',0));
  }
  const password=b.action==='password'?b.oldPassword:b.password;
  if(typeof password!=='string'||password.length>128)throw new Error('AUTH_CREDENTIALS');
  // Unknown accounts also pay the password-hashing cost; login errors are identical.
  const encoded=account?.password_hash||'scrypt:16384:8:5:00000000000000000000000000000000:'+'0'.repeat(64);
  const valid=await verifyPassword(password,encoded);if(!account||!valid)throw new Error('AUTH_CREDENTIALS');
  if(b.action==='password'){
   const nextHash=await hashPassword(b.password);
   await db.prepare('UPDATE email_accounts SET password_hash=? WHERE id=?').bind(nextHash,account.id).run();
   await db.prepare('DELETE FROM email_sessions WHERE account_id=?').bind(account.id).run();
  }
  const token=await newSession(db,account.id);return response({ok:true},200,cookie(token));
 }catch(e){const error=e instanceof Error?e.message:'AUTH_ERROR';const known=['AUTH_INVALID','AUTH_PASSWORD','AUTH_FORBIDDEN','AUTH_CREDENTIALS','AUTH_REGISTER','AUTH_LIMIT','AUTH_BUSY'];return response({error:known.includes(error)?error:'AUTH_ERROR'},error==='AUTH_FORBIDDEN'?403:error==='AUTH_CREDENTIALS'?401:error==='AUTH_REGISTER'?409:['AUTH_LIMIT','AUTH_BUSY'].includes(error)?429:known.includes(error)?400:500);}
}
