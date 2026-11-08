# Seguimiento — entrega frontend

## Fuentes y alcance

Se revisaron ERS, protocolo actual, diagnóstico, comunicación y arquitectura de la carpeta CMMI v3. Los 40 requerimientos originales permanecen en `verificacion-ers.json`, con aceptación y método originales. Los Word no se modificaron.

Ruta local: `/desarrollo/seguimiento`. Comparte pacientes, expedientes, notas, evaluaciones y citas con los dos módulos previos. Funciona sin login ni Supabase activo, con datos ficticios en IndexedDB. El selector de identidad es una demostración, no autenticación.

## Actividades primero

- RF16: crear/editar título, descripción, instrucciones, prioridad y fecha de seguimiento; conservación local y validación de obligatorios, fechas y valores.
- RF17: pendiente, en proceso, cumplida y vencida, sin estados inventados. La profesional registra el cambio; el vencimiento no se deduce automáticamente de la fecha.
- RF18: autorización familiar explícita, reservada por defecto. La vista previa entrega un objeto limitado: sin notas privadas, referencias a notas ni metadatos del apoyo. El portal autenticado por código todavía debe implementarse.
- RF19: nota opcional del mismo expediente; se rechazan referencias de otro expediente.
- Resumen del plan, búsqueda/filtros, navegación por teclado e historial con actor/fecha/acción. Administración y desarrollo no acceden a actividades ni al apoyo clínico. El alcance es conservador hasta formalizar permisos adicionales con el centro.
- Acceso desde el detalle del expediente al seguimiento correspondiente. El perfil se conserva entre módulos.

## Apoyo experimental, separado del trabajo principal

RF-AP01–RF-AP7 y RNF-ET01 se implementan en una pestaña secundaria. El aviso literal permanece visible: **Herramienta de apoyo. No diagnostica ni reemplaza el criterio de la profesional**.

La beta usa reglas transparentes para revisar dificultad, frecuencia, acompañamiento y continuidad. No genera sugerencias sin actividades. Respeta el ejemplo del ERS de cuatro actividades vigentes y tres vencidas. Cada borrador presenta su fundamento y origen. No produce diagnósticos, pronósticos, puntuaciones ni conclusiones sobre capacidades.

Como extensión solicitada, la profesional puede elegir notas/evaluaciones de los últimos 90 días y etiquetar habilidades de actividades. El modelo recibe cantidades, estados y esas etiquetas; no interpreta el texto clínico. La ventana de 90 días es una decisión provisional de implementación, no una regla del ERS ni un criterio clínico validado.

Se añadió un selector kNN local con 96 ejemplos artificiales de referencia y 24 casos artificiales separados para pruebas. Este es un experimento de clasificación restringido a etiquetas ya elegidas por la profesional; **no es un LLM entrenado ni un modelo validado clínicamente**. El ensayo artificial reproduce etiquetas construidas por código y no mide eficacia, generalización ni calidad terapéutica. La contribución inteligente real debe evaluarse antes de uso institucional.

ADR-04 de arquitectura escogió reglas transparentes para la beta. Se conserva esa capa para el comportamiento principal. El selector sintético es una extensión experimental, no un cambio retroactivo del documento ni una integración generativa ya completada.

## Revisión y publicación

- Máximo tres recomendaciones activas por expediente; regenerar no multiplica duplicados activos.
- Aceptar con edición o descartar, dejando historial. Confirmación profesional y autorización familiar separadas.
- La familia solo recibe el texto revisado de una recomendación aceptada y autorizada, nunca el borrador original pendiente.
- Si cambian actividades, citas relevantes o fuentes seleccionadas, la publicación deja de ser válida; hay que actualizar y revisar de nuevo. Se conserva el contexto anterior archivado.
- Desactivación por expediente: impide generar y retira sus textos familiares del apoyo.
- Valoración útil/parcial/no útil después de la revisión; no equivale a una escala clínica ni a resultados reales del pilotaje.

La guardia de texto complementa plantillas limitadas y revisión humana. Un filtro de palabras no garantiza la seguridad de un futuro LLM abierto. No se envían datos a proveedores externos ni se usan expedientes para entrenar. La descarga sintética se genera desde un corpus fijo, independiente del contexto abierto.

## Comprobación y límites

Las pruebas reproducibles están en `tests/seguimiento.spec.js`, `tests/accesibilidad-seguimiento.spec.js` y `tests-unit/support-engine.test.mjs`. Los resultados efectivamente ejecutados se registran en `resultados-verificacion.md`. Se verifican flujos positivos, negativos, persistencia local, privacidad de la proyección, roles, límites y revisión.

Antes del cierre integral faltan Auth, RLS, restricciones y bitácora protegida en servidor, portal familiar real, concurrencia entre usuarios/pestañas y pruebas de integración. La cola local solo serializa mutaciones de una instancia; no promete transacciones multiusuario. Los perfiles ficticios y el almacenamiento del navegador no protegen datos clínicos reales.

En pilotaje se aplicarán SUS (usabilidad percibida global; RNF04 profesional >=70/100), Likert complementario, observación y entrevistas. Se formalizarán los criterios WCAG aplicables a RF23–RF26/RNF05 antes de evaluar el portal. El escaneo automático de pantallas internas no acredita conformidad completa. RNF01 y métricas operacionales se medirán en las condiciones del piloto, comparando línea base sin atribuir causalidad. No se han aplicado instrumentos ni obtenido resultados con participantes.

Siguiente alcance previsto: portal familiar RF20–RF26 y conexión segura a Supabase. No están incluidos como terminados en esta entrega.

## Plan de validación del módulo

Cadena: necesidad de continuidad familiar → RF16–RF19 → actividad completa, estado conservado y contenido autorizado → frontend actual → pruebas funcionales e inspección → evidencia anterior. RF-AP01–RF-AP7 añaden control profesional del apoyo, sin introducir instrumentos clínicos en el diagnóstico inicial.

En el piloto, las tareas serán asignar una actividad, modificarla, registrar cumplimiento, autorizar contenido, comprobar la vista familiar, revisar/editar/descartar un borrador y desactivar el apoyo. Registrar finalización, errores, solicitudes de ayuda y observaciones con un guion definido. No usar datos clínicos reales en las pruebas de desarrollo.

Después del recorrido, aplicar la versión SUS adoptada por el protocolo a la experiencia global profesional y calcular su puntuación con el método del instrumento. Complementar con ítems Likert sobre claridad de estados, comprensión de instrucciones, navegación, eficiencia percibida y control de publicación; acordar redacción, anclajes, participantes y análisis antes de aplicarlos. No sustituir SUS por esos ítems ni atribuirle subescalas independientes.

Para el apoyo, la profesional revisará casos previamente definidos: sin actividades; cuatro vigentes/tres vencidas; información insuficiente; evaluación reciente etiquetada; sugerencia irrelevante; cambio de contexto y desactivación. Registrar pertinencia, motivo de edición/descarte y detección de contenido improcedente. Las valoraciones útil/parcial/no útil capturadas por software no reemplazan este análisis profesional.

La evaluación de accesibilidad formalizará criterios concretos para controles, formularios, estados, foco y contenido autorizado del portal, trazados a RNF05 y RF23–RF26. Comparar después el reporte familiar con la línea base del 35 %, manteniendo denominador y período. No presentar las actividades cumplidas de esta demo como mejora del centro ni como impacto causal.
