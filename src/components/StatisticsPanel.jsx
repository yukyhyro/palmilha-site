import React from 'react';

export default function StatisticsPanel({ stats, unit }) {
  if (!stats) {
    return (
      <div className="empty-state" style={{ padding: '24px' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Carregue um arquivo para ver as estatísticas</div>
      </div>
    );
  }

  const u = unit || '';
  const items = [
    { label: 'Pressão Máxima', value: stats.globalMax.toFixed(2), unit: u, detail: stats.globalMaxSensor },
    { label: 'Pressão Média', value: stats.globalMean.toFixed(2), unit: u },
    { label: 'Pico em', value: stats.globalMaxTime.toFixed(2), unit: 's' },
    { label: 'Registros', value: stats.sampleCount },
    { label: 'Duração', value: stats.duration.toFixed(2), unit: 's' },
  ];

  if (stats.totalMax !== null) {
    items.push({ label: 'Total Máximo', value: stats.totalMax.toFixed(2), unit: u });
  }

  return (
    <div className="stats-grid">
      {items.map((item, i) => (
        <div key={i} className="stat-item">
          <div className="stat-label">{item.label}</div>
          <div className="stat-value">
            {item.value}
            {item.unit && <span className="stat-unit">{item.unit}</span>}
          </div>
          {item.detail && <div className="stat-detail">{item.detail}</div>}
        </div>
      ))}
    </div>
  );
}
