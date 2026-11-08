# Agenda y citas — frontend de desarrollo

## Abrir y recorrer

Ruta local: `http://127.0.0.1:5180/desarrollo/agenda`.
Con `npm run dev -- --port 5180`, se puede abrir sin login, con Supabase pausado.
La ruta no importa el cliente Supabase del prototipo anterior ni consulta datos reales.
Usa el mismo almacenamiento ficticio de Expedientes y conserva el perfil de prueba
durante la navegación entre ambos módulos dentro de una pestaña.

Se puede recorrer semana/lista, fecha, Hoy, semanas anterior/siguiente, búsqueda por
paciente/número, filtros, creación, detalle, reprogramación y cancelación confirmada.
La celda de un horario precarga fecha y hora. Las citas canceladas quedan en Lista y
detalle sin bloquear la disponibilidad. No se borran silenciosamente del registro.

## Fuente y correspondencia

Se revisó el ERS completo, sus 40 identificadores, aceptación y métodos, además del
protocolo, arquitectura, diagnóstico y plan de comunicación. Los Word no se modificaron.

- RF13 · T: paciente/expediente y profesional asociados; fecha-hora, modalidad y estado.
- RF14 · D: semana y lista sobre el mismo registro de citas, para profesional y administración.
- RF15 · T: reprogramación y cancelación conservando el registro; impedir cruces de
  horario de la misma profesional y pedir otra disponibilidad.
- RF02/RF03/RNF03: perfiles ficticios, datos por profesional y llamadas directas denegadas
  en el adaptador; aún no son Auth ni permisos de servidor.
- RF05: las acciones se incorporan al historial local vinculado al expediente y a la cita.
- RF06/RF12: pacientes y expedientes autorizados proceden del módulo ya implementado.
- RF21: la alerta de próxima cita del portal sigue pendiente; esta entrega no la simula
  como contenido ya publicado para familias.
- RNF01, RNF04 y RNF06: mantener medición, validación de usabilidad y compatibilidad
  como verificaciones separadas. No inferir resultado del piloto a partir del build.

## Decisiones provisionales de interfaz y dominio

El ERS no fija duración, catálogo de estados o modalidad, horario de atención ni
política completa de intervalos. La siguiente propuesta debe confirmarse con el centro:

- Hora de atención expresada siempre en `America/Managua` (UTC−6). Se almacena un
  instante ISO UTC; fecha y hora se interpretan en Nicaragua, no en la zona del navegador.
- Duraciones de 15, 30, 45, 60 y 90 minutos; valor inicial 45. No hay una obligación
  documental de 45 minutos ni una regla de horario laboral impuesta por esta implementación.
- Estados: pendiente, confirmada, atendida y cancelada. Modalidad: presencial o virtual.
- Pendientes y confirmadas ocupan el intervalo `[inicio, fin)` de una profesional.
  Citas contiguas son válidas; mismos horarios de distintas profesionales son válidos.
- Se comprueba al crear y actualizar, excluyendo la propia cita en reprogramación.
  Se rechazan fechas imposibles, horas inválidas, estados/modalidades desconocidos y
  citas que terminan en otro día. Estos límites se explican en los errores del formulario.
- Las canceladas conservan historial y no se reactivan por edición; se registra una
  nueva cita. Los cambios entre estados y esta política se revisarán con el centro.
- Paciente y profesional derivan del expediente seleccionado, sin confiar en IDs
  discordantes enviados por la pantalla. Reprogramar conserva esa asociación.
- Si un expediente cambió de responsable, la cita anterior requiere cancelación y
  nuevo registro; no se reasigna silenciosamente a otra profesional.

## Persistencia y arquitectura

- `src/features/agenda/repository.js`: validación y contrato asíncrono de agenda.
- `src/features/agenda/AgendaWorkspace.jsx`: pantallas y formularios.
- `src/features/agenda/agenda.css`: estilos de agenda con la identidad de la landing.
- `src/features/shared/DevelopmentShell.jsx`: menú, perfil de prueba y aviso compartidos.
- `developmentStore` en el adaptador ficticio de Expedientes conserva un único estado
  IndexedDB: no se duplican pacientes entre módulos. La incorporación de citas preserva
  expedientes, notas, evaluaciones y archivos ya existentes.

La cola local serializa mutaciones de esta instancia. No acredita protección entre
usuarios/pestañas concurrentes ni reemplaza una transacción o restricción en PostgreSQL.
En Supabase será necesaria una comprobación transaccional del intervalo y del estado,
RLS por identidad real, referencias entre paciente/expediente/profesional y bitácora
inmutable de servidor. La disponibilidad debe comprobarse nuevamente al confirmar,
incluso cuando la pantalla mostró un horario disponible previamente.

## Verificación y estado

`tests/agenda.spec.js` conserva positivos/negativos de RF13–RF15, integración y aislamiento.
Se ejecuta junto con `tests/expedientes.spec.js` para detectar regresiones del módulo anterior.
Consultar `resultados-verificacion.md` y `verificacion-ers.json` para resultados obtenidos.

Se mantiene el estado **frontend de desarrollo verificado; integración y pilotaje pendientes**.
SUS >=70/100 de RNF04 exige evaluación de la interfaz profesional por participantes;
Likert será complementario. Los Success Criteria WCAG aplicables al portal se formalizarán
antes de su evaluación. No se aplicaron esos instrumentos ni se garantiza su puntuación.

No hay medición posterior de los 12 min por cita ni de los 4 cruces/mes de la línea base.
Esas comparaciones requieren el piloto, períodos equivalentes y registros de medición.
