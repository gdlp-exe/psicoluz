# Revisión completa del ERS — 8 de noviembre de 2026

Los 40 registros conservan enunciados, aceptación, métodos T/I/D/A e identificadores originales. Frontend local con datos ficticios de Expedientes, Agenda, Seguimiento y Portal familiar. No acredita cierre integral ni resultados de pilotaje.

Actualización de autenticación: Supabase Auth y lectura del propio perfil implementados; primera cuenta Administración habilitada. El acceso real y la restauración tras recarga se observaron en el preview con la cuenta de la titular. Ver `modulo-autenticacion.md`.
## Estado de cada requerimiento

- **RF01 · T · parcial**: Supabase Auth individual implementado; acceso y recarga local observados. Titular confirmó ingreso en Vercel después de configurar Production y redesplegar (Ready). Recuperación por correo e inspección institucional pendientes.
- **RF02 · T · parcial**: Roles canónicos y contrato de perfil comprobados contra SQL; perfil Administración activo en Supabase, sin escalamiento por metadatos. Falta matriz operativa de permisos de módulos conectados.
- **RF03 · T · parcial**: Aislamiento y nota privada ensayados localmente; falta RLS y escenario de portal por código. Seguimiento incorpora aislamiento, proyección autorizada e historial local; servidor y portal reales pendientes.
- **RF04 · T · parcial**: Portal de demostración entrega solo el DTO autorizado por expediente; archivos ocultos y borradores se rechazan/omiten. Rutas públicas cerradas hasta disponer de servidor; falta autorización real y pruebas negativas sobre Supabase.
- **RF05 · I · parcial**: Bitácora SQL de lectura del perfil con actor autenticado y solo anexado comprobada. Historial de módulos todavía local; inspección integral institucional pendiente.
- **RNF02 · I · pendiente**: Pendiente inspección de HTTPS, credenciales, autorización por código y controles de servidor.
- **RNF03 · I · pendiente**: Pendiente inspección y pruebas negativas de todas las entidades con RLS/Storage reales.
- **RF06 · T · frontend_verificado_integracion_pendiente**: Creación y numeración local, paciente existente y responsable; falta unicidad transaccional/concurrencia en PostgreSQL.
- **RF07 · I · parcial**: Inspección del formulario de mínimos; el centro debe confirmar el conjunto definitivo de datos necesario.
- **RF08 · T · frontend_verificado_integracion_pendiente**: Motivo y cinco estados comprobables en frontend; repetir integración con restricciones de base de datos.
- **RF9 · T · frontend_verificado_integracion_pendiente**: Portal local muestra únicamente título, fecha y texto de notas paciente_tutor; sin extractos privados, campos internos ni evaluaciones. Escenario T comprobado en demo, pendiente repetir con autorización real.
- **RF10 · D · frontend_verificado_integracion_pendiente**: Registro local de tipo/fecha/resumen y recarga comprobables; demostración formal e integración pendientes.
- **RF11 · T · frontend_verificado_integracion_pendiente**: Archivo local autorizado descargable por la sesión de su expediente; revocación bloquea nueva descarga. Archivos internos omitidos. Storage privado y autorización de servidor pendientes.
- **RF12 · T · frontend_verificado_integracion_pendiente**: Búsqueda por nombre y número dentro del perfil local; falta verificar consultas con identidad y políticas reales.
- **RF13 · T · frontend_verificado_integracion_pendiente**: Registro local de paciente/expediente, profesional, fecha/hora de Nicaragua, modalidad y estado; recarga comprobada. Falta persistencia y autorización reales en Supabase.
- **RF14 · D · frontend_verificado_integracion_pendiente**: Semana/lista y filtros comprobados para administración y profesional sobre el mismo registro local. Demostración e integración institucional pendientes.
- **RF15 · T · frontend_verificado_integracion_pendiente**: Reprogramación y cancelación probadas; cruces exactos/parciales rechazados, contigüidad y distintas profesionales permitidas. Cola local comprobada; falta restricción transaccional en PostgreSQL y concurrencia real.
- **RF16 · T · frontend_verificado_integracion_pendiente**: Asignación/edición con título, descripción, instrucciones, prioridad y fecha; persistencia y negativos comprobados. Integración y autorización de servidor pendientes.
- **RF17 · T · frontend_verificado_integracion_pendiente**: Cuatro estados originales registrados y conservados. La fecha no cambia el estado automáticamente. Integración pendiente.
- **RF18 · T · frontend_verificado_integracion_pendiente**: Código ficticio limita el DTO a actividades expresamente visibles de un expediente; internas/ajenas rechazadas en reportes. Portal real, sesión segura y RLS pendientes.
- **RF19 · T · frontend_verificado_integracion_pendiente**: Nota opcional del mismo expediente; referencias ajenas rechazadas. Restricciones de servidor pendientes.
- **RF20 · T · parcial**: Acceso por código ficticio sin crear cuenta, sesión opaca en memoria y salida comprobados. Los códigos conocidos de demostración no autentican personas; validación, revocación y límites de intentos de servidor pendientes.
- **RF21 · D · frontend_verificado_integracion_pendiente**: Portal local muestra actividades, notas, archivos, enlaces HTTPS autorizados y próxima cita confirmada/futura solo fecha/hora. No expone resumen de consulta ni evaluación. Demostración formal e integración institucional pendientes.
- **RF22 · T · parcial**: Códigos inválidos/número de expediente y sesiones inventadas o cerradas rechazados con mensaje genérico. No acepta cambiar expediente desde la llamada. Servidor, códigos reales y protección de intentos pendientes.
- **RF23 · D · frontend_verificado_integracion_pendiente**: Tres tamaños de texto aplicados y conservados sin recortar contenido; recorridos de 320–1440 px y texto grande comprobados. Demostración formal y comprensión con usuarios pendientes.
- **RF24 · D · frontend_verificado_integracion_pendiente**: Tema institucional, alto contraste, oscuro y cálido implementados; contraste automático y estados legibles ensayados. Inspección/demostración manual formal pendientes.
- **RF25 · T · frontend_verificado_integracion_pendiente**: Preferencias de lectura en sessionStorage sin cuenta ni datos clínicos; recarga y navegación comprobadas. Datos corruptos o almacenamiento bloqueado conservan funcionamiento con aviso; pilotaje pendiente.
- **RF26 · D · frontend_verificado_integracion_pendiente**: Lectura explícita de título/descripción/instrucciones autorizadas con voz local en español, pausa/continuación/detención, cancelación al salir/cambiar sección y fallback sin API/voz. Contrato automatizado comprobado; audio real en dispositivos y demostración formal pendientes.
- **RNF05 · I · parcial**: Portal incluye controles de lectura, teclado, foco, temas y espaciado. Escaneo automático y reflujo ensayados; criterios WCAG 2.2 propuestos en modulo-portal.md por formalizar. No acredita conformidad integral ni inspección real con usuarios/lector de pantalla.
- **RF-AP01 · A · parcial**: Reglas transparentes y clasificador softmax entrenado con 96 casos sintéticos, evaluado con 24 reservados; parámetros, hashes y reporte versionados. Caso 4 vigentes/3 vencidas, ausencia de actividades y etiquetas elegidas comprobados. No interpreta texto clínico ni acredita utilidad profesional; análisis formal pendiente.
- **RF-AP02 · I · parcial**: Catálogo orientado al plan y posibilidad, con revisión y guardia de texto. Inspección formal pendiente; filtro no garantiza seguridad de un futuro generador abierto.
- **RF-AP03 · T · frontend_verificado_integracion_pendiente**: Aceptar/editar/descartar, confirmaciones y texto familiar revisado comprobados. Cambios del contexto retiran publicación. Portal real y servidor pendientes. Cambio de versión del motor invalida autorización anterior; ejemplo sintético independiente no persiste ni publica. Texto editado autorizado y retiro al cambiar datos comprobados también en el portal local.
- **RF-AP04 · I · parcial**: Aviso literal persistente en área de apoyo y contenido familiar del apoyo; inspección formal pendiente.
- **RF-AP05 · T · frontend_verificado_integracion_pendiente**: Desactivación por expediente impide generar y retira textos familiares del apoyo. Integración pendiente.
- **RF-AP06 · T · frontend_verificado_integracion_pendiente**: Máximo tres recomendaciones activas ante regeneraciones; contexto anterior archivado. Restricción transaccional multiusuario pendiente.
- **RF-AP7 · T · frontend_verificado_integracion_pendiente**: Útil/parcial/no útil después de revisión, persistencia y rechazo de valor inválido comprobados. Valoración profesional real pendiente.
- **RNF01 · T · pendiente**: Pendiente medir cada operación en entorno de piloto (<3 s); no extrapolar desde la demo local.
- **RNF04 · D · pendiente**: SUS >=70/100 para interfaz profesional: aplicación y puntuación con participantes pendientes; no garantizadas.
- **RNF06 · D · parcial**: Frontend completo comprobado en Edge y Chrome; portal a 320, 360, 390, 768, 1024 y 1440 px con texto grande y espaciado. Dispositivos, lector de pantalla y demostración institucional pendientes.
- **RNF-ET01 · I · parcial**: Sin diagnóstico, pronóstico ni puntuación clínica automática. Reglas limitadas, etiquetas elegidas y revisión obligatoria. Modelo entrenado exclusivamente con casos artificiales; resultados de test sintético no acreditan validez clínica. Inspección ética formal pendiente.

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

## Inicio del backend

Base privada aplicada en el proyecto nuevo: 15 tablas con RLS y acceso directo denegado. Se probaron restricciones SQL locales; faltan Auth, políticas por rol/API, Storage y conexión de módulos. Los estados de los 40 requerimientos no se convierten en cumplimiento integral por esta base. Ver `backend-fase1.md`.
