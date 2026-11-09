import {createClient} from '@supabase/supabase-js';
import {validateAuthConfig} from '../auth/client';
const denied=()=>new Error('No se pudo abrir el portal. Revisá el código o consultá al centro.');
const keys=['greetingName','activities','notes','files','links','recommendations','nextAppointment','reports'];
export function createRemotePortal(client){
 async function rpc(action,payload){const{data,error}=await client.rpc('psicoluz_portal',{p_action:action,p_payload:payload});if(error||!data)throw denied();return data;}
 return {
  async enter(code){const d=await rpc('enter',{code:String(code).trim()});if(!/^[a-f0-9]{64}$/.test(d.token||''))throw denied();return d.token;},
  async view(token){const d=await rpc('view',{token});if(Object.keys(d).sort().join()!==[...keys].sort().join()||typeof d.greetingName!=='string'||['activities','notes','files','links','recommendations','reports'].some(k=>!Array.isArray(d[k])))throw denied();return d;},
  async report(token,id,input){await rpc('report',{token,activity_id:id,outcome:input.outcome,message:input.message||''});},
  async file(token,id){const{data,error}=await client.functions.invoke('psicoluz-files',{body:{mode:'download',fileId:id,portalToken:token}});if(error||!(data instanceof Blob))throw new Error('El archivo ya no está disponible. Actualizá el contenido o consultá al centro.');return data;},
  async leave(token){await rpc('leave',{token}).catch(()=>{});},
 };
}
export function getRemotePortal(){const url=import.meta.env.VITE_SUPABASE_URL,key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||import.meta.env.VITE_SUPABASE_ANON_KEY;validateAuthConfig(url,key);return createRemotePortal(createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(url,init)=>fetch(url,{...init,cache:'no-store'})}}));}
