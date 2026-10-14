import {compileGraph} from './graph-math';
export function calculate(expression:string,degrees=false,answer=0){
 const text=expression.replace(/\bans\b/gi,'('+String(answer)+')').replace(/%/g,'/100');
 if(/\b[abcx]\b/i.test(text))throw new Error('CALC_VARIABLE');
 const result=compileGraph(text)(0,undefined,degrees);
 if(!Number.isFinite(result))throw new Error('CALC_DOMAIN');
 return Object.is(result,-0)?0:result;
}
