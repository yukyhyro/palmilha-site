import React from 'react';

/**
 * Legend
 *
 * Barra de gradiente de cores indicando a escala do heatmap.
 * Mostra min e max com unidade.
 */
export default function Legend({ min, max }) {
  const formatVal = (v) => {
    if (v == null || isNaN(v)) return '0';
    return v.toFixed(1);
  };

  return (
    <div className="heatmap-legend">
      <span className="legend-label">{formatVal(min)}</span>
      <div className="legend-gradient" />
      <span className="legend-label">{formatVal(max)}</span>
      <span className="legend-unit">kgf</span>
    </div>
  );
}
