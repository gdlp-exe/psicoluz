# Agenda conectada — 8 de noviembre de 2026

Ruta: `/personal/agenda`. Mantiene semana/lista, búsqueda, filtros, alta, consulta, edición/reprogramación y cancelación confirmada. Usa Supabase con la cuenta individual; no usa el selector de roles ni los pacientes ficticios de `/desarrollo/agenda`. La demostración se conserva independiente.

## Requerimientos y campos

Se revisaron los 40 requerimientos del ERS y el protocolo, arquitectura, diagnóstico y comunicación. Se conserva su aceptación y métodos T/I/D/A.

- RF13: `recordId → record_id`, fecha/hora local → `start_at`, `end_at` calculado con duración, `modality` y `status`. El servidor deriva `patient_id` y `professional_id` del expediente; no acepta actor, rol o responsable arbitrario.
- RF14: la agenda obtiene citas de PostgreSQL en el intervalo de la semana visible; cambiar semana vuelve a consultar. Catálogo mínimo de expedientes autorizados y profesionales, sin motivo de consulta ni notas.
- RF15: crear y reprogramar pasan por la restricción GiST existente. Rechaza cruces exactos/parciales de la misma profesional; permite contigüidad y diferentes profesionales. Pendientes y confirmadas reservan intervalo. Cancelar conserva el registro y libera el horario; no se reactiva silenciosamente una cancelada.
- RF02/RF03/RNF03: identidad desde `auth.uid()` y perfil activo. Profesional: solo sus citas y expedientes asignados. Administración: coordinación de la agenda. Desarrollo/anon/inactivo: denegados. La autorización se verifica en cada operación, también al escribir por API directamente.
- RF05: consultas y modificaciones con actor, acción y fecha en bitácora. El detalle incorpora historial de esa cita; no existe operación de borrado de citas ni historial. La petición de borrado administrativo de historial queda pendiente de definición; esta entrega conserva trazabilidad.

## Implementación y decisiones

`20261108000400_agenda.sql` crea una función pública limitada y un proyector privado. No concede acceso directo a tablas ni al esquema privado. `remote.js` convierte exactamente las columnas SQL a los nombres de interfaz, sin aceptar alias del prototipo. La edición y cancelación envían la versión `updated_at` original para evitar sobrescribir cambios concurrentes; se conserva su precisión.

Fecha y hora se interpretan en `America/Managua`; se guardan instantes con zona. Se conserva la propuesta anterior: modalidades presencial/virtual; duraciones 15/30/45/60/90; estados pendiente/confirmada/atendida/cancelada. No son catálogos impuestos por el ERS y deben ratificarse con el centro. Se rechazan fechas imposibles y citas que terminan en otro día. No se envían notificaciones ni se modifican notas/evaluaciones/archivos.

Un guardado cuya respuesta no pudo confirmarse pide revisar la agenda antes de reintentar; no se reintenta automáticamente una escritura. La disponibilidad siempre se comprueba de nuevo al guardar. La protección transaccional proviene de PostgreSQL, no de la comprobación visual del calendario.

## Evidencia

Migración ejecutada en `krrurcjowhgrkenkgtpf` con éxito observado. Consulta remota: ejecución authenticated=true, anon=false; acceso al esquema privado=false; permiso de borrar bitácora=false. Agenda local observada con sesión real de Administración, datos del servidor y listado semanal vacío; no se crearon citas ficticias en producción. El perfil profesional ya existente puede operar únicamente sobre sus expedientes asignados. No se volvió a leer ni solicitar su contraseña.

Pruebas reproducibles: `scripts/test-db-agenda.mjs` aplica las cuatro migraciones en PostgreSQL local y verifica campos reales, roles, aislamiento, cruces, contigüidad, reprogramación, cancelación, versiones, fechas y bitácora. `tests/agenda-real.spec.js` prueba la conexión de interfaz con respuestas controladas; el resto de la suite conserva regresiones de todos los módulos. Se mejoró contraste del formulario y se comprobó su ancho de 360 px y retirada de datos al revocar el perfil.

La escritura y concurrencia reales entre dos conexiones remotas de Agenda requieren casos autorizados en entorno de pruebas. La medición RNF01 (<3 s), SUS profesional >=70/100, Likert complementario y los indicadores operacionales respecto a 12 min/cita y 4 cruces/mes siguen pendientes de pilotaje. No se afirma impacto causal ni resultados alcanzados. El portal RF21 y su alerta de próxima cita todavía requieren su conexión autorizada; la revisión WCAG del portal se mantiene separada.
