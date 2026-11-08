# Autenticación del personal — 8 de noviembre de 2026

## Alcance implementado

Acceso individual con Supabase Auth, restauración de sesión en la pestaña, cierre local y recuperación de contraseña. El proyecto configurado es `krrurcjowhgrkenkgtpf`. Las rutas privadas antiguas pasan por la misma verificación; el registro público está cerrado también en Supabase. Las cuentas se crean administrativamente.

El servidor verifica la identidad mediante `auth.getUser()` y la función `public.psicoluz_current_staff_profile()`. No se confía en roles enviados por el navegador ni en `user_metadata`. Una cuenta Auth sin perfil activo no obtiene acceso. Un fallo de verificación retira la vista protegida.

## Correspondencia exacta con la base

- `auth.users.id` → `psicoluz.staff_profiles.id`: misma cuenta individual.
- `staff_profiles.display_name` → `identity.displayName`: única conversión de nombre para la interfaz.
- `staff_profiles.role` → `identity.role`: exactamente `psicologa`, `administracion` o `desarrollo`, un rol por cuenta.
- `staff_profiles.active` → `identity.active`: debe ser `true`.
- Correo: procede del usuario verificado por Auth; no se duplica en la tabla de perfiles.

La respuesta SQL admite únicamente `id`, `display_name`, `role` y `active`. El cliente rechaza columnas antiguas como `perfil.rol`, roles desconocidos, identificadores ajenos y campos adicionales. Las contraseñas las administra Supabase Auth; no se almacenan en tablas de la aplicación.

## Protección y sesión

La función no recibe identificadores: usa `auth.uid()`, consulta solo el propio perfil activo y registra su lectura en bitácora. Tiene búsqueda de esquema fija, ejecución revocada a PUBLIC/anon y concedida únicamente a authenticated. No otorga acceso directo al esquema privado ni a tablas clínicas. Las 15 tablas conservan RLS. Administración no obtiene acceso a notas reservadas por habilitar este perfil.

La sesión se guarda en `sessionStorage`, separada del selector de datos ficticios. El cierre solicita invalidar la renovación de la sesión actual. Un JWT ya emitido puede conservar validez hasta su vencimiento; cerrar la interfaz no sustituye la autorización por operación en servidor.

## Configuración aplicada en Supabase

- Migración `20261108000200_staff_auth.sql` ejecutada con éxito observado en SQL Editor.
- Primer perfil activo con rol `administracion`, autorizado por la titular. Sus datos personales no se guardan en este repositorio.
- Consulta remota: ejecución de la función para authenticated=true, anon=false; acceso de authenticated al esquema privado=false.
- Registro público y sesiones anónimas deshabilitados; confirmación de correo habilitada.
- Retorno permitido de recuperación: `http://127.0.0.1:5180/actualizar-clave`, sin comodines.

El dominio de producción y SMTP deben configurarse antes de validar recuperación institucional. No se envió un correo real de recuperación ni se acredita entrega de correo. La contraseña inicial la ingresó la usuaria directamente en Supabase. La titular comprobó el inicio real con su propia contraseña. Se observó el rol Administración y su restauración después de recargar el preview; las pruebas automatizadas usan identidades ficticias y respuestas controladas.

## Verificación y límites

Se revisaron los 40 requerimientos del ERS y los entregables fuente. Nueve escenarios de navegador comprueban login, roles del servidor, restauración, cierre, credenciales inválidas, perfil ausente/inactivo, rutas privadas, recuperación, confirmación de contraseña y accesibilidad automática. Siete casos SQL de autorización y su contenedor verifican el contrato contra las migraciones reales en PGlite; no sustituyen pruebas de infraestructura remota.

RF01 y RF02 avanzan en autenticación y configuración de roles; la matriz operativa de permisos clínicos sigue pendiente de conexión. RF03 y RF05 requieren repetir sus escenarios completos con los módulos reales. Las demostraciones de Expedientes, Agenda, Seguimiento y Portal continúan usando datos ficticios. No se presentan SUS, Likert, conformidad WCAG completa, resultados clínicos ni resultados de pilotaje como alcanzados.

Referencias técnicas: [login](https://supabase.com/docs/reference/javascript/auth-signinwithpassword), [recuperación](https://supabase.com/docs/guides/auth/passwords), [funciones y permisos](https://supabase.com/docs/guides/database/functions), [sesiones](https://supabase.com/docs/guides/auth/sessions).

## Vercel

Dominio comunicado por la titular: `https://psicoluz.vercel.app`. El error de la publicación anterior en `LegacyApp` indica que ese build exige variables que no tiene. El router actual carga la landing independientemente del cliente Auth y presenta un error visible de configuración en el login.

En Settings → Environment Variables configurar `VITE_SUPABASE_URL` con la URL del proyecto nuevo y `VITE_SUPABASE_PUBLISHABLE_KEY` con su clave pública publishable. Vite incorpora estos valores durante la compilación: actualizar variables requiere un despliegue nuevo. No usar service_role ni claves secretas en variables VITE. El código admite `VITE_SUPABASE_ANON_KEY` como alternativa, siempre que corresponda al proyecto nuevo.

`vercel.json` ya contiene la reescritura de rutas a `/`; `/login`, `/personal` y `/actualizar-clave` no requieren páginas HTML separadas. Cada dominio mantiene su propia sesión: haber ingresado en localhost no inicia sesión en Vercel. El retorno de recuperación de producción debe añadirse explícitamente a Supabase; no se permiten dominios arbitrarios ni comodines. La conexión de los módulos clínicos y la validación institucional continúan pendientes.

### Comprobación de producción

Se guardaron ambas variables públicas en el entorno Production de Vercel y se redesplegó `4cd9df4b67bcab53d21d54e839a75a15645d6289` sin reutilizar caché de build. Despliegue `HmxxomAxtxYK6qvKGeNjviiGNhzz`: Ready, dominio `https://psicoluz.vercel.app`. Landing y formulario de acceso observados sin el error anterior. La titular confirmó que pudo ingresar desde la versión publicada; no se leyó ni se reutilizó su contraseña. En el navegador del agente solo se observó el formulario público; la confirmación de ingreso publicado proviene de la titular.

Supabase Site URL quedó en `https://psicoluz.vercel.app`; retornos exactos permitidos: `https://psicoluz.vercel.app/actualizar-clave` y `http://127.0.0.1:5180/actualizar-clave`. No se enviaron mensajes reales de recuperación ni se verificó SMTP institucional. Los despliegues Preview de Vercel no tienen todavía variables propias; esta configuración corresponde a Production. La conexión clínica sigue pendiente.
