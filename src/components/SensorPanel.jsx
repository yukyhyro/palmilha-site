import React from 'react';
import { heatColor } from '../services/heatmapProcessor';

function getLevel(percent) {
  if (percent >= 80) return 'Alto';
  if (percent >= 40) return 'Médio';
  if (percent > 0) return 'Baixo';
  return '—';
}

export default function SensorPanel({ sensorNames, sensorValues, maxValue, unit }) {
  if (!sensorNames || sensorNames.length === 0) return null;

  // Encontra o sensor com maior valor
  let maxSensor = '';
  let maxVal = -1;
  sensorNames.forEach(name => {
    const v = sensorValues[name] || 0;
    if (v > maxVal) { maxVal = v; maxSensor = name; }
  });

  return (
    <div className="sensor-grid">
      {sensorNames.map(name => {
        const value = sensorValues[name] || 0;
        const percent = maxValue > 0 ? (value / maxValue) * 100 : 0;
        const norm = maxValue > 0 ? value / maxValue : 0;
        const color = heatColor(norm);
        const colorStr = `rgb(${color.r},${color.g},${color.b})`;
        const isMax = name === maxSensor && maxVal > 0;

        return (
          <div key={name} className={`sensor-item ${isMax ? 'highlight' : ''}`}>
            <div className="sensor-name">{name}</div>
            <div className="sensor-value" style={{ color: value > 0 ? colorStr : 'var(--text-muted)' }}>
              {value.toFixed(1)}
            </div>
            <div className="sensor-bar-track">
              <div className="sensor-bar-fill" style={{ width: `${Math.min(percent, 100)}%`, background: colorStr }} />
            </div>
            <div className="sensor-percent">{percent.toFixed(0)}% · {getLevel(percent)}</div>
          </div>
        );
      })}
    </div>
  );
}
