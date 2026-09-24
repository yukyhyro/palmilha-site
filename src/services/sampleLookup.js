/**
 * sampleLookup.js
 *
 * Busca binária para encontrar a amostra mais próxima de um dado tempo.
 * O(log n) — performático mesmo para gravações longas.
 *
 * @param {Array} samples - Array de amostras ordenadas por tempo
 * @param {number} targetTime - Tempo alvo em segundos
 * @returns {number} Índice da amostra mais próxima
 */
export function findSampleAtTime(samples, targetTime) {
  if (!samples || samples.length === 0) return 0;
  if (samples.length === 1) return 0;

  let lo = 0;
  let hi = samples.length - 1;

  // Limites
  if (targetTime <= samples[lo].time) return lo;
  if (targetTime >= samples[hi].time) return hi;

  // Busca binária
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (samples[mid].time <= targetTime) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  // Retorna o mais próximo entre lo e hi
  const dLo = Math.abs(samples[lo].time - targetTime);
  const dHi = Math.abs(samples[hi].time - targetTime);
  return dLo <= dHi ? lo : hi;
}
