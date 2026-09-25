import React, { useMemo, useState, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { getRegionSensors } from '../config/sensorLayout';

/**
 * RegionalChart
 *
 * Exibe 3 gráficos empilhados organizados por região anatômica do pé,
 * conforme a Figura 3 do projeto:
 *   - Antepé (FSR1–FSR4 em 9 sensores, FSR1–FSR2 em 5)
 *   - Mediopé (FSR5–FSR7 em 9 sensores, FSR3–FSR4 em 5)
 *   - Calcâneo (FSR8–FSR9 em 9 sensores, FSR5 em 5)
 *
 * Características:
 *   - Escala Y compartilhada entre os 3 gráficos
 *   - Linhas tracejadas para distinguir sensores
 *   - Cursor de tempo sincronizado com a timeline
 *   - Eixo X só no gráfico inferior
 *   - Zoom e navegação por janela de tempo
 *   - Downsampling para performance (max 800 pontos na janela visível)
 */

const SENSOR_COLORS = {
  FSR1: '#39ff85',
  FSR2: '#00d4ff',
  FSR3: '#ff6b6b',
  FSR4: '#ffd93d',
  FSR5: '#c084fc',
  FSR6: '#fb923c',
  FSR7: '#f472b6',
  FSR8: '#34d399',
  FSR9: '#60a5fa',
};

const DASH_PATTERNS = [
  '0',       // Sólido
  '8 4',     // Tracejado longo
  '4 4',     // Tracejado curto
  '2 2',     // Pontilhado
  '8 2 2 2', // Traço-ponto
];

/**
 * Legenda customizada — substitui a padrão do Recharts para evitar
 * bug de renderização no texto (ex: "FSR9)" sobreposto).
 */
function CustomLegend({ payload }) {
  if (!payload) return null;
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      gap: '16px',
      paddingTop: '4px',
      paddingBottom: '2px',
    }}>
      {payload.map((entry) => (
        <span
          key={entry.value}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.8)',
          }}
        >
          <span style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            backgroundColor: entry.color,
            borderRadius: '2px',
            flexShrink: 0,
          }} />
          {entry.value}
        </span>
      ))}
    </div>
  );
}

const ZOOM_LEVELS = [
  { label: '1s', value: 1 },
  { label: '5s', value: 5 },
  { label: '10s', value: 10 },
  { label: '30s', value: 30 },
  { label: 'Tudo', value: null },
];

function downsample(data, maxPoints) {
  if (data.length <= maxPoints) return data;
  const step = data.length / maxPoints;
  const result = [];
  for (let i = 0; i < maxPoints; i++) {
    result.push(data[Math.floor(i * step)]);
  }
  if (result[result.length - 1] !== data[data.length - 1]) {
    result.push(data[data.length - 1]);
  }
  return result;
}

export default function RegionalChart({ samples, sensorNames, currentTime, title }) {
  const [windowSize, setWindowSize] = useState(null);
  const [windowStart, setWindowStart] = useState(0);

  // Identifica as regiões com seus sensores
  const regions = useMemo(() => {
    if (!sensorNames || sensorNames.length === 0) return {};
    return getRegionSensors(sensorNames);
  }, [sensorNames]);

  // Dados completos (sem downsampling)
  const rawChartData = useMemo(() => {
    if (!samples || samples.length === 0) return [];
    return samples.map(s => {
      const point = { time: Math.round(s.time * 1000) / 1000 };
      for (const name of sensorNames) {
        point[name] = s.sensors[name] || 0;
      }
      return point;
    });
  }, [samples, sensorNames]);

  // Range total do tempo
  const timeRange = useMemo(() => {
    if (!rawChartData || rawChartData.length === 0) return { min: 0, max: 0, duration: 0 };
    const min = rawChartData[0].time;
    const max = rawChartData[rawChartData.length - 1].time;
    return { min, max, duration: max - min };
  }, [rawChartData]);

  // Dados visíveis (filtrados pela janela + downsampling)
  const visibleData = useMemo(() => {
    if (!rawChartData || rawChartData.length === 0) return [];

    let data = rawChartData;
    if (windowSize !== null) {
      const end = windowStart + windowSize;
      data = data.filter(d => d.time >= windowStart && d.time <= end);
    }

    return downsample(data, 800);
  }, [rawChartData, windowSize, windowStart]);

  // Zoom handler
  const handleZoom = useCallback((seconds) => {
    if (seconds === null) {
      setWindowSize(null);
      setWindowStart(0);
      return;
    }
    setWindowSize(seconds);
    // Se já está com zoom, mantém a posição central
    if (windowSize !== null) {
      const currentCenter = windowStart + windowSize / 2;
      const newStart = Math.max(timeRange.min, Math.min(currentCenter - seconds / 2, timeRange.max - seconds));
      setWindowStart(newStart);
    } else {
      // Centraliza no tempo atual se disponível
      if (currentTime != null) {
        const newStart = Math.max(timeRange.min, Math.min(currentTime - seconds / 2, timeRange.max - seconds));
        setWindowStart(newStart);
      } else {
        setWindowStart(timeRange.min);
      }
    }
  }, [windowSize, windowStart, timeRange, currentTime]);

  // Pan (navegar)
  const handlePan = useCallback((direction) => {
    if (windowSize === null) return;
    const step = windowSize * 0.25;
    const newStart = windowStart + (direction * step);
    const maxStart = timeRange.max - windowSize;
    setWindowStart(Math.max(timeRange.min, Math.min(newStart, maxStart)));
  }, [windowSize, windowStart, timeRange]);

  // Slider handler
  const handleSlider = useCallback((e) => {
    const val = parseFloat(e.target.value);
    setWindowStart(val);
  }, []);

  // Calcula a escala Y máxima compartilhada
  const sharedYMax = useMemo(() => {
    if (!samples || samples.length === 0) return 1;
    let max = 0;
    for (const sample of samples) {
      for (const name of sensorNames) {
        const val = sample.sensors[name] || 0;
        if (val > max) max = val;
      }
    }
    return Math.ceil(max * 1.1) || 1;
  }, [samples, sensorNames]);

  if (!samples || samples.length === 0 || Object.keys(regions).length === 0) {
    return null;
  }

  const regionEntries = Object.entries(regions);
  const maxSlider = windowSize !== null ? Math.max(timeRange.min, timeRange.max - windowSize) : 0;
  const windowEnd = windowSize !== null ? Math.min(windowStart + windowSize, timeRange.max) : timeRange.max;

  return (
    <div className="regional-chart-container">
      <h3 className="section-title">{title || 'Resposta por Região Anatômica'}</h3>

      {/* Controles de zoom */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        marginBottom: '8px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '8px',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginRight: '4px' }}>
          Zoom:
        </span>
        {ZOOM_LEVELS.map(level => (
          <button
            key={level.label}
            onClick={() => handleZoom(level.value)}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontFamily: 'JetBrains Mono, monospace',
              border: '1px solid',
              borderColor: windowSize === level.value ? '#39ff85' : 'rgba(255,255,255,0.15)',
              borderRadius: '4px',
              background: windowSize === level.value ? 'rgba(57, 255, 133, 0.15)' : 'rgba(255,255,255,0.05)',
              color: windowSize === level.value ? '#39ff85' : 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {level.label}
          </button>
        ))}

        {/* Navegação quando zoom ativo */}
        {windowSize !== null && (
          <>
            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
            <button
              onClick={() => handlePan(-1)}
              style={{
                padding: '4px 8px',
                fontSize: '13px',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '4px',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
              }}
            >
              ◀
            </button>
            <input
              type="range"
              min={timeRange.min}
              max={maxSlider}
              step={0.1}
              value={windowStart}
              onChange={handleSlider}
              style={{
                flex: '1',
                minWidth: '120px',
                accentColor: '#39ff85',
                cursor: 'pointer',
              }}
            />
            <button
              onClick={() => handlePan(1)}
              style={{
                padding: '4px 8px',
                fontSize: '13px',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '4px',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
              }}
            >
              ▶
            </button>
            <span style={{
              fontSize: '11px',
              fontFamily: 'JetBrains Mono, monospace',
              color: '#39ff85',
              whiteSpace: 'nowrap',
            }}>
              {windowStart.toFixed(1)}s — {windowEnd.toFixed(1)}s
            </span>
          </>
        )}
      </div>

      <div className="regional-charts-stack">
        {regionEntries.map(([regionId, region], regionIdx) => {
          const isLast = regionIdx === regionEntries.length - 1;

          return (
            <div key={regionId} className="regional-chart-item">
              <div className="regional-chart-label" style={{ borderLeftColor: region.color }}>
                {region.label}
                <span className="regional-chart-sensors">
                  {region.sensors.join(', ')}
                </span>
              </div>
              <ResponsiveContainer width="100%" height={isLast ? 180 : 150}>
                <LineChart
                  data={visibleData}
                  margin={{ top: 5, right: 20, left: 10, bottom: isLast ? 25 : 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                  />
                  {/* Eixo X apenas no último gráfico */}
                  <XAxis
                    dataKey="time"
                    stroke="rgba(255,255,255,0.3)"
                    tick={isLast ? { fontSize: 10, fill: 'rgba(255,255,255,0.5)' } : false}
                    tickFormatter={(v) => `${v.toFixed(1)}s`}
                    axisLine={isLast}
                    tickLine={isLast}
                    label={isLast ? {
                      value: 'Tempo (s)',
                      position: 'insideBottom',
                      offset: -15,
                      style: { fill: 'rgba(255,255,255,0.4)', fontSize: 10 },
                    } : undefined}
                  />
                  <YAxis
                    domain={[0, sharedYMax]}
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }}
                    width={45}
                    label={{
                      value: 'kgf',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fill: 'rgba(255,255,255,0.3)', fontSize: 10 },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1f2e',
                      border: `1px solid ${region.color}`,
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: 11,
                    }}
                    formatter={(val, name) => [`${val.toFixed(2)} kgf`, name]}
                    labelFormatter={(label) => `Tempo: ${label}s`}
                  />
                  {/* Cursor de tempo */}
                  {currentTime != null && (
                    <ReferenceLine
                      x={Math.round(currentTime * 1000) / 1000}
                      stroke="rgba(57, 255, 133, 0.5)"
                      strokeDasharray="4 4"
                      strokeWidth={1}
                    />
                  )}

                  {/* Linhas de cada sensor da região */}
                  {region.sensors.map((sensorName, sIdx) => (
                    <Line
                      key={sensorName}
                      type="monotone"
                      dataKey={sensorName}
                      name={sensorName}
                      stroke={SENSOR_COLORS[sensorName] || '#888'}
                      strokeWidth={1.5}
                      strokeDasharray={DASH_PATTERNS[sIdx % DASH_PATTERNS.length]}
                      dot={false}
                      activeDot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
              {/* Legenda fora do Recharts para evitar overlap com eixo X */}
              <CustomLegend payload={region.sensors.map(s => ({ value: s, color: SENSOR_COLORS[s] || '#888' }))} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
