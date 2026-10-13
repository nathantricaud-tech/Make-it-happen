import {runtimeEnv} from '@/lib/server';
import {handlePasswordReset} from '@/lib/password-reset';
export async function POST(req:Request){const env=runtimeEnv();return handlePasswordReset(req,env.DB,env)}
