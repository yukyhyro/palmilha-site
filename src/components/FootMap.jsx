import React, { useState } from 'react';
import { getSensorPositions, getFootOutlinePath, REGION_LABELS } from '../config/sensorLayout';
import HeatmapCanvas from './HeatmapCanvas';

export default function FootMap({ side, sensorValues, sensorNames, maxValue, unit }) {
  const [tooltip, setTooltip] = useState(null);
  const positions = getSensorPositions(side, sensorNames);
  const mirror = side === 'right';
  const outlinePath = getFootOutlinePath(mirror);

  const sensorSamples = sensorNames
    .filter(name => positions[name] && sensorValues[name] !== undefined)
    .map(name => ({
      x: positions[name].x,
      y: positions[name].y,
      value: sensorValues[name] || 0,
    }));

  return (
    <div className="foot-map-wrapper">
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <path d={outlinePath} fill="#1a2332" stroke="#253344" strokeWidth="0.6" />
      </svg>

      <HeatmapCanvas side={side} sensorSamples={sensorSamples} maxValue={maxValue} />

      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <path d={outlinePath} fill="none" stroke="#39ff85" strokeWidth="0.4" strokeOpacity="0.4" />
      </svg>

      <div style={{ position: 'absolute', inset: 0 }}>
        {sensorNames.map(name => {
          const pos = positions[name];
          if (!pos) return null;
          const value = sensorValues[name];
          const hasData = value !== undefined && value !== null;

          return (
            <div
              key={name}
              style={{
                position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)', cursor: 'pointer',
              }}
              onMouseEnter={() => setTooltip({ name, value, region: pos.region, x: pos.x, y: pos.y })}
              onMouseLeave={() => setTooltip(null)}
            >
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                border: `2px solid ${hasData ? 'rgba(57,255,133,0.6)' : 'rgba(255,255,255,0.2)'}`,
                background: hasData ? 'rgba(57,255,133,0.15)' : 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontFamily: 'var(--font-mono)', color: hasData ? '#39ff85' : '#556677',
              }}>
                {name.replace('FSR', '')}
              </div>
            </div>
          );
        })}
      </div>

      {tooltip && (
        <div style={{
          position: 'absolute', left: `${tooltip.x}%`, top: `${tooltip.y}%`,
          transform: 'translate(-50%, -130%)', zIndex: 10,
          background: '#12181C', border: '1px solid #253344', borderRadius: 6,
          padding: '6px 10px', whiteSpace: 'nowrap', fontSize: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        }}>
          <div style={{ fontWeight: 600, color: '#39ff85' }}>{tooltip.name}</div>
          <div style={{ color: '#8899aa', fontSize: 11 }}>{REGION_LABELS[tooltip.region] || ''}</div>
          <div style={{ fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            {tooltip.value !== undefined && tooltip.value !== null
              ? `${tooltip.value.toFixed(2)} ${unit || ''}`
              : 'sem dado'}
          </div>
        </div>
      )}
    </div>
  );
}
