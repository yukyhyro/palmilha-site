/**
 * Estatísticas e médias ponderadas pelo tempo para o Mapa de Pressão Geral.
 */

export function computeStatistics(parsedData) {
  if (!parsedData || !parsedData.samples || parsedData.samples.length === 0) return null;
  const { samples, sensorNames } = parsedData;
  let globalMax = 0, globalMaxSensor = '', globalMaxTime = 0;
  let globalSum = 0, globalCount = 0;
  let totalMax = null, totalMaxTime = null;
  const perSensor = {};
  sensorNames.forEach(name => { perSensor[name] = { sum: 0, count: 0, max: 0, maxTime: 0 }; });
  for (const sample of samples) {
    for (const name of sensorNames) {
      const val = sample.sensorValues[name] || 0;
      const acc = perSensor[name];
      acc.sum += val; acc.count++;
      if (val > acc.max) { acc.max = val; acc.maxTime = sample.time; }
      globalSum += val; globalCount++;
      if (val > globalMax) { globalMax = val; globalMaxSensor = name; globalMaxTime = sample.time; }
    }
    if (sample.total !== null && sample.total !== undefined) {
      if (totalMax === null || sample.total > totalMax) { totalMax = sample.total; totalMaxTime = sample.time; }
    }
  }
  return {
    sampleCount: samples.length,
    duration: samples[samples.length - 1].time - samples[0].time,
    globalMax, globalMaxSensor, globalMaxTime,
    globalMean: globalCount > 0 ? globalSum / globalCount : 0,
    totalMax, totalMaxTime,
    perSensor: Object.fromEntries(
      Object.entries(perSensor).map(([name, acc]) => [
        name, { max: acc.max, mean: acc.count > 0 ? acc.sum / acc.count : 0, maxTime: acc.maxTime },
      ])
    ),
  };
}

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

/**
 * Calcula a pressão média ponderada pelo tempo para cada sensor.
 *
 * Fórmula: Σ(pressão_i × duração_i) / Σ(duração_i)
 *
 * Onde duração_i = tempo do próximo registro - tempo do registro atual.
 * Para o último registro, usa a mesma duração do penúltimo.
 *
 * Se os timestamps não forem confiáveis (todos iguais ou negativos),
 * faz fallback para média aritmética simples.
 */
export function computeTimeWeightedAverage(parsedData) {
  if (!parsedData || !parsedData.samples || parsedData.samples.length === 0) return null;

  const { samples, sensorNames } = parsedData;

  // Calcula durações entre amostras consecutivas
  const durations = [];
  let totalDuration = 0;
  let hasValidDurations = false;

  for (let i = 0; i < samples.length; i++) {
    let dt;
    if (i < samples.length - 1) {
      dt = samples[i + 1].time - samples[i].time;
    } else {
      // Último registro: usa a mesma duração do penúltimo
      dt = durations.length > 0 ? durations[durations.length - 1] : 1;
    }
    // Proteção contra duração negativa ou zero
    if (dt <= 0) dt = 0.001;
    if (dt > 0.001) hasValidDurations = true;
    durations.push(dt);
    totalDuration += dt;
  }

  const result = {};

  for (const name of sensorNames) {
    if (hasValidDurations && totalDuration > 0) {
      // Média ponderada pelo tempo
      let weightedSum = 0;
      for (let i = 0; i < samples.length; i++) {
        const value = samples[i].sensorValues[name] || 0;
        weightedSum += value * durations[i];
      }
      result[name] = weightedSum / totalDuration;
    } else {
      // Fallback: média aritmética simples
      let sum = 0;
      for (const sample of samples) {
        sum += sample.sensorValues[name] || 0;
      }
      result[name] = sum / samples.length;
    }
  }

  return result;
}
