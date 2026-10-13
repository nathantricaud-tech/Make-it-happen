import {headers} from 'next/headers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {runtimeEnv,json} from '@/lib/server';
import {emailIdentity,handleEmailAuth} from '@/lib/email-auth';
export const dynamic='force-dynamic';
export async function GET(){const db=runtimeEnv().DB;const h=await headers();const user=await emailIdentity(db,h.get('cookie'));const platform=await getChatGPTUser();const linked=platform?await db.prepare('SELECT 1 FROM email_accounts WHERE user_id=?').bind(platform.userId).first():null;return json({authenticated:!!user,canLinkCurrent:!!platform&&!linked,email:user?.email||null});}
export async function POST(req:Request){return handleEmailAuth(req,runtimeEnv().DB,getChatGPTUser);}
