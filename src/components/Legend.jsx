import React from 'react';

export default function Legend({ maxValue, unit }) {
  return (
    <div className="legend">
      <span className="legend-label">0</span>
      <div className="legend-gradient" />
      <span className="legend-label">{maxValue.toFixed(0)} {unit || ''}</span>
    </div>
  );
}
