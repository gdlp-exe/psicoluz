import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import model from '../src/features/seguimiento/model/model.json' with { type: 'json' };
import { trainSoftmax, evaluate } from '../scripts/lib/train-softmax.mjs';
import { softmaxScores, predictClass } from '../src/features/seguimiento/modelRuntime.js';
import { classifySkills } from '../src/features/seguimiento/supportEngine.js';
import { SKILLS, FEATURE_NAMES, MODEL_VERSION } from '../src/features/seguimiento/syntheticData.js';

const raw = split => readFileSync(new URL(`../data/synthetic/${split}.jsonl`, import.meta.url), 'utf8');
const parse = text => text.trim().split(/\r?\n/).map(JSON.parse);
const train = parse(raw('train')), heldOut = parse(raw('test'));
test('Entrenamiento: artefacto reproduce los pesos aprendidos solo con train.jsonl', () => {
  const fitted = trainSoftmax(train, Object.keys(SKILLS), FEATURE_NAMES, model.hyperparameters);
  assert.equal(model.version, MODEL_VERSION); assert.equal(model.trained, true);
  assert.deepEqual(fitted.model.weights, model.weights); assert.deepEqual(fitted.model.bias, model.bias);
  assert.ok(fitted.lossHistory.at(-1).loss < fitted.lossHistory[0].loss / 4);
  assert.ok(model.weights.flat().some(w => Math.abs(w) > 0.01));
});
test('Entrenamiento: hashes del corpus coinciden y no se comparten IDs ni vectores', () => {
  for (const split of ['train', 'test']) assert.equal(createHash('sha256').update(raw(split).replace(/\r\n/g, '\n')).digest('hex'), model.datasetSha256[split]);
  assert.equal(train.length, model.trainingSamples); assert.equal(heldOut.length, model.testSamples);
  for (const t of heldOut) assert.ok(!train.some(r => r.caseId === t.caseId || JSON.stringify(r.features) === JSON.stringify(t.features)));
});
test('Evaluación: métricas guardadas se recalculan y superan un clasificador sin aprender', () => {
  const result = evaluate(model, heldOut), blank = { ...model, weights: model.weights.map(w => w.map(() => 0)), bias: model.bias.map(() => 0) };
  assert.deepEqual(result, model.metrics.heldOut);
  assert.ok(result.accuracy > evaluate(blank, heldOut).accuracy);
  assert.ok(result.logLoss < evaluate(blank, heldOut).logLoss);
  assert.equal(model.clinicalValidation, false); assert.equal(model.llmTrained, false);
});
test('Inferencia: usa parámetros del artefacto y se abstiene fuera del dominio admitido', () => {
  const x = heldOut[0].features, scores = softmaxScores(model, x);
  assert.ok(Math.abs(scores.reduce((a, b) => a + b, 0) - 1) < 1e-12);
  assert.equal(predictClass(model, x), heldOut[0].target);
  for (const input of [[...x.slice(0, 8), NaN], x.map(() => -1), x.map(() => 2), [1, 0], [...x.slice(0, 3), 0.5, 0, 0, 0, 0, 0]]) assert.deepEqual(classifySkills(input), []);
});
test('Inferencia: múltiples etiquetas solo devuelven habilidades elegidas, sin inventar otras', () => {
  const output = classifySkills([0.4, 0.3, 0, 0, 0, 0, 1, 1, 0]);
  assert.ok(output.length > 0); assert.ok(output.every(k => ['lectura', 'escritura'].includes(k)));
  assert.equal(classifySkills([0.4, 0.3, 0, 0, 0, 0, 1, 1, 0], 1).length, 1);
});
