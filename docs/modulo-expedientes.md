# Expedientes: primera implementación del frontend

## Abrir

Con `npm run dev`, visitar `/desarrollo/expedientes`. La landing pública sigue en `/`.
Esta ruta es una vista de desarrollo independiente: usa identidades y pacientes ficticios,
sin iniciar sesión ni consultar tablas de Supabase. No usar datos reales en ella.

El selector «Perfil de prueba» permite revisar psicóloga responsable, otra profesional,
administración y desarrollo. Cambiarlo no autentica usuarios. Las restricciones de esta
vista son comprobaciones del frontend y deben repetirse en servicios y políticas RLS.

## Documentos consultados

Se extrajo el contenido de los cinco entregables/protocolo indicados y de la otra copia
de protocolo presente en `Desktop/CMMI v3`: `fase1_InformeDiagnostico.docx`,
`fase2_PlanDeComunicación.docx`, `ERS_Psicoluz_iso.docx`, `arquitecturaPsicoluz.docx`,
`propuestaProtocolo.docx` y `protocoloPsicoluz.docx`.
El ERS define las capacidades implementadas y la arquitectura establece las relaciones.
Los documentos Word no se modificaron.

## Correspondencia de esta entrega

- RF06: creación y número único en el almacenamiento local; paciente y profesional obligatorios.
- RF07: nombres y apellidos; nacimiento y contacto opcionales. El conjunto mínimo definitivo
  de identificación deberá ser confirmado por el centro antes de producción.
- RF08: motivo y estados activo, en espera, suspendido, alta y archivado.
- RF9: notas con niveles `solo_psicologo`, `equipo_clinico`, `paciente_tutor`.
  Reservadas por defecto; confirmación explícita antes de autorizar contenido familiar.
- RF10: evaluaciones internas con tipo, fecha y resumen. La lista de tipos es una
  propuesta de interfaz configurable, no un catálogo obligatorio definido por el ERS.
- RF11: adjuntar y descargar PDF, JPG, PNG y DOCX; visibilidad interna por defecto.
  El límite de 10 MB y estos formatos son decisiones provisionales de frontend.
- RF12: buscar por nombre y número dentro del universo del perfil de prueba.
- RF02/RF03: representaciones de permisos por rol/responsable; desarrollo sin datos clínicos.
  Administración no puede leer notas «solo psicóloga» ni modificar contenido clínico.
- RF05: historial local de consultas y modificaciones. No es una bitácora protegida de servidor.

No se afirma cumplimiento completo de RF04, RF9 o RF11 sobre el portal familiar:
su consumo autorizado aún debe implementarse y verificarse en backend/portal.
No se realizaron SUS, Likert o evaluación WCAG sobre el producto terminado.

## Organización técnica

- `src/features/expedientes/ExpedientesWorkspace.jsx`: pantalla, formularios y navegación del módulo.
- `src/features/expedientes/expedientes.css`: estilos aislados con la paleta de la landing.
- `src/features/expedientes/repository.js`: adaptador asíncrono con datos ficticios en IndexedDB.
- `src/App.jsx`: entrada independiente de desarrollo antes de montar el prototipo existente.

La relación es Paciente 1–N Expediente; cada expediente pertenece a una profesional.
Notas, evaluaciones, archivos e historial conservan `recordId`. Los archivos se guardan
como objetos File/Blob, sin convertirlos en rutas públicas. Todas las mutaciones del
adaptador se serializan dentro de esta instancia de la aplicación.

## Conexión posterior a Supabase

Reemplazar el adaptador manteniendo las firmas `list`, `patients`, `open`, `create`,
`update`, `saveNote`, `addEvaluation`, `addFile`, `setFileVisibility` y `file`.
El servidor obtendrá la identidad desde Supabase Auth; no confiará en el objeto
`identity` enviado por el navegador. La numeración única será transaccional en PostgreSQL.
RLS restringirá la pertenencia por profesional y la visibilidad por dato; desarrollo
no tendrá permisos clínicos por defecto. La bitácora se registrará en servidor, sin
posibilidad de modificación por clientes. Storage usará un bucket privado y descargas
autorizadas. No exponer claves `service_role` en el frontend.

Antes de habilitar producción: confirmar permisos de coordinación/administración con
el centro, finalizar el modelo de datos, generar migraciones y políticas SQL, conectar
Auth y probar escenarios negativos entre profesionales y entre expedientes del portal.
El prototipo anterior no ha sido conectado automáticamente a este almacenamiento.

## Revisión y pruebas

Consultar `verificacion-ers.md`, `verificacion-ers.json` y `resultados-verificacion.md` para
la revisión de los 40 requerimientos y la evidencia real. Ejecutar `npm run verify` antes
de cerrar un módulo; las instrucciones de navegador están en el informe de resultados.
