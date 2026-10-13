export type MessagePart={kind:'text'|'math'|'code';text:string;display?:boolean};
export function messageParts(content:string):MessagePart[]{
 const result:MessagePart[]=[];const pattern=/\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)|\$([^\n$]+)\$|```([^\n`]*)\n([\s\S]*?)```|`([^`\n]+)`/g;let at=0;
 for(const match of content.matchAll(pattern)){const start=match.index!;if(start>at)result.push({kind:'text',text:content.slice(at,start)});
 if(match[1]!==undefined||match[2]!==undefined||match[3]!==undefined||match[4]!==undefined)result.push({kind:'math',text:match[1]??match[2]??match[3]??match[4],display:match[1]!==undefined||match[2]!==undefined});
 else{const lang=(match[5]||'').trim().toLowerCase(),text=match[6]??match[7],formula=/\\(?:frac|sqrt|sum|int|vec|cdot|times|mathrm|begin)|^[A-Za-z_\s0-9]+\s*=\s*[^;{}]+$/.test(text);result.push({kind:['latex','tex','math','katex'].includes(lang)||(!lang&&formula)?'math':'code',text,display:match[6]!==undefined});}at=start+match[0].length;
 }if(at<content.length)result.push({kind:'text',text:content.slice(at)});return result;
}
