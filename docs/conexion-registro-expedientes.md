# Conexión de pacientes y apertura de expedientes

Estado: permisos confirmados por la titular y migración `supabase/migrations/20261108000300_records_registry.sql` aplicada en Supabase con éxito observado. Listado vacío y responsable real verificados desde la sesión local autenticada. Publicación de la pantalla en Vercel en curso al registrar esta evidencia.

## Alcance de esta etapa

RF06: abrir un expediente, crear o reutilizar un paciente autorizado y asociar una psicóloga activa. Número emitido por la secuencia SQL y guardado transaccional: un fallo del expediente revierte también al paciente nuevo. RF07: nombres/apellidos obligatorios; nacimiento y contacto opcionales, conforme al mínimo de la interfaz y sujeto a confirmación institucional. RF08: motivo y cinco estados del ERS. RF12: búsqueda por nombre/número, filtro y paginación dentro del alcance autorizado. RF05: consultas y cambios registrados en el servidor sin copiar datos clínicos a la bitácora.

Las notas RF9, evaluaciones RF10 y archivos RF11 continúan en la demostración y requieren su propia conexión posterior. Esta entrega no cierra todo el módulo Expedientes ni los 40 requerimientos. Tampoco habilita Agenda, Seguimiento, portal familiar o apoyo automático reales.

## Permisos que se propone activar

La función pública `psicoluz_records_registry` verifica `auth.uid()` y un perfil activo en cada operación. Administración podrá consultar y gestionar identificación, motivo, estado y apertura de expedientes. La profesional podrá consultar/gestionar exclusivamente los expedientes que tenga asignados y abrir expedientes bajo su propia responsabilidad. Desarrollo, anon y cuentas sin perfil o desactivadas serán rechazados. El cliente no puede enviar un rol ni un actor para autorizarse.

Las tablas conservan RLS y no se concede acceso directo al esquema privado. La respuesta incluye solo identificación y datos básicos del expediente: no devuelve notas, evaluaciones, archivos, códigos, sesiones ni recomendaciones. No hay borrado ni cambio de roles/responsable en esta API. El procedimiento de reasignación deberá diseñarse aparte para preservar las relaciones existentes con citas.

## Correspondencia exacta de campos

- Paciente: `firstName → first_name`, `lastName → last_name`, `birthDate → birth_date`, `tutorName → tutor_name`, `tutorPhone → tutor_phone`, `tutorRelation → tutor_relation`.
- Expediente: `patientId → patient_id`, `professionalId → professional_id`, `reason → reason`, `state → state`. `number` y `created_by` se establecen en servidor.
- Edición: se conservan las versiones SQL `updated_at` de expediente y paciente, sin perder microsegundos; ambas se verifican antes de escribir. Si alguien editó, el servidor rechaza el guardado y se conserva el formulario para revisión.
- Paciente existente: la solicitud contiene su identificador; no vuelve a enviar identificación nueva ni crea otro paciente.

El contrato rechaza campos adicionales. La pantalla utiliza exclusivamente el adaptador remoto; no importa el repositorio IndexedDB de la demo ni copia pacientes ficticios a Supabase. No guarda respuestas clínicas en localStorage/IndexedDB.

## Interfaz y comprobación

Ruta prevista: `/personal/expedientes`, protegida por el mismo acceso individual. Sin profesionales activos, no se puede abrir expediente y se explica el pendiente. Cambiar de pestaña conserva un borrador mientras se vuelve a comprobar el perfil; el contenido queda oculto durante esa comprobación. Si el acceso fue retirado o falla la verificación, se retira el formulario y los datos de pantalla.

La tabla pagina de 50 en 50; la búsqueda de paciente existente devuelve hasta 20 coincidencias. Buscar un nombre más específico permite precisar. La selección es por identificador, sin unir pacientes solo por nombre.

Pruebas SQL: denegaciones por rol/sesión/otro expediente, paciente existente, numeración, atomicidad, estados/fechas/campos, conflicto entre versiones, búsqueda sin acentos, paginación y bitácora. Se ejecutan ambas migraciones aplicadas y el SQL propuesto en PostgreSQL local PGlite. El adaptador convierte la respuesta real de ese motor en la misma estructura que usa la pantalla.

Pruebas de navegador: flujos con respuestas controladas, creación/reutilización, contrato de campos, edición en conflicto, borrador al volver a la pestaña, revocación, falta de responsables/configuración, exclusión de Desarrollo, teclado, etiquetas, contraste y 360 px. Estos ensayos no acreditan concurrencia remota entre conexiones, permisos reales hasta aplicar el SQL, uso con participantes ni resultados de SUS/Likert. Los criterios WCAG del portal deben formalizarse antes del pilotaje; no se declara conformidad integral por axe.

## Procedimiento de activación

1. Confirmación de permisos para la función de registro y la primera cuenta profesional.
2. La usuaria crea la credencial directamente en Supabase; el agente no lee contraseñas. El perfil se vincula al UUID y correo exactos, sin registrar estos datos personales en GitHub.
3. Aplicar el SQL aprobado una sola vez, trasladarlo de `planned` a `migrations` y verificar permisos remotamente.
4. Verificar el listado vacío y responsables reales sin insertar pacientes ficticios en producción.
5. Guardar evidencia, publicar el código en GitHub y comprobar el despliegue Vercel. Las pruebas de escritura remota requerirán casos autorizados y un entorno/conjunto de prueba definido.

## Resultado de activación

La titular autorizó la función de registro y el primer perfil profesional. La credencial fue creada por ella directamente; se vinculó el perfil al UUID y correo exactos con una guarda que rechaza una cuenta distinta o un rol previo diferente. El perfil activo utiliza el rol canónico `psicologa` del ERS. No se guardan el correo ni el identificador personal en este documento o los tests.

En Supabase se observó éxito de migración y consulta de permisos: función ejecutable por authenticated=true y anon=false; uso del esquema privado por authenticated=false. En el preview local se verificó la llamada real con la sesión de Administración: listado 0 de 0, botón de apertura habilitado y primera profesional disponible en el selector. Se canceló el formulario sin enviar pacientes. El agente no creó pacientes ficticios ni escribió expedientes reales en producción.

Verificación final: 41 comprobaciones SQL (incluidos contenedores), 73 escenarios aprobados en Edge y 73 en Chrome; 25 pruebas de lógica; compilación y registro íntegro de 40 requerimientos correctos. La suite SQL incluye pruebas de registro contra la migración completa; sus resultados corresponden a PostgreSQL local, no a escritura remota ni concurrencia entre conexiones. Se corrigió un desbordamiento móvil producido por la etiqueta oculta de una columna y se comprobó retorno de foco al cerrar el formulario.

Pendientes: pruebas de escritura autorizadas en entorno de pruebas, acceso real con la primera cuenta profesional, concurrencia remota, reasignación de responsable, notas/evaluaciones/Storage y conexión de los otros módulos. SUS, Likert, revisión WCAG formal e indicadores operacionales se comprobarán en el pilotaje, sin inventar resultados.
