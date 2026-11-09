# Revisión completa del ERS — 8 de noviembre de 2026

Los 40 registros conservan enunciados, aceptación, métodos T/I/D/A e identificadores originales. Frontend local con datos ficticios de Expedientes, Agenda, Seguimiento y Portal familiar. No acredita cierre integral ni resultados de pilotaje.

Actualización de autenticación: Supabase Auth y lectura del propio perfil implementados; primera cuenta Administración habilitada. El acceso real y la restauración tras recarga se observaron en el preview con la cuenta de la titular. Ver `modulo-autenticacion.md`.
## Estado de cada requerimiento

- **RF01 · T · parcial**: Supabase Auth individual implementado; acceso y recarga local observados. Titular confirmó ingreso en Vercel después de configurar Production y redesplegar (Ready). Recuperación por correo e inspección institucional pendientes.
- **RF02 · T · parcial**: Roles canónicos y contrato de perfil comprobados contra SQL; perfil Administración activo en Supabase, sin escalamiento por metadatos. Falta matriz operativa de permisos de módulos conectados.
- **RF03 · T · parcial**: Seguimiento comprueba rol psicologa activo y expediente propio en servidor; Administración/Desarrollo/anon y expedientes ajenos rechazados en SQL. Permisos aplicados con autorización de la titular; portal externo y Storage pendientes.
- **RF04 · T · parcial**: Portal de demostración entrega solo el DTO autorizado por expediente; archivos ocultos y borradores se rechazan/omiten. Rutas públicas cerradas hasta disponer de servidor; falta autorización real y pruebas negativas sobre Supabase.
- **RF05 · I · parcial**: Auditoría de consultas y cambios de Registro, Agenda y Seguimiento con actor/acción/fecha, sin texto clínico en eventos; protección contra borrado comprobada en SQL. Inspección institucional pendiente.
- **RNF02 · I · pendiente**: Pendiente inspección de HTTPS, credenciales, autorización por código y controles de servidor.
- **RNF03 · I · pendiente**: Pendiente inspección y pruebas negativas de todas las entidades con RLS/Storage reales.
- **RF06 · T · parcial**: Apertura transaccional de paciente/expediente, reutilización autorizada y secuencia única comprobadas contra SQL local. API aplicada en Supabase; listado y responsable real leídos con JWT de Administración. Escritura remota y concurrencia pendientes. La titular confirmó creación y edición en Vercel; ese ensayo fue informado por ella, no observado por el agente.
- **RF07 · I · parcial**: Formulario real de identificación mínima preparado y conectado: nombres/apellidos obligatorios, nacimiento/contacto opcionales. Límites SQL probados; el centro debe confirmar suficiencia del conjunto mínimo.
- **RF08 · T · parcial**: Motivo y cinco estados conservados por API y pantalla; edición compara versiones de paciente y expediente. Pruebas locales y controladas; falta escritura real autorizada.
- **RF9 · T · parcial**: Registro/edición de notas y visibilidad explícita implementados en Seguimiento autenticado; SQL y navegador con Auth simulado comprobados. Publicación externa paciente_tutor y escritura remota clínica pendientes.
- **RF10 · D · parcial**: Tipo, fecha y resumen de evaluación conectados a SQL; creación desde interfaz y persistencia verificadas con PGlite. Demostración formal y escritura remota clínica pendientes.
- **RF11 · T · frontend_verificado_integracion_pendiente**: Archivo local autorizado descargable por la sesión de su expediente; revocación bloquea nueva descarga. Archivos internos omitidos. Storage privado y autorización de servidor pendientes.
- **RF12 · T · parcial**: Búsqueda por nombre sin acentos y número dentro del alcance, filtro y paginación comprobados en SQL y navegador. Listado vacío real verificado; datos no vacíos remotos pendientes.
- **RF13 · T · parcial**: Agenda conectada: servidor deriva paciente/profesional del expediente y guarda fecha-hora Nicaragua, modalidad y estado. Contrato real SQL/adaptador probado; API aplicada y lectura remota observada. Escritura remota de citas pendiente de ensayo autorizado.
- **RF14 · D · parcial**: Semana/lista conservadas sobre PostgreSQL con consulta por rango y alcance del rol. Interfaz real y catálogo autorizado conectados; demostración institucional y medición de piloto pendientes.
- **RF15 · T · parcial**: GiST rechaza cruces exactos/parciales; admite contigüidad y distintas profesionales. Reprogramación con versión, cancelación sin borrar y horario liberado probados en SQL y navegador controlados. Concurrencia entre conexiones remotas pendiente.
- **RF16 · T · parcial**: Actividades conectadas con título, descripción, instrucciones, prioridad, fecha y autorización explícita. Contrato SQL/adaptador, persistencia y negativos probados; escritura clínica remota pendiente.
- **RF17 · T · parcial**: Cuatro estados originales conservados en SQL y pantalla; cambios versionados, sin estado automático por fecha y con historial. Prueba remota clínica pendiente.
- **RF18 · T · parcial**: Autorización explícita de actividades y proyección familiar filtrada comprobadas en servidor local; el portal externo sigue cerrado hasta conectar código/sesión seguros.
- **RF19 · T · parcial**: Asociación opcional a nota del mismo expediente impuesta en servidor y probada contra SQL; referencias ajenas rechazadas. Ensayo clínico remoto pendiente.
- **RF20 · T · parcial**: Acceso por código ficticio sin crear cuenta, sesión opaca en memoria y salida comprobados. Los códigos conocidos de demostración no autentican personas; validación, revocación y límites de intentos de servidor pendientes.
- **RF21 · D · frontend_verificado_integracion_pendiente**: Portal local muestra actividades, notas, archivos, enlaces HTTPS autorizados y próxima cita confirmada/futura solo fecha/hora. No expone resumen de consulta ni evaluación. Demostración formal e integración institucional pendientes.
- **RF22 · T · parcial**: Códigos inválidos/número de expediente y sesiones inventadas o cerradas rechazados con mensaje genérico. No acepta cambiar expediente desde la llamada. Servidor, códigos reales y protección de intentos pendientes.
- **RF23 · D · frontend_verificado_integracion_pendiente**: Tres tamaños de texto aplicados y conservados sin recortar contenido; recorridos de 320–1440 px y texto grande comprobados. Demostración formal y comprensión con usuarios pendientes.
- **RF24 · D · frontend_verificado_integracion_pendiente**: Tema institucional, alto contraste, oscuro y cálido implementados; contraste automático y estados legibles ensayados. Inspección/demostración manual formal pendientes.
- **RF25 · T · frontend_verificado_integracion_pendiente**: Preferencias de lectura en sessionStorage sin cuenta ni datos clínicos; recarga y navegación comprobadas. Datos corruptos o almacenamiento bloqueado conservan funcionamiento con aviso; pilotaje pendiente.
- **RF26 · D · frontend_verificado_integracion_pendiente**: Lectura explícita de título/descripción/instrucciones autorizadas con voz local en español, pausa/continuación/detención, cancelación al salir/cambiar sección y fallback sin API/voz. Contrato automatizado comprobado; audio real en dispositivos y demostración formal pendientes.
- **RNF05 · I · parcial**: Portal incluye controles de lectura, teclado, foco, temas y espaciado. Escaneo automático y reflujo ensayados; criterios WCAG 2.2 propuestos en modulo-portal.md por formalizar. No acredita conformidad integral ni inspección real con usuarios/lector de pantalla.
- **RF-AP01 · A · parcial**: Generación en PostgreSQL desde actividades y fuentes recientes etiquetadas; textos clínicos no son entrada del modelo. Sin actividades no se inventan borradores. Inferencia sintética remota observada; validación profesional pendiente.
- **RF-AP02 · I · parcial**: Beta sin diagnóstico ni pronóstico, aviso permanente y filtro de texto revisado en servidor; revisión profesional obligatoria. No acredita validación clínica ni eficacia.
- **RF-AP03 · T · parcial**: Borradores internos, revisión/edición/descarte versionados; retirada por cambios de datos, envejecimiento de fuentes o artefacto del motor probada en SQL y navegador. Portal externo pendiente.
- **RF-AP04 · I · parcial**: Aviso persistente «Herramienta de apoyo. No diagnostica ni reemplaza el criterio de la profesional» conservado en la interfaz y comprobado en navegador. Inspección institucional formal pendiente.
- **RF-AP05 · T · parcial**: Desactivación por expediente retira recomendaciones; reactivar no publica textos automáticamente. Aislamiento y persistencia comprobados contra SQL local.
- **RF-AP06 · T · parcial**: Generación servidor limitada a tres propuestas y revisión/descarte auditados, control de versiones y fuentes; pruebas SQL/navegador aprobadas, demostración institucional pendiente.
- **RF-AP7 · T · parcial**: Valoración de utilidad de recomendaciones revisadas persistida en SQL; valores inválidos/recomendaciones pendientes rechazados. Resultados del piloto no disponibles.
- **RNF01 · T · pendiente**: Pendiente medir cada operación en entorno de piloto (<3 s); no extrapolar desde la demo local.
- **RNF04 · D · pendiente**: SUS >=70/100 para interfaz profesional: aplicación y puntuación con participantes pendientes; no garantizadas.
- **RNF06 · D · parcial**: Frontend completo comprobado en Edge y Chrome; portal a 320, 360, 390, 768, 1024 y 1440 px con texto grande y espaciado. Dispositivos, lector de pantalla y demostración institucional pendientes. Revisión de distribución: 89 escenarios cubiertos en Chrome/Edge; anchos 360/768/1024/1440, sin desbordamiento de página y cabecera sin menú superpuesto. No sustituye demostración institucional.
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

## Seguimiento conectado

Actividades, notas, evaluaciones, enlaces y beta supervisada disponen de API restringida a la profesional responsable. Ver [conexion-seguimiento.md](conexion-seguimiento.md). Storage y portal externo siguen pendientes. Se preservaron los 40 IDs, métodos y criterios originales; ningún requerimiento se declara íntegramente acreditado por estas pruebas.

## Revisión visual transversal

Marco profesional unificado, encabezado único, pestañas completas y formularios aislados del acceso. Ver resultados-verificacion.md y tests/workspace-layout.spec.js. Se conservaron los 40 criterios de aceptación y métodos; la revisión visual no acredita SUS, Likert ni WCAG integral.
