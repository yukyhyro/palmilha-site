/**
 * sensorLayout.js
 *
 * Configuração das posições dos sensores na palmilha.
 * Baseado na Figura 2 do projeto (posições anatômicas reais).
 *
 * Vista PLANTAR (vista de baixo da sola do pé):
 *   - Pé direito: dedão no lado ESQUERDO (medial)
 *   - Pé esquerdo: dedão no lado DIREITO (medial)
 *
 * Coordenadas em espaço 0-100 (x horizontal, y vertical).
 * y=0 = topo (dedos), y=100 = base (calcanhar).
 *
 * Layouts independentes para pé esquerdo e direito.
 *
 * Regiões anatômicas (conforme Figura 2):
 *   - Antepé: FSR1–FSR4 (dedos e cabeças dos metatarsos)
 *   - Mediopé: FSR5–FSR7 (arco do pé)
 *   - Calcâneo: FSR8–FSR9 (calcanhar)
 */

// === Layouts para 9 sensores (conforme Figura 2) ===

const RIGHT_9 = {
  FSR1: { x: 35, y: 10 },  // Hálux (dedão) - medial/esquerdo
  FSR2: { x: 40, y: 27 },  // Cabeça 1º/2º metatarso - medial
  FSR3: { x: 57, y: 27 },  // Cabeça 3º/4º metatarso - central
  FSR4: { x: 72, y: 33 },  // Cabeça 5º metatarso - lateral/direito
  FSR5: { x: 50, y: 46 },  // Mediopé central
  FSR6: { x: 37, y: 54 },  // Mediopé medial/esquerdo
  FSR7: { x: 65, y: 54 },  // Mediopé lateral/direito
  FSR8: { x: 48, y: 76 },  // Calcâneo superior
  FSR9: { x: 48, y: 88 },  // Calcâneo inferior
};

const LEFT_9 = {
  FSR1: { x: 65, y: 10 },  // Hálux (dedão) - medial/direito
  FSR2: { x: 60, y: 27 },  // Cabeça 1º/2º metatarso - medial
  FSR3: { x: 43, y: 27 },  // Cabeça 3º/4º metatarso - central
  FSR4: { x: 28, y: 33 },  // Cabeça 5º metatarso - lateral/esquerdo
  FSR5: { x: 50, y: 46 },  // Mediopé central
  FSR6: { x: 63, y: 54 },  // Mediopé medial/direito
  FSR7: { x: 35, y: 54 },  // Mediopé lateral/esquerdo
  FSR8: { x: 52, y: 76 },  // Calcâneo superior
  FSR9: { x: 52, y: 88 },  // Calcâneo inferior
};

// === Layouts para 5 sensores ===

const RIGHT_5 = {
  FSR1: { x: 35, y: 12 },  // Hálux / Antepé medial
  FSR2: { x: 63, y: 15 },  // Antepé lateral
  FSR3: { x: 50, y: 36 },  // Metatarso central
  FSR4: { x: 65, y: 55 },  // Mediopé lateral
  FSR5: { x: 48, y: 82 },  // Calcâneo
};

const LEFT_5 = {
  FSR1: { x: 65, y: 12 },  // Hálux / Antepé medial
  FSR2: { x: 37, y: 15 },  // Antepé lateral
  FSR3: { x: 50, y: 36 },  // Metatarso central
  FSR4: { x: 35, y: 55 },  // Mediopé lateral
  FSR5: { x: 52, y: 82 },  // Calcâneo
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
 * Pontos âncora do contorno do pé (vista plantar com dedos visíveis).
 * Coordenadas em espaço 0-100.
 *
 * Vista PLANTAR do pé DIREITO:
 *   - Dedão (hálux) no lado ESQUERDO (medial)
 *   - Mindinho no lado DIREITO (lateral)
 *
 * Percurso: dedão → dedos menores → borda lateral → calcanhar → borda medial → volta.
 * Para o pé esquerdo, espelha-se em x (100 - x).
 */
const FOOT_ANCHORS = [
  // Dedão (hálux) - lado esquerdo/medial
  [30, 14], [32, 7], [36, 3], [41, 6], [43, 12],
  // Dedos menores (2º a 5º) - indo para a direita/lateral
  [48, 7], [51, 12], [55, 7], [59, 12], [63, 8], [67, 13], [71, 10],
  // Borda lateral desce (lado direito)
  [76, 16], [80, 24], [83, 33], [84, 40],
  // Arco lateral (cintura do pé)
  [81, 50], [78, 58], [76, 64],
  // Calcanhar (arredondado)
  [73, 74], [67, 84], [58, 92], [50, 96], [42, 92], [33, 84], [27, 74],
  // Borda medial sobe (lado esquerdo)
  [24, 64], [22, 54], [20, 44], [19, 34], [21, 24], [25, 18],
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
 * Conforme Figura 2: Antepé (1-4), Mediopé (5-7), Calcâneo (8-9).
 */
export const FOOT_REGIONS = {
  forefoot: {
    label: 'Antepé',
    y: [0, 38],
    color: 'rgba(57, 255, 133, 0.08)',
    borderColor: 'rgba(57, 255, 133, 0.2)',
    sensors9: ['FSR1', 'FSR2', 'FSR3', 'FSR4'],
    sensors5: ['FSR1', 'FSR2'],
  },
  midfoot: {
    label: 'Mediopé',
    y: [38, 65],
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
