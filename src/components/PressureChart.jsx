import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

/**
 * PressureChart
 *
 * Gráfico de pressão ao longo do tempo usando Recharts.
 * Mostra a evolução de cada sensor e do total.
 * Inclui cursor de tempo (ReferenceLine) sincronizado com a timeline.
 *
 * Faz amostragem dos dados para performance (max 600 pontos).
 */

// Cores distintas para cada sensor
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
  TOTAL: 'rgba(255,255,255,0.5)',
};

/**
 * Faz downsampling para evitar renderizar milhares de pontos.
 */
function downsample(data, maxPoints) {
  if (data.length <= maxPoints) return data;
  const step = data.length / maxPoints;
  const result = [];
  for (let i = 0; i < maxPoints; i++) {
    result.push(data[Math.floor(i * step)]);
  }
  // Sempre inclui o último ponto
  if (result[result.length - 1] !== data[data.length - 1]) {
    result.push(data[data.length - 1]);
  }
  return result;
}

export default function PressureChart({ samples, sensorNames, currentTime, title }) {
  const chartData = useMemo(() => {
    if (!samples || samples.length === 0) return [];

    const raw = samples.map(s => {
      const point = { time: Math.round(s.time * 1000) / 1000 };
      for (const name of sensorNames) {
        point[name] = s.sensors[name] || 0;
      }
      point.total = s.total || 0;
      return point;
    });

    return downsample(raw, 600);
  }, [samples, sensorNames]);

  if (!samples || samples.length === 0 || !sensorNames || sensorNames.length === 0) {
    return null;
  }

  return (
    <div className="chart-container">
      <h3 className="section-title">{title || 'Pressão ao longo do tempo'}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="time"
            stroke="rgba(255,255,255,0.4)"
            tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }}
            tickFormatter={(v) => `${v.toFixed(1)}s`}
          />
          <YAxis
            stroke="rgba(255,255,255,0.4)"
            tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }}
            label={{
              value: 'kgf',
              angle: -90,
              position: 'insideLeft',
              style: { fill: 'rgba(255,255,255,0.4)', fontSize: 11 },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1f2e',
              border: '1px solid rgba(57, 255, 133, 0.2)',
              borderRadius: 8,
              color: '#fff',
              fontSize: 12,
            }}
            formatter={(val, name) => [`${val.toFixed(2)} kgf`, name]}
            labelFormatter={(label) => `Tempo: ${label}s`}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}
          />

          {/* Cursor de tempo */}
          {currentTime != null && (
            <ReferenceLine
              x={Math.round(currentTime * 1000) / 1000}
              stroke="rgba(57, 255, 133, 0.6)"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
          )}

          {/* Linhas dos sensores */}
          {sensorNames.map((name) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={SENSOR_COLORS[name] || '#888'}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
