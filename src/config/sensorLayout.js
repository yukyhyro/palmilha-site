/**
 * Posições dos sensores na palmilha (viewBox 0-100 x 0-100).
 * Topo = dedos, base = calcanhar.
 * Altere esses valores para reposicionar os sensores visualmente.
 */

export const SENSOR_POSITIONS = {
  FSR1: { x: 55, y: 8,  region: 'antepe' },
  FSR2: { x: 38, y: 18, region: 'antepe' },
  FSR3: { x: 55, y: 20, region: 'antepe' },
  FSR4: { x: 72, y: 22, region: 'antepe' },
  FSR5: { x: 55, y: 35, region: 'mediope' },
  FSR6: { x: 42, y: 45, region: 'mediope' },
  FSR7: { x: 68, y: 45, region: 'mediope' },
  FSR8: { x: 55, y: 60, region: 'calcaneo' },
  FSR9: { x: 55, y: 75, region: 'calcaneo' },
};

export const REGION_LABELS = {
  antepe: 'Antepé',
  mediope: 'Mediopé',
  calcaneo: 'Calcâneo',
};

/** Contorno estilizado da palmilha (pé esquerdo, viewBox 0 0 100 100) */
export const FOOT_ANCHOR_POINTS = [
  [55, 3], [70, 8], [78, 18], [82, 30], [80, 42],
  [76, 55], [78, 68], [68, 88], [50, 95], [32, 88],
  [22, 68], [24, 55], [20, 42], [22, 30], [28, 18],
  [35, 8], [45, 3],
];

/**
 * Gera SVG path via Catmull-Rom → Bézier.
 * mirror=true espelha para o pé direito.
 */
export function getFootOutlinePath(mirror = false) {
  const pts = mirror
    ? FOOT_ANCHOR_POINTS.map(([x, y]) => [100 - x, y])
    : FOOT_ANCHOR_POINTS;
  const n = pts.length;
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)} `;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)} `;
  }
  return d + 'Z';
}

/**
 * Retorna as posições dos sensores, espelhadas para o pé direito.
 */
export function getSensorPositions(side) {
  const entries = Object.entries(SENSOR_POSITIONS);
  if (side === 'right') {
    return Object.fromEntries(
      entries.map(([key, val]) => [key, { ...val, x: 100 - val.x }])
    );
  }
  return SENSOR_POSITIONS;
}
