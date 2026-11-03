// Per-process manager throttling. The hosting worker count is a deployment concern.
const slots=new Map<string,{start:number;count:number;running:boolean}>();let running=0;
export function reserveAIGeneration(user:string,now=Date.now()){
 for(const [key,value] of slots)if(now-value.start>600000&&!value.running)slots.delete(key);
 let slot=slots.get(user);if(!slot){if(slots.size>=256)return null;slot={start:now,count:0,running:false};slots.set(user,slot)}
 if(slot.running||slot.count>=4||running>=4)return null;
 slot.running=true;slot.count++;running++;let released=false;return ()=>{if(released)return;released=true;slot!.running=false;running--};
}
