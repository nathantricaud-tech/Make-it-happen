import {runtimeEnv,json,identity} from '@/lib/server';
export const dynamic='force-dynamic';
let cached:{until:number;status:string}|undefined;
let pending:Promise<string>|undefined;
async function check(){
 const env=runtimeEnv();
 if(!env.GROQ_API_KEY)return 'missing';
 if(cached&&cached.until>Date.now())return cached.status;
 if(!pending)pending=(async()=>{
  let status='unreachable';
  try{
   const r=await fetch('https://api.groq.com/openai/v1/models',{headers:{Authorization:`Bearer ${env.GROQ_API_KEY}`},signal:AbortSignal.timeout(10000)});
   if(r.ok){const body:any=await r.json();status=body.data?.some((m:any)=>m.id===(env.GROQ_MODEL||'openai/gpt-oss-20b'))?'ready':'model_missing';}
   else status=r.status===401||r.status===403?'invalid':r.status===429?'rate_limited':'unreachable';
  }catch{}
  cached={until:Date.now()+60000,status};return status;
 })().finally(()=>{pending=undefined});
 return pending;
}
// Read-only service status. No visitor data or secret values are returned.
export async function GET(){const [user,status]=await Promise.all([identity().catch(()=>null),check()]);return json({authenticated:!!user,provider:status});}
