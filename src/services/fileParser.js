/**
 * fileParser.js
 *
 * Parser robusto para arquivos de dados de pressão plantar.
 * Detecta automaticamente:
 *   - Delimitador (|, ;, , ou tabulação)
 *   - Cabeçalho
 *   - Coluna de tempo
 *   - Colunas FSR (sensores)
 *   - Coluna TOTAL
 *
 * Suporta:
 *   - Arquivos com 5 ou 9 sensores
 *   - Números com vírgula decimal
 *   - Linhas vazias e inválidas (ignoradas)
 *   - Detecção de concatenação (regressão temporal)
 */

const DELIMITERS = ['|', ';', ',', '\t'];

/**
 * Detecta o delimitador mais provável analisando as primeiras linhas.
 */
function detectDelimiter(lines) {
  const candidateLines = lines.slice(0, Math.min(10, lines.length));

  let bestDelimiter = '|';
  let bestScore = 0;

  for (const delim of DELIMITERS) {
    const counts = candidateLines.map(l => l.split(delim).length);
    const nonTrivial = counts.filter(c => c > 1);
    if (nonTrivial.length === 0) continue;

    // Consistência: todas as linhas com mesmo número de colunas
    const mode = nonTrivial[0];
    const consistent = nonTrivial.filter(c => c === mode).length;
    const score = consistent * mode;

    if (score > bestScore) {
      bestScore = score;
      bestDelimiter = delim;
    }
  }

  return bestDelimiter;
}

/**
 * Converte string numérica para número, suportando vírgula decimal.
 */
function parseNumber(str) {
  if (!str || str.trim() === '') return NaN;
  let cleaned = str.trim();
  // Se contém vírgula mas não ponto, troca vírgula por ponto
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    cleaned = cleaned.replace(',', '.');
  }
  return parseFloat(cleaned);
}

/**
 * Identifica colunas relevantes no cabeçalho.
 */
function identifyColumns(headers) {
  const result = {
    timeIndex: -1,
    intervalIndex: -1,
    sampleIndex: -1,
    fsrIndices: [],
    fsrNames: [],
    totalIndex: -1,
  };

  headers.forEach((h, i) => {
    const upper = h.toUpperCase().trim();

    if (upper.includes('TEMPO') || upper === 'TIME' || upper === 'T(S)' || upper === 'TEMPO(S)') {
      result.timeIndex = i;
    } else if (upper.includes('INTERVALO') || upper === 'INTERVAL' || upper === 'DT') {
      result.intervalIndex = i;
    } else if (upper.includes('AMOSTRA') || upper === 'SAMPLE' || upper === 'N') {
      result.sampleIndex = i;
    } else if (upper.includes('TOTAL')) {
      result.totalIndex = i;
    } else if (/FSR\d+/.test(upper) || /SENSOR\d+/.test(upper) || /S\d+/.test(upper)) {
      result.fsrIndices.push(i);
      // Extrai o nome padronizado FSRn
      const match = upper.match(/(?:FSR|SENSOR|S)(\d+)/);
      if (match) {
        result.fsrNames.push('FSR' + match[1]);
      } else {
        result.fsrNames.push(upper);
      }
    }
  });

  return result;
}

/**
 * Detecta se a primeira linha é cabeçalho (contém texto não-numérico).
 */
function isHeaderLine(fields) {
  // Se pelo menos 2 campos contêm letras, é cabeçalho
  const textFields = fields.filter(f => /[a-zA-Z]/.test(f.trim()));
  return textFields.length >= 2;
}

/**
 * Faz o parse completo de um arquivo de dados de pressão plantar.
 *
 * @param {string} text - Conteúdo do arquivo
 * @returns {{ samples: Array, sensorNames: string[], stats: object, error: string|null }}
 */
export function parseFile(text) {
  try {
    if (!text || text.trim().length === 0) {
      return { samples: [], sensorNames: [], stats: {}, error: 'Arquivo vazio' };
    }

    // Normaliza line breaks
    const rawLines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

    // Filtra linhas vazias
    const lines = rawLines.filter(l => l.trim().length > 0);

    if (lines.length < 2) {
      return { samples: [], sensorNames: [], stats: {}, error: 'Arquivo com dados insuficientes' };
    }

    // Detecta delimitador
    const delimiter = detectDelimiter(lines);

    // Divide todas as linhas
    const splitLines = lines.map(l => l.split(delimiter).map(f => f.trim()));

    // Detecta cabeçalho
    let headers;
    let dataStartIndex;

    if (isHeaderLine(splitLines[0])) {
      headers = splitLines[0];
      dataStartIndex = 1;
    } else {
      // Gera cabeçalho genérico
      const numCols = splitLines[0].length;
      headers = Array.from({ length: numCols }, (_, i) => `COL${i + 1}`);
      dataStartIndex = 0;
    }

    // Identifica colunas
    const cols = identifyColumns(headers);

    // Se não encontrou FSRs pelo nome, tenta inferir
    if (cols.fsrIndices.length === 0) {
      // Assume que colunas numéricas (exceto tempo/amostra/total) são sensores
      const excludeIndices = new Set([cols.timeIndex, cols.intervalIndex, cols.sampleIndex, cols.totalIndex].filter(i => i >= 0));
      headers.forEach((h, i) => {
        if (!excludeIndices.has(i)) {
          const testVal = dataStartIndex < splitLines.length ? parseNumber(splitLines[dataStartIndex][i]) : NaN;
          if (!isNaN(testVal)) {
            cols.fsrIndices.push(i);
            cols.fsrNames.push('FSR' + (cols.fsrIndices.length));
          }
        }
      });
    }

    if (cols.fsrIndices.length === 0) {
      return { samples: [], sensorNames: [], stats: {}, error: 'Não foi possível identificar colunas de sensores no arquivo' };
    }

    // Parse das linhas de dados
    const samples = [];
    let lastTime = -Infinity;
    let timeRegressionDetected = false;
    let invalidLines = 0;

    for (let i = dataStartIndex; i < splitLines.length; i++) {
      const fields = splitLines[i];

      // Ignora linhas com número errado de colunas
      if (fields.length < cols.fsrIndices[cols.fsrIndices.length - 1] + 1) {
        invalidLines++;
        continue;
      }

      // Extrai tempo
      let time = null;
      if (cols.timeIndex >= 0) {
        time = parseNumber(fields[cols.timeIndex]);
        if (isNaN(time)) time = null;
      }

      // Fallback: usa índice se sem tempo
      if (time === null) {
        time = samples.length;
      }

      // Detecta regressão temporal (concatenação de arquivos)
      if (time < lastTime - 0.001 && samples.length > 5) {
        timeRegressionDetected = true;
        // Usa apenas a primeira sequência
        break;
      }
      lastTime = time;

      // Extrai intervalo se disponível
      let interval = null;
      if (cols.intervalIndex >= 0) {
        interval = parseNumber(fields[cols.intervalIndex]);
        if (isNaN(interval)) interval = null;
      }

      // Extrai valores dos sensores
      const sensorValues = {};
      let allNaN = true;
      for (let j = 0; j < cols.fsrIndices.length; j++) {
        const val = parseNumber(fields[cols.fsrIndices[j]]);
        sensorValues[cols.fsrNames[j]] = isNaN(val) ? 0 : val;
        if (!isNaN(val)) allNaN = false;
      }

      // Pula linhas onde todos os sensores são NaN
      if (allNaN && cols.fsrIndices.length > 0) {
        invalidLines++;
        continue;
      }

      // Extrai total
      let total = null;
      if (cols.totalIndex >= 0) {
        total = parseNumber(fields[cols.totalIndex]);
        if (isNaN(total)) total = null;
      }

      // Calcula total se não disponível
      if (total === null) {
        total = Object.values(sensorValues).reduce((s, v) => s + v, 0);
      }

      samples.push({
        index: samples.length,
        time,
        interval,
        sensors: sensorValues,
        total,
      });
    }

    if (samples.length === 0) {
      return { samples: [], sensorNames: [], stats: {}, error: 'Nenhum registro válido encontrado no arquivo' };
    }

    // Estatísticas básicas
    const duration = samples[samples.length - 1].time - samples[0].time;
    const stats = {
      totalSamples: samples.length,
      duration: duration > 0 ? duration : samples.length,
      sensorCount: cols.fsrNames.length,
      startTime: samples[0].time,
      endTime: samples[samples.length - 1].time,
      invalidLines,
      timeRegressionDetected,
    };

    return {
      samples,
      sensorNames: cols.fsrNames,
      stats,
      error: null,
      warning: timeRegressionDetected
        ? 'Detectada regressão temporal (possível concatenação). Usando apenas a primeira sequência.'
        : null,
    };
  } catch (err) {
    console.error('Erro no parser:', err);
    return { samples: [], sensorNames: [], stats: {}, error: 'Erro inesperado ao processar o arquivo: ' + err.message };
  }
}
