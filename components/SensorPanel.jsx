import React, { useMemo } from 'react';

/**
 * SensorPanel
 *
 * Exibe cards individuais para cada sensor:
 *   - Nome do sensor
 *   - Valor atual
 *   - Barra de percentual
 *   - Nível de pressão (Baixo/Médio/Alto)
 *
 * O sensor de maior pressão é destacado.
 */
export default function SensorPanel({ sensorValues, sensorNames, scale }) {
  const maxVal = scale ? scale.max : 1;

  // Encontra o sensor com maior pressão
  const maxSensor = useMemo(() => {
    if (!sensorValues || !sensorNames) return null;
    let maxName = null;
    let maxValue = -1;
    for (const name of sensorNames) {
      const val = sensorValues[name] || 0;
      if (val > maxValue) {
        maxValue = val;
        maxName = name;
      }
    }
    return maxName;
  }, [sensorValues, sensorNames]);

  if (!sensorNames || sensorNames.length === 0) {
    return (
      <div className="sensor-panel">
        <h3 className="section-title">Sensores</h3>
        <div className="sensor-panel-empty">Nenhum dado carregado</div>
      </div>
    );
  }

  const getPressureLevel = (val) => {
    const pct = maxVal > 0 ? val / maxVal : 0;
    if (pct < 0.01) return { label: '—', className: 'none' };
    if (pct < 0.33) return { label: 'Baixo', className: 'low' };
    if (pct < 0.66) return { label: 'Médio', className: 'medium' };
    return { label: 'Alto', className: 'high' };
  };

  return (
    <div className="sensor-panel">
      <h3 className="section-title">Sensores</h3>
      <div className="sensor-cards">
        {sensorNames.map((name) => {
          const val = sensorValues ? (sensorValues[name] || 0) : 0;
          const pct = maxVal > 0 ? Math.min((val / maxVal) * 100, 100) : 0;
          const level = getPressureLevel(val);
          const isMax = name === maxSensor && val > 0;

          return (
            <div key={name} className={`sensor-card ${isMax ? 'sensor-max' : ''} ${level.className}`}>
              <div className="sensor-card-header">
                <span className="sensor-name">{name}</span>
                {isMax && <span className="sensor-peak-badge">MAX</span>}
              </div>
              <div className="sensor-value">{val.toFixed(2)}</div>
              <div className="sensor-unit">kgf</div>
              <div className="sensor-bar-container">
                <div
                  className="sensor-bar"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="sensor-meta">
                <span className="sensor-pct">{pct.toFixed(0)}%</span>
                <span className={`sensor-level level-${level.className}`}>{level.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
