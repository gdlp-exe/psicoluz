# Seguimiento conectado — 8 de noviembre de 2026

## Alcance y permisos

Ruta autenticada: `/personal/seguimiento`. La profesional activa consulta y modifica únicamente sus expedientes asignados. Administración, Desarrollo, cuentas inactivas y acceso anónimo se rechazan en el servidor. La interfaz no permite seleccionar una identidad ficticia. La demo `/desarrollo/seguimiento` permanece independiente con datos sintéticos.

Incluye actividades con cuatro estados, prioridad, fecha, instrucciones, nota opcional del mismo expediente y autorización familiar explícita; notas de sesión, evaluaciones, enlaces HTTPS, historial y lectura de reportes existentes. No hay acción de borrado. Los archivos esperan Storage privado y el acceso externo familiar todavía no está habilitado. La clasificación de notas conserva los tres niveles del ERS; no habilita acceso compartido de otras profesionales ni acceso externo en esta etapa.

## Correspondencia y persistencia

La migración `20261108000500_seguimiento.sql` mantiene las 15 tablas de la base y añade la huella del contexto. `public.psicoluz_seguimiento(text,jsonb)` es la única entrada nueva para el navegador. Es SECURITY DEFINER con search_path fijo y comprobación propia de rol, cuenta activa y expediente. El esquema privado y las funciones auxiliares no tienen permisos directos para anon/authenticated.

Los nombres de base siguen en snake_case; la proyección SQL entrega explícitamente los nombres camelCase que exige el frontend. Por ejemplo: `record_id → recordId`, `follow_up_date → followUpDate`, `visible_portal → visiblePortal`, `updated_at → updatedAt`. El adaptador valida el contrato y transforma los campos de escritura de forma explícita. No almacena contenido clínico en IndexedDB ni localStorage; solo mantiene versiones en memoria. Auth conserva el comportamiento de sesión ya documentado.

Las escrituras bloquean el expediente y comparan revisión; la edición compara además la versión original de la fila. Un formulario desactualizado se rechaza. Los registros de auditoría conservan actor, operación y fecha sin copiar el texto clínico al evento. La bitácora no puede borrarse desde la aplicación.

## Beta supervisada en el servidor

Se reutiliza el clasificador de regresión logística multinomial `synthetic-softmax-v2`: 120 casos propios deterministas, 96 de entrenamiento y 24 reservados para prueba. No se volvió a entrenar un modelo ni se utilizó un LLM o un proveedor externo. La procedencia y las limitaciones siguen descritas en [beta-apoyo.md](beta-apoyo.md).

PostgreSQL ejecuta los pesos softmax y las reglas de organización/continuidad. El navegador envía solo expediente y revisión para generar; el servidor obtiene estados de actividades, cancelaciones recientes y etiquetas seleccionadas por la profesional. No interpreta ni envía textos de notas/evaluaciones al clasificador. Se admiten fuentes seleccionadas de los últimos 90 días según fecha de Nicaragua; esta ventana es una decisión provisional del software, no un criterio clínico validado.

La generación produce como máximo tres borradores internos. Aceptar o editar exige revisión expresa; compartir exige otra autorización. Se puede descartar y valorar la utilidad. No diagnostica, pronostica ni sustituye el criterio profesional. La huella incluye contexto, versiones de fuentes y artefacto del motor: cambios de datos, antigüedad natural de las fuentes, desactivación o cambios del modelo retiran textos autorizados. Reactivar no los publica automáticamente.

## Verificación y pendientes

69 comprobaciones SQL y 29 de lógica aprobadas; 83 escenarios en Edge y 83 en Chrome. Cinco recorridos nuevos usan el SQL de las cinco migraciones en PGlite desde la interfaz, con Auth mínimo simulado. Se verifica también paridad de 21 contextos entre la inferencia SQL y el motor JavaScript. Incluyen negativos por rol/expediente, contrato, versiones, autorizaciones, retirada, enlaces, teclado, 360 px y revisión automática axe del formulario clínico.

En Supabase se observó ejecución exitosa y metadatos: EXECUTE authenticated=true, anon=false, USAGE del esquema privado=false. Una consulta sintética sin pacientes produjo las reglas `plan` y `skill-lectura`. No se insertaron pacientes ni notas de prueba en producción. Escritura clínica remota, concurrencia entre conexiones reales, Storage, portal externo, demostración institucional y validación de la beta con profesionales siguen pendientes.

SUS medirá usabilidad percibida global durante el piloto (RNF04: meta profesional ≥70); Likert la complementará. Los criterios WCAG aplicables a RF23–RF26/RNF05 deben formalizarse antes del piloto. Las pruebas automáticas no certifican esos instrumentos ni cumplimiento integral del ERS. Las métricas posteriores se compararán con la línea base, sin afirmar impacto causal.
