import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
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
 *   - Cursor de tempo sincronizado com a timelineimport React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
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
 *   - Downsampling para performance (max 600 pontos)
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

const REGION_COLORS = {
  forefoot: 'rgba(57, 255, 133, 0.15)',
  midfoot: 'rgba(0, 200, 255, 0.15)',
  rearfoot: 'rgba(255, 180, 0, 0.15)',
};

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
  // Identifica as regiões com seus sensores
  const regions = useMemo(() => {
    if (!sensorNames || sensorNames.length === 0) return {};
    return getRegionSensors(sensorNames);
  }, [sensorNames]);

  // Prepara dados do gráfico (com downsampling)
  const chartData = useMemo(() => {
    if (!samples || samples.length === 0) return [];

    const raw = samples.map(s => {
      const point = { time: Math.round(s.time * 1000) / 1000 };
      for (const name of sensorNames) {
        point[name] = s.sensors[name] || 0;
      }
      return point;
    });

    return downsample(raw, 600);
  }, [samples, sensorNames]);

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
    return Math.ceil(max * 1.1) || 1; // 10% de margem
  }, [samples, sensorNames]);

  if (!samples || samples.length === 0 || Object.keys(regions).length === 0) {
    return null;
  }

  const regionEntries = Object.entries(regions);

  return (
    <div className="regional-chart-container">
      <h3 className="section-title">{title || 'Resposta por Região Anatômica'}</h3>
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
                  data={chartData}
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
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 2 }}
                    iconSize={10}
                    iconType="square"
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
                      stroke={SENSOR_COLORS[sensorName] || '#888'}
                      strokeWidth={1.5}
                      strokeDasharray={DASH_PATTERNS[sIdx % DASH_PATTERNS.length]}
                      dot={false}
                      activeDot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </div>
  );
}

 *   - Eixo X só no gráfico inferior
 *   - Downsampling para performance (max 600 pontos)
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

const REGION_COLORS = {
  forefoot: 'rgba(57, 255, 133, 0.15)',
  midfoot: 'rgba(0, 200, 255, 0.15)',
  rearfoot: 'rgba(255, 180, 0, 0.15)',
};

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
  // Identifica as regiões com seus sensores
  const regions = useMemo(() => {
    if (!sensorNames || sensorNames.length === 0) return {};
    return getRegionSensors(sensorNames);
  }, [sensorNames]);

  // Prepara dados do gráfico (com downsampling)
  const chartData = useMemo(() => {
    if (!samples || samples.length === 0) return [];

    const raw = samples.map(s => {
      const point = { time: Math.round(s.time * 1000) / 1000 };
      for (const name of sensorNames) {
        point[name] = s.sensors[name] || 0;
      }
      return point;
    });

    return downsample(raw, 600);
  }, [samples, sensorNames]);

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
    return Math.ceil(max * 1.1) || 1; // 10% de margem
  }, [samples, sensorNames]);

  if (!samples || samples.length === 0 || Object.keys(regions).length === 0) {
    return null;
  }

  const regionEntries = Object.entries(regions);

  return (
    <div className="regional-chart-container">
      <h3 className="section-title">{title || 'Resposta por Região Anatômica'}</h3>
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
                  data={chartData}
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
                  <Legend
                    wrapperStyle={{ fontSize: 10, paddingTop: 0 }}
                    iconType="plainline"
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
                      stroke={SENSOR_COLORS[sensorName] || '#888'}
                      strokeWidth={1.5}
                      strokeDasharray={DASH_PATTERNS[sIdx % DASH_PATTERNS.length]}
                      dot={false}
                      activeDot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </div>
  );
}
