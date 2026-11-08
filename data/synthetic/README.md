# Corpus experimental sintético

Todos los casos son artificiales, deterministas y generados por `supportEngine.js`. No contienen pacientes, expedientes, notas, diagnósticos ni textos clínicos; no dependen de la base de desarrollo. No se usaron APIs externas ni servicios de pago.

Reproducir: `npm run data:synthetic`.

- `train.jsonl`: 96 referencias para un kNN local (k=3).
- `test.jsonl`: 24 casos separados por identificador, reservados para comprobación de software.
- `metadata.json`: versión, orden de características, procedencia y límites.

Cada línea contiene `caseId`, `synthetic`, `split`, `features` y `target`. Las nueve características son proporción de vencidas, proporción cumplida, cancelaciones recientes escaladas y seis indicadores de etiquetas profesionales: organización, instrucciones, comunicación, lectura, escritura y autonomía. El objetivo es una de esas etiquetas; su construcción artificial hace que este ensayo sea una comprobación de funcionamiento, no evidencia predictiva independiente.

Este corpus no es suficiente para entrenar ni validar un LLM clínico. El selector no puede inferir una habilidad que no haya sido seleccionada por la profesional. No se muestran probabilidades clínicas ni se toman decisiones autónomas. Todo texto requiere revisión.

## Posible integración posterior

Google describe generación de datos sintéticos con Gemini/Vertex AI en su [documentación oficial](https://cloud.google.com/discover/what-is-synthetic-data). La [salida estructurada de Gemini](https://ai.google.dev/gemini-api/docs/structured-output) podría restringir un futuro formato de respuesta. Esas capacidades no equivalen a entrenar este modelo, obtener un dataset clínico validado o garantizar calidad del contenido.

Antes de integrar un proveedor: definir la finalidad no diagnóstica, política de datos sintéticos, esquema, separación de evaluación, revisión profesional, controles del servidor y evaluación de seguridad/pertinencia. Ninguna integración externa está activa en esta entrega.
