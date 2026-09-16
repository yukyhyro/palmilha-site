import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316'];

const tooltipStyle = {
  backgroundColor: '#12181C', border: '1px solid #253344',
  borderRadius: 6, fontSize: 11, color: '#e6edf5',
};

export default function PressureChart({ data, currentTime, title }) {
  const chartData = useMemo(() => {
    if (!data || !data.samples) return [];
    // Amostra no máximo 500 pontos para performance
    const samples = data.samples;
    const step = samples.length > 500 ? Math.floor(samples.length / 500) : 1;
    const result = [];
    for (let i = 0; i < samples.length; i += step) {
      const s = samples[i];
      const point = { time: Number(s.time.toFixed(3)) };
      data.sensorNames.forEach(name => { point[name] = s.sensorValues[name] || 0; });
      if (s.total !== null && s.total !== undefined) point.TOTAL = s.total;
      result.push(point);
    }
    return result;
  }, [data]);

  if (chartData.length === 0) return null;

  return (
    <div>
      <div className="card-title">{title}</div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="time" type="number" domain={['dataMin', 'dataMax']}
              tickFormatter={v => `${Number(v).toFixed(0)}s`}
              tick={{ fontSize: 10, fill: '#556677' }} stroke="#1e2a3a"
            />
            <YAxis tick={{ fontSize: 10, fill: '#556677' }} stroke="#1e2a3a" width={40} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={v => `${Number(v).toFixed(3)}s`}
              formatter={(v, name) => [Number(v).toFixed(2), name]} />
            <ReferenceLine x={Number(currentTime.toFixed(3))} stroke="#39ff85" strokeDasharray="4 3" strokeWidth={1.5} />
            {data.sensorNames.map((name, i) => (
              <Line key={name} dataKey={name} stroke={COLORS[i % COLORS.length]}
                strokeWidth={1.5} dot={false} isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
