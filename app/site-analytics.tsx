'use client';
import {Analytics} from '@vercel/analytics/next';
export default function SiteAnalytics(){
 return <Analytics beforeSend={event=>{
  const url=new URL(event.url);
  // Never collect reset tokens, search text, invitation codes or URL fragments.
  url.search='';url.hash='';
  return {...event,url:url.toString()};
 }}/>;
}
