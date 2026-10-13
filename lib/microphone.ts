export async function openMicrophone(media:Pick<MediaDevices,'getUserMedia'>,timeout=20000){
 let expired=false;let timer:ReturnType<typeof setTimeout>|undefined;
 const request=media.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}}).then(stream=>{if(expired){stream.getTracks().forEach(t=>t.stop());throw new Error('MIC_TIMEOUT')}return stream});
 try{return await Promise.race([request,new Promise<never>((_,reject)=>{timer=setTimeout(()=>{expired=true;reject(new Error('MIC_TIMEOUT'))},timeout)})]);}finally{clearTimeout(timer)}
}
export function microphoneIssue(secure:boolean,allowed:boolean|undefined,supported:boolean){return !secure?'MIC_INSECURE':allowed===false?'MIC_EMBEDDED':!supported?'MIC_UNSUPPORTED':null;}
