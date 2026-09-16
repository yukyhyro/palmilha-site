/**
 * Interpolação IDW (Inverse Distance Weighting) para o mapa de calor.
 * Produz um grid 2D com valor interpolado e confiança (distância do sensor mais próximo).
 */

export function computeHeatmapGrid(sensorSamples, resolution = 50, power = 2.2) {
  if (!sensorSamples || sensorSamples.length === 0) return null;

  // Calcula espaçamento típico entre sensores para calibrar a confiança
  let totalNearest = 0;
  for (const s of sensorSamples) {
    let nearest = Infinity;
    for (const o of sensorSamples) {
      if (o === s) continue;
      const d = Math.hypot(s.x - o.x, s.y - o.y);
      if (d < nearest) nearest = d;
    }
    totalNearest += nearest;
  }
  const spacing = sensorSamples.length >= 2 ? totalNearest / sensorSamples.length : 30;

  const cells = [];
  for (let row = 0; row < resolution; row++) {
    const py = (row / (resolution - 1)) * 100;
    for (let col = 0; col < resolution; col++) {
      const px = (col / (resolution - 1)) * 100;
      let weightedSum = 0, weightTotal = 0, minDist = Infinity;

      for (const sensor of sensorSamples) {
        const dist = Math.hypot(px - sensor.x, py - sensor.y);
        minDist = Math.min(minDist, dist);
        if (dist < 0.001) {
          weightedSum = sensor.value;
          weightTotal = 1;
          minDist = 0;
          break;
        }
        const w = 1 / Math.pow(dist, power);
        weightedSum += w * sensor.value;
        weightTotal += w;
      }

      const value = weightTotal > 0 ? weightedSum / weightTotal : 0;
      const confidence = Math.max(0, Math.min(1, 1 - minDist / (spacing * 1.5)));
      cells.push({ value, confidence });
    }
  }

  return { resolution, cells };
}

/** Mapeia um valor normalizado 0-1 para uma cor da escala de calor. */
export function heatColor(t) {
  const stops = [
    { s: 0,    r: 11, g: 61, b: 69 },
    { s: 0.25, r: 18, g: 122, b: 117 },
    { s: 0.5,  r: 91, g: 166, b: 132 },
    { s: 0.7,  r: 201, g: 180, b: 88 },
    { s: 0.85, r: 217, g: 122, b: 61 },
    { s: 1,    r: 180, g: 64, b: 42 },
  ];
  const c = Math.max(0, Math.min(1, t));
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i], b = stops[i + 1];
    if (c >= a.s && c <= b.s) {
      const lt = (c - a.s) / (b.s - a.s || 1);
      return {
        r: Math.round(a.r + (b.r - a.r) * lt),
        g: Math.round(a.g + (b.g - a.g) * lt),
        b: Math.round(a.b + (b.b - a.b) * lt),
      };
    }
  }
  const last = stops[stops.length - 1];
  return { r: last.r, g: last.g, b: last.b };
}
