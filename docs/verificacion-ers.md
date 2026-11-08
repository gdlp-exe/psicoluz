# Revisión completa del ERS — 7 de noviembre de 2026

Los 40 registros conservan enunciados, aceptación, métodos T/I/D/A e identificadores originales. Frontend local con datos ficticios de Expedientes, Agenda y Seguimiento. No acredita cierre integral ni resultados de pilotaje.

## Estado de cada requerimiento

- **RF01 · T · pendiente**: Autenticación real y cuentas individuales pendientes. El selector de la demo no autentica.
- **RF02 · T · parcial**: Selector de perfiles y restricciones de la demo comprobables; falta Auth y matriz de permisos de servidor.
- **RF03 · T · parcial**: Aislamiento y nota privada ensayados localmente; falta RLS y escenario de portal por código. Seguimiento incorpora aislamiento, proyección autorizada e historial local; servidor y portal reales pendientes.
- **RF04 · T · pendiente**: Pendiente portal real y denegación de contenido no autorizado en backend. Seguimiento incorpora aislamiento, proyección autorizada e historial local; servidor y portal reales pendientes.
- **RF05 · I · parcial**: Historial local con actor/acción/fecha; falta bitácora de servidor no modificable por clientes. Seguimiento incorpora aislamiento, proyección autorizada e historial local; servidor y portal reales pendientes.
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
- **RF16 · T · frontend_verificado_integracion_pendiente**: Asignación/edición con título, descripción, instrucciones, prioridad y fecha; persistencia y negativos comprobados. Integración y autorización de servidor pendientes.
- **RF17 · T · frontend_verificado_integracion_pendiente**: Cuatro estados originales registrados y conservados. La fecha no cambia el estado automáticamente. Integración pendiente.
- **RF18 · T · parcial**: Proyección solo de actividades autorizadas del mismo expediente, sin notas internas. Es vista previa profesional; portal por código y denegaciones de servidor pendientes.
- **RF19 · T · frontend_verificado_integracion_pendiente**: Nota opcional del mismo expediente; referencias ajenas rechazadas. Restricciones de servidor pendientes.
- **RF20 · T · pendiente**: Fuera del primer módulo reconstruido. Implementación, integración y verificación aún pendientes.
- **RF21 · D · pendiente**: Agenda prepara citas vinculadas al expediente; la alerta discreta y su autorización en el portal familiar siguen pendientes.
- **RF22 · T · pendiente**: Fuera del primer módulo reconstruido. Implementación, integración y verificación aún pendientes.
- **RF23 · D · pendiente**: Fuera del primer módulo reconstruido. Implementación, integración y verificación aún pendientes.
- **RF24 · D · pendiente**: Fuera del primer módulo reconstruido. Implementación, integración y verificación aún pendientes.
- **RF25 · T · pendiente**: Fuera del primer módulo reconstruido. Implementación, integración y verificación aún pendientes.
- **RF26 · D · pendiente**: Iteración posterior prevista en el ERS: lectura de contenido autorizado y fallback sin Web Speech API pendientes.
- **RNF05 · I · parcial**: Escaneo automático WCAG 2 A/AA en pantallas/formularios de Seguimiento sin incidencias detectadas en escenarios cubiertos. No acredita conformidad integral; criterios aplicables a RF23–RF26 y portal pendientes de formalización/inspección.
- **RF-AP01 · A · parcial**: Reglas transparentes y selector kNN sintético secundario. Caso 4 vigentes/3 vencidas y ausencia de actividades comprobados. Evaluaciones etiquetadas son extensión solicitada, sin interpretación clínica automática. Análisis formal profesional pendiente.
- **RF-AP02 · I · parcial**: Catálogo orientado al plan y posibilidad, con revisión y guardia de texto. Inspección formal pendiente; filtro no garantiza seguridad de un futuro generador abierto.
- **RF-AP03 · T · frontend_verificado_integracion_pendiente**: Aceptar/editar/descartar, confirmaciones y texto familiar revisado comprobados. Cambios del contexto retiran publicación. Portal real y servidor pendientes.
- **RF-AP04 · I · parcial**: Aviso literal persistente en área de apoyo y contenido familiar del apoyo; inspección formal pendiente.
- **RF-AP05 · T · frontend_verificado_integracion_pendiente**: Desactivación por expediente impide generar y retira textos familiares del apoyo. Integración pendiente.
- **RF-AP06 · T · frontend_verificado_integracion_pendiente**: Máximo tres recomendaciones activas ante regeneraciones; contexto anterior archivado. Restricción transaccional multiusuario pendiente.
- **RF-AP7 · T · frontend_verificado_integracion_pendiente**: Útil/parcial/no útil después de revisión, persistencia y rechazo de valor inválido comprobados. Valoración profesional real pendiente.
- **RNF01 · T · pendiente**: Pendiente medir cada operación en entorno de piloto (<3 s); no extrapolar desde la demo local.
- **RNF04 · D · pendiente**: SUS >=70/100 para interfaz profesional: aplicación y puntuación con participantes pendientes; no garantizadas.
- **RNF06 · D · parcial**: Expedientes, Agenda y Seguimiento revisados en Edge y Chrome; Seguimiento a 360, 390, 768, 1024 y 1440 px. Portal familiar real pendiente.
- **RNF-ET01 · I · parcial**: Sin diagnóstico, pronóstico ni puntuación clínica automática. Reglas limitadas y etiquetas explícitas; selector artificial experimental. Inspección ética formal pendiente.

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

## Criterio para cerrar módulos

1. Revisar todos los registros y marcar aplicables, dependencias y pendientes.
2. Ejecutar positivos, negativos y persistencia con datos ficticios; respetar el método formal del ERS.
3. Verificar autorización real, restricciones y concurrencia después de conectar Supabase.
4. Registrar entorno, fecha, resultado obtenido y evidencia; corregir fallos y repetir solo lo afectado.
5. Separar cierre frontend, integración y pilotaje. No anunciar resultados de instrumentos todavía no aplicados.
