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

Se entrenó una regresión logística multiclase (softmax) local con los **96 casos sintéticos originales de entrenamiento**, y se evaluó después con los **24 casos originales reservados**. Se aprendieron pesos y sesgos mediante descenso de gradiente; se guardan en `src/features/seguimiento/model/model.json`. El navegador usa esos parámetros, no vuelve a entrenar ni compara ejemplos por vecinos. `npm run train:support` reproduce el entrenamiento desde los JSONL, sin servicios externos.

El conjunto artificial contiene una habilidad explícita por caso y su etiqueta objetivo. Es un problema sencillo: acertar sus 24 etiquetas no mide generalización, calidad de recomendaciones, mejoría ni utilidad clínica. No es un LLM ni un modelo validado clínicamente. Para varias etiquetas profesionales, cada una se evalúa por separado en el dominio de una etiqueta y se ordenan las salidas admitidas; nunca se añade una habilidad no elegida por la profesional. Las cantidades del plan no son puntuaciones del niño.

La pestaña beta ahora presenta tres pasos: elegir información, preparar borradores y revisar. Muestra etiquetas seleccionadas, pendientes/revisadas, controles de autorización y acceso a la vista familiar. Un ejemplo interactivo permite cambiar cantidades y habilidad sin leer ni modificar el expediente; sus resultados no se guardan ni publican.

ADR-04 de arquitectura escogió reglas transparentes para la beta. Se conserva esa capa para el comportamiento principal. El selector sintético es una extensión experimental, no un cambio retroactivo del documento ni una integración generativa ya completada.

## Revisión y publicación

- Máximo tres recomendaciones activas por expediente; regenerar no multiplica duplicados activos.
- Aceptar con edición o descartar, dejando historial. Confirmación profesional y autorización familiar separadas.
- La familia solo recibe el texto revisado de una recomendación aceptada y autorizada, nunca el borrador original pendiente.
- Si cambia la versión del modelo o las reglas, o cambian actividades, citas relevantes o fuentes seleccionadas, la publicación deja de ser válida; hay que actualizar y revisar de nuevo. Se conserva el contexto anterior archivado.
- Desactivación por expediente: impide generar y retira sus textos familiares del apoyo.
- Valoración útil/parcial/no útil después de la revisión; no equivale a una escala clínica ni a resultados reales del pilotaje.

La guardia de texto complementa plantillas limitadas y revisión humana. Un filtro de palabras no garantiza la seguridad de un futuro LLM abierto. No se envían datos a proveedores externos ni se usan expedientes para entrenar. La descarga sintética se genera desde un corpus fijo, independiente del contexto abierto.

## Comprobación y límites

Las pruebas reproducibles están en `tests/seguimiento.spec.js`, `tests/accesibilidad-seguimiento.spec.js` y `tests-unit/support-engine.test.mjs`, `tests-unit/trained-model.test.mjs` y `tests/apoyo-entrenado.spec.js`. Los resultados efectivamente ejecutados se registran en `resultados-verificacion.md`. Se verifican flujos positivos, negativos, persistencia local, privacidad de la proyección, roles, límites y revisión.

Antes del cierre integral faltan Auth, RLS, restricciones y bitácora protegida en servidor, portal familiar real, concurrencia entre usuarios/pestañas y pruebas de integración. La cola local solo serializa mutaciones de una instancia; no promete transacciones multiusuario. Los perfiles ficticios y el almacenamiento del navegador no protegen datos clínicos reales.

En pilotaje se aplicarán SUS (usabilidad percibida global; RNF04 profesional >=70/100), Likert complementario, observación y entrevistas. Se formalizarán los criterios WCAG aplicables a RF23–RF26/RNF05 antes de evaluar el portal. El escaneo automático de pantallas internas no acredita conformidad completa. RNF01 y métricas operacionales se medirán en las condiciones del piloto, comparando línea base sin atribuir causalidad. No se han aplicado instrumentos ni obtenido resultados con participantes.

Siguiente alcance previsto: portal familiar RF20–RF26 y conexión segura a Supabase. No están incluidos como terminados en esta entrega.

## Plan de validación del módulo

Cadena: necesidad de continuidad familiar → RF16–RF19 → actividad completa, estado conservado y contenido autorizado → frontend actual → pruebas funcionales e inspección → evidencia anterior. RF-AP01–RF-AP7 añaden control profesional del apoyo, sin introducir instrumentos clínicos en el diagnóstico inicial.

En el piloto, las tareas serán asignar una actividad, modificarla, registrar cumplimiento, autorizar contenido, comprobar la vista familiar, revisar/editar/descartar un borrador y desactivar el apoyo. Registrar finalización, errores, solicitudes de ayuda y observaciones con un guion definido. No usar datos clínicos reales en las pruebas de desarrollo.

Después del recorrido, aplicar la versión SUS adoptada por el protocolo a la experiencia global profesional y calcular su puntuación con el método del instrumento. Complementar con ítems Likert sobre claridad de estados, comprensión de instrucciones, navegación, eficiencia percibida y control de publicación; acordar redacción, anclajes, participantes y análisis antes de aplicarlos. No sustituir SUS por esos ítems ni atribuirle subescalas independientes.

Para el apoyo, la profesional revisará casos previamente definidos: sin actividades; cuatro vigentes/tres vencidas; información insuficiente; evaluación reciente etiquetada; sugerencia irrelevante; cambio de contexto y desactivación. Registrar pertinencia, motivo de edición/descarte y detección de contenido improcedente. Las valoraciones útil/parcial/no útil capturadas por software no reemplazan este análisis profesional.

La evaluación de accesibilidad formalizará criterios concretos para controles, formularios, estados, foco y contenido autorizado del portal, trazados a RNF05 y RF23–RF26. Comparar después el reporte familiar con la línea base del 35 %, manteniendo denominador y período. No presentar las actividades cumplidas de esta demo como mejora del centro ni como impacto causal.

## Entrenamiento y evaluación reproducibles — 8 de noviembre de 2026

- Arquitectura del modelo: nueve entradas, seis clases, 54 pesos y seis sesgos; softmax estable y entropía cruzada con regularización L2.
- Parámetros fijados antes de evaluar test: 1200 épocas, tasa 0.3, L2 0.001; inicialización cero y entrenamiento determinista por lote completo.
- División original inalterada: 96 train / 24 test; sin IDs ni vectores compartidos. No se ajustaron hiperparámetros mirando el test.
- Pérdida regularizada de entrenamiento: 1.7917594692 → 0.0951625078. Test: 24/24 etiquetas artificiales, log-loss 0.0307554949; referencia de clase mayoritaria: 1/6.
- Registro completo de curva de pérdida, matriz de confusión y hashes SHA256 de ambos archivos en `data/synthetic/training-report.json`. Los tests recalculan métricas y reproducen exactamente el artefacto aprendido.
- No es una evaluación clínica independiente: etiquetas y casos proceden del mismo generador artificial. Falta evaluación profesional de pertinencia y pruebas con escenarios de uso representativos antes de uso institucional.

El procedimiento matemático sigue el [clasificador softmax explicado por Stanford CS231n](https://cs231n.github.io/linear-classify/), adaptado aquí a características estructuradas de actividades. No se importaron datos de imágenes ni modelos del curso.

## Actualización: conexión al servidor

Seguimiento autenticado e inferencia de la beta en PostgreSQL implementados el 8 de noviembre de 2026. Se conserva la demo local. Alcance, correspondencia de campos, permisos, evidencia y pendientes en [conexion-seguimiento.md](conexion-seguimiento.md). El portal externo y Storage no están habilitados.
