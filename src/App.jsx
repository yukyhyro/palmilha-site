import React, { useState, useMemo, useCallback } from 'react';
import FileUploader from './components/FileUploader';
import FootMap from './components/FootMap';
import Timeline from './components/Timeline';
import SensorPanel from './components/SensorPanel';
import StatisticsPanel from './components/StatisticsPanel';
import RegionalChart from './components/RegionalChart';
import Legend from './components/Legend';
import { useTimeline } from './hooks/useTimeline';
import { computeStatistics, computeAutoScale, computeTimeWeightedAverage } from './services/statisticsCalculator';

/**
 * App
 *
 * Componente principal do PodoSense.
 * Compõe todo o dashboard de análise de pressão plantar:
 *   - Upload de arquivos (pé direito e esquerdo)
 *   - Mapa de pressão dinâmico (segue a timeline)
 *   - Timeline com controles de reprodução
 *   - Mapa de pressão geral (média ponderada pelo tempo, estático)
 *   - Painel de sensores
 *   - Estatísticas
 *   - Gráficos de pressão
 *   - Gráficos por região anatômica
 */
export default function App() {
  // Estado: dados do pé direito
  const [rightData, setRightData] = useState(null);
  const [rightSensors, setRightSensors] = useState(null);
  const [rightStats, setRightStats] = useState(null);

  // Estado: dados do pé esquerdo
  const [leftData, setLeftData] = useState(null);
  const [leftSensors, setLeftSensors] = useState(null);
  const [leftStats, setLeftStats] = useState(null);

  // Determina qual conjunto de dados é o "ativo" para a timeline
  // Prioriza o que tiver mais amostras
  const activeSamples = useMemo(() => {
    if (rightData && leftData) {
      return rightData.length >= leftData.length ? rightData : leftData;
    }
    return rightData || leftData || [];
  }, [rightData, leftData]);

  // Timeline hook
  const timeline = useTimeline(activeSamples);

  // Callbacks de upload
  const handleRightData = useCallback((samples, sensorNames, stats) => {
    setRightData(samples);
    setRightSensors(sensorNames);
    setRightStats(stats);
  }, []);

  const handleLeftData = useCallback((samples, sensorNames, stats) => {
    setLeftData(samples);
    setLeftSensors(sensorNames);
    setLeftStats(stats);
  }, []);

  // Escalas de cores (percentil 95)
  const rightScale = useMemo(() => {
    if (!rightData || !rightSensors) return null;
    return computeAutoScale(rightData, rightSensors);
  }, [rightData, rightSensors]);

  const leftScale = useMemo(() => {
    if (!leftData || !leftSensors) return null;
    return computeAutoScale(leftData, leftSensors);
  }, [leftData, leftSensors]);

  // Valores atuais dos sensores (instante selecionado na timeline)
  const currentRightValues = useMemo(() => {
    if (!rightData || rightData.length === 0) return null;
    const idx = Math.min(timeline.currentIndex, rightData.length - 1);
    return rightData[idx]?.sensors || null;
  }, [rightData, timeline.currentIndex]);

  const currentLeftValues = useMemo(() => {
    if (!leftData || leftData.length === 0) return null;
    const idx = Math.min(timeline.currentIndex, leftData.length - 1);
    return leftData[idx]?.sensors || null;
  }, [leftData, timeline.currentIndex]);

  // Estatísticas completas
  const rightStatistics = useMemo(() => {
    if (!rightData || !rightSensors) return null;
    return computeStatistics(rightData, rightSensors);
  }, [rightData, rightSensors]);

  const leftStatistics = useMemo(() => {
    if (!leftData || !leftSensors) return null;
    return computeStatistics(leftData, leftSensors);
  }, [leftData, leftSensors]);

  // Média ponderada pelo tempo (para Mapa de Pressão Geral)
  const rightTimeWeighted = useMemo(() => {
    if (!rightData || !rightSensors) return null;
    return computeTimeWeightedAverage(rightData, rightSensors);
  }, [rightData, rightSensors]);

  const leftTimeWeighted = useMemo(() => {
    if (!leftData || !leftSensors) return null;
    return computeTimeWeightedAverage(leftData, leftSensors);
  }, [leftData, leftSensors]);

  // Escala do mapa geral (baseada nos valores time-weighted)
  const rightGeneralScale = useMemo(() => {
    if (!rightTimeWeighted) return null;
    const values = Object.values(rightTimeWeighted);
    const max = Math.max(...values, 0.1);
    return { min: 0, max };
  }, [rightTimeWeighted]);

  const leftGeneralScale = useMemo(() => {
    if (!leftTimeWeighted) return null;
    const values = Object.values(leftTimeWeighted);
    const max = Math.max(...values, 0.1);
    return { min: 0, max };
  }, [leftTimeWeighted]);

  // Tempo atual
  const currentTime = timeline.currentSample?.time || 0;

  const hasData = rightData || leftData;

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-brand">
            <div className="header-logo">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <circle cx="18" cy="18" r="16" stroke="#39ff85" strokeWidth="2" fill="none" />
                <circle cx="18" cy="12" r="3" fill="#39ff85" opacity="0.7" />
                <circle cx="12" cy="18" r="2.5" fill="#39ff85" opacity="0.5" />
                <circle cx="24" cy="18" r="2.5" fill="#39ff85" opacity="0.5" />
                <circle cx="15" cy="24" r="2" fill="#39ff85" opacity="0.3" />
                <circle cx="21" cy="24" r="2" fill="#39ff85" opacity="0.3" />
              </svg>
            </div>
            <div className="header-text">
              <h1 className="header-title">PodoSense</h1>
              <span className="header-subtitle">Visualização e análise de pressão plantar</span>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        {/* Upload Section */}
        <section className="section upload-section">
          <h2 className="section-heading">Upload de Dados</h2>
          <div className="upload-grid">
            <FileUploader
              label="Pé Direito"
              side="right"
              onDataLoaded={handleRightData}
            />
            <FileUploader
              label="Pé Esquerdo"
              side="left"
              onDataLoaded={handleLeftData}
            />
          </div>
        </section>

        {/* Mapa de Pressão Dinâmico */}
        {hasData && (
          <section className="section">
            <h2 className="section-heading">Mapa de Pressão Dinâmico</h2>
            <p className="section-description">
              Pressão no instante selecionado na timeline
            </p>
            <div className="foot-maps-row">
              {rightData && rightSensors && (
                <div className="foot-map-wrapper">
                  <FootMap
                    side="right"
                    sensorValues={currentRightValues}
                    sensorNames={rightSensors}
                    scale={rightScale}
                    title="Pé Direito"
                  />
                  <Legend min={0} max={rightScale?.max || 0} />
                </div>
              )}
              {leftData && leftSensors && (
                <div className="foot-map-wrapper">
                  <FootMap
                    side="left"
                    sensorValues={currentLeftValues}
                    sensorNames={leftSensors}
                    scale={leftScale}
                    title="Pé Esquerdo"
                  />
                  <Legend min={0} max={leftScale?.max || 0} />
                </div>
              )}
            </div>
          </section>
        )}

        {/* Timeline */}
        {hasData && (
          <section className="section">
            <Timeline
              currentIndex={timeline.currentIndex}
              totalSamples={timeline.totalSamples}
              currentSample={timeline.currentSample}
              isPlaying={timeline.isPlaying}
              speed={timeline.speed}
              onPlay={timeline.play}
              onPause={timeline.pause}
              onSeek={timeline.seek}
              onStepForward={timeline.stepForward}
              onStepBackward={timeline.stepBackward}
              onSpeedChange={timeline.changeSpeed}
            />
          </section>
        )}

        {/* Mapa de Pressão Geral */}
        {hasData && (
          <section className="section">
            <h2 className="section-heading">Mapa de Pressão Geral</h2>
            <p className="section-description">
              Média ponderada pelo tempo — regiões mais solicitadas durante toda a coleta
            </p>
            <div className="foot-maps-row">
              {rightTimeWeighted && rightSensors && (
                <div className="foot-map-wrapper">
                  <FootMap
                    side="right"
                    sensorValues={rightTimeWeighted}
                    sensorNames={rightSensors}
                    scale={rightGeneralScale}
                    title="Pé Direito — Geral"
                  />
                  <Legend min={0} max={rightGeneralScale?.max || 0} />
                </div>
              )}
              {leftTimeWeighted && leftSensors && (
                <div className="foot-map-wrapper">
                  <FootMap
                    side="left"
                    sensorValues={leftTimeWeighted}
                    sensorNames={leftSensors}
                    scale={leftGeneralScale}
                    title="Pé Esquerdo — Geral"
                  />
                  <Legend min={0} max={leftGeneralScale?.max || 0} />
                </div>
              )}
            </div>
          </section>
        )}

        {/* Painel de Sensores */}
        {hasData && (
          <section className="section">
            {rightData && rightSensors && (
              <SensorPanel
                sensorValues={currentRightValues}
                sensorNames={rightSensors}
                scale={rightScale}
              />
            )}
            {leftData && leftSensors && (
              <SensorPanel
                sensorValues={currentLeftValues}
                sensorNames={leftSensors}
                scale={leftScale}
              />
            )}
          </section>
        )}

        {/* Estatísticas */}
        {hasData && (
          <section className="section stats-section">
            <div className="stats-row">
              {rightStatistics && (
                <div className="stats-col">
                  <h3 className="stats-side-title">Pé Direito</h3>
                  <StatisticsPanel statistics={rightStatistics} />
                </div>
              )}
              {leftStatistics && (
                <div className="stats-col">
                  <h3 className="stats-side-title">Pé Esquerdo</h3>
                  <StatisticsPanel statistics={leftStatistics} />
                </div>
              )}
            </div>
          </section>
        )}

        {/* Gráficos por Região Anatômica */}
        {hasData && (
          <section className="section">
            {rightData && rightSensors && (
              <RegionalChart
                samples={rightData}
                sensorNames={rightSensors}
                currentTime={currentTime}
                title="Região Anatômica — Pé Direito"
              />
            )}
            {leftData && leftSensors && (
              <RegionalChart
                samples={leftData}
                sensorNames={leftSensors}
                currentTime={currentTime}
                title="Região Anatômica — Pé Esquerdo"
              />
            )}
          </section>
        )}

        {/* Estado vazio */}
        {!hasData && (
          <section className="section empty-state">
            <div className="empty-state-content">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(57, 255, 133, 0.3)" strokeWidth="1">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <h3>Nenhum arquivo carregado</h3>
              <p>Carregue um ou dois arquivos de dados para iniciar a análise</p>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <span>PodoSense — Visualização e análise de pressão plantar</span>
      </footer>
    </div>
  );
}
