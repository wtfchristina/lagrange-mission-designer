import React, { useRef, useEffect, useState } from 'react';

export default function PoincareCanvas({ points, targetCj, onSeedTrajectory }) {
  const canvasRef = useRef(null);
  const [hoverCoords, setHoverCoords] = useState(null);

  const mapX = (x, w) => ((x + 1.5) / 3.0) * w;
  const mapVx = (vx, h) => h - ((vx + 1.5) / 3.0) * h;
  const unmapX = (px, w) => (px / w) * 3.0 - 1.5;
  const unmapVx = (py, h) => ((h - py) / h) * 3.0 - 1.5;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, w, h);

    // Coordinate Grid & Axes
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '9px monospace';
    ctx.fillText('x = -1.5', 6, h / 2 - 4);
    ctx.fillText('x = +1.5', w - 46, h / 2 - 4);
    ctx.fillText('ẋ = +1.5', w / 2 + 6, 12);
    ctx.fillText('ẋ = -1.5', w / 2 + 6, h - 5);

    // Plot Poincaré Intersections
    points.forEach((pt, i) => {
      const [x, vx] = pt;
      const px = mapX(x, w);
      const py = mapVx(vx, h);

      ctx.fillStyle = i === points.length - 1 ? '#38bdf8' : '#22c55e';
      ctx.beginPath();
      ctx.arc(px, py, i === points.length - 1 ? 3.5 : 1.6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Crosshair on Hover
    if (hoverCoords) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(hoverCoords.px, 0); ctx.lineTo(hoverCoords.px, h);
      ctx.moveTo(0, hoverCoords.py); ctx.lineTo(w, hoverCoords.py);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [points, hoverCoords]);

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const x = unmapX(px, rect.width);
    const vx = unmapVx(py, rect.height);
    setHoverCoords({ px, py, x, vx });
  };

  const handleMouseLeave = () => {
    setHoverCoords(null);
  };

  const handleClick = (e) => {
    if (!hoverCoords) return;
    onSeedTrajectory(hoverCoords.x, hoverCoords.vx);
  };

  return (
    <div style={{
      backgroundColor: 'rgba(3, 7, 18, 0.95)',
      border: '1px solid #1e293b',
      borderRadius: '8px',
      padding: '12px',
      pointerEvents: 'auto',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#f8fafc' }}>
          POINCARÉ SURFACE OF SECTION (Σ: y = 0, ẏ &gt; 0)
        </div>
        <div style={{ fontSize: '10px', color: '#38bdf8' }}>
          {points.length} PTS | C_J = {targetCj.toFixed(2)}
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={320}
          height={220}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          style={{ display: 'block', borderRadius: '4px', border: '1px solid #1e293b', cursor: 'crosshair' }}
        />
        {hoverCoords && (
          <div style={{
            position: 'absolute',
            bottom: '6px',
            right: '8px',
            backgroundColor: 'rgba(3, 7, 18, 0.85)',
            border: '1px solid #334155',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '9px',
            color: '#38bdf8',
            fontFamily: 'monospace',
            pointerEvents: 'none'
          }}>
            CLICK TO SEED: x: {hoverCoords.x.toFixed(3)}, ẋ: {hoverCoords.vx.toFixed(3)}
          </div>
        )}
      </div>
      <div style={{ fontSize: '9px', color: '#64748b', marginTop: '6px' }}>
        Click anywhere to inject state vector and trace orbital manifold
      </div>
    </div>
  );
}
