import React from 'react';

/**
 * StatisticsPanel
 *
 * Grid de estatísticas calculadas a partir dos dados:
 *   - Pressão máxima
 *   - Pressão média
 *   - Sensor de maior pressão
 *   - Momento do pico
 *   - Duração da coleta
 *   - Quantidade de registros
 */
export default function StatisticsPanel({ statistics }) {
  if (!statistics) {
    return (
      <div className="statistics-panel">
        <h3 className="section-title">Estatísticas</h3>
        <div className="stats-empty">Carregue um arquivo para ver as estatísticas</div>
      </div>
    );
  }

  const formatTime = (seconds) => {
    if (seconds == null || isNaN(seconds)) return '—';
    if (seconds < 60) return `${seconds.toFixed(3)}s`;
    const min = Math.floor(seconds / 60);
    const sec = (seconds % 60).toFixed(1);
    return `${min}m ${sec}s`;
  };

  const stats = [
    {
      label: 'Pressão Máxima',
      value: `${statistics.maxPressure} kgf`,
      icon: '⬆',
    },
    {
      label: 'Pressão Média',
      value: `${statistics.meanPressure} kgf`,
      icon: '≈',
    },
    {
      label: 'Sensor de Pico',
      value: statistics.maxPressureSensor,
      icon: '◎',
    },
    {
      label: 'Momento do Pico',
      value: formatTime(statistics.maxPressureTime),
      icon: '⏱',
    },
    {
      label: 'Duração',
      value: formatTime(statistics.duration),
      icon: '⏳',
    },
    {
      label: 'Registros',
      value: statistics.totalSamples.toLocaleString(),
      icon: '📊',
    },
  ];

  return (
    <div className="statistics-panel">
      <h3 className="section-title">Estatísticas</h3>
      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <span className="stat-card-icon">{stat.icon}</span>
            <div className="stat-card-content">
              <span className="stat-card-value">{stat.value}</span>
              <span className="stat-card-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
