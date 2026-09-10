/**
 * Parser robusto para arquivos de dados da palmilha.
 * Detecta automaticamente: delimitador, cabeçalho, colunas de tempo/FSR/TOTAL.
 * Aceita 5, 9 ou qualquer número de sensores.
 * Trata vírgula decimal, linhas vazias e linhas inválidas.
 */

const POSSIBLE_DELIMITERS = ['|', ';', ',', '\t'];

function detectDelimiter(lines) {
  const candidates = POSSIBLE_DELIMITERS.map(d => {
    const counts = lines.slice(0, Math.min(10, lines.length)).map(l => l.split(d).length);
    const consistent = counts.every(c => c === counts[0]) && counts[0] > 1;
    return { delimiter: d, columns: counts[0], consistent, avg: counts.reduce((a, b) => a + b, 0) / counts.length };
  });
  const best = candidates.filter(c => c.consistent && c.columns > 1).sort((a, b) => b.columns - a.columns)[0];
  if (best) return best.delimiter;
  // Fallback: escolhe o que produz mais colunas em média
  const fallback = candidates.sort((a, b) => b.avg - a.avg)[0];
  return fallback.columns > 1 ? fallback.delimiter : '|';
}

function parseNumericValue(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let cleaned = raw.trim();
  if (cleaned === '') return null;
  // Trata vírgula decimal: "1,5" -> "1.5", mas não "1,500" (separador de milhar)
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length <= 3) {
      cleaned = parts.join('.');
    }
  }
  const val = Number(cleaned);
  return isFinite(val) ? val : null;
}

function isHeaderRow(cells) {
  // Se a maioria das células não são números, provavelmente é cabeçalho
  const numericCount = cells.filter(c => parseNumericValue(c) !== null).length;
  return numericCount < cells.length / 2;
}

function identifyColumns(headerCells) {
  const result = { timeIndex: -1, sensorIndices: {}, totalIndex: -1, unit: null };

  headerCells.forEach((raw, idx) => {
    const cell = raw.trim().toUpperCase();

    // Detecta coluna de tempo
    if (/^TEMPO/.test(cell) || /^TIME/.test(cell) || cell === 'T') {
      result.timeIndex = idx;
      // Extrai unidade de tempo se presente: TEMPO(s), TEMPO(us)
      const unitMatch = raw.match(/\(([^)]+)\)/);
      if (unitMatch) result.timeUnit = unitMatch[1];
      return;
    }

    // Detecta colunas FSR
    const fsrMatch = cell.match(/^FSR\s*(\d+)/);
    if (fsrMatch) {
      const sensorId = parseInt(fsrMatch[1], 10);
      result.sensorIndices[`FSR${sensorId}`] = idx;
      // Extrai unidade se presente
      const unitMatch = raw.match(/\(([^)]+)\)/);
      if (unitMatch && !result.unit) result.unit = unitMatch[1];
      return;
    }

    // Detecta coluna TOTAL
    if (/^TOTAL/.test(cell)) {
      result.totalIndex = idx;
      return;
    }
  });

  return result;
}

export function parseFile(fileName, content) {
  try {
    const rawLines = content.split(/\r\n|\n|\r/);
    const lines = rawLines.map(l => l.trim()).filter(l => l.length > 0);

    if (lines.length === 0) {
      return { ok: false, error: 'O arquivo está vazio.' };
    }

    const delimiter = detectDelimiter(lines);
    const firstCells = lines[0].split(delimiter).map(c => c.trim());
    const hasHeader = isHeaderRow(firstCells);

    let columns;
    let dataStartIndex;

    if (hasHeader) {
      columns = identifyColumns(firstCells);
      dataStartIndex = 1;
    } else {
      // Sem cabeçalho: assume primeira coluna = tempo, restantes = FSR1, FSR2...
      columns = { timeIndex: 0, sensorIndices: {}, totalIndex: -1, unit: null };
      for (let i = 1; i < firstCells.length; i++) {
        columns.sensorIndices[`FSR${i}`] = i;
      }
      dataStartIndex = 0;
    }

    // Se não achou tempo, tenta a primeira coluna
    if (columns.timeIndex === -1) {
      columns.timeIndex = 0;
    }

    const sensorNames = Object.keys(columns.sensorIndices).sort((a, b) => {
      const na = parseInt(a.replace('FSR', ''), 10);
      const nb = parseInt(b.replace('FSR', ''), 10);
      return na - nb;
    });

    if (sensorNames.length === 0) {
      return { ok: false, error: 'Nenhuma coluna de sensor (FSR) encontrada.' };
    }

    const samples = [];
    const warnings = [];
    let prevTime = -Infinity;

    for (let i = dataStartIndex; i < lines.length; i++) {
      const cells = lines[i].split(delimiter).map(c => c.trim());
      const time = parseNumericValue(cells[columns.timeIndex]);

      if (time === null) {
        warnings.push(`Linha ${i + 1}: tempo inválido, ignorada.`);
        continue;
      }

      // Verifica se o tempo regride (duas gravações concatenadas)
      if (time < prevTime) {
        warnings.push(`Linha ${i + 1}: tempo regride (${prevTime} → ${time}). Dados a partir daqui ignorados.`);
        break;
      }
      prevTime = time;

      const sensorValues = {};
      let validSensors = 0;
      for (const name of sensorNames) {
        const idx = columns.sensorIndices[name];
        const val = idx < cells.length ? parseNumericValue(cells[idx]) : null;
        sensorValues[name] = val !== null ? val : 0;
        if (val !== null) validSensors++;
      }

      if (validSensors === 0) {
        warnings.push(`Linha ${i + 1}: sem dados de sensor válidos, ignorada.`);
        continue;
      }

      let total = null;
      if (columns.totalIndex >= 0 && columns.totalIndex < cells.length) {
        total = parseNumericValue(cells[columns.totalIndex]);
      }

      samples.push({ time, sensorValues, total });
    }

    if (samples.length === 0) {
      return { ok: false, error: 'Nenhum registro de dados válido encontrado.' };
    }

    return {
      ok: true,
      data: {
        fileName,
        sensorNames,
        unit: columns.unit || '',
        sampleCount: samples.length,
        duration: samples[samples.length - 1].time - samples[0].time,
        samples,
        warnings,
      },
    };
  } catch (err) {
    console.error('Erro no parser:', err);
    return { ok: false, error: 'Erro inesperado ao processar o arquivo.' };
  }
}
