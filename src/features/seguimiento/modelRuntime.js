// Runtime only: no training, patient text or external calls in the browser.
export function softmaxScores(model, features) {
  if (!Array.isArray(features) || features.length !== model.features.length || features.some(n => !Number.isFinite(n) || n < 0 || n > 1)) return [];
  const logits = model.weights.map((weights, k) => weights.reduce((sum, w, j) => sum + w * features[j], model.bias[k]));
  const max = Math.max(...logits), exp = logits.map(v => Math.exp(v - max)), total = exp.reduce((a, b) => a + b, 0);
  return exp.map(v => v / total);
}
export function predictClass(model, features) {
  const scores = softmaxScores(model, features);
  return scores.length ? model.classes[scores.indexOf(Math.max(...scores))] : null;
}
