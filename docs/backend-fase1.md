# Backend — primera base privada

Fecha: 8 de noviembre de 2026. Proyecto nuevo: **psicoluz.ni**, referencia
`krrurcjowhgrkenkgtpf`, región del panel **us-east-1**. No se modificó el proyecto anterior.

## Qué se aplicó

`supabase/migrations/20261108000100_private_foundation.sql` crea el esquema privado
`psicoluz` y 15 tablas: perfiles del personal, pacientes, expedientes, notas, evaluaciones,
citas, actividades, archivos, enlaces, fuentes del apoyo, recomendaciones, códigos,
sesiones del portal, reportes familiares y bitácora.

Todas tienen RLS habilitado. No se expone el esquema al navegador y todavía no hay
políticas que autoricen operaciones: **esta entrega es una base cerrada, no un backend
operativo ni una conexión del frontend**. Los perfiles se relacionan con `auth.users`;
las contraseñas las gestiona Supabase Auth, no una tabla propia.

Restricciones implementadas: numeración única con secuencia; estados del ERS; responsable
profesional activo al asignar expediente; pertenencia de paciente/profesional en citas;
nota y actividad del mismo expediente; autorización familiar registrada; campos y tamaños;
cruces de agenda mediante exclusión GiST; máximo tres recomendaciones activas con bloqueo
del expediente; aceptación con texto revisado antes de publicar; archivo/retiro de propuestas
al cambiar fuentes/actividades/citas o desactivar el apoyo. La bitácora registra metadatos de
escritura sin copiar contenido clínico y rechaza UPDATE, DELETE y TRUNCATE normales.

Los cambios de contexto archivan las propuestas en SQL; el adaptador real tendrá que
mostrar esa transición y generar/revisar propuestas nuevas. La implementación anterior
con datos locales queda intacta. Las operaciones privilegiadas del propietario de la base
siguen siendo administrativas: RLS no limita al propietario de las tablas.

## Evidencia

- Migración ejecutada desde el editor SQL del proyecto nuevo: resultado de éxito.
- Consulta `supabase/checks/verify_foundation.sql`: **15 tablas**, **15 con RLS**, privilegio
  de uso del esquema para `anon=false`, para `authenticated=false`, **0 políticas abiertas**.
- `npm run test:db`: 18 comprobaciones locales y un caso contenedor; Node informa **19
  pruebas aprobadas**. Motor PostgreSQL embebido PGlite 0.5.15; `auth.users`, `auth.uid()` y
  roles son dobles mínimos del entorno Supabase. No equivale a probar el servicio Auth real.
- Se ensayan restricciones positivas/negativas, RLS denegando aun con SELECT accidental,
  numeración superior a 9999, cruces parciales/exactos, contigüidad, cancelación, texto revisado
  nulo, máximo tres, retiro por contexto, desactivación y asociaciones cruzadas de sesión.
- La verificación en Supabase observa metadatos, no introduce pacientes ni cuentas ficticias.
  No se probaron aún concurrencia entre conexiones, JWT reales, Storage o el portal remoto.

## Correspondencia con el frontend

El frontend usa nombres `camelCase`; el adaptador real convertirá a `snake_case`:
`recordId → record_id`, `professionalId → professional_id`, `followUpDate → follow_up_date`,
`visiblePortal → visible_portal`, `reviewedText → reviewed_text`. Se conservan los mismos
estados y reglas de negocio; no se reutilizan los nombres del prototipo antiguo.

Archivos: esta migración crea únicamente metadatos. Falta bucket privado, políticas y
descargas autorizadas. Códigos/sesiones: se prepararon hashes y vínculos al expediente;
faltan generación segura, verificación, revocación/caducidad y límites de intentos en el
servicio. No existe un endpoint público para consultar esos hashes.

## Orden de conexión

1. Supabase Auth para personal con cuentas individuales; asignación de roles solo desde
   una operación administrativa confiable. No usar metadatos editables del usuario como rol.
2. API y autorización de Expedientes, con proyección administrativa limitada y acceso clínico
   solo de la profesional responsable. Registrar consultas además de escrituras.
3. Agenda y actividades, con pruebas de concurrencia reales y denegación entre cuentas.
4. Storage privado y portal por código, con DTO autorizado, sesión y descargas privadas.
5. Apoyo supervisado, retiro por contexto/versión y verificaciones completas de aceptación.
6. Pruebas en el entorno real, configuración de producción y pilotaje. SUS/Likert/WCAG y
   mediciones operacionales siguen pendientes; ninguna restricción SQL acredita esas escalas.

## Gestión de la migración

La primera aplicación fue manual desde el editor SQL, usando este archivo versionado.
Antes de usar `supabase db push`, vincular el CLI a **esta referencia** y registrar esta
versión ya aplicada con `supabase migration repair --status applied 20261108000100`.
Revisar el enlace y el historial antes de ejecutar comandos remotos. No volver a ejecutar
la creación inicial sobre el mismo esquema ni usar reset remoto para conectar el sistema.

Fuentes técnicas: [RLS en Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security),
[migraciones](https://supabase.com/docs/guides/deployment/database-migrations) y
[exclusión de rangos en PostgreSQL](https://www.postgresql.org/docs/15/rangetypes.html).
Requerimientos: ERS completo, protocolo, arquitectura, diagnóstico y comunicación revisados.
Los Word originales permanecen sin cambios.
