import React, { useRef, useEffect } from 'react';
import { computeHeatmapGrid, heatColor } from '../services/heatmapProcessor';
import { getFootOutlinePath } from '../config/sensorLayout';

/**
 * Canvas que renderiza o mapa de calor IDW recortado ao formato da palmilha.
 * Áreas distantes dos sensores ficam transparentes (confiança baixa).
 */
export default function HeatmapCanvas({ side, sensorSamples, maxValue }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const SIZE = 300;
    canvas.width = SIZE;
    canvas.height = SIZE;
    ctx.clearRect(0, 0, SIZE, SIZE);

    if (!sensorSamples || sensorSamples.length === 0 || maxValue <= 0) return;

    const resolution = 50;
    const grid = computeHeatmapGrid(sensorSamples, resolution);
    if (!grid) return;

    const cellSize = SIZE / resolution;

    for (let row = 0; row < resolution; row++) {
      for (let col = 0; col < resolution; col++) {
        const cell = grid.cells[row * resolution + col];
        const norm = Math.min(1, cell.value / maxValue);
        const color = heatColor(norm);
        ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
        ctx.globalAlpha = 0.1 + 0.8 * cell.confidence;
        ctx.fillRect(col * cellSize, row * cellSize, cellSize + 1, cellSize + 1);
      }
    }
    ctx.globalAlpha = 1;

    // Recorta pelo contorno do pé
    const mirror = side === 'right';
    const scale = SIZE / 100;
    const path = new Path2D(getFootOutlinePath(mirror));
    const scaledPath = new Path2D();
    scaledPath.addPath(path, new DOMMatrix([scale, 0, 0, scale, 0, 0]));
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = '#000';
    ctx.fill(scaledPath);
    ctx.globalCompositeOperation = 'source-over';
  }, [side, sensorSamples, maxValue]);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}
