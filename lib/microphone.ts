export async function openMicrophone(media:Pick<MediaDevices,'getUserMedia'>,timeout=20000,options:{deviceId?:string;processing?:boolean}={}){
 let expired=false;let timer:ReturnType<typeof setTimeout>|undefined;
 const request=media.getUserMedia({audio:{echoCancellation:options.processing??true,noiseSuppression:options.processing??true,autoGainControl:true,channelCount:{ideal:1},...(options.deviceId?{deviceId:{exact:options.deviceId}}:{})}}).then(stream=>{if(expired){stream.getTracks().forEach(t=>t.stop());throw new Error('MIC_TIMEOUT')}return stream});
 try{return await Promise.race([request,new Promise<never>((_,reject)=>{timer=setTimeout(()=>{expired=true;reject(new Error('MIC_TIMEOUT'))},timeout)})]);}finally{clearTimeout(timer)}
}
export function microphoneIssue(secure:boolean,allowed:boolean|undefined,supported:boolean){return !secure?'MIC_INSECURE':allowed===false?'MIC_EMBEDDED':!supported?'MIC_UNSUPPORTED':null;}

export function signalRms(samples:Float32Array){let sum=0;for(const x of samples)sum+=x*x;return Math.sqrt(sum/Math.max(1,samples.length));}
export function silentCapture(samples:number,peak:number){return samples>=10&&peak<0.0001;}
/** Measures the input without connecting it to speakers (no microphone feedback). */
export function monitorMicrophone(stream:MediaStream,onLevel:(level:number)=>void){
 const context=new AudioContext();const source=context.createMediaStreamSource(stream);const analyser=context.createAnalyser();analyser.fftSize=2048;source.connect(analyser);
 const data=new Float32Array(analyser.fftSize);let peak=0,samples=0;void context.resume().catch(()=>{});
 const timer=setInterval(()=>{if(context.state!=='running')return;analyser.getFloatTimeDomainData(data);const rms=signalRms(data);peak=Math.max(peak,rms);samples++;onLevel(Math.min(100,Math.max(0,(20*Math.log10(Math.max(rms,0.000001))+70)/60*100)));},100);
 return {stop(){clearInterval(timer);source.disconnect();void context.close().catch(()=>{});return {samples,peak,silent:silentCapture(samples,peak)}}};
}
