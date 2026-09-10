/**
 * Calcula estatísticas a partir dos dados parsados.
 * Nunca inventa dados — retorna null quando não há informação.
 */

export function computeStatistics(parsedData) {
  if (!parsedData || !parsedData.samples || parsedData.samples.length === 0) return null;

  const { samples, sensorNames } = parsedData;
  let globalMax = 0, globalMaxSensor = '', globalMaxTime = 0;
  let globalSum = 0, globalCount = 0;
  let totalMax = null, totalMaxTime = null;

  const perSensor = {};
  sensorNames.forEach(name => {
    perSensor[name] = { sum: 0, count: 0, max: 0, maxTime: 0 };
  });

  for (const sample of samples) {
    for (const name of sensorNames) {
      const val = sample.sensorValues[name] || 0;
      const acc = perSensor[name];
      acc.sum += val;
      acc.count++;
      if (val > acc.max) { acc.max = val; acc.maxTime = sample.time; }
      globalSum += val;
      globalCount++;
      if (val > globalMax) { globalMax = val; globalMaxSensor = name; globalMaxTime = sample.time; }
    }
    if (sample.total !== null && sample.total !== undefined) {
      if (totalMax === null || sample.total > totalMax) {
        totalMax = sample.total;
        totalMaxTime = sample.time;
      }
    }
  }

  return {
    sampleCount: samples.length,
    duration: samples[samples.length - 1].time - samples[0].time,
    globalMax,
    globalMaxSensor,
    globalMaxTime,
    globalMean: globalCount > 0 ? globalSum / globalCount : 0,
    totalMax,
    totalMaxTime,
    perSensor: Object.fromEntries(
      Object.entries(perSensor).map(([name, acc]) => [
        name,
        { max: acc.max, mean: acc.count > 0 ? acc.sum / acc.count : 0, maxTime: acc.maxTime },
      ])
    ),
  };
}

/** Calcula o valor máximo entre todos os sensores de todos os samples. */
export function computeAutoScale(...datasets) {
  let max = 0;
  for (const data of datasets) {
    if (!data) continue;
    for (const sample of data.samples) {
      for (const val of Object.values(sample.sensorValues)) {
        if (val > max) max = val;
      }
    }
  }
  return max > 0 ? Math.ceil(max) : 1;
}
