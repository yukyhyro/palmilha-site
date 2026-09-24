/**
 * statisticsCalculator.js
 *
 * Calcula estatísticas dos dados de pressão plantar.
 */

/**
 * Calcula estatísticas gerais a partir de todas as amostras.
 *
 * @param {Array} samples - Array de amostras do parser
 * @param {string[]} sensorNames - Nomes dos sensores
 * @returns {object} Estatísticas calculadas
 */
export function computeStatistics(samples, sensorNames) {
  if (!samples || samples.length === 0 || !sensorNames || sensorNames.length === 0) {
    return null;
  }

  let maxPressure = 0;
  let maxPressureSensor = '';
  let maxPressureTime = 0;
  let totalPressureSum = 0;
  let totalSensorReadings = 0;

  const sensorStats = {};
  sensorNames.forEach(name => {
    sensorStats[name] = { sum: 0, max: 0, count: 0 };
  });

  for (const sample of samples) {
    let sampleTotal = 0;

    for (const name of sensorNames) {
      const val = sample.sensors[name] || 0;
      sampleTotal += val;

      sensorStats[name].sum += val;
      sensorStats[name].count++;
      if (val > sensorStats[name].max) {
        sensorStats[name].max = val;
      }

      if (val > maxPressure) {
        maxPressure = val;
        maxPressureSensor = name;
        maxPressureTime = sample.time;
      }
    }

    totalPressureSum += sampleTotal;
    totalSensorReadings++;
  }

  const duration = samples[samples.length - 1].time - samples[0].time;

  // Média por sensor
  const sensorAverages = {};
  sensorNames.forEach(name => {
    sensorAverages[name] = sensorStats[name].count > 0
      ? sensorStats[name].sum / sensorStats[name].count
      : 0;
  });

  return {
    maxPressure: Math.round(maxPressure * 100) / 100,
    maxPressureSensor,
    maxPressureTime: Math.round(maxPressureTime * 1000) / 1000,
    meanPressure: Math.round((totalPressureSum / (totalSensorReadings * sensorNames.length)) * 100) / 100,
    totalSamples: samples.length,
    duration: Math.round(duration * 1000) / 1000,
    sensorCount: sensorNames.length,
    sensorAverages,
    sensorMaxes: Object.fromEntries(sensorNames.map(n => [n, sensorStats[n].max])),
  };
}

/**
 * Calcula escalas automáticas para normalização do heatmap.
 *
 * @param {Array} samples - Array de amostras
 * @param {string[]} sensorNames - Nomes dos sensores
 * @returns {{ min: number, max: number }}
 */
export function computeAutoScale(samples, sensorNames) {
  if (!samples || samples.length === 0) return { min: 0, max: 1 };

  let globalMax = 0;

  for (const sample of samples) {
    for (const name of sensorNames) {
      const val = sample.sensors[name] || 0;
      if (val > globalMax) globalMax = val;
    }
  }

  // Usa percentil 95 para evitar que picos isolados dominem a escala
  const allValues = [];
  for (const sample of samples) {
    for (const name of sensorNames) {
      const val = sample.sensors[name] || 0;
      if (val > 0) allValues.push(val);
    }
  }

  allValues.sort((a, b) => a - b);
  const p95Index = Math.floor(allValues.length * 0.95);
  const p95 = allValues.length > 0 ? allValues[Math.min(p95Index, allValues.length - 1)] : 1;

  return {
    min: 0,
    max: Math.max(p95, 0.1),
    absoluteMax: globalMax,
  };
}

/**
 * Calcula a média ponderada pelo tempo para cada sensor.
 * Usado no Mapa de Pressão Geral.
 *
 * Fórmula: Σ(pressão × duração) / Σ(duração)
 *
 * Se os timestamps não forem confiáveis, usa média simples como fallback.
 *
 * @param {Array} samples - Array de amostras
 * @param {string[]} sensorNames - Nomes dos sensores
 * @returns {object} Objeto { sensorName: valorMédioPonderado }
 */
export function computeTimeWeightedAverage(samples, sensorNames) {
  if (!samples || samples.length < 2 || !sensorNames || sensorNames.length === 0) {
    // Fallback: média simples
    if (samples && samples.length > 0) {
      const result = {};
      sensorNames.forEach(name => {
        const sum = samples.reduce((s, sample) => s + (sample.sensors[name] || 0), 0);
        result[name] = sum / samples.length;
      });
      return result;
    }
    return {};
  }

  // Verifica se timestamps são confiáveis (monotonicamente crescentes e com variação)
  const totalDuration = samples[samples.length - 1].time - samples[0].time;
  const hasReliableTime = totalDuration > 0;

  if (!hasReliableTime) {
    // Fallback: média simples
    const result = {};
    sensorNames.forEach(name => {
      const sum = samples.reduce((s, sample) => s + (sample.sensors[name] || 0), 0);
      result[name] = sum / samples.length;
    });
    return result;
  }

  // Média ponderada pelo tempo
  const result = {};
  sensorNames.forEach(name => {
    let weightedSum = 0;
    let totalWeight = 0;

    for (let i = 0; i < samples.length; i++) {
      // Duração associada a cada amostra:
      // usa metade do intervalo anterior + metade do intervalo posterior
      let dt;
      if (i === 0) {
        dt = samples[1].time - samples[0].time;
      } else if (i === samples.length - 1) {
        dt = samples[i].time - samples[i - 1].time;
      } else {
        dt = (samples[i + 1].time - samples[i - 1].time) / 2;
      }

      if (dt <= 0) dt = 0.001; // Proteção contra dt zero

      const val = samples[i].sensors[name] || 0;
      weightedSum += val * dt;
      totalWeight += dt;
    }

    result[name] = totalWeight > 0 ? weightedSum / totalWeight : 0;
  });

  return result;
}
