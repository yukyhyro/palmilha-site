import React, { useState, useMemo, useCallback } from 'react';
import FileUploader from './components/FileUploader';
import FootMap from './components/FootMap';
import Timeline from './components/Timeline';
import SensorPanel from './components/SensorPanel';
import StatisticsPanel from './components/StatisticsPanel';
import PressureChart from './components/PressureChart';
import Legend from './components/Legend';
import { useTimeline } from './hooks/useTimeline';
import { findSampleAtTime } from './services/sampleLookup';
import {
  computeStatistics,
  computeAutoScale,
  computeTimeWeightedAverage,
} from './services/statisticsCalculator';

export default function App() {
  const [leftData, setLeftData] = useState(null);
  const [rightData, setRightData] = useState(null);

  const hasData = leftData || rightData;

  const duration = useMemo(() => {
    if (leftData && rightData) return Math.min(leftData.duration, rightData.duration);
    if (leftData) return leftData.duration;
    if (rightData) return rightData.duration;
    return 0;
  }, [leftData, rightData]);

  const timeline = useTimeline(duration);

  const maxValue = useMemo(() => computeAutoScale(leftData, rightData), [leftData, rightData]);

  // ─── Amostras no instante atual (mapa dinâmico) ───
  const leftSample = leftData ? findSampleAtTime(leftData.samples, timeline.currentTime) : null;
  const rightSample = rightData ? findSampleAtTime(rightData.samples, timeline.currentTime) : null;

  // ─── Média ponderada pelo tempo (Mapa de Pressão Geral) ───
  const leftGeneralAvg = useMemo(() => computeTimeWeightedAverage(leftData), [leftData]);
  const rightGeneralAvg = useMemo(() => computeTimeWeightedAverage(rightData), [rightData]);

  // Escala para o mapa geral (máximo entre as médias ponderadas)
  const generalMaxValue = useMemo(() => {
    let max = 0;
    if (leftGeneralAvg) Object.values(leftGeneralAvg).forEach(v => { if (v > max) max = v; });
    if (rightGeneralAvg) Object.values(rightGeneralAvg).forEach(v => { if (v > max) max = v; });
    return max > 0 ? Math.ceil(max) : 1;
  }, [leftGeneralAvg, rightGeneralAvg]);

  const currentIndex = useMemo(() => {
    const data = leftData || rightData;
    if (!data || !data.samples.length) return 0;
    const sample = findSampleAtTime(data.samples, timeline.currentTime);
    return data.samples.indexOf(sample);
  }, [leftData, rightData, timeline.currentTime]);

  const totalSamples = (leftData || rightData)?.sampleCount || 0;

  const leftStats = useMemo(() => computeStatistics(leftData), [leftData]);
  const rightStats = useMemo(() => computeStatistics(rightData), [rightData]);

  const unit = rightData?.unit || leftData?.unit || '';

  const allSensorNames = useMemo(() => {
    const set = new Set();
    leftData?.sensorNames.forEach(n => set.add(n));
    rightData?.sensorNames.forEach(n => set.add(n));
    return Array.from(set).sort((a, b) => parseInt(a.replace('FSR', '')) - parseInt(b.replace('FSR', '')));
  }, [leftData, rightData]);

  const handleLeftParsed = useCallback((data) => setLeftData(data), []);
  const handleRightParsed = useCallback((data) => setRightData(data), []);

  return (
    <div className="app">
      {/* ─── Header ─── */}
      <header className="header">
        <div className="header-logo">
          <h1>Podo<span>Sense</span></h1>
        </div>
        <div className="header-badge">Visualização e análise de pressão plantar</div>
      </header>

      <main className="main-content">
        {/* ─── Upload ─── */}
        <div className="card">
          <div className="card-title">Importar Dados</div>
          <div className="upload-grid">
            <FileUploader label="🦶 Pé Esquerdo" onParsed={handleLeftParsed} />
            <FileUploader label="🦶 Pé Direito" onParsed={handleRightParsed} />
          </div>
        </div>

        {/* ─── Estado vazio ─── */}
        {!hasData && (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-title">Nenhum arquivo carregado</div>
              <div className="empty-state-text">
                Importe os arquivos de dados (.txt) dos sensores para iniciar a análise de pressão plantar.
              </div>
            </div>
          </div>
        )}

        {/* ─── Dashboard ─── */}
        {hasData && (
          <>
            {/* ═══ MAPA DE PRESSÃO DINÂMICO (segue a timeline) ═══ */}
            <div className="card">
              <div className="card-title">Mapa de Pressão — Instante Atual</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                Pressão no instante selecionado na timeline. Mova o controle abaixo para navegar.
              </div>
              <div className="feet-grid">
                {leftData && (
                  <div className="foot-container">
                    <div className="foot-label">Pé Esquerdo</div>
                    <FootMap
                      side="left"
                      sensorValues={leftSample?.sensorValues || {}}
                      sensorNames={leftData.sensorNames}
                      maxValue={maxValue}
                      unit={unit}
                    />
                  </div>
                )}
                {rightData && (
                  <div className="foot-container">
                    <div className="foot-label">Pé Direito</div>
                    <FootMap
                      side="right"
                      sensorValues={rightSample?.sensorValues || {}}
                      sensorNames={rightData.sensorNames}
                      maxValue={maxValue}
                      unit={unit}
                    />
                  </div>
                )}
              </div>
              <Legend maxValue={maxValue} unit={unit} />
            </div>

            {/* ─── Timeline ─── */}
            <div className="card">
              <div className="card-title">Linha do Tempo</div>
              <Timeline
                currentTime={timeline.currentTime}
                duration={duration}
                isPlaying={timeline.isPlaying}
                speed={timeline.speed}
                sampleIndex={currentIndex}
                sampleCount={totalSamples}
                onSeek={timeline.seek}
                onPlay={timeline.play}
                onPause={timeline.pause}
                onReset={timeline.reset}
                onStepForward={timeline.stepForward}
                onStepBackward={timeline.stepBackward}
                onSpeedChange={timeline.setSpeed}
              />
            </div>

            {/* ═══ MAPA DE PRESSÃO GERAL (NÃO segue a timeline) ═══ */}
            <div className="card">
              <div className="card-title">Mapa de Pressão Geral</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                Visão geral de toda a coleta — média ponderada pelo tempo.
                Regiões mais solicitadas durante todo o período aparecem mais intensas.
                <span style={{ display: 'block', marginTop: 4, fontStyle: 'italic', fontSize: 11, color: 'var(--text-muted)', opacity: 0.7 }}>
                  A interpolação entre sensores é uma estimativa visual, não uma medição direta.
                </span>
              </div>
              <div className="feet-grid">
                {leftData && leftGeneralAvg && (
                  <div className="foot-container">
                    <div className="foot-label">Pé Esquerdo</div>
                    <FootMap
                      side="left"
                      sensorValues={leftGeneralAvg}
                      sensorNames={leftData.sensorNames}
                      maxValue={generalMaxValue}
                      unit={unit}
                    />
                  </div>
                )}
                {rightData && rightGeneralAvg && (
                  <div className="foot-container">
                    <div className="foot-label">Pé Direito</div>
                    <FootMap
                      side="right"
                      sensorValues={rightGeneralAvg}
                      sensorNames={rightData.sensorNames}
                      maxValue={generalMaxValue}
                      unit={unit}
                    />
                  </div>
                )}
              </div>
              <Legend maxValue={generalMaxValue} unit={unit} />
            </div>

            {/* ─── Sensores + Estatísticas ─── */}
            <div className="section-row">
              <div className="card">
                <div className="card-title">Sensores — Instante Atual</div>
                <SensorPanel
                  sensorNames={allSensorNames}
                  sensorValues={{
                    ...(leftSample?.sensorValues || {}),
                    ...(rightSample?.sensorValues || {}),
                  }}
                  maxValue={maxValue}
                  unit={unit}
                />
              </div>

              <div className="card">
                <div className="card-title">Estatísticas</div>
                {leftStats && (
                  <div style={{ marginBottom: leftStats && rightStats ? 16 : 0 }}>
                    {rightStats && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Pé Esquerdo</div>}
                    <StatisticsPanel stats={leftStats} unit={unit} />
                  </div>
                )}
                {rightStats && (
                  <div>
                    {leftStats && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Pé Direito</div>}
                    <StatisticsPanel stats={rightStats} unit={unit} />
                  </div>
                )}
              </div>
            </div>

            {/* ─── Gráficos ─── */}
            <div className="section-row">
              {leftData && (
                <div className="card">
                  <PressureChart data={leftData} currentTime={timeline.currentTime} title="Pé Esquerdo — Pressão × Tempo" />
                </div>
              )}
              {rightData && (
                <div className="card">
                  <PressureChart data={rightData} currentTime={timeline.currentTime} title="Pé Direito — Pressão × Tempo" />
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <footer style={{
        borderTop: '1px solid var(--border)', padding: '12px 24px',
        fontSize: 11, color: 'var(--text-muted)', textAlign: 'center',
      }}>
        PodoSense · Visualização e análise de pressão plantar · Não realiza diagnóstico médico · Dados processados localmente
      </footer>
    </div>
  );
}
