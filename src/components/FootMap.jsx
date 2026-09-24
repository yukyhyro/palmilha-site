import React, { useMemo, useState } from 'react';
import HeatmapCanvas from './HeatmapCanvas';
import { getSensorPositions, getFootOutlinePath, FOOT_REGIONS } from '../config/sensorLayout';

/**
 * FootMap
 *
 * Compõe a visualização completa de um pé:
 *   - Contorno SVG do pé (com dedos)
 *   - Heatmap Canvas (IDW interpolado, clipped ao contorno)
 *   - Marcadores dos sensores com tooltip
 *   - Indicadores de regiões anatômicas
 *
 * @param {'left'|'right'} side
 * @param {object} sensorValues - { FSR1: valor, FSR2: valor, ... }
 * @param {string[]} sensorNames
 * @param {object} scale - { min, max }
 * @param {string} title - Título do mapa
 */
export default function FootMap({ side, sensorValues, sensorNames, scale, title }) {
  const [tooltip, setTooltip] = useState(null);

  const mirror = side === 'left';
  const mapWidth = 200;
  const mapHeight = 300;
  const scaleX = mapWidth / 100;
  const scaleY = mapHeight / 100;

  // Posições dos sensores
  const positions = useMemo(() => {
    if (!sensorNames || sensorNames.length === 0) return {};
    return getSensorPositions(side, sensorNames);
  }, [side, sensorNames]);

  // Path SVG do contorno
  const outlinePath = useMemo(() => getFootOutlinePath(mirror), [mirror]);

  // Prepara dados para o heatmap
  const sensorSamples = useMemo(() => {
    if (!sensorValues || !positions) return [];
    return Object.entries(positions).map(([name, pos]) => ({
      x: pos.x,
      y: pos.y,
      value: sensorValues[name] || 0,
    }));
  }, [sensorValues, positions]);

  // Sem dados
  if (!sensorNames || sensorNames.length === 0) {
    return (
      <div className="foot-map-container empty">
        <h3 className="foot-map-title">
          {title || (side === 'right' ? 'Pé Direito' : 'Pé Esquerdo')}
        </h3>
        <div className="foot-map-empty">
          <svg width={mapWidth} height={mapHeight} viewBox={`0 0 ${mapWidth} ${mapHeight}`}>
            <path
              d={outlinePath}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1.5"
              transform={`scale(${scaleX}, ${scaleY})`}
            />
          </svg>
          <span className="foot-map-empty-text">Sem dados</span>
        </div>
      </div>
    );
  }

  return (
    <div className="foot-map-container">
      <h3 className="foot-map-title">
        {title || (side === 'right' ? 'Pé Direito' : 'Pé Esquerdo')}
      </h3>
      <div className="foot-map-visual" style={{ width: mapWidth, height: mapHeight, position: 'relative' }}>
        {/* Heatmap Canvas (fundo) */}
        <HeatmapCanvas
          sensorSamples={sensorSamples}
          mirror={mirror}
          scale={scale}
          width={mapWidth}
          height={mapHeight}
        />

        {/* Contorno SVG + Sensores (overlay) */}
        <svg
          width={mapWidth}
          height={mapHeight}
          viewBox={`0 0 100 100`}
          preserveAspectRatio="none"
          className="foot-map-overlay"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {/* Regiões anatômicas */}
          {Object.entries(FOOT_REGIONS).map(([key, region]) => (
            <rect
              key={key}
              x="5"
              y={region.y[0]}
              width="90"
              height={region.y[1] - region.y[0]}
              fill={region.color}
              stroke={region.borderColor}
              strokeWidth="0.3"
              strokeDasharray="2,2"
              rx="2"
            />
          ))}

          {/* Labels das regiões */}
          {Object.entries(FOOT_REGIONS).map(([key, region]) => (
            <text
              key={`label-${key}`}
              x={mirror ? 95 : 5}
              y={(region.y[0] + region.y[1]) / 2}
              fill="rgba(255,255,255,0.25)"
              fontSize="4"
              textAnchor={mirror ? 'end' : 'start'}
              dominantBaseline="middle"
              style={{ pointerEvents: 'none', fontFamily: 'Inter, sans-serif' }}
            >
              {region.label}
            </text>
          ))}

          {/* Contorno do pé */}
          <path
            d={outlinePath}
            fill="none"
            stroke="rgba(57, 255, 133, 0.5)"
            strokeWidth="0.8"
          />

          {/* Marcadores dos sensores */}
          {Object.entries(positions).map(([name, pos]) => {
            const val = sensorValues[name] || 0;
            const maxVal = scale ? scale.max : 1;
            const intensity = maxVal > 0 ? Math.min(val / maxVal, 1) : 0;

            return (
              <g
                key={name}
                onMouseEnter={() => setTooltip({ name, value: val, x: pos.x, y: pos.y })}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={2.5 + intensity * 2}
                  fill={`rgba(57, 255, 133, ${0.3 + intensity * 0.5})`}
                  stroke="rgba(57, 255, 133, 0.8)"
                  strokeWidth="0.4"
                />
                <text
                  x={pos.x}
                  y={pos.y + 0.8}
                  fill="white"
                  fontSize="2.8"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ pointerEvents: 'none', fontFamily: 'JetBrains Mono, monospace', fontWeight: 500 }}
                >
                  {val.toFixed(1)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="sensor-tooltip"
            style={{
              left: `${(tooltip.x / 100) * mapWidth}px`,
              top: `${(tooltip.y / 100) * mapHeight - 40}px`,
            }}
          >
            <strong>{tooltip.name}</strong>
            <span>{tooltip.value.toFixed(2)} kgf</span>
          </div>
        )}
      </div>
    </div>
  );
}
