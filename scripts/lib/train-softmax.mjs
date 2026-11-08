import { softmaxScores, predictClass } from '../../src/features/seguimiento/modelRuntime.js';

export function validateDataset(rows, split, classes, featureNames) {
  if (!rows.length) throw new Error('Empty dataset');
  const ids = new Set();
  for (const row of rows) {
    if (!row.synthetic || row.split !== split || !row.caseId?.startsWith('synthetic-') || ids.has(row.caseId) || !classes.includes(row.target) || row.features.length !== featureNames.length || row.features.some(n => !Number.isFinite(n) || n < 0 || n > 1)) throw new Error('Invalid synthetic dataset');
    ids.add(row.caseId);
  }
}

// Multinomial logistic regression: full-batch cross entropy + L2, gradient descent.
// Hyperparameters are fixed before evaluating the held-out test set.
export function trainSoftmax(rows, classes, features, { epochs = 1200, learningRate = 0.3, l2 = 0.001 } = {}) {
  validateDataset(rows, 'train', classes, features);
  const model = { classes: [...classes], features: [...features], weights: classes.map(() => features.map(() => 0)), bias: classes.map(() => 0) };
  const lossHistory = [];
  function loss() {
    const ce = rows.reduce((sum, row) => sum - Math.log(Math.max(softmaxScores(model, row.features)[classes.indexOf(row.target)], 1e-15)), 0) / rows.length;
    return ce + l2 / 2 * model.weights.flat().reduce((sum, w) => sum + w * w, 0);
  }
  lossHistory.push({ epoch: 0, loss: loss() });
  for (let epoch = 1; epoch <= epochs; epoch++) {
    const dw = classes.map(() => features.map(() => 0)), db = classes.map(() => 0);
    for (const row of rows) {
      const scores = softmaxScores(model, row.features), target = classes.indexOf(row.target);
      for (let k = 0; k < classes.length; k++) {
        const delta = (scores[k] - (k === target ? 1 : 0)) / rows.length;
        db[k] += delta;
        for (let j = 0; j < features.length; j++) dw[k][j] += delta * row.features[j];
      }
    }
    for (let k = 0; k < classes.length; k++) {
      model.bias[k] -= learningRate * db[k];
      for (let j = 0; j < features.length; j++) model.weights[k][j] -= learningRate * (dw[k][j] + l2 * model.weights[k][j]);
    }
    if (epoch % 100 === 0 || epoch === epochs) lossHistory.push({ epoch, loss: loss() });
  }
  return { model, lossHistory, hyperparameters: { epochs, learningRate, l2 } };
}

export function evaluate(model, rows) {
  const confusion = model.classes.map(() => model.classes.map(() => 0));
  let correct = 0, logLoss = 0;
  for (const row of rows) {
    const predicted = predictClass(model, row.features), actual = model.classes.indexOf(row.target), p = model.classes.indexOf(predicted);
    confusion[actual][p]++; correct += predicted === row.target ? 1 : 0;
    logLoss -= Math.log(Math.max(softmaxScores(model, row.features)[actual], 1e-15));
  }
  return { samples: rows.length, correct, accuracy: correct / rows.length, logLoss: logLoss / rows.length, confusion, classOrder: model.classes };
}
