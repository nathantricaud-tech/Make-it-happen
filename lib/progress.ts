export type StudyRecord={id:string;kind:string;[key:string]:any};
export const thresholds=[0,60,240,600,1500,3600];
export function progress(records:StudyRecord[],today:string){
 const daily=new Map<string,number>();
 for(const r of records)if(r.kind==='session'&&!r.planned&&typeof r.date==='string'&&r.date<=today&&Number.isFinite(r.minutes)&&r.minutes>0)daily.set(r.date,(daily.get(r.date)||0)+r.minutes);
 const minutes=[...daily.values()].reduce((a,b)=>a+b,0),xp=[...daily.values()].reduce((a,b)=>a+Math.min(120,b),0);
 const dates=[...daily.keys()].sort();let streak=0,best=0,previous='';for(const date of dates){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-1);streak=d.toISOString().slice(0,10)===previous?streak+1:1;best=Math.max(best,streak);previous=date;}
 const courses=records.filter(r=>r.kind==='course'&&!r.example).length;
 const sheets=records.filter(r=>r.kind==='artifact'&&r.type==='sheet').length;
 const perfect=records.some(r=>r.kind==='attempt'&&Number.isInteger(r.total)&&r.total>0&&r.score===r.total);
 const values=[courses,daily.size,minutes,best,sheets,perfect?1:0];const goals=[1,7,300,3,5,1];
 const badges=values.map((value,i)=>({index:i,value,goal:goals[i],unlocked:value>=goals[i]}));
 const rank=thresholds.reduce((n,x,i)=>xp>=x?i:n,0);const next=thresholds[rank+1];
 return {xp,rank,next,percent:next?Math.min(100,(xp-thresholds[rank])/(next-thresholds[rank])*100):100,badges,minutes,days:daily.size};
}
export type Highlight={start:number;end:number;color:'graphite'|'yellow'|'sage'};
export function validHighlights(value:unknown,text:string):Highlight[]{return Array.isArray(value)?value.filter((h:any)=>h&&Number.isInteger(h.start)&&Number.isInteger(h.end)&&h.start>=0&&h.end>h.start&&h.end<=text.length&&['graphite','yellow','sage'].includes(h.color)).slice(0,500).sort((a,b)=>a.start-b.start).reduce((out:Highlight[],h:Highlight)=>{if(!out.length||h.start>=out[out.length-1].end)out.push(h);return out;},[]):[];}
export function addHighlight(marks:Highlight[],mark:Highlight){return [...marks.filter(h=>h.end<=mark.start||h.start>=mark.end),mark].sort((a,b)=>a.start-b.start);}
