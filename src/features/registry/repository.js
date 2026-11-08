export const REGISTRY_RPC = 'psicoluz_records_registry';
export const RECORD_STATES = { activo:'Activo', en_espera:'En espera', suspendido:'Suspendido', alta:'Alta', archivado:'Archivado' };
const recordKeys = ['id','number','patient_id','professional_id','professional_name','reason','state','created_at','updated_at','patient'];
const patientKeys = ['id','first_name','last_name','birth_date','tutor_name','tutor_phone','tutor_relation','updated_at'];
const sameKeys = (v,keys) => v && !Array.isArray(v) && Object.keys(v).sort().join() === [...keys].sort().join();
function invalid() { throw new Error('La respuesta no coincide con el registro esperado. Volvé a cargar.'); }
export function mapRegistryRecord(row) {
  if (!sameKeys(row,recordKeys) || !sameKeys(row.patient,patientKeys) || row.patient_id!==row.patient.id || !Object.hasOwn(RECORD_STATES,row.state) || !row.id || !row.professional_id || !row.updated_at || !row.patient.updated_at) invalid();
  for(const field of ['number','professional_name','reason','created_at','updated_at']) if(typeof row[field]!=='string') invalid();
  for(const field of ['first_name','last_name','tutor_name','tutor_phone','tutor_relation','updated_at']) if(typeof row.patient[field]!=='string') invalid();
  if(row.patient.birth_date!==null && typeof row.patient.birth_date!=='string') invalid();
  return {id:row.id,number:row.number,patientId:row.patient_id,professionalId:row.professional_id,professionalName:row.professional_name,reason:row.reason,state:row.state,createdAt:row.created_at,updatedAt:row.updated_at,patient:{id:row.patient.id,firstName:row.patient.first_name,lastName:row.patient.last_name,birthDate:row.patient.birth_date||'',tutorName:row.patient.tutor_name,tutorPhone:row.patient.tutor_phone,tutorRelation:row.patient.tutor_relation,updatedAt:row.patient.updated_at}};
}
export function registryError(error,writing=false) {
  if(error?.code==='42501') return 'No tenés acceso a esta operación. Revisá tu sesión y tu rol.';
  if(error?.code==='40001') return 'Otra persona actualizó este registro. Volvé al listado y abrilo de nuevo antes de guardar.';
  if(['23502','23514','22023','22007','22008','22P02'].includes(error?.code)) return 'Revisá los campos obligatorios, las fechas y los valores seleccionados.';
  if(['PGRST202','42883'].includes(error?.code)) return 'La conexión de Expedientes todavía no está habilitada. Volvé a intentar cuando se complete la configuración.';
  return writing ? 'No se pudo confirmar el guardado. Revisá el listado antes de intentarlo otra vez.' : 'No se pudo cargar el registro. Revisá la conexión y volvé a intentar.';
}
const patientFields = value => ({first_name:value.firstName.trim(),last_name:value.lastName.trim(),birth_date:value.birthDate||null,tutor_name:value.tutorName.trim(),tutor_phone:value.tutorPhone.trim(),tutor_relation:value.tutorRelation.trim()});
export function registryPayload(values,record=null) {
  const base={reason:values.reason.trim(),state:values.state};
  if(record) return {...base,...patientFields(values),record_id:record.id,expected_record_updated_at:record.updatedAt,expected_patient_updated_at:record.patient.updatedAt};
  return {...base,professional_id:values.professionalId,...(values.patientId?{patient_id:values.patientId}:patientFields(values))};
}
export function createRegistryRepository(client) {
  async function request(action,payload={},writing=false) {
    const {data,error}=await client.rpc(REGISTRY_RPC,{p_action:action,p_payload:payload}); if(error) throw new Error(registryError(error,writing)); return data;
  }
  return {
    async index({search='',state='',offset=0}={}) { const data=await request('index',{search,state,offset}); if(!sameKeys(data,['records','total','professionals']) || !Array.isArray(data.records) || !Array.isArray(data.professionals) || !Number.isInteger(data.total) || data.total<0) invalid(); return {records:data.records.map(mapRegistryRecord),total:data.total,professionals:data.professionals.map(p=>{if(!sameKeys(p,['id','name']) || !p.id || typeof p.name!=='string') invalid();return p;})}; },
    async patients(search) {const rows=await request('patients',{search});if(!Array.isArray(rows))invalid();return rows.map(p=>{if(!sameKeys(p,['id','first_name','last_name'])||!p.id||typeof p.first_name!=='string'||typeof p.last_name!=='string')invalid();return {id:p.id,firstName:p.first_name,lastName:p.last_name};});},
    async detail(id) {return mapRegistryRecord(await request('detail',{record_id:id}));},
    async save(values,record=null) {return mapRegistryRecord(await request(record?'update':'create',registryPayload(values,record),true));},
  };
}
