# Revisión completa del ERS — 8 de noviembre de 2026

Los 40 registros conservan enunciados, aceptación, métodos T/I/D/A e identificadores originales. Frontend local con datos ficticios de Expedientes, Agenda, Seguimiento y Portal familiar. No acredita cierre integral ni resultados de pilotaje.

Actualización de autenticación: Supabase Auth y lectura del propio perfil implementados; primera cuenta Administración habilitada. El acceso real y la restauración tras recarga se observaron en el preview con la cuenta de la titular. Ver `modulo-autenticacion.md`.
## Estado de cada requerimiento

- **RF01 · T · parcial**: Supabase Auth individual implementado; acceso y recarga local observados. Titular confirmó ingreso en Vercel después de configurar Production y redesplegar (Ready). Recuperación por correo e inspección institucional pendientes.
- **RF02 · T · parcial**: Roles canónicos y contrato de perfil comprobados contra SQL; perfil Administración activo en Supabase, sin escalamiento por metadatos. Falta matriz operativa de permisos de módulos conectados.
- **RF03 · T · parcial**: Cuenta profesional activa y expediente propio comprobados en Registro/Agenda/Seguimiento/archivos. Portal limitado a código y sesión del expediente; Administración/Desarrollo no tienen API clínica. SQL aplicado y permisos remotos verificados; ensayo positivo remoto de archivo/código pendiente.
- **RF04 · T · parcial**: Proyección familiar de servidor excluye contenido interno, evaluaciones, motivos, responsables y borradores. Descarga vuelve a verificar sesión y autorización. SQL y manejador probados; rechazo remoto observado. Pilotaje y recorrido positivo remoto pendientes.
- **RF05 · I · parcial**: Consultas y cambios registran actor profesional o sesión familiar, operación y fecha. No se registran códigos, tokens ni textos clínicos en eventos. Un código no identifica individualmente a cada persona que lo posee. Inspección institucional pendiente.
- **RNF02 · I · parcial**: Canales HTTPS y hashes de códigos/tokens implementados; credenciales de personal en Auth y clave privilegiada solo en servidor. Bucket privado sin enlaces públicos/firmados. Falta inspección institucional completa y ensayo positivo remoto de archivos/códigos.
- **RNF03 · I · parcial**: 16 tablas propias con RLS observadas remotamente; esquema privado inaccesible para anon. Storage tiene solo política INSERT para reserva profesional propia; sin lecturas directas del navegador. Negativos SQL y servicio probados, inspección completa y prueba positiva real pendientes.
- **RF06 · T · parcial**: Apertura transaccional de paciente/expediente, reutilización autorizada y secuencia única comprobadas contra SQL local. API aplicada en Supabase; listado y responsable real leídos con JWT de Administración. Escritura remota y concurrencia pendientes. La titular confirmó creación y edición en Vercel; ese ensayo fue informado por ella, no observado por el agente.
- **RF07 · I · parcial**: Formulario real de identificación mínima preparado y conectado: nombres/apellidos obligatorios, nacimiento/contacto opcionales. Límites SQL probados; el centro debe confirmar suficiencia del conjunto mínimo.
- **RF08 · T · parcial**: Motivo y cinco estados conservados por API y pantalla; edición compara versiones de paciente y expediente. Pruebas locales y controladas; falta escritura real autorizada.
- **RF9 · T · parcial**: Notas propias conectadas; portal devuelve solo texto de notas paciente_tutor con autorización registrada, sin extractos privados ni evaluaciones. SQL y navegación local probados; demostración remota formal pendiente.
- **RF10 · D · parcial**: Tipo, fecha y resumen de evaluación conectados a SQL; creación desde interfaz y persistencia verificadas con PGlite. Demostración formal y escritura remota clínica pendientes.
- **RF11 · T · parcial**: Carga privada con reserva, verificación de firma/tamaño/MIME en servidor y autorización familiar separada. Descarga por función con permisos actuales, sin URL pública/firmada; retirada conserva bitácora. Supabase configurado; carga/descarga positiva real pendiente.
- **RF12 · T · parcial**: Búsqueda por nombre sin acentos y número dentro del alcance, filtro y paginación comprobados en SQL y navegador. Listado vacío real verificado; datos no vacíos remotos pendientes.
- **RF13 · T · parcial**: Agenda conectada: servidor deriva paciente/profesional del expediente y guarda fecha-hora Nicaragua, modalidad y estado. Contrato real SQL/adaptador probado; API aplicada y lectura remota observada. Escritura remota de citas pendiente de ensayo autorizado.
- **RF14 · D · parcial**: Semana/lista conservadas sobre PostgreSQL con consulta por rango y alcance del rol. Interfaz real y catálogo autorizado conectados; demostración institucional y medición de piloto pendientes.
- **RF15 · T · parcial**: GiST rechaza cruces exactos/parciales; admite contigüidad y distintas profesionales. Reprogramación con versión, cancelación sin borrar y horario liberado probados en SQL y navegador controlados. Concurrencia entre conexiones remotas pendiente.
- **RF16 · T · parcial**: Actividades conectadas con título, descripción, instrucciones, prioridad, fecha y autorización explícita. Contrato SQL/adaptador, persistencia y negativos probados; escritura clínica remota pendiente.
- **RF17 · T · parcial**: Cuatro estados originales conservados en SQL y pantalla; cambios versionados, sin estado automático por fecha y con historial. Prueba remota clínica pendiente.
- **RF18 · T · parcial**: Portal conectado proyecta solo actividades expresamente autorizadas del expediente del código. SQL y recorrido de navegador local verificados; prueba positiva remota con familia pendiente.
- **RF19 · T · parcial**: Asociación opcional a nota del mismo expediente impuesta en servidor y probada contra SQL; referencias ajenas rechazadas. Ensayo clínico remoto pendiente.
- **RF20 · T · parcial**: Código aleatorio por expediente con hash, vigencia 1/7/30 días y sesión opaca de hasta 8 horas sin cuenta. Rotación/revocación y límites persistentes aplicados. Código real aún no emitido para un ensayo remoto.
- **RF21 · D · parcial**: Portal conectado incluye actividades/notas/archivos/enlaces autorizados, textos revisados actuales del apoyo y próxima cita confirmada futura solo fecha/hora. No incluye resumen de consulta. Recorrido local SQL/servicio probado; demostración institucional pendiente.
- **RF22 · T · parcial**: Servidor rechaza código inválido/expirado/revocado, sesión falsa y expediente distinto con respuesta genérica; contadores persistentes de intentos. Rechazo de descarga con sesión inválida observado en función remota. Prueba positiva real y revisión operativa pendientes.
- **RF23 · D · parcial**: Tres tamaños conservados en el portal conectado, sin recortar instrucciones en pruebas de reflujo. Demostración y comprensión con participantes pendientes. Se conservaron tres niveles de texto en las presentaciones familiar e infantil; reflujo 360/768/1440 y cuatro temas comprobados.
- **RF24 · D · parcial**: Temas institucional, alto contraste, oscuro y cálido conservados en el portal conectado. Contraste automatizado ensayado; inspección manual formal pendiente. Presentación infantil respeta los cuatro temas y contraste automático; inspección manual pendiente.
- **RF25 · T · parcial**: Preferencias de accesibilidad conservadas durante sesión sin cuenta. Token familiar solo en memoria; no se almacena con las preferencias. Recarga cierra el acceso familiar y exige volver a ingresar código; preferencias persisten. Pilotaje pendiente. Preferencias de presentación y voz local añadidas a la misma sesión, sin cuenta ni datos clínicos.
- **RF26 · D · parcial**: Lectura de título/descripción/instrucciones autorizadas con voz local; pausa, continuación, salida y fallback conservados. Actualizar contenido detiene texto retirado o modificado. Contrato automatizado probado; voz real y demostración pendientes. Selector de voces locales en español, muestra explícita, carga tardía y cortes por frase implementados. La calidad depende de las voces del dispositivo; escucha real con participantes pendiente.
- **RNF05 · I · parcial**: Controles de accesibilidad conservados al conectar el portal y recursos; revisión axe, teclado y reflujo aprobados. Los criterios WCAG aplicables deben formalizarse y verificarse manualmente; no se acredita conformidad integral. Refinamiento visual con iconos y tarjetas, reducción de movimiento y vuelta a la vista familiar; no se añadió un requerimiento de juegos. Comprensión por niños no lectores y evaluación manual pendientes.
- **RF-AP01 · A · parcial**: Generación en PostgreSQL desde actividades y fuentes recientes etiquetadas; textos clínicos no son entrada del modelo. Sin actividades no se inventan borradores. Inferencia sintética remota observada; validación profesional pendiente.
- **RF-AP02 · I · parcial**: Beta sin diagnóstico ni pronóstico, aviso permanente y filtro de texto revisado en servidor; revisión profesional obligatoria. No acredita validación clínica ni eficacia.
- **RF-AP03 · T · parcial**: Borradores internos; revisión y autorización antes de compartir. Portal conectado solo devuelve texto revisado vigente según huella/revisión y motor. Cambios retiran la proyección; validación profesional y prueba remota positiva pendientes.
- **RF-AP04 · I · parcial**: Aviso persistente «Herramienta de apoyo. No diagnostica ni reemplaza el criterio de la profesional» conservado en la interfaz y comprobado en navegador. Inspección institucional formal pendiente.
- **RF-AP05 · T · parcial**: Desactivación por expediente retira recomendaciones; reactivar no publica textos automáticamente. Aislamiento y persistencia comprobados contra SQL local.
- **RF-AP06 · T · parcial**: Generación servidor limitada a tres propuestas y revisión/descarte auditados, control de versiones y fuentes; pruebas SQL/navegador aprobadas, demostración institucional pendiente.
- **RF-AP7 · T · parcial**: Valoración de utilidad de recomendaciones revisadas persistida en SQL; valores inválidos/recomendaciones pendientes rechazados. Resultados del piloto no disponibles.
- **RNF01 · T · pendiente**: Pendiente medir cada operación en entorno de piloto (<3 s); no extrapolar desde la demo local.
- **RNF04 · D · pendiente**: SUS >=70/100 para interfaz profesional: aplicación y puntuación con participantes pendientes; no garantizadas.
- **RNF06 · D · parcial**: Frontend completo comprobado en Edge y Chrome; portal a 320, 360, 390, 768, 1024 y 1440 px con texto grande y espaciado. Dispositivos, lector de pantalla y demostración institucional pendientes. Revisión de distribución: 89 escenarios cubiertos en Chrome/Edge; anchos 360/768/1024/1440, sin desbordamiento de página y cabecera sin menú superpuesto. No sustituye demostración institucional. Personalización final: 95 escenarios aprobados en Edge y 95 en Chrome; vista infantil en 360/768/1440 y cuatro temas comprobada.
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

## Archivos privados y portal conectados

Activación autorizada por la titular, incluida la configuración de autenticación propia de la función. 16 tablas propias con RLS; bucket privado y solo INSERT profesional. Ver conexion-archivos-portal.md. El recorrido positivo remoto con archivo/código, inspecciones formales, SUS/Likert/WCAG y métricas de piloto siguen pendientes.

## Personalización del portal — 9 de noviembre

Presentación familiar/infantil reversible y mejora de selección/lectura de voces locales. Se conserva contenido, autorización y alcance del ERS; ver personalizacion-portal.md. Validación con niños, familias y equipos reales pendiente.
