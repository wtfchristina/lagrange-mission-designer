import React from 'react';
import { CELESTIAL_SYSTEMS } from '../logic/cr3bpEngine';
import PoincareCanvas from './PoincareCanvas';

export default function ResearchHUD({
  isRecording,
  countdown,
  onRecordShowcase,
  systemKey,
  setSystemKey,
  lagrangePoints,
  selectedCj,
  setSelectedCj,
  currentCj,
  onLaunchPreset,
  onSolveDifferentialCorrector,
  correctorResidual,
  poincarePoints,
  showPoincare,
  setShowPoincare,
  onOpenTheory,
  onSeedTrajectory,
  onExportCSV,
  onExportJSON
}) {
  const currentSystem = CELESTIAL_SYSTEMS[systemKey];

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      fontFamily: 'monospace',
      boxSizing: 'border-box'
    }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          backgroundColor: 'rgba(3, 7, 18, 0.92)',
          border: '1px solid #1e293b',
          borderRadius: '8px',
          padding: '16px',
          pointerEvents: 'auto',
          maxWidth: '380px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#f8fafc' }}>
              CR3BP DYNAMICAL SYSTEMS INSTRUMENT
            </div>
            <button
              onClick={onOpenTheory}
              style={{
                padding: '4px 8px',
                fontSize: '9px',
                fontWeight: 'bold',
                backgroundColor: '#1e293b',
                color: '#38bdf8',
                border: '1px solid #38bdf8',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              THEORY & DERIVATIONS [LaTeX]
            </button>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>
            MONODROMY MANIFOLDS & DIFFERENTIAL CORRECTION
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            {Object.entries(CELESTIAL_SYSTEMS).map(([key, sys]) => (
              <button
                key={key}
                onClick={() => setSystemKey(key)}
                style={{
                  padding: '6px 10px',
                  fontSize: '10px',
                  backgroundColor: systemKey === key ? '#2563eb' : '#0f172a',
                  color: systemKey === key ? '#ffffff' : '#94a3b8',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {sys.primaryName}-{sys.secondaryName}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.6 }}>
            <div>• Mass Parameter (μ): <span style={{ color: '#38bdf8' }}>{currentSystem.mu.toExponential(5)}</span></div>
            <div>• Jacobi Energy Level (C_J): <span style={{ color: '#22c55e' }}>{currentCj.toFixed(4)}</span></div>
            <div>• Corrector Residual (|v_x|): <span style={{ color: '#fbbf24' }}>{correctorResidual ? correctorResidual.toExponential(4) : 'CONVERGED'}</span></div>
          </div>

          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <button
              onClick={() => onSolveDifferentialCorrector(false)}
              style={{
                flex: 1,
                padding: '8px',
                fontSize: '10px',
                fontWeight: 'bold',
                backgroundColor: '#1e293b',
                color: '#fbbf24',
                border: '1px solid #fbbf24',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              SHOOT L1 HALO (NEWTON)
            </button>
            <button
              onClick={() => onSolveDifferentialCorrector(true)}
              style={{
                flex: 1,
                padding: '8px',
                fontSize: '10px',
                fontWeight: 'bold',
                backgroundColor: '#1e293b',
                color: '#fbbf24',
                border: '1px solid #fbbf24',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              SHOOT L2 HALO (NEWTON)
            </button>
          </div>

          {/* Ephemeris Export Bar */}
          <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
            <button
              onClick={onExportCSV}
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '9px',
                fontWeight: 'bold',
                backgroundColor: '#0f172a',
                color: '#22c55e',
                border: '1px solid #22c55e',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              EXPORT EPHEMERIS (.CSV)
            </button>
            <button
              onClick={onExportJSON}
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '9px',
                fontWeight: 'bold',
                backgroundColor: '#0f172a',
                color: '#38bdf8',
                border: '1px solid #38bdf8',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              EXPORT STATE (.JSON)
            </button>
          </div>
          <div style={{ marginTop: "8px" }}>
            <button
              onClick={onRecordShowcase}
              disabled={isRecording}
              style={{
                width: "100%",
                padding: "7px",
                fontSize: "10px",
                fontWeight: "bold",
                backgroundColor: isRecording ? "#ef4444" : "#1e1b4b",
                color: isRecording ? "#ffffff" : "#c084fc",
                border: isRecording ? "1px solid #ef4444" : "1px solid #c084fc",
                borderRadius: "4px",
                cursor: isRecording ? "not-allowed" : "pointer",
                transition: "all 0.2s ease"
              }}
            >
              {isRecording ? `● RECORDING CANVAS STREAM (${countdown}s)...` : "● RECORD 10s HD CLIP (MP4)"}
            </button>
          </div>
  
        </div>

        {/* Right Column: Mission Presets + Clickable Poincaré Canvas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{
            backgroundColor: 'rgba(3, 7, 18, 0.92)',
            border: '1px solid #1e293b',
            borderRadius: '8px',
            padding: '16px',
            pointerEvents: 'auto',
            minWidth: '280px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#f8fafc' }}>
                MISSION TRAJECTORY PRESETS
              </div>
              <button
                onClick={() => setShowPoincare(!showPoincare)}
                style={{
                  padding: '4px 8px',
                  fontSize: '9px',
                  backgroundColor: showPoincare ? '#2563eb' : '#0f172a',
                  color: '#fff',
                  border: '1px solid #334155',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                {showPoincare ? 'HIDE POINCARÉ' : 'SHOW POINCARÉ'}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button onClick={() => onLaunchPreset('L1_HALO')} style={presetBtnStyle}>
                1. L1 Lyapunov Periodic Orbit
              </button>
              <button onClick={() => onLaunchPreset('BLT_CAPTURE')} style={presetBtnStyle}>
                2. Ballistic Lunar Transfer (BLT)
              </button>
              <button onClick={() => onLaunchPreset('NRHO_GATEWAY')} style={presetBtnStyle}>
                3. Artemis Gateway L2 Orbit
              </button>
              <button onClick={() => onLaunchPreset('CHAOTIC_SEA')} style={{ ...presetBtnStyle, color: '#f43f5e' }}>
                4. Chaotic Sea (Poincaré Scan)
              </button>
            </div>
          </div>

          {showPoincare && (
            <PoincareCanvas
              points={poincarePoints}
              targetCj={selectedCj}
              onSeedTrajectory={onSeedTrajectory}
            />
          )}
        </div>
      </div>

      {/* Bottom Diagnostic Bar */}
      <div style={{
        backgroundColor: 'rgba(3, 7, 18, 0.92)',
        border: '1px solid #1e293b',
        borderRadius: '8px',
        padding: '14px 20px',
        pointerEvents: 'auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Zero-Velocity Surface (C_J = {selectedCj.toFixed(2)}):</div>
          <input
            type="range"
            min="2.8"
            max="3.4"
            step="0.02"
            value={selectedCj}
            onChange={(e) => setSelectedCj(parseFloat(e.target.value))}
            style={{ width: '160px', cursor: 'pointer' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '16px', fontSize: '11px' }}>
          <span style={{ color: '#fbbf24' }}>■ Corrected Halo (Shooting)</span>
          <span style={{ color: '#06b6d4' }}>■ Stable Tube (W^s)</span>
          <span style={{ color: '#f43f5e' }}>■ Unstable Tube (W^u)</span>
          <span style={{ color: '#22c55e' }}>■ Spacecraft Trajectory</span>
        </div>
      </div>
    </div>
  );
}

const presetBtnStyle = {
  padding: '8px 12px',
  textAlign: 'left',
  backgroundColor: '#0f172a',
  border: '1px solid #334155',
  color: '#38bdf8',
  borderRadius: '4px',
  fontSize: '11px',
  cursor: 'pointer'
};
