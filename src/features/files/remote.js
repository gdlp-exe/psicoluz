const deny=()=>new Error('No se pudo completar la operación. Revisá tu acceso y volvé a cargar el expediente.');
export const FILE_BUCKET='psicoluz-private';
export function fileType(file){const ext=file.name.split('.').at(-1)?.toLowerCase(),type={pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}[ext];if(!type||!file.size||file.size>10485760||file.name.length>255||/[/\\\x00-\x1f]/.test(file.name)||(file.type&&file.type!==type))throw new Error('Elegí un PDF, PNG, JPG o DOCX de hasta 10 MB.');return type;}
export function saveBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function createResourceRepository(client){
 async function rpc(action,rid,values={}){const{data,error}=await client.rpc('psicoluz_resources',{p_action:action,p_payload:{record_id:rid,...values}});if(error||!data)throw error?.code==='40001'?new Error('El archivo cambió. Volvé a cargar antes de editarlo.'):deny();return data;}
 async function gateway(body){const{data,error}=await client.functions.invoke('psicoluz-files',{body});if(error||!data)throw new Error('No se pudo verificar o descargar el archivo. Revisá su formato y tu acceso.');return data;}
 return {
  async list(rid){const d=await rpc('list',rid);if(!Array.isArray(d.files)||!Array.isArray(d.codes))throw deny();return d;},
  async upload(rid,file){const type=fileType(file);let reserved;try{reserved=await rpc('reserve',rid,{name:file.name,type,size:file.size});const{error}=await client.storage.from(FILE_BUCKET).upload(reserved.path,new Blob([file],{type}),{contentType:type,upsert:false,cacheControl:'0'});if(error)throw deny();await gateway({mode:'finalize',recordId:rid,fileId:reserved.id});}catch(e){if(reserved)await rpc('cancel_upload',rid,{id:reserved.id}).catch(()=>{});throw e;}},
  async file(rid,id){const blob=await gateway({mode:'download',recordId:rid,fileId:id});if(!(blob instanceof Blob))throw deny();return blob;},
  visibility(rid,file,visible,confirm){return rpc('visibility',rid,{id:file.id,updated_at:file.updatedAt,visible,confirm});},
  revokeFile(rid,file,confirm){return rpc('revoke_file',rid,{id:file.id,updated_at:file.updatedAt,confirm});},
  issue(rid,days,confirm){return rpc('issue_code',rid,{days:Number(days),confirm});},
  revokeCode(rid,id,confirm){return rpc('revoke_code',rid,{id,confirm});},
 };
}
