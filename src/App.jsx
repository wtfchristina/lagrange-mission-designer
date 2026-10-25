import React, { useState, useMemo, useEffect, useRef } from 'react';
import SynodicViewport from './components/SynodicViewport';
import ResearchHUD from './components/ResearchHUD';
import TheoryModal from './components/TheoryModal';
import {
  CELESTIAL_SYSTEMS,
  calculateLagrangePoints,
  calculateJacobiConstant,
  rk4Step,
  solvePeriodicOrbit,
  computeRigorousManifolds,
  reconstructStateFromPoincare,
  exportEphemerisCSV
} from './logic/cr3bpEngine';

export default function App() {
  const [systemKey, setSystemKey] = useState('EARTH_MOON');
  const [selectedCj, setSelectedCj] = useState(3.18);
  const [trajectory, setTrajectory] = useState([]);
  const [currentCj, setCurrentCj] = useState(3.18);

  const [haloOrbit, setHaloOrbit] = useState(null);
  const [manifoldTubes, setManifoldTubes] = useState(null);
  const [correctorResidual, setCorrectorResidual] = useState(null);
  const [poincarePoints, setPoincarePoints] = useState([]);
  const [showPoincare, setShowPoincare] = useState(true);
  const [isTheoryOpen, setIsTheoryOpen] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(10);

  const handleRecordShowcase = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas || isRecording) return;

    const stream = canvas.captureStream(60);
    const mimeType = MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")
      ? "video/mp4;codecs=avc1"
      : MediaRecorder.isTypeSupported("video/mp4")
      ? "video/mp4"
      : "video/webm;codecs=vp9";

    const ext = mimeType.includes("mp4") ? "mp4" : "webm";
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 12000000
    });

    const chunks = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cr3bp_manifold_showcase_10s.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      setIsRecording(false);
    };

    setIsRecording(true);
    setCountdown(10);
    recorder.start();

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimeout(() => {
      recorder.stop();
    }, 10000);
  };
  

  const system = CELESTIAL_SYSTEMS[systemKey];
  const lagrangePoints = useMemo(() => calculateLagrangePoints(system.mu), [system.mu]);

  const stateRef = useRef(null);
  const animRef = useRef(null);
  const trajectoryHistoryRef = useRef([]);

  const runDifferentialCorrector = (isL2 = false) => {
    const targetLp = isL2 ? lagrangePoints.L2 : lagrangePoints.L1;
    const solution = solvePeriodicOrbit(system.mu, targetLp, 0.04, isL2);

    setHaloOrbit(solution.orbit);
    setCorrectorResidual(solution.residual);

    const tubes = computeRigorousManifolds(system.mu, solution.initialState, solution.period, 16);
    setManifoldTubes(tubes);
  };

  const launchPreset = (presetType) => {
    const mu = system.mu;
    const l1 = lagrangePoints.L1;
    const l2 = lagrangePoints.L2;

    let initial = null;

    if (presetType === 'L1_HALO') {
      initial = [l1.x - 0.04, 0.0, 0.0, 0.0, 0.165, 0.0];
    } else if (presetType === 'BLT_CAPTURE') {
      initial = [-mu + 0.08, 0.02, 0.0, 0.2, 0.88, 0.0];
    } else if (presetType === 'NRHO_GATEWAY') {
      initial = [l2.x + 0.012, 0.0, 0.08, 0.0, -0.19, 0.0];
    } else if (presetType === 'CHAOTIC_SEA') {
      initial = [l1.x + 0.02, 0.001, 0.0, -0.05, 0.22, 0.0];
      setPoincarePoints([]);
    }

    if (initial) {
      stateRef.current = initial;
      trajectoryHistoryRef.current = [];
      setTrajectory([initial.slice(0, 3)]);
      setCurrentCj(calculateJacobiConstant(initial, mu));
    }
  };

  // Interactive Poincaré Click-to-Seed
  const seedFromPoincare = (x0, vx0) => {
    const state = reconstructStateFromPoincare(x0, vx0, selectedCj, system.mu);
    if (!state) {
      alert(`Energetically forbidden: (${x0.toFixed(2)}, ${vx0.toFixed(2)}) requires C_J > ${selectedCj.toFixed(2)}.`);
      return;
    }
    stateRef.current = state;
    trajectoryHistoryRef.current = [];
    setTrajectory([state.slice(0, 3)]);
    setCurrentCj(calculateJacobiConstant(state, system.mu));
  };

  // Export Trajectory to CSV
  const handleExportCSV = () => {
    const csvContent = exportEphemerisCSV(trajectoryHistoryRef.current, system);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cr3bp_ephemeris_${systemKey.toLowerCase()}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Trajectory to JSON
  const handleExportJSON = () => {
    const payload = {
      system: system.name,
      mu: system.mu,
      lengthScaleKm: system.lengthScaleKm,
      timeScaleDays: system.timeScaleDays,
      ephemeris: trajectoryHistoryRef.current.map((r, idx) => ({
        step: idx,
        x: r[0], y: r[1], z: r[2],
        vx: r[3], vy: r[4], vz: r[5],
        C_J: r[6]
      }))
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cr3bp_state_${systemKey.toLowerCase()}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    runDifferentialCorrector(false);
    launchPreset('L1_HALO');
  }, [systemKey]);

  useEffect(() => {
    const propagate = () => {
      animRef.current = requestAnimationFrame(propagate);

      if (stateRef.current) {
        let current = stateRef.current;
        const newPoints = [];

        for (let sub = 0; sub < 8; sub++) {
          const oldY = current[1];
          current = rk4Step(current, system.mu, 0.002);
          const cj = calculateJacobiConstant(current, system.mu);
          newPoints.push(current.slice(0, 3));

          // Retain full history for data exports (up to 5000 points)
          if (trajectoryHistoryRef.current.length < 5000) {
            trajectoryHistoryRef.current.push([...current, cj]);
          }

          if (oldY <= 0 && current[1] > 0) {
            const fraction = -oldY / (current[1] - oldY);
            const crossX = current[0] + fraction * (current[0] - oldY);
            const crossVx = current[3];

            setPoincarePoints((prev) => {
              const updated = [...prev, [crossX, crossVx]];
              return updated.length > 500 ? updated.slice(updated.length - 500) : updated;
            });
          }
        }

        stateRef.current = current;
        setCurrentCj(calculateJacobiConstant(current, system.mu));

        setTrajectory((prev) => {
          const combined = [...prev, ...newPoints];
          return combined.length > 900 ? combined.slice(combined.length - 900) : combined;
        });
      }
    };

    propagate();
    return () => cancelAnimationFrame(animRef.current);
  }, [system.mu]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <SynodicViewport
        system={system}
        lagrangePoints={lagrangePoints}
        selectedCj={selectedCj}
        trajectory={trajectory}
        haloOrbit={haloOrbit}
        manifoldTubes={manifoldTubes}
        showPoincarePlane={showPoincare}
      />
      <ResearchHUD
        systemKey={systemKey}
        setSystemKey={setSystemKey}
        lagrangePoints={lagrangePoints}
        selectedCj={selectedCj}
        setSelectedCj={setSelectedCj}
        currentCj={currentCj}
        onLaunchPreset={launchPreset}
        onSolveDifferentialCorrector={runDifferentialCorrector}
        correctorResidual={correctorResidual}
        poincarePoints={poincarePoints}
        showPoincare={showPoincare}
        setShowPoincare={setShowPoincare}
        onOpenTheory={() => setIsTheoryOpen(true)}
        onSeedTrajectory={seedFromPoincare}
        onExportCSV={handleExportCSV}
        onExportJSON={handleExportJSON}
        isRecording={isRecording}
        countdown={countdown}
        onRecordShowcase={handleRecordShowcase}
      />
      <TheoryModal
        isOpen={isTheoryOpen}
        onClose={() => setIsTheoryOpen(false)}
      />
    </div>
  );
}
