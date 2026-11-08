import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { SKILLS, FEATURE_NAMES, MODEL_VERSION } from '../src/features/seguimiento/syntheticData.js';
import { trainSoftmax, evaluate, validateDataset } from './lib/train-softmax.mjs';

const root = new URL('../', import.meta.url);
const trainText = await readFile(new URL('data/synthetic/train.jsonl', root), 'utf8');
const testText = await readFile(new URL('data/synthetic/test.jsonl', root), 'utf8');
const parse = text => text.trim().split(/\r?\n/).map(line => JSON.parse(line));
const train = parse(trainText), test = parse(testText), classes = Object.keys(SKILLS);
validateDataset(train, 'train', classes, FEATURE_NAMES); validateDataset(test, 'test', classes, FEATURE_NAMES);
if (test.some(row => train.some(t => t.caseId === row.caseId || JSON.stringify(t.features) === JSON.stringify(row.features)))) throw new Error('Train/test leakage');
const { model, lossHistory, hyperparameters } = trainSoftmax(train, classes, FEATURE_NAMES);
const training = evaluate(model, train), heldOut = evaluate(model, test);
const digest = text => createHash('sha256').update(text.replace(/\r\n/g, '\n')).digest('hex');
const artifact = {
  version: MODEL_VERSION, kind: 'multinomial-logistic-regression', trained: true,
  syntheticOnly: true, llmTrained: false, clinicalValidation: false,
  ...model, trainingSamples: train.length, testSamples: test.length,
  datasetSha256: { train: digest(trainText), test: digest(testText) },
  hyperparameters, metrics: { training, heldOut },
  limitations: 'Artificial one-tag scenarios. Not a clinical evaluation or proof of real-world skill recommendation quality.',
};
await mkdir(new URL('src/features/seguimiento/model/', root), { recursive: true });
await writeFile(new URL('src/features/seguimiento/model/model.json', root), JSON.stringify(artifact, null, 2) + '\n');
const report = { version: MODEL_VERSION, trained: true, datasetSha256: artifact.datasetSha256, hyperparameters, lossHistory, training, heldOut, majorityBaselineAccuracy: 1 / classes.length, independentClinicalEvaluation: false, reproducibleCommand: 'npm run train:support', limitations: artifact.limitations };
await writeFile(new URL('data/synthetic/training-report.json', root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ version: MODEL_VERSION, trainingSamples: train.length, testSamples: test.length, initialLoss: lossHistory[0].loss, finalLoss: lossHistory.at(-1).loss, heldOut, warning: artifact.limitations }, null, 2));
