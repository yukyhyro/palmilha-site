/**
 * Posições dos sensores conforme a Figura 2 (Distribuição dos sensores FSR402).
 *
 * ANATOMIA (vista plantar, olhando a sola do pé):
 * - Pé ESQUERDO: dedão (medial) fica à DIREITA da imagem
 * - Pé DIREITO:  dedão (medial) fica à ESQUERDA da imagem
 *
 * Coordenadas em viewBox 0-100 x 0-100.
 * Topo = dedos, base = calcanhar.
 *
 * Sensores:
 *   1     = hálux (dedão)
 *   2,3,4 = antepé (2=medial, 3=central, 4=lateral)
 *   5     = mediopé central
 *   6,7   = mediopé (6=medial, 7=lateral)
 *   8,9   = calcâneo (8=superior, 9=inferior)
 */

// ─── 9 sensores — pé ESQUERDO (dedão à direita) ───
const LEFT_9 = {
  FSR1: { x: 60, y: 10, region: 'antepe' },
  FSR2: { x: 60, y: 24, region: 'antepe' },
  FSR3: { x: 45, y: 22, region: 'antepe' },
  FSR4: { x: 28, y: 28, region: 'antepe' },
  FSR5: { x: 48, y: 40, region: 'mediope' },
  FSR6: { x: 60, y: 52, region: 'mediope' },
  FSR7: { x: 35, y: 52, region: 'mediope' },
  FSR8: { x: 48, y: 66, region: 'calcaneo' },
  FSR9: { x: 48, y: 80, region: 'calcaneo' },
};

// ─── 9 sensores — pé DIREITO (dedão à esquerda) ───
const RIGHT_9 = {
  FSR1: { x: 40, y: 10, region: 'antepe' },
  FSR2: { x: 40, y: 24, region: 'antepe' },
  FSR3: { x: 55, y: 22, region: 'antepe' },
  FSR4: { x: 72, y: 28, region: 'antepe' },
  FSR5: { x: 52, y: 40, region: 'mediope' },
  FSR6: { x: 40, y: 52, region: 'mediope' },
  FSR7: { x: 65, y: 52, region: 'mediope' },
  FSR8: { x: 52, y: 66, region: 'calcaneo' },
  FSR9: { x: 52, y: 80, region: 'calcaneo' },
};

// ─── 5 sensores — pé ESQUERDO ───
// Com apenas FSR1–FSR5, mapeamos para as posições corretas da Figura 2
const LEFT_5 = {
  FSR1: LEFT_9.FSR1,
  FSR2: LEFT_9.FSR2,
  FSR3: LEFT_9.FSR3,
  FSR4: LEFT_9.FSR4,
  FSR5: LEFT_9.FSR5,
};

// ─── 5 sensores — pé DIREITO ───
const RIGHT_5 = {
  FSR1: RIGHT_9.FSR1,
  FSR2: RIGHT_9.FSR2,
  FSR3: RIGHT_9.FSR3,
  FSR4: RIGHT_9.FSR4,
  FSR5: RIGHT_9.FSR5,
};

export const REGION_LABELS = {
  antepe: 'Antepé',
  mediope: 'Mediopé',
  calcaneo: 'Calcâneo',
};

/**
 * Retorna as posições dos sensores para um dado lado e quantidade.
 * @param {'left'|'right'} side
 * @param {string[]} sensorNames - ex: ['FSR1','FSR2','FSR3','FSR4','FSR5']
 */
export function getSensorPositions(side, sensorNames) {
  const count = sensorNames ? sensorNames.length : 9;
  if (side === 'right') {
    return count <= 5 ? RIGHT_5 : RIGHT_9;
  }
  return count <= 5 ? LEFT_5 : LEFT_9;
}

/** Contorno estilizado da palmilha — pontos-âncora para Catmull-Rom */
const FOOT_ANCHORS = [
  [55, 3], [68, 8], [76, 18], [82, 30], [80, 42],
  [76, 55], [78, 68], [68, 88], [50, 95], [32, 88],
  [22, 68], [24, 55], [20, 42], [22, 30], [28, 18],
  [35, 8], [45, 3],
];

export function getFootOutlinePath(mirror = false) {
  const pts = mirror
    ? FOOT_ANCHORS.map(([x, y]) => [100 - x, y])
    : FOOT_ANCHORS;
  const n = pts.length;
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)} `;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i],
          p2 = pts[(i + 1) % n],     p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)} `;
  }
  return d + 'Z';
}
