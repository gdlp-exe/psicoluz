import test from 'node:test';
import assert from 'node:assert/strict';
import { mapStaffProfile, authErrorMessage, StaffAccessError } from '../src/features/auth/contract.js';

const id='11111111-1111-4111-8111-111111111111', row={id,display_name:'Persona de prueba',role:'administracion',active:true};
test('Auth contrato: snake_case de SQL se convierte a displayName sin alias del prototipo',()=>{
  assert.deepEqual(mapStaffProfile(row,id),{id,displayName:'Persona de prueba',role:'administracion',active:true});
  for(const value of [{...row,display_name:undefined,nombres:'Ejemplo'},{id,nombre:'Ejemplo',rol:'administrador',activo:true},{...row,role:'psicologo'},{...row,id:'otro'},{...row,active:false},{...row,admin:true}]) assert.throws(()=>mapStaffProfile(value,id),StaffAccessError);
});
test('Auth contrato: perfil ausente no se convierte en rol por defecto',()=>{assert.throws(()=>mapStaffProfile(null,id),e=>e.code==='not_enabled');});
test('Auth errores: no expone correo existente, token, mensaje SQL ni contraseña',()=>{
  for(const code of ['invalid_credentials','email_not_confirmed','user_banned']) assert.equal(authErrorMessage({code}),authErrorMessage({code:'invalid_credentials'}));
  assert.ok(!authErrorMessage({message:'TOKEN_SECRETO SQL private'}).includes('TOKEN_SECRETO'));
});
