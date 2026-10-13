import handler from 'vinext/server/fetch-handler';
export default {async fetch(request:Request,env:Cloudflare.Env,ctx:ExecutionContext){
 // Identity is provided exclusively by our signed-in email/password sessions.
 // Do not trust platform-authentication headers on a public Worker.
 const response=await handler.fetch(request,env,ctx);
 const headers=new Headers(response.headers);
 headers.set('X-Content-Type-Options','nosniff');
 headers.set('Referrer-Policy','no-referrer');
 headers.set('X-Frame-Options','DENY');
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}};
