/**
 * heatmapProcessor.js
 *
 * Calcula grids de heatmap usando interpolação IDW (Inverse Distance Weighting).
 * Cada pixel do grid recebe um valor interpolado a partir dos sensores,
 * ponderado pelo inverso da distância elevada a uma potência (tipicamente 2).
 *
 * Inclui um campo de confiança: áreas muito distantes dos sensores
 * ficam transparentes, evitando dar falsa precisão onde não há medição.
 */

/**
 * Calcula o grid de heatmap por IDW.
 *
 * @param {Array<{x: number, y: number, value: number}>} sensorSamples
 *   Posições (0-100) e valores dos sensores
 * @param {number} resolution - Tamanho do grid (ex: 50 = grid 50x50)
 * @param {number} power - Expoente IDW (default 2.5)
 * @returns {{ grid: Float32Array, width: number, height: number }}
 */
export function computeHeatmapGrid(sensorSamples, resolution = 50, power = 2.5) {
  const width = resolution;
  const height = resolution;
  const grid = new Float32Array(width * height);
  const confidence = new Float32Array(width * height);

  if (!sensorSamples || sensorSamples.length === 0) {
    return { grid, confidence, width, height };
  }

  // Filtra sensores com posição válida
  const sensors = sensorSamples.filter(s => s.x != null && s.y != null);
  if (sensors.length === 0) {
    return { grid, confidence, width, height };
  }

  // Raio de influência máximo (em unidades do grid 0-100)
  const maxInfluenceRadius = 35;

  for (let gy = 0; gy < height; gy++) {
    for (let gx = 0; gx < width; gx++) {
      // Coordenada no espaço 0-100
      const px = (gx / (width - 1)) * 100;
      const py = (gy / (height - 1)) * 100;

      let weightSum = 0;
      let valueSum = 0;
      let minDist = Infinity;
      let exactMatch = false;

      for (const sensor of sensors) {
        const dx = px - sensor.x;
        const dy = py - sensor.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.5) {
          // Ponto praticamente no sensor
          valueSum = sensor.value;
          weightSum = 1;
          exactMatch = true;
          minDist = 0;
          break;
        }

        if (dist < minDist) minDist = dist;

        const w = 1 / Math.pow(dist, power);
        weightSum += w;
        valueSum += w * sensor.value;
      }

      const idx = gy * width + gx;

      if (exactMatch) {
        grid[idx] = valueSum;
        confidence[idx] = 1.0;
      } else if (weightSum > 0) {
        grid[idx] = valueSum / weightSum;
        // Confiança diminui com a distância ao sensor mais próximo
        confidence[idx] = Math.max(0, 1 - (minDist / maxInfluenceRadius));
      } else {
        grid[idx] = 0;
        confidence[idx] = 0;
      }
    }
  }

  return { grid, confidence, width, height };
}

/**
 * Mapeia um valor normalizado (0-1) para uma cor do heatmap.
 * Escala: azul escuro → ciano → verde → amarelo → vermelho
 *
 * @param {number} t - Valor normalizado entre 0 e 1
 * @returns {[number, number, number]} RGB (0-255)
 */
export function heatColor(t) {
  t = Math.max(0, Math.min(1, t));

  let r, g, b;

  if (t < 0.25) {
    // Azul escuro → Ciano
    const s = t / 0.25;
    r = 0;
    g = Math.round(s * 200);
    b = Math.round(100 + s * 155);
  } else if (t < 0.5) {
    // Ciano → Verde
    const s = (t - 0.25) / 0.25;
    r = 0;
    g = Math.round(200 + s * 55);
    b = Math.round(255 - s * 200);
  } else if (t < 0.75) {
    // Verde → Amarelo
    const s = (t - 0.5) / 0.25;
    r = Math.round(s * 255);
    g = 255;
    b = Math.round(55 - s * 55);
  } else {
    // Amarelo → Vermelho
    const s = (t - 0.75) / 0.25;
    r = 255;
    g = Math.round(255 - s * 255);
    b = 0;
  }

  return [r, g, b];
}
