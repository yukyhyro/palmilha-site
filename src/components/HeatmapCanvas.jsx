import React, { useRef, useEffect, useMemo } from 'react';
import { computeHeatmapGrid, heatColor } from '../services/heatmapProcessor';
import { getFootOutlinePath } from '../config/sensorLayout';

/**
 * HeatmapCanvas
 *
 * Renderiza o mapa de calor usando Canvas.
 * O heatmap é recortado (clipped) ao contorno do pé via Path2D.
 * Usa interpolação IDW com campo de confiança.
 *
 * @param {Array} sensorSamples - [{x, y, value}, ...]
 * @param {boolean} mirror - true para pé esquerdo
 * @param {object} scale - {min, max} para normalização
 * @param {number} width - Largura do canvas em pixels
 * @param {number} height - Altura do canvas em pixels
 */
export default function HeatmapCanvas({ sensorSamples, mirror, scale, width = 200, height = 300 }) {
  const canvasRef = useRef(null);

  // Pré-calcula o path do contorno em coordenadas de canvas
  const footPath = useMemo(() => {
    const svgPath = getFootOutlinePath(mirror);
    return svgPath;
  }, [mirror]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Limpa
    ctx.clearRect(0, 0, width, height);

    if (!sensorSamples || sensorSamples.length === 0) return;

    // Cria Path2D para clipping do contorno do pé
    const clipPath = new Path2D();
    // Converte coordenadas 0-100 para pixels
    const scaleX = width / 100;
    const scaleY = height / 100;

    // Parse simplificado do SVG path para Path2D
    const pathStr = footPath;
    const parts = pathStr.match(/[MmCcLlZz][^MmCcLlZz]*/g) || [];

    for (const part of parts) {
      const cmd = part[0];
      const nums = part.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));

      if (cmd === 'M' && nums.length >= 2) {
        clipPath.moveTo(nums[0] * scaleX, nums[1] * scaleY);
      } else if (cmd === 'C') {
        for (let i = 0; i + 5 < nums.length; i += 6) {
          clipPath.bezierCurveTo(
            nums[i] * scaleX, nums[i + 1] * scaleY,
            nums[i + 2] * scaleX, nums[i + 3] * scaleY,
            nums[i + 4] * scaleX, nums[i + 5] * scaleY
          );
        }
      } else if (cmd === 'Z' || cmd === 'z') {
        clipPath.closePath();
      }
    }

    // Calcula heatmap grid
    const resolution = 60;
    const { grid, confidence, width: gw, height: gh } = computeHeatmapGrid(
      sensorSamples, resolution, 2.5
    );

    const scaleMax = scale ? scale.max : 1;
    const scaleMin = scale ? scale.min : 0;
    const range = scaleMax - scaleMin || 1;

    // Renderiza no canvas com clipping
    ctx.save();
    ctx.clip(clipPath);

    // Cria ImageData
    const cellW = width / gw;
    const cellH = height / gh;

    for (let gy = 0; gy < gh; gy++) {
      for (let gx = 0; gx < gw; gx++) {
        const idx = gy * gw + gx;
        const val = grid[idx];
        const conf = confidence[idx];

        if (conf < 0.01) continue;

        const normalized = Math.max(0, Math.min(1, (val - scaleMin) / range));
        const [r, g, b] = heatColor(normalized);

        // Opacidade baseada na confiança e no valor
        const alpha = conf * Math.max(0.15, Math.min(0.9, normalized + 0.1));

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fillRect(
          gx * cellW,
          gy * cellH,
          cellW + 0.5,
          cellH + 0.5
        );
      }
    }

    ctx.restore();
  }, [sensorSamples, mirror, scale, width, height, footPath]);

  return (
    <canvas
      ref={canvasRef}
      className="heatmap-canvas"
      style={{ width, height }}
    />
  );
}
