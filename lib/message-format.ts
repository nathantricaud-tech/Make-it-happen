export type MessagePart={kind:'text'|'math'|'code';text:string;display?:boolean};
const latexCommand=/\\(?:d?frac|tfrac|sqrt|sum|prod|int|lim|vec|overrightarrow|overline|hat|cdot|times|mathrm|text|alpha|beta|gamma|Delta|delta|theta|lambda|mu|pi|omega|sigma|rho|nu|infty|partial|begin)\b/;
// Repair doubled command slashes without destroying matrix row separators.
export function normalizeMath(text:string){return text.trim().replace(/^\$\$?([\s\S]*?)\$\$?$/,'$1').replace(/^\\[([]([\s\S]*?)\\[)\]]$/,'$1').replace(/\\\\(?=(?:frac|dfrac|tfrac|sqrt|sum|prod|int|vec|mathrm|text|cdot|times|begin|end|left|right)\b)/g,'\\').replace(/\\begin\{(?:equation\*?|displaymath)\}/g,'').replace(/\\end\{(?:equation\*?|displaymath)\}/g,'');}
function plainParts(text:string):MessagePart[]{
 const parts:MessagePart[]=[];
 for(const line of text.split(/(?<=\n)/)){
  const trimmed=line.trim().replace(/^[-•]\s+|^\d+[.)]\s+/,'');
  // A standalone equation, including bare TeX emitted without delimiters.
  if(latexCommand.test(trimmed)&&!/[.!?]\s+[A-ZÀ-Ü]/.test(trimmed)&&!/(?:\b[\p{L}]{3,}\s+){3}/u.test(trimmed.replace(/\\[a-zA-Z]+/g,'').replace(/\{[^{}]*\}/g,''))){parts.push({kind:'math',text:normalizeMath(trimmed),display:true});continue;}
  // Recover individual undelimited commands embedded in prose using balanced braces.
  const command=/\\(?:d?frac|tfrac|sqrt|vec|overrightarrow|overline|hat|mathrm|text)\b/g;let at=0,match:RegExpExecArray|null;
  while((match=command.exec(line))){let end=command.lastIndex,groups=/frac$/.test(match[0])?2:1;
   if(line[end]==='['){const close=line.indexOf(']',end+1);if(close<0)continue;end=close+1;}
   let valid=true;for(let g=0;g<groups;g++){while(line[end]===' ')end++;if(line[end]!=='{'){valid=false;break;}let depth=0;do{if(line[end]==='{')depth++;if(line[end]==='}')depth--;end++;}while(end<line.length&&depth);if(depth){valid=false;break;}}
   if(!valid)continue;
   if(match.index>at)parts.push({kind:'text',text:line.slice(at,match.index)});
   parts.push({kind:'math',text:normalizeMath(line.slice(match.index,end))});at=end;command.lastIndex=end;
  }
  if(at<line.length)parts.push({kind:'text',text:line.slice(at)});
 }
 return parts;
}
export function messageParts(content:string):MessagePart[]{
 const result:MessagePart[]=[];const pattern=/\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)|\$([^\n$]+)\$|```([^\n`]*)\n([\s\S]*?)```|`([^`\n]+)`|\\begin\{(equation\*?|displaymath|align\*?)\}([\s\S]*?)\\end\{\8\}/g;let at=0;
 for(const match of content.matchAll(pattern)){const start=match.index!;if(start>at)result.push(...plainParts(content.slice(at,start)));
 if(match[8]!==undefined)result.push({kind:'math',text:normalizeMath(match[8].startsWith('align')?'\\begin{aligned}'+match[9]+'\\end{aligned}':match[9]),display:true});
 else if(match[1]!==undefined||match[2]!==undefined||match[3]!==undefined||match[4]!==undefined)result.push({kind:'math',text:normalizeMath(match[1]??match[2]??match[3]??match[4]),display:match[1]!==undefined||match[2]!==undefined});
 else{const lang=(match[5]||'').trim().toLowerCase(),text=match[6]??match[7],formula=latexCommand.test(text)||/^[A-Za-z_\s0-9]+\s*=\s*[^;{}]+$/.test(text);const isMath=['latex','tex','math','katex'].includes(lang)||(['','text','plaintext'].includes(lang)&&formula);result.push({kind:isMath?'math':'code',text:isMath?normalizeMath(text):text,display:match[6]!==undefined});}at=start+match[0].length;
 }if(at<content.length)result.push(...plainParts(content.slice(at)));return result;
}
