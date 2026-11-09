# Archivos privados y portal familiar

## Conexión implementada

Se revisaron los 40 requerimientos, sus métodos y aceptación, junto con protocolo, arquitectura, diagnóstico y comunicación. RF11 y RF20–RF26 se conectan a los datos existentes; RF04/RF9/RF18/RF21 delimitan la proyección familiar. Las notas privadas, evaluaciones, motivos de consulta, responsables y borradores de apoyo nunca forman parte de esa proyección. La próxima cita muestra solo fecha y hora.

En Seguimiento, la sección **Archivos y portal** está reservada a la profesional activa de los expedientes asignados. Administración y Desarrollo no acceden. El servidor deriva el alcance de Auth; no acepta un rol o responsable enviado por la pantalla.

## Archivos

La carga reserva una ruta aleatoria por expediente, sube el contenido al bucket privado psicoluz-private y exige validación en la función de servidor psicoluz-files antes de quedar disponible. Se admiten PDF, PNG, JPG y DOCX hasta 10 MB. El servidor comprueba tamaño, firma básica y, en DOCX, entradas del directorio ZIP y rechazo de macros/ActiveX/rutas inseguras. Esta comprobación no equivale a un antivirus ni a validar el contenido clínico del documento.

La carga es interna por defecto. Compartir exige confirmación expresa y registra autor/fecha. Quitar la autorización conserva el archivo interno; retirarlo lo deja inaccesible por la aplicación sin borrar el objeto ni la bitácora. No hay sobrescritura. Las modificaciones comparan la versión original del registro.

Storage permite únicamente INSERT de la reserva propia pendiente durante una hora. No se crean políticas de lectura, firma de enlaces, actualización o borrado para el navegador. La descarga pasa por la función, que comprueba la sesión/rol antes y después de obtener los bytes y responde como adjunto, sin caché. No se generan URLs públicas ni firmadas. Los bytes ya descargados no pueden retirarse del dispositivo del destinatario.

La función utiliza las variables de servidor proporcionadas por Supabase; ninguna clave privilegiada se copia al navegador, archivos locales de configuración ni GitHub. La comprobación de JWT de personal se realiza mediante PostgREST; para familias se valida la sesión opaca en PostgreSQL. Por ello la función nueva usa verify_jwt=false en el gateway y aplica esas comprobaciones en su propio manejador. No se cambia la autenticación de otros servicios. Referencias: [despliegue de funciones](https://supabase.com/docs/guides/functions/quickstart-dashboard), [variables del servidor](https://supabase.com/docs/guides/functions/secrets).

## Códigos y sesiones

La profesional genera un código aleatorio de 122 bits de entropía, con vigencia seleccionable de 1, 7 o 30 días (7 por defecto). El código se muestra una vez y se entrega por un canal privado. Se almacena su SHA-256, nunca el valor legible. Emitir otro revoca los anteriores y sus sesiones del expediente. Revocar exige confirmación.

La familia entra en /expediente sin crear cuenta. El servidor emite un token de sesión aleatorio de dos UUID y almacena solo su hash; dura como máximo ocho horas y nunca supera el vencimiento del código. El token vive en memoria del navegador, sin URL, localStorage ni sessionStorage. Las preferencias de accesibilidad sí se conservan durante la sesión, sin datos clínicos.

La consulta y cada descarga verifican código, sesión, profesional activa, expediente no archivado y autorización actual del contenido. La pantalla se actualiza al recuperar foco, manualmente y cada 30 segundos. La salida revoca la sesión. Las respuestas de rechazo son genéricas. Los reportes familiares admiten únicamente actividades autorizadas y no modifican el estado registrado por la profesional.

Los límites persisten en PostgreSQL: entrada global 300/5 min y por candidato a código 12/5 min; consultas por sesión 120/5 min; comentarios 10/sesión y 20/expediente por 5 min. Son controles provisionales de la implementación, no valores prescritos por el ERS. El límite global puede afectar temporalmente a otras familias durante un volumen elevado de intentos; no se declara protección distribuida contra todo ataque. Los contadores no conservan códigos/tokens legibles ni direcciones IP y se depuran después de 48 horas.

## Base de datos y evidencia

Se añade una tabla de contadores portal_rate_limits: el esquema del proyecto pasa de 15 a 16 tablas. El bucket y las tablas internas de Storage no se incluyen en ese conteo. Se aprovechan attachments, portal_codes, portal_sessions y family_reports ya existentes.

Pruebas reproducibles: scripts/test-db-portal-files.mjs, tests-unit/files-gateway.test.mjs y tests/portal-files-real.spec.js. Las pruebas de navegador nuevas ejecutan las seis migraciones SQL en PGlite y el manejador real de descarga con HTTP/Storage/Auth controlados. No representan una prueba real de Supabase Storage o Auth remoto. Estado de activación y resultados finales en resultados-verificacion.md.

## Validación pendiente

La titular autorizó la activación y la configuración propia de autenticación de la función. Se observaron metadatos correctos y denegación remota sin insertar datos clínicos ficticios en producción. El recorrido positivo real con un archivo y código autorizados debe comprobarse con la profesional. No se acreditan antivirus, concurrencia distribuida, SUS, Likert, WCAG integral, voz real ni resultados operacionales del piloto por estas pruebas.
