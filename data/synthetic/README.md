# Corpus experimental sintético

Todos los casos son artificiales, deterministas y generados por `syntheticData.js`. No contienen pacientes, expedientes, notas, diagnósticos ni textos clínicos; no dependen de la base de desarrollo. No se usaron APIs externas ni servicios de pago.

Reproducir los datos: `npm run data:synthetic`. Entrenar y evaluar: `npm run train:support`.

- `train.jsonl`: 96 casos usados para aprender pesos y sesgos de un clasificador softmax local.
- `test.jsonl`: 24 casos separados por identificador, reservados para evaluación posterior al entrenamiento, sin ajustar parámetros con ellos.
- `metadata.json`: versión, orden de características, procedencia y límites.
- `training-report.json`: pérdida por época, métricas recalculables, matriz de confusión y hashes del corpus.
- `../../src/features/seguimiento/model/model.json`: parámetros aprendidos que usa la beta.

Cada línea contiene `caseId`, `synthetic`, `split`, `features` y `target`. Las nueve características son proporción de vencidas, proporción cumplida, cancelaciones recientes escaladas y seis indicadores de etiquetas profesionales: organización, instrucciones, comunicación, lectura, escritura y autonomía. El objetivo es una de esas etiquetas; su construcción artificial hace que este ensayo sea una comprobación de funcionamiento, no evidencia predictiva independiente.

Este corpus no es suficiente para entrenar ni validar un LLM clínico. El selector no puede inferir una habilidad que no haya sido seleccionada por la profesional. No se muestran probabilidades clínicas ni se toman decisiones autónomas. Todo texto requiere revisión.

## Posible integración posterior

Google describe generación de datos sintéticos con Gemini/Vertex AI en su [documentación oficial](https://cloud.google.com/discover/what-is-synthetic-data). La [salida estructurada de Gemini](https://ai.google.dev/gemini-api/docs/structured-output) podría restringir un futuro formato de respuesta. Esas capacidades no equivalen a entrenar este modelo, obtener un dataset clínico validado o garantizar calidad del contenido.

Antes de integrar un proveedor: definir la finalidad no diagnóstica, política de datos sintéticos, esquema, separación de evaluación, revisión profesional, controles del servidor y evaluación de seguridad/pertinencia. Ninguna integración externa está activa en esta entrega.

## Resultado del entrenamiento

Se entrenó con los 96 casos y se evaluó con los 24 reservados: 24 coincidencias. La pérdida de entrenamiento disminuyó de 1.791759 a 0.095163. El generador asigna una etiqueta explícita por caso: este resultado artificial sencillo no acredita calidad clínica, generalización ni beneficio de las recomendaciones. No es un LLM entrenado.

La separación original se conserva; no hay IDs ni vectores compartidos. La inferencia aplica los pesos guardados y solo admite habilidades previamente elegidas por la profesional. No se entrena en el navegador ni con expedientes, retroalimentación de usuarios o textos clínicos. Los casos, modelo y reporte son versionados; cambiar la versión invalida la autorización de borradores anteriores hasta una nueva revisión.
