import {compileGraph} from './graph-math';
export function calculate(expression:string,degrees=false,answer=0){
 const superscripts:Record<string,string>={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-','⁺':'+'};
 const normalized=expression.replace(/([0-9)])[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g,match=>match[0]+'^('+[...match.slice(1)].map(c=>superscripts[c]).join('')+')').replace(/[−–]/g,'-').replace(/(\d),(?=\d)/g,'$1.').replace(/;/g,',').replace(/((?:\d+(?:\.\d*)?|\.\d+))\s*[×*·]\s*10\s*\^\s*(?:\(\s*([+-]?\d+)\s*\)|([+-]?\d+))(?![\d.]|\s*\^)/g,(_,n,a,b)=>n+'e'+(a??b));
 const text=normalized.replace(/\bans\b/gi,'('+String(answer)+')').replace(/%/g,'/100');
 if(/\b[abcx]\b/i.test(text))throw new Error('CALC_VARIABLE');
 const result=compileGraph(text)(0,undefined,degrees);
 if(!Number.isFinite(result))throw new Error('CALC_DOMAIN');
 return Object.is(result,-0)?0:result;
}

export function scientificDisplay(value:number,scientific=false){
 const rounded=Number(value.toPrecision(13));
 const useExponent=scientific||(rounded!==0&&(Math.abs(rounded)>=1e10||Math.abs(rounded)<1e-6));
 if(!useExponent)return {mantissa:String(rounded),exponent:null};
 const [mantissa,exponent]=rounded.toExponential().split('e');
 return {mantissa,exponent:Number(exponent)};
}
