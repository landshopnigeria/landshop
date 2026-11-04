/** Bound read latency without retrying or interrupting writes and uploads. */
export const READ_TIMEOUT_MS=8000;
export const boundedReadFetch:typeof fetch=async(input,init)=>{
 const request=typeof Request!=='undefined'&&input instanceof Request?input:undefined;
 const method=(init?.method||request?.method||'GET').toUpperCase();
 if(method!=='GET'&&method!=='HEAD')return fetch(input,init);
 const controller=new AbortController();
 const upstream=init?.signal??request?.signal;
 const cancel=()=>controller.abort(upstream?.reason);
 if(upstream?.aborted)cancel();else upstream?.addEventListener('abort',cancel,{once:true});
 const timer=setTimeout(()=>controller.abort(new DOMException('Read timed out','TimeoutError')),READ_TIMEOUT_MS);
 try{
  const response=await fetch(input,{...init,signal:controller.signal});
  // Keep the deadline active until the response body has arrived as well.
  // These clients use bounded JSON reads; upload/write bodies pass through above.
  const body=await response.arrayBuffer();
  return new Response(method==='HEAD'||[204,205,304].includes(response.status)?null:body,
   {status:response.status,statusText:response.statusText,headers:response.headers});
 }
 finally{clearTimeout(timer);upstream?.removeEventListener('abort',cancel);}
};
