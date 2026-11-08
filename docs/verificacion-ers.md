# Revisión completa del ERS — 7 de noviembre de 2026

Se contrastaron los 40 registros originales, conservando métodos T/I/D/A y aceptación en `verificacion-ers.json`.
Los módulos Expedientes y Agenda cuentan con frontend local y datos ficticios. **No está cerrado integralmente**: servidor, portal y pilotaje conservan pendientes.

## Estado de cada requerimiento

- **RF01 · T · pendiente**: Autenticación real y cuentas individuales pendientes. El selector de la demo no autentica.
- **RF02 · T · parcial**: Selector de perfiles y restricciones de la demo comprobables; falta Auth y matriz de permisos de servidor.
- **RF03 · T · parcial**: Aislamiento y nota privada ensayados localmente; falta RLS y escenario de portal por código.
- **RF04 · T · pendiente**: Pendiente portal real y denegación de contenido no autorizado en backend.
- **RF05 · I · parcial**: Historial local con actor/acción/fecha; falta bitácora de servidor no modificable por clientes.
- **RNF02 · I · pendiente**: Pendiente inspección de HTTPS, credenciales, autorización por código y controles de servidor.
- **RNF03 · I · pendiente**: Pendiente inspección y pruebas negativas de todas las entidades con RLS/Storage reales.
- **RF06 · T · frontend_verificado_integracion_pendiente**: Creación y numeración local, paciente existente y responsable; falta unicidad transaccional/concurrencia en PostgreSQL.
- **RF07 · I · parcial**: Inspección del formulario de mínimos; el centro debe confirmar el conjunto definitivo de datos necesario.
- **RF08 · T · frontend_verificado_integracion_pendiente**: Motivo y cinco estados comprobables en frontend; repetir integración con restricciones de base de datos.
- **RF9 · T · parcial**: Niveles y autorización explícita del frontend; no se ejecutó todavía el escenario tutor/portal exigido por el ERS.
- **RF10 · D · frontend_verificado_integracion_pendiente**: Registro local de tipo/fecha/resumen y recarga comprobables; demostración formal e integración pendientes.
- **RF11 · T · parcial**: Archivo local, descarga y visibilidad comprobables; Storage privado y consumo/denegación desde portal pendientes.
- **RF12 · T · frontend_verificado_integracion_pendiente**: Búsqueda por nombre y número dentro del perfil local; falta verificar consultas con identidad y políticas reales.
- **RF13 · T · frontend_verificado_integracion_pendiente**: Registro local de paciente/expediente, profesional, fecha/hora de Nicaragua, modalidad y estado; recarga comprobada. Falta persistencia y autorización reales en Supabase.
- **RF14 · D · frontend_verificado_integracion_pendiente**: Semana/lista y filtros comprobados para administración y profesional sobre el mismo registro local. Demostración e integración institucional pendientes.
- **RF15 · T · frontend_verificado_integracion_pendiente**: Reprogramación y cancelación probadas; cruces exactos/parciales rechazados, contigüidad y distintas profesionales permitidas. Cola local comprobada; falta restricción transaccional en PostgreSQL y concurrencia real.
- **RF16 · T · pendiente**: Fuera del primer módulo reconstruido. Implementación, integración y verificación aún pendientes.
- **RF17 · T · pendiente**: Fuera del primer módulo reconstruido. Implementación, integración y verificación aún pendientes.
- **RF18 · T · pendiente**: Fuera del primer módulo reconstruido. Implementación, integración y verificación aún pendientes.
- **RF19 · T · pendiente**: Fuera del primer módulo reconstruido. Implementación, integración y verificación aún pendientes.
- **RF20 · T · pendiente**: Fuera del primer módulo reconstruido. Implementación, integración y verificación aún pendientes.
- **RF21 · D · pendiente**: Agenda prepara citas vinculadas al expediente; la alerta discreta y su autorización en el portal familiar siguen pendientes.
- **RF22 · T · pendiente**: Fuera del primer módulo reconstruido. Implementación, integración y verificación aún pendientes.
- **RF23 · D · pendiente**: Fuera del primer módulo reconstruido. Implementación, integración y verificación aún pendientes.
- **RF24 · D · pendiente**: Fuera del primer módulo reconstruido. Implementación, integración y verificación aún pendientes.
- **RF25 · T · pendiente**: Fuera del primer módulo reconstruido. Implementación, integración y verificación aún pendientes.
- **RF26 · D · pendiente**: Iteración posterior prevista en el ERS: lectura de contenido autorizado y fallback sin Web Speech API pendientes.
- **RNF05 · I · pendiente**: Criterios WCAG aplicables por formalizar; inspección documentada del portal pendiente.
- **RF-AP01 · A · pendiente**: Fuera del primer módulo reconstruido. Implementación, integración y verificación aún pendientes.
- **RF-AP02 · I · pendiente**: Fuera del primer módulo reconstruido. Implementación, integración y verificación aún pendientes.
- **RF-AP03 · T · pendiente**: Fuera del primer módulo reconstruido. Implementación, integración y verificación aún pendientes.
- **RF-AP04 · I · pendiente**: Fuera del primer módulo reconstruido. Implementación, integración y verificación aún pendientes.
- **RF-AP05 · T · pendiente**: Fuera del primer módulo reconstruido. Implementación, integración y verificación aún pendientes.
- **RF-AP06 · T · pendiente**: Fuera del primer módulo reconstruido. Implementación, integración y verificación aún pendientes.
- **RF-AP7 · T · pendiente**: Fuera del primer módulo reconstruido. Implementación, integración y verificación aún pendientes.
- **RNF01 · T · pendiente**: Pendiente medir cada operación en entorno de piloto (<3 s); no extrapolar desde la demo local.
- **RNF04 · D · pendiente**: SUS >=70/100 para interfaz profesional: aplicación y puntuación con participantes pendientes; no garantizadas.
- **RNF06 · D · parcial**: Expedientes y Agenda internos revisados con Edge y Chrome; Agenda inspeccionada a 360–1440 px. El portal familiar real a 360 px permanece pendiente.
- **RNF-ET01 · I · pendiente**: Fuera del primer módulo reconstruido. Implementación, integración y verificación aún pendientes.

## Cadena de comprobación

Diagnóstico → necesidad → requerimiento → aceptación/indicador → implementación → instrumento → evidencia obtenida.
Los instrumentos de pilotaje no se consideran aplicados en el diagnóstico.

## SUS, Likert, accesibilidad y mediciones

- RNF04: SUS proporcionará una valoración global de usabilidad percibida. Meta de la interfaz profesional: >=70/100. La puntuación exige participantes reales y no se puede garantizar por inspección del código.
- Likert: instrumento complementario para claridad, navegación, comprensión, eficiencia percibida y aceptación. Formalizar preguntas, escala, participantes y análisis antes del piloto.
- WCAG: relacionar componentes con RF23–RF26 y RNF05. Los Success Criteria aplicables siguen por definir/formalizar; una prueba automática o de 360 px no demuestra conformidad completa.
- RNF01: medir operaciones del software bajo las condiciones del piloto; objetivo de menos de 3 segundos.
- Medidas operacionales: comparar búsqueda de expediente con 18.5 min, coordinación con 12 min, cruces con 4/mes, reporte familiar con 35 % e incidencias con 8.5 %. Conservar períodos y denominadores; no afirmar causalidad.
- Observación, entrevistas y retroalimentación: tareas y guías durante el pilotaje. No inventar respuestas, tamaños alcanzados o resultados.

## Agenda implementada y siguiente etapa

Agenda RF13–RF15 está implementada como frontend de desarrollo y usa pacientes y expedientes compartidos.
Consultar `modulo-agenda.md`: propone duraciones, estados, intervalos y hora Nicaragua para confirmar con el centro.
La protección de servidor y la concurrencia multiusuario permanecen pendientes.

La siguiente etapa funcional será Seguimiento de actividades (RF16–RF19); el contenido familiar
se verificará después con RF18/RF20–RF25. No se considera que esos requerimientos estén satisfechos
por haber construido Agenda. La alerta de próxima cita del portal (RF21) sigue pendiente.

## Criterio para cerrar módulos

1. Revisar todos los registros y marcar aplicables, dependencias y pendientes.
2. Ejecutar positivos, negativos y persistencia con datos ficticios; respetar el método formal del ERS.
3. Verificar autorización real, restricciones y concurrencia después de conectar Supabase.
4. Registrar entorno, fecha, resultado obtenido y evidencia; corregir fallos y repetir solo lo afectado.
5. Separar cierre frontend, integración y pilotaje. No anunciar resultados de instrumentos todavía no aplicados.
