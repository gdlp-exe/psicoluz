# Anexo técnico · reproducción y evidencia

## A. Parámetros del experimento

Modelo: regresión logística multiclase softmax. Entradas: 9. Clases: 6. Inicialización: cero. Épocas: 1200. Tasa de aprendizaje: 0.3. Regularización L2: 0.001. Algoritmo determinista por lote completo. División: 96 entrenamiento / 24 prueba. Referencia de clase mayoritaria en este corpus equilibrado: 1/6.

## B. Cómo repetirlo

Entorno de referencia: Node.js 24, React 19 y Vite 8.3.6; navegador Edge o Chrome. Desde la carpeta del proyecto, instalar las dependencias con npm ci y ejecutar:
npm run data:synthetic — regenera el corpus original.
npm run train:support — aprende, evalúa y guarda el modelo.
npm run test:unit — verifica reproducción y controles del motor.
npm run verify — integridad del ERS, pruebas unitarias, compilación y pruebas de navegador.

## C. Archivos principales

Datos: data/synthetic/train.jsonl y test.jsonl.
Generador: src/features/seguimiento/syntheticData.js.
Entrenamiento: scripts/train-support-model.mjs y scripts/lib/train-softmax.mjs.
Modelo: src/features/seguimiento/model/model.json.
Informe: data/synthetic/training-report.json, con pérdidas por época, matriz de confusión y hashes.
Inferencia: modelRuntime.js y supportEngine.js en el módulo Seguimiento.
Pruebas: tests-unit/trained-model.test.mjs y tests/apoyo-entrenado.spec.js.

## D. Integridad del corpus

SHA256 de train.jsonl (saltos LF):
d1ec9a08a33f2222a12223360096a798d2b5b5246756dabec8f4c245a13a5477
SHA256 de test.jsonl (saltos LF):
f5314cae22eca66c390444989cf5e8d444de5853fe6bc9a0610926cdeb40d40b

## E. Fuentes y estado documental

Fuentes del proyecto: ERS_Psicoluz_iso.docx, propuestaProtocolo.docx y arquitecturaPsicoluz.docx; diagnóstico y comunicación como contexto. Los Word originales no se modificaron. ADR-04 conserva reglas transparentes; el clasificador entrenado es una extensión experimental documentada. Métodos y pendientes de los 40 requerimientos están en docs/verificacion-ers.json.

## Referencia técnica

Stanford CS231n, Linear Classification, apartado Softmax classifier: cs231n.github.io/linear-classify/. Se toma como referencia matemática; no se usan sus datos ni modelos de imágenes.
