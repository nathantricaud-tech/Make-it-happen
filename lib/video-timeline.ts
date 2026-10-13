export type LessonSlide={title:string;text:string;narration:string};
export function slideDuration(slide:LessonSlide){return Math.max(10,Math.ceil(slide.narration.trim().split(/\s+/).length/2)+3);}
export function videoFrame(slides:LessonSlide[],elapsed:number){let start=0;for(let i=0;i<slides.length;i++){const duration=slideDuration(slides[i]);if(elapsed<start+duration||i===slides.length-1)return {index:i,local:Math.max(0,Math.min(duration,elapsed-start)),duration};start+=duration;}return {index:0,local:0,duration:1};}
export function totalDuration(slides:LessonSlide[]){return slides.reduce((sum,s)=>sum+slideDuration(s),0);}
export function subtitlePages(text:string){const words=text.trim().split(/\s+/);const pages:string[]=[];let line='';for(const word of words){if((line+' '+word).length>105&&line){pages.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)pages.push(line);return pages;}
