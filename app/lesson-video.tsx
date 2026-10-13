'use client';
import {useEffect,useRef,useState} from 'react';
import {Play,Pause,Download,RotateCcw} from 'lucide-react';
import {Lang,locales,translate} from '@/lib/i18n';
import {LessonSlide,totalDuration,videoFrame,subtitlePages,slideDuration} from '@/lib/video-timeline';
export default function LessonVideo({lesson,lang}:{lesson:{title:string;slides:LessonSlide[]};lang:Lang}){
 const canvas=useRef<HTMLCanvasElement>(null),recorder=useRef<MediaRecorder|null>(null),stream=useRef<MediaStream|null>(null),aborted=useRef(false),urlRef=useRef('');
 const [playing,setPlaying]=useState(false),[elapsed,setElapsed]=useState(0),[exporting,setExporting]=useState(false),[download,setDownload]=useState(''),[extension,setExtension]=useState('webm'),[error,setError]=useState(''),[voice,setVoice]=useState(true);
 const total=totalDuration(lesson.slides),frame=videoFrame(lesson.slides,elapsed),t=(k:string)=>translate(lang,k);
 useEffect(()=>()=>{aborted.current=true;recorder.current?.state==='recording'&&recorder.current.stop();stream.current?.getTracks().forEach(t=>t.stop());if(urlRef.current)URL.revokeObjectURL(urlRef.current);if('speechSynthesis'in window)speechSynthesis.cancel()},[]);
 useEffect(()=>{if(!playing)return;let raf=0;const start=performance.now()-elapsed*1000;const tick=(now:number)=>{const next=Math.min(total,(now-start)/1000);setElapsed(next);if(next>=total){setPlaying(false);if(recorder.current?.state==='recording')recorder.current.stop();}else raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf)},[playing,total]);
 useEffect(()=>{if(!('speechSynthesis'in window))return;speechSynthesis.cancel();if(playing&&!exporting&&voice){const u=new SpeechSynthesisUtterance(lesson.slides[frame.index].narration);u.lang=locales[lang];u.rate=.95;u.onerror=()=>{};speechSynthesis.speak(u)}return()=>speechSynthesis.cancel()},[playing,frame.index,exporting,voice,lang,lesson]);
 useEffect(()=>{
  const c=canvas.current,ctx=c?.getContext('2d');if(!c||!ctx)return;
  const s=lesson.slides[frame.index],light=frame.index%2===1;
  const bg=light?'#f2f0e8':'#121212',ink=light?'#181818':'#f3f2eb',muted=light?'#595950':'#c1c1b7';
  ctx.fillStyle=bg;ctx.fillRect(0,0,1280,720);
  ctx.fillStyle=light?'#e6e3d9':'#252523';ctx.fillRect(24,24,1232,672);
  ctx.fillStyle=bg;ctx.fillRect(26,26,1228,668);
  ctx.fillStyle=muted;ctx.font='20px monospace';ctx.fillText('MAKE IT HAPPEN',64,72);
  ctx.textAlign='right';ctx.fillText(String(frame.index+1).padStart(2,'0')+' / '+String(lesson.slides.length).padStart(2,'0'),1216,72);ctx.textAlign='left';
  const wrap=(text:string,width:number)=>{const lines:string[]=[];let line='';for(const word of text.split(/\s+/)){const next=line?line+' '+word:word;if(ctx.measureText(next).width>width&&line){lines.push(line);line=word}else line=next;}if(line)lines.push(line);return lines};
  const block=(text:string,x:number,y:number,width:number,height:number,initial:number,family:string,color=ink)=>{let size=initial,lines:string[]=[];do{ctx.font=`${size}px ${family}`;lines=wrap(text,width);if(lines.length*size*1.3<=height||size<=18)break;size-=2;}while(size>16);ctx.fillStyle=color;lines.forEach((line,i)=>ctx.fillText(line,x,y+i*size*1.3));};
  const reveal=Math.min(1,frame.local/0.7);ctx.save();ctx.globalAlpha=.2+.8*reveal;ctx.translate(0,24*(1-reveal));
  block(s.title,64,164,1110,145,64,'Georgia');ctx.restore();
  const clauses=s.text.split(/\n+|(?<=[.!?])\s+/).filter(Boolean);const cards=clauses.length>3?[clauses[0],clauses[1],clauses.slice(2).join(' ')]:clauses;
  const width=(1152-(cards.length-1)*18)/Math.max(1,cards.length);
  cards.forEach((text,i)=>{const reveal=Math.max(0,Math.min(1,(frame.local-i*.35)/.7));ctx.save();ctx.globalAlpha=.2+.8*reveal;const x=64+i*(width+18),y=300+18*(1-reveal);ctx.fillStyle=light?'#e6e3d9':'#272725';ctx.fillRect(x,y,width,208);ctx.fillStyle=muted;ctx.font='18px monospace';ctx.fillText(String(i+1).padStart(2,'0'),x+24,y+35);block(text,x+24,y+88,width-48,120,cards.length===1?42:32,'sans-serif');ctx.restore();});
  const pages=subtitlePages(s.narration);const subtitle=pages[Math.min(pages.length-1,Math.floor(frame.local/frame.duration*pages.length))]||'';
  block(subtitle,76,578,1128,85,30,'sans-serif');
  const gap=8,w=(1152-gap*(lesson.slides.length-1))/lesson.slides.length;
  for(let i=0;i<lesson.slides.length;i++){ctx.fillStyle=light?'#d0cec4':'#44443d';ctx.fillRect(64+i*(w+gap),664,w,5);ctx.fillStyle=ink;const fill=i<frame.index?1:i===frame.index?frame.local/frame.duration:0;ctx.fillRect(64+i*(w+gap),664,w*fill,5);}

 },[elapsed,frame.index,frame.local,frame.duration,lesson,total]);
 async function exportVideo(){
  const c=canvas.current;if(!c||typeof MediaRecorder==='undefined'||!c.captureStream){setError(t('videoUnsupported'));return}
  setError('');setPlaying(false);setElapsed(0);aborted.current=false;
  try{
   const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4'].find(x=>MediaRecorder.isTypeSupported(x));if(!mime)throw new Error();
   stream.current=c.captureStream(30);const r=new MediaRecorder(stream.current,{mimeType:mime,videoBitsPerSecond:2500000});recorder.current=r;const chunks:Blob[]=[];
   r.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
   r.onstop=()=>{stream.current?.getTracks().forEach(t=>t.stop());if(aborted.current)return;setExporting(false);setPlaying(false);if(!chunks.length){setError(t('videoUnsupported'));return}if(urlRef.current)URL.revokeObjectURL(urlRef.current);const url=URL.createObjectURL(new Blob(chunks,{type:r.mimeType}));urlRef.current=url;setExtension(r.mimeType.includes('mp4')?'mp4':'webm');setDownload(url)};
   r.onerror=()=>{aborted.current=true;stream.current?.getTracks().forEach(t=>t.stop());setExporting(false);setPlaying(false);setError(t('videoUnsupported'))};
   setExporting(true);r.start(500);setPlaying(true);
  }catch{stream.current?.getTracks().forEach(t=>t.stop());setExporting(false);setError(t('videoUnsupported'))}
 }
 const cancel=()=>{aborted.current=true;if(recorder.current?.state==='recording')recorder.current.stop();stream.current?.getTracks().forEach(t=>t.stop());setExporting(false);setPlaying(false);setElapsed(0)};
 return <div className="lesson-video"><canvas ref={canvas} width={1280} height={720} role="img" aria-label={lesson.title}/><div className="video-live-copy"><strong>{lesson.slides[frame.index].title}</strong><p>{lesson.slides[frame.index].text}</p></div><label className="video-seek">{t('videoPosition')}<input type="range" min={0} max={total} step={.1} value={elapsed} disabled={exporting} onChange={e=>{setPlaying(false);setElapsed(Number(e.target.value))}}/></label><div className="video-chapters">{lesson.slides.map((s,i)=><button key={i} className={frame.index===i?'active':''} disabled={exporting} onClick={()=>{setPlaying(false);setElapsed(lesson.slides.slice(0,i).reduce((n,s)=>n+slideDuration(s),0))}}>{i+1}. {s.title}</button>)}</div><p className="muted">{Math.floor(elapsed)} / {total} s · {frame.index+1}/{lesson.slides.length}</p><div className="button-row"><button className="button primary" disabled={exporting} onClick={()=>{if(elapsed>=total)setElapsed(0);setPlaying(!playing)}}>{playing?<Pause size={17}/>:<Play size={17}/>} {t(playing?'pause':'playVideo')}</button><button className="icon-button" disabled={exporting} aria-label={t('reset')} onClick={()=>{setPlaying(false);setElapsed(0)}}><RotateCcw size={17}/></button><label className="checkbox-row"><input type="checkbox" checked={voice} disabled={exporting} onChange={e=>setVoice(e.target.checked)}/>{t('voiceover')}</label></div><p>{t('videoExportNote')}</p>{exporting?<><progress value={elapsed} max={total}/><p role="status">{t('videoRendering')} {Math.floor(elapsed/total*100)}%</p><button className="button secondary" onClick={cancel}>{t('cancel')}</button></>:<button className="button secondary" disabled={playing} onClick={exportVideo}><Download size={17}/>{t('exportVideo')}</button>}{download&&<a className="button primary" href={download} download={'make-it-happen.'+extension}>{t('download')} .{extension}</a>}{error&&<p role="alert">{error}</p>}<details><summary>{t('transcription')}</summary>{lesson.slides.map((s,i)=><section key={i}><h3>{s.title}</h3><p>{s.text}</p><p>{s.narration}</p></section>)}</details></div>
}
