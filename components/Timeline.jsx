import React from 'react';

/**
 * Timeline
 *
 * Controles de timeline interativa:
 *   - Slider
 *   - Play / Pause
 *   - Step anterior / próximo
 *   - Indicador de registro e tempo
 *   - Velocidades: 0.5x, 1x, 2x, 4x
 */
export default function Timeline({
  currentIndex,
  totalSamples,
  currentSample,
  isPlaying,
  speed,
  onPlay,
  onPause,
  onSeek,
  onStepForward,
  onStepBackward,
  onSpeedChange,
}) {
  const disabled = totalSamples === 0;
  const currentTime = currentSample ? currentSample.time : 0;

  const speeds = [0.5, 1, 2, 4];

  const formatTime = (seconds) => {
    if (seconds == null || isNaN(seconds)) return '0.000s';
    if (seconds < 60) return `${seconds.toFixed(3)}s`;
    const min = Math.floor(seconds / 60);
    const sec = (seconds % 60).toFixed(1);
    return `${min}m ${sec}s`;
  };

  return (
    <div className={`timeline-container ${disabled ? 'disabled' : ''}`}>
      {/* Slider */}
      <div className="timeline-slider-row">
        <input
          type="range"
          className="timeline-slider"
          min={0}
          max={Math.max(0, totalSamples - 1)}
          value={currentIndex}
          onChange={(e) => onSeek(parseInt(e.target.value))}
          disabled={disabled}
        />
      </div>

      {/* Controles */}
      <div className="timeline-controls">
        <div className="timeline-buttons">
          {/* Step backward */}
          <button
            className="timeline-btn"
            onClick={onStepBackward}
            disabled={disabled || currentIndex <= 0}
            title="Anterior"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          {/* Play / Pause */}
          <button
            className="timeline-btn play-btn"
            onClick={isPlaying ? onPause : onPlay}
            disabled={disabled}
            title={isPlaying ? 'Pausar' : 'Reproduzir'}
          >
            {isPlaying ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Step forward */}
          <button
            className="timeline-btn"
            onClick={onStepForward}
            disabled={disabled || currentIndex >= totalSamples - 1}
            title="Próximo"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>

        {/* Info */}
        <div className="timeline-info">
          <span className="timeline-time">{formatTime(currentTime)}</span>
          <span className="timeline-divider">|</span>
          <span className="timeline-sample">
            {disabled ? '—' : `${currentIndex + 1} / ${totalSamples}`}
          </span>
        </div>

        {/* Velocidade */}
        <div className="timeline-speed">
          {speeds.map((s) => (
            <button
              key={s}
              className={`speed-btn ${speed === s ? 'active' : ''}`}
              onClick={() => onSpeedChange(s)}
              disabled={disabled}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
