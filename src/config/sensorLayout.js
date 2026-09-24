/**
 * sensorLayout.js
 *
 * Configuração das posições dos sensores na palmilha.
 * Baseado na Figura 2 do projeto (posições anatômicas reais).
 *
 * Coordenadas em espaço 0-100 (x horizontal, y vertical).
 * y=0 = topo (dedos), y=100 = base (calcanhar).
 *
 * Layouts independentes para pé esquerdo e direito.
 * Não é um espelhamento simples — a numeração dos sensores
 * é preservada conforme a palmilha real.
 *
 * Regiões anatômicas:
 *   - Antepé (dedos e metatarsos): FSR1–FSR4 (ou FSR1–FSR4 em 5 sensores)
 *   - Mediopé (arco): FSR5–FSR7 (ou FSR5 em 5 sensores)
 *   - Calcâneo (calcanhar): FSR8–FSR9
 */

// === Layouts para 9 sensores ===

const RIGHT_9 = {
  FSR1: { x: 62, y: 12 },  // Hálux (dedão) - medial
  FSR2: { x: 45, y: 10 },  // 2º/3º metatarso
  FSR3: { x: 30, y: 14 },  // 4º/5º metatarso - lateral
  FSR4: { x: 55, y: 28 },  // Cabeça 1º metatarso - medial
  FSR5: { x: 35, y: 30 },  // Cabeça 5º metatarso - lateral
  FSR6: { x: 45, y: 45 },  // Mediopé central
  FSR7: { x: 30, y: 55 },  // Mediopé lateral
  FSR8: { x: 55, y: 80 },  // Calcâneo medial
  FSR9: { x: 42, y: 82 },  // Calcâneo lateral
};

const LEFT_9 = {
  FSR1: { x: 38, y: 12 },  // Hálux (dedão) - medial
  FSR2: { x: 55, y: 10 },  // 2º/3º metatarso
  FSR3: { x: 70, y: 14 },  // 4º/5º metatarso - lateral
  FSR4: { x: 45, y: 28 },  // Cabeça 1º metatarso - medial
  FSR5: { x: 65, y: 30 },  // Cabeça 5º metatarso - lateral
  FSR6: { x: 55, y: 45 },  // Mediopé central
  FSR7: { x: 70, y: 55 },  // Mediopé lateral
  FSR8: { x: 45, y: 80 },  // Calcâneo medial
  FSR9: { x: 58, y: 82 },  // Calcâneo lateral
};

// === Layouts para 5 sensores ===

const RIGHT_5 = {
  FSR1: { x: 62, y: 12 },  // Hálux / Antepé medial
  FSR2: { x: 38, y: 15 },  // Antepé lateral
  FSR3: { x: 50, y: 35 },  // Metatarso central
  FSR4: { x: 35, y: 55 },  // Mediopé lateral
  FSR5: { x: 48, y: 80 },  // Calcâneo
};

const LEFT_5 = {
  FSR1: { x: 38, y: 12 },  // Hálux / Antepé medial
  FSR2: { x: 62, y: 15 },  // Antepé lateral
  FSR3: { x: 50, y: 35 },  // Metatarso central
  FSR4: { x: 65, y: 55 },  // Mediopé lateral
  FSR5: { x: 52, y: 80 },  // Calcâneo
};

/**
 * Retorna as posições dos sensores para um dado pé e lista de sensores.
 *
 * @param {'left'|'right'} side - Lado do pé
 * @param {string[]} sensorNames - Lista de nomes de sensores (ex: ['FSR1','FSR2',...])
 * @returns {object} Mapa { sensorName: {x, y} }
 */
export function getSensorPositions(side, sensorNames) {
  const count = sensorNames.length;
  let layout;

  if (count <= 5) {
    layout = side === 'left' ? LEFT_5 : RIGHT_5;
  } else {
    layout = side === 'left' ? LEFT_9 : RIGHT_9;
  }

  const result = {};
  for (const name of sensorNames) {
    if (layout[name]) {
      result[name] = { ...layout[name] };
    }
  }

  return result;
}

/**
 * Pontos âncora do contorno do pé (com dedos visíveis).
 * Coordenadas em espaço 0-100.
 * Percurso: dedão → dedos menores → borda lateral → calcanhar → borda medial → volta ao dedão.
 *
 * Os pontos são para o pé DIREITO. Para o esquerdo, espelha-se em x (100 - x).
 */
const FOOT_ANCHORS = [
  // Dedão (hálux)
  [70, 14], [68, 7], [64, 3], [59, 6], [57, 12],
  // Dedos menores (2º a 5º)
  [52, 7], [49, 12], [45, 7], [41, 12], [37, 8], [33, 13], [29, 10],
  // Borda lateral desce
  [24, 16], [20, 24], [17, 33], [16, 40],
  // Arco lateral (cintura do pé)
  [19, 50], [22, 58], [24, 64],
  // Calcanhar (arredondado)
  [27, 74], [33, 84], [42, 92], [50, 96], [58, 92], [67, 84], [73, 74],
  // Borda medial sobe
  [76, 64], [78, 54], [80, 44], [81, 34], [79, 24], [75, 18],
];

/**
 * Converte Catmull-Rom spline points para comandos SVG cúbicos de Bézier.
 * Gera uma curva suave passando por todos os pontos.
 */
function catmullRomToBezier(points, closed = true) {
  const n = points.length;
  if (n < 3) return '';

  let d = `M ${points[0][0]} ${points[0][1]} `;

  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];

    // Tangentes Catmull-Rom → controle de Bézier cúbico
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

    d += `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]} `;
  }

  if (closed) d += 'Z';
  return d;
}

/**
 * Gera o path SVG do contorno do pé.
 *
 * @param {boolean} mirror - Se true, espelha para o pé esquerdo
 * @returns {string} String de path SVG
 */
export function getFootOutlinePath(mirror = false) {
  let points = FOOT_ANCHORS.map(([x, y]) => [x, y]);

  if (mirror) {
    points = points.map(([x, y]) => [100 - x, y]);
  }

  return catmullRomToBezier(points, true);
}

/**
 * Regiões anatômicas do pé com cores para indicadores visuais.
 */
export const FOOT_REGIONS = {
  forefoot: {
    label: 'Antepé',
    y: [0, 35],
    color: 'rgba(57, 255, 133, 0.08)',
    borderColor: 'rgba(57, 255, 133, 0.2)',
    sensors9: ['FSR1', 'FSR2', 'FSR3', 'FSR4'],
    sensors5: ['FSR1', 'FSR2'],
  },
  midfoot: {
    label: 'Mediopé',
    y: [35, 65],
    color: 'rgba(0, 200, 255, 0.08)',
    borderColor: 'rgba(0, 200, 255, 0.2)',
    sensors9: ['FSR5', 'FSR6', 'FSR7'],
    sensors5: ['FSR3', 'FSR4'],
  },
  rearfoot: {
    label: 'Calcâneo',
    y: [65, 100],
    color: 'rgba(255, 180, 0, 0.08)',
    borderColor: 'rgba(255, 180, 0, 0.2)',
    sensors9: ['FSR8', 'FSR9'],
    sensors5: ['FSR5'],
  },
};

/**
 * Retorna os sensores de cada região anatômica dado o total de sensores.
 */
export function getRegionSensors(sensorNames) {
  const count = sensorNames.length;
  const key = count <= 5 ? 'sensors5' : 'sensors9';

  const regions = {};
  for (const [regionId, region] of Object.entries(FOOT_REGIONS)) {
    const regionSensors = region[key].filter(s => sensorNames.includes(s));
    if (regionSensors.length > 0) {
      regions[regionId] = {
        label: region.label,
        sensors: regionSensors,
        color: region.borderColor,
      };
    }
  }

  return regions;
}
