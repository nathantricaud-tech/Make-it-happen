'use client';
import React,{useEffect,useRef} from 'react';

// Compatibility rendering only: the official ShapeWaves component is used when WebGPU is available.
export function ShapeWavesFallback({paused=false}:{paused?:boolean}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const canvas=ref.current,ctx=canvas?.getContext('2d');if(!canvas||!ctx)return;let width=1,height=1,frame=0,visible=true,last=0;const pointer={x:-999,y:-999};
 const draw=(now:number)=>{frame=0;if(!visible||document.hidden)return;if(now-last<32&&!paused){frame=requestAnimationFrame(draw);return}last=now;ctx.clearRect(0,0,width,height);const time=paused?0:now*.0007;const gap=22;
 for(let row=0,y=gap/2;y<height;y+=gap,row++)for(let col=0,x=gap/2;x<width;x+=gap,col++){const distance=Math.hypot(x-pointer.x,y-pointer.y);const swell=(Math.sin(x*.018+y*.025-time*1.8)+Math.sin(y*.025-time))*.25+.5;const hover=Math.max(0,1-distance/110);const light=Math.min(1,.12+swell*.65+hover*.35);const size=2.3+light*4;ctx.fillStyle=`rgba(220,220,212,${light*.8})`;ctx.beginPath();switch((row*7+col*11)%3){case 0:ctx.rect(x-size/2,y-size/2,size,size);break;case 1:ctx.arc(x,y,size/2,0,Math.PI*2);break;default:ctx.moveTo(x,y-size*.65);ctx.lineTo(x+size*.6,y+size*.45);ctx.lineTo(x-size*.6,y+size*.45);ctx.closePath()}ctx.fill()}
 if(!paused)frame=requestAnimationFrame(draw)};
 const wake=()=>{if(!frame&&visible&&!document.hidden)frame=requestAnimationFrame(draw)};
 const resize=()=>{const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);wake()};
 const ro=new ResizeObserver(resize);ro.observe(canvas);const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(!visible){cancelAnimationFrame(frame);frame=0}else wake()});io.observe(canvas);
 const move=(e:PointerEvent)=>{const r=canvas.getBoundingClientRect();pointer.x=e.clientX-r.left;pointer.y=e.clientY-r.top;wake()};window.addEventListener('pointermove',move,{passive:true});document.addEventListener('visibilitychange',wake);resize();
 return()=>{cancelAnimationFrame(frame);ro.disconnect();io.disconnect();window.removeEventListener('pointermove',move);document.removeEventListener('visibilitychange',wake)};
 },[paused]);return <canvas className="shape-waves-fallback" ref={ref} aria-hidden="true"/>;
}
export function CubesFallback({paused=false}:{paused?:boolean}){return <div className={'cubes-fallback '+(paused?'paused':'')} onPointerMove={e=>{if(paused||e.pointerType!=='mouse')return;const r=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty('--cx',`${(e.clientY-r.top-r.height/2)/6}deg`);e.currentTarget.style.setProperty('--cy',`${(e.clientX-r.left-r.width/2)/6}deg`)}} aria-hidden="true">{Array.from({length:25},(_,i)=><div className="fallback-cube-cell" key={i}><div className="fallback-cube" style={{animationDelay:`${-i*.12}s`}}>{Array.from({length:6},(_,f)=><i key={f}/>)}</div></div>)}</div>}
