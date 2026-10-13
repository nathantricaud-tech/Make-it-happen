import {identity,runtimeEnv,json,failure} from '@/lib/server';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{
 await identity();
 const requested=new URL(req.url).searchParams.get('lang')||'fr';const lang=['fr','en','de','es'].includes(requested)?requested:'fr';
 const date=new Date().toISOString().slice(0,10),key=`daily:${lang}:${date}`,db=runtimeEnv().DB;
 const cached=await db.prepare("SELECT payload FROM records WHERE id=? AND owner='__daily_public__'").bind(key).first();
 if(cached)return json(JSON.parse(String(cached.payload)));
 const params=new URLSearchParams({action:'query',format:'json',formatversion:'2',generator:'random',grnnamespace:'0',grnlimit:'5',grnfilterredir:'nonredirects',prop:'extracts|info|pageprops',inprop:'url',exintro:'1',explaintext:'1',exchars:'700',exlimit:'5',ppprop:'disambiguation'});
 const response=await fetch(`https://${lang}.wikipedia.org/w/api.php?${params}`,{headers:{'User-Agent':'MakeItHappenStudy/1.0 (https://klivo-study.sacred-owl-2095.chatgpt.site)'},signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw new Error('SOURCE_UNAVAILABLE');
 const data:any=await response.json();const page=data.query?.pages?.find((p:any)=>typeof p.extract==='string'&&p.extract.length>100&&!p.pageprops?.hasOwnProperty('disambiguation')&&p.fullurl?.startsWith(`https://${lang}.wikipedia.org/`));
 if(!page)throw new Error('SOURCE_UNAVAILABLE');
 const result={date,lang,title:page.title,text:page.extract,url:page.fullurl,retrievedAt:new Date().toISOString(),license:'https://creativecommons.org/licenses/by-sa/4.0/'};
 await db.prepare("INSERT OR IGNORE INTO records(id,owner,kind,payload,created) VALUES(?,'__daily_public__','daily',?,?)").bind(key,JSON.stringify(result),result.retrievedAt).run();
 const winner=await db.prepare("SELECT payload FROM records WHERE id=? AND owner='__daily_public__'").bind(key).first();
 return json(winner?JSON.parse(String(winner.payload)):result);
 }catch(e){if(e instanceof Error&&e.message==='UNAUTHORIZED')return failure(e);return json({error:'SOURCE_UNAVAILABLE'},503);}}
