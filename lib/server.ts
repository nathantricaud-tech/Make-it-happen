import {database} from './database';
import {del} from '@vercel/blob';
import {headers} from 'next/headers';
import {emailIdentity} from './email-auth';
export const runtimeEnv=()=>({GROQ_API_KEY:process.env.GROQ_API_KEY,GROQ_MODEL:process.env.GROQ_MODEL,GROQ_VISION_MODEL:process.env.GROQ_VISION_MODEL,RESEND_API_KEY:process.env.RESEND_API_KEY,MAIL_FROM:process.env.MAIL_FROM,APP_ORIGIN:process.env.APP_ORIGIN,DB:database,BUCKET:{delete:(pathname:string)=>del(pathname)}});
export async function identity(req?:Request){if(req&&req.method!=='GET'){const origin=req.headers.get('origin');if(origin!==new URL(req.url).origin)throw new Error('FORBIDDEN');} const h=req?req.headers:await headers();const user=await emailIdentity(runtimeEnv().DB,h.get('cookie'));if(!user)throw new Error('UNAUTHORIZED');return user;}
export const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export function failure(e:unknown){const message=e instanceof Error?e.message:'ERROR';return json({error:['UNAUTHORIZED','FORBIDDEN','NOT_FOUND','LIMIT','INVALID','AI_UNAVAILABLE','AI_ERROR','AI_KEY_INVALID','AI_RATE_LIMIT','AI_FORMAT','AUDIO_EMPTY','STORAGE_LIMIT'].includes(message)?message:'ERROR'},message==='UNAUTHORIZED'?401:message==='FORBIDDEN'?403:message==='NOT_FOUND'?404:(message==='LIMIT'||message==='AI_RATE_LIMIT')?429:message==='AI_KEY_INVALID'?502:message==='AI_UNAVAILABLE'?503:['INVALID','STORAGE_LIMIT'].includes(message)?400:500);}
export function str(v:unknown,max=200){if(typeof v!=='string'||!v.trim()||v.length>max)throw new Error('INVALID');return v.trim();}
export const id=()=>crypto.randomUUID();
// Free access for every authenticated student; provider limits still apply.
export async function reserve(_owner:string){return async()=>{};}
