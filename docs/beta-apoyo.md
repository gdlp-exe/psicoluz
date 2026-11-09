# Beta de apoyo al plan de trabajo

## Ficha de la beta

PsicoLuz · versión synthetic-softmax-v2 · 8 de noviembre de 2026. Estado: experimento funcional de frontend, con modelo entrenado localmente y revisión profesional obligatoria. No es un LLM ni una herramienta diagnóstica.

## 1. Propósito y alcance

Preparar hasta tres propuestas sobre las actividades y la continuidad del plan. Utiliza estados de actividades, citas recientes y habilidades etiquetadas expresamente por la profesional en notas o evaluaciones de los últimos 90 días. No interpreta el texto clínico ni evalúa las capacidades del niño. La ventana de 90 días es una decisión provisional del software, no un criterio clínico validado.

## 2. De dónde salieron los datos

Los 120 casos son sintéticos: se generaron de forma determinista mediante código propio en syntheticData.js. No se descargaron de Google, Gemini ni otro proveedor, y no provienen de pacientes. Se construyeron 20 ejemplos para cada una de seis etiquetas: organización, instrucciones, comunicación, lectura, escritura y autonomía.

## Construcción y separación

Cada caso contiene nueve números: proporción de actividades vencidas, proporción cumplida, cancelaciones recientes escaladas y seis indicadores de habilidad. La etiqueta objetivo coincide con la habilidad artificial elegida para ese caso. Se reservaron para prueba los índices divisibles entre cinco: 96 casos de entrenamiento y 24 de prueba. No comparten identificadores ni vectores.

## 3. Cómo se entrenó

Se sustituyó el selector por vecinos de la primera beta por un clasificador softmax: una regresión logística multiclase que aprende 54 pesos y seis sesgos. Se entrenó únicamente con train.jsonl mediante descenso de gradiente por lote completo y entropía cruzada con regularización L2. Los parámetros se fijaron antes de evaluar test.jsonl. Se guardaron el modelo, los hashes de los datos y el informe de evaluación.

## Qué ocurre al usarlo

El navegador carga los parámetros aprendidos; no vuelve a entrenar ni envía datos a servicios externos. Cada habilidad seleccionada se evalúa por separado, dentro del dominio artificial de una etiqueta. No se puede proponer una habilidad que la profesional no haya elegido. Las reglas transparentes de cumplimiento y continuidad complementan al clasificador; las frases provienen de un catálogo limitado y revisable.

# Evaluación, uso y límites

## 4. Qué se comprobó

El entrenamiento redujo la pérdida regularizada de 1.791759 a 0.095163. En los 24 casos sintéticos reservados se obtuvieron 24 coincidencias con las etiquetas; log-loss: 0.030755. El problema artificial es sencillo y la etiqueta está construida a partir de una habilidad explícita. Este resultado no demuestra generalización, pertinencia clínica ni beneficio para niños o familias.

## Evidencia de software

La entrega de la beta se verificó con 13 pruebas unitarias y 42 pruebas de navegador en cada uno de Edge y Chrome. Las pruebas reproducen los pesos, recalculan métricas, verifican separación del corpus y comprueban ausencia de actividades, permisos, publicación, edición, descarte, máximo tres propuestas y desactivación. Es evidencia de funcionamiento local, no resultados del piloto institucional.

## 5. Recorrido de uso

1) Seleccionar el expediente y las habilidades relacionadas con información reciente. 2) Preparar los borradores y leer el motivo de cada propuesta. 3) Aceptar con edición o descartar. Compartir un texto exige además autorización familiar explícita. Se registra una valoración útil, parcial o no útil. El ejemplo sintético interactivo no modifica ni publica nada del expediente.

## 6. Controles y trazabilidad

Aviso persistente: Herramienta de apoyo. No diagnostica ni reemplaza el criterio de la profesional. Sin actividades no se generan propuestas. Los borradores pendientes permanecen internos. La familia recibe solo el texto aceptado y autorizado. Cambios en las fuentes, actividades o versión del motor invalidan la publicación anterior hasta actualizar y revisar. El apoyo puede desactivarse por expediente. Se relaciona con RF-AP01–RF-AP7 y RNF-ET01 del ERS; métodos formales A/I/T conservan pendientes.

## 7. Limitaciones y criterio de avance

No se utilizaron datos clínicos reales ni se entrenó un LLM. La muestra no representa la diversidad del centro; las proporciones se generaron independientemente y algunas combinaciones no describen un plan real. El modelo solo selecciona etiquetas explícitas; no descubre necesidades clínicas. El filtro de palabras no garantiza seguridad de un futuro generador abierto. Antes de uso institucional faltan análisis profesional de pertinencia, pruebas del servidor, Auth/RLS, pilotaje y evaluación ética. SUS y Likert siguen pendientes; el resultado del test sintético no los reemplaza.

## Mejoras previstas

Formalizar escenarios representativos y criterios de pertinencia con la profesional; revisar motivos de edición/descarte; ampliar el corpus sintético con una especificación aprobada y mantener una evaluación separada. Las valoraciones de usuarios no reentrenan el modelo automáticamente.

## Actualización: conexión al servidor

Seguimiento autenticado e inferencia de la beta en PostgreSQL implementados el 8 de noviembre de 2026. Se conserva la demo local. Alcance, correspondencia de campos, permisos, evidencia y pendientes en [conexion-seguimiento.md](conexion-seguimiento.md). El portal externo y Storage no están habilitados.
