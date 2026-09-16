import React from 'react';

const SPEEDS = [0.5, 1, 2, 4];

function formatTime(seconds) {
  if (seconds < 0) return '0.00s';
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return m > 0 ? `${m}:${s.toFixed(2).padStart(5, '0')}` : `${s.toFixed(2)}s`;
}

export default function Timeline({
  currentTime, duration, isPlaying, speed, sampleIndex, sampleCount,
  onSeek, onPlay, onPause, onReset, onStepForward, onStepBackward, onSpeedChange,
}) {
  return (
    <div className="timeline-container">
      <div className="timeline-slider-row">
        <span className="timeline-time" style={{ textAlign: 'right' }}>{formatTime(currentTime)}</span>
        <input
          type="range"
          className="timeline-slider"
          min={0} max={duration || 1} step={0.01}
          value={currentTime}
          onInput={(e) => onSeek(Number(e.target.value))}
        />
        <span className="timeline-time">{formatTime(duration)}</span>
      </div>

      <div className="timeline-controls">
        <button className="timeline-btn" onClick={onReset} title="Reiniciar">⏮</button>
        <button className="timeline-btn" onClick={onStepBackward} title="Voltar">◀</button>
        <button
          className="timeline-btn play-btn"
          onClick={isPlaying ? onPause : onPlay}
          title={isPlaying ? 'Pausar' : 'Reproduzir'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button className="timeline-btn" onClick={onStepForward} title="Avançar">▶</button>

        <div className="speed-group">
          {SPEEDS.map(s => (
            <button
              key={s}
              className={`timeline-btn ${s === speed ? 'active' : ''}`}
              onClick={() => onSpeedChange(s)}
            >
              {s}x
            </button>
          ))}
        </div>

        <span className="timeline-info">
          {sampleIndex + 1} / {sampleCount}
        </span>
      </div>
    </div>
  );
}
