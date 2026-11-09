// Dependencies and credentials stay in Supabase's server environment.
export function validBytes(bytes, type) {
  if (!(bytes instanceof Uint8Array) || !bytes.length || bytes.length > 10485760) return false;
  const starts = signature => signature.every((v,i)=>bytes[i]===v);
  if (type==='application/pdf') return new TextDecoder().decode(bytes.slice(0,5))==='%PDF-';
  if (type==='image/png') return starts([137,80,78,71,13,10,26,10]);
  if (type==='image/jpeg') return starts([255,216,255]);
  if (type!=='application/vnd.openxmlformats-officedocument.wordprocessingml.document' || !starts([80,75,3,4])) return false;
  // Inspect ZIP central-directory names, not an arbitrary string in a binary payload.
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),names=[];let end=-1;
  for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(view.getUint32(i,true)===0x06054b50){end=i;break;}
  if(end<0 || view.getUint16(end+4,true)!==0 || view.getUint16(end+6,true)!==0)return false;
  const count=view.getUint16(end+10,true);let at=view.getUint32(end+16,true);
  if(count<2 || count>3000)return false;
  try{for(let i=0;i<count;i++){if(at+46>end || view.getUint32(at,true)!==0x02014b50 || view.getUint16(at+8,true)&1)return false;const n=view.getUint16(at+28,true),extra=view.getUint16(at+30,true),comment=view.getUint16(at+32,true);if(at+46+n>end)return false;names.push(new TextDecoder().decode(bytes.slice(at+46,at+46+n)));at+=46+n+extra+comment;}}catch{return false;}
  return names.includes('word/document.xml')&&names.includes('[Content_Types].xml')&&!names.some(n=>/vbaProject|activeX|(^|\/)\.\.(\/|$)|^\//i.test(n));
}

export function createHandler({env,fetcher}) {
 const allowed=new Set(['https://psicoluz.vercel.app','http://127.0.0.1:5180','http://localhost:5180']);
 return async request=>{
  const origin=request.headers.get('origin'),cors={'Access-Control-Allow-Origin':origin&&allowed.has(origin)?origin:'https://psicoluz.vercel.app','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  const failure=(status=404)=>new Response(JSON.stringify({error:'El archivo no está disponible.'}),{status,headers:{...cors,'Content-Type':'application/json'}});
  if(origin&&!allowed.has(origin))return failure(403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(request.method!=='POST')return failure(405);
  try{
   if(Number(request.headers.get('content-length')||0)>4096)return failure(400);
   const raw=await request.text();if(raw.length>4096)return failure(400);
   const body=JSON.parse(raw),keys=['mode','fileId','recordId','portalToken'];
   if(!body||Array.isArray(body)||Object.keys(body).some(k=>!keys.includes(k))||!['download','finalize'].includes(body.mode)||!/^[a-f0-9-]{36}$/.test(body.fileId||''))return failure(400);
   if(body.portalToken&& (body.mode!=='download'||body.recordId||!/^[a-f0-9]{64}$/.test(body.portalToken)))return failure(400);
   const url=env.get('SUPABASE_URL'),anon=env.get('SUPABASE_ANON_KEY'),secret=env.get('SUPABASE_SERVICE_ROLE_KEY');
   if(!url||!anon||!secret)return failure(503);
   const authorization=body.portalToken?'Bearer '+anon:request.headers.get('authorization');if(!authorization?.startsWith('Bearer '))return failure();
   const rpc=async(name,payload,privileged=false)=>{
    const response=await fetcher(url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:privileged?secret:anon,Authorization:privileged?'Bearer '+secret:authorization,'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});
    if(!response.ok)throw new Error('denied');return response.json();
   };
   const meta=body.portalToken?await rpc('psicoluz_portal',{p_action:'file',p_payload:{token:body.portalToken,id:body.fileId}}):await rpc('psicoluz_resources',{p_action:body.mode==='finalize'?'upload_check':'file',p_payload:{record_id:body.recordId,id:body.fileId}});
   if(!meta||typeof meta.path!=='string'||!/^([a-f0-9-]{36})\/([a-f0-9-]{36})\.(pdf|png|jpe?g|docx)$/.test(meta.path)||!Number.isSafeInteger(meta.size)||meta.size<1||meta.size>10485760)return failure();
   const stored=await fetcher(url+'/storage/v1/object/authenticated/psicoluz-private/'+meta.path.split('/').map(encodeURIComponent).join('/'),{headers:{apikey:secret,Authorization:'Bearer '+secret},signal:AbortSignal.timeout(20000)});
   if(!stored.ok)return failure();
   const bytes=new Uint8Array(await stored.arrayBuffer());if(bytes.length!==meta.size)return failure();
   if(body.mode==='finalize'){
    if(!validBytes(bytes,meta.type))return failure(422);
    const result=await rpc('psicoluz_finalize_upload',{p_file_id:meta.id,p_actor_id:meta.actorId},true);
    return new Response(JSON.stringify(result),{headers:{...cors,'Content-Type':'application/json'}});
   }
   // Recheck after reading bytes, in case the code/file/assignment changed in flight.
   const current=body.portalToken?await rpc('psicoluz_portal',{p_action:'file',p_payload:{token:body.portalToken,id:body.fileId}}):await rpc('psicoluz_resources',{p_action:'file',p_payload:{record_id:body.recordId,id:body.fileId}});
   if(!current||current.path!==meta.path)return failure();
   return new Response(bytes,{headers:{...cors,'Content-Type':'application/octet-stream','Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(meta.name),'Content-Length':String(bytes.length)}});
  }catch{return failure();}
 };
}
if(typeof Deno!=='undefined')Deno.serve(createHandler({env:Deno.env,fetcher:fetch}));
