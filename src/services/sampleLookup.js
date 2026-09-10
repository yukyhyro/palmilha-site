/**
 * Busca binária: encontra a amostra com tempo <= targetTime.
 * O(log n) — escala para gravações longas.
 */
export function findSampleAtTime(samples, targetTime) {
  if (!samples || samples.length === 0) return null;
  if (targetTime <= samples[0].time) return samples[0];
  if (targetTime >= samples[samples.length - 1].time) return samples[samples.length - 1];

  let lo = 0, hi = samples.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (samples[mid].time <= targetTime) lo = mid;
    else hi = mid - 1;
  }
  return samples[lo];
}
