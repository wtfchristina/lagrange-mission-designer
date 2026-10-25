import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';
import CelestialBodies from './CelestialBodies';

function ZeroVelocitySurfaces({ system, targetCj }) {
  const meshData = useMemo(() => {
    const res = 48;
    const size = 3.2 * 5; // scaled by 5 to match synodic viewport
    const geom = new THREE.PlaneGeometry(size, size, res, res);
    const pos = geom.attributes.position;
    const mu = system.mu;

    for (let i = 0; i < pos.count; i++) {
      // Unscale to synodic coordinates for potential evaluation
      const x = pos.getX(i) / 5;
      const y = pos.getY(i) / 5;

      const r1 = Math.sqrt((x + mu) ** 2 + y ** 2) + 1e-4;
      const r2 = Math.sqrt((x - 1 + mu) ** 2 + y ** 2) + 1e-4;
      const omega = 0.5 * (x ** 2 + y ** 2) + (1 - mu) / r1 + mu / r2;
      const cj = 2 * omega;

      // Displacement elevation based on Jacobi constant deficit
      const diff = cj - targetCj;
      pos.setZ(i, Math.sign(diff) * Math.min(Math.abs(diff) * 0.15, 0.4) * 5);
    }
    geom.computeVertexNormals();
    return geom;
  }, [system.mu, targetCj]);

  return (
    <mesh geometry={meshData}>
      <meshStandardMaterial
        color="#1e1b4b"
        wireframe={true}
        transparent={true}
        opacity={0.12}
      />
    </mesh>
  );
}

function LagrangeMarker({ position, label, color = '#eab308' }) {
  return (
    <group position={[position[0] * 5, position[1] * 5, position[2] * 5]}>
      {/* 3D Libration Axis Reticle */}
      <mesh>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.09, 0.11, 24]} />
        <meshBasicMaterial color={color} transparent={true} opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function ManifoldFilaments({ filaments, color }) {
  if (!filaments || filaments.length === 0) return null;
  return (
    <group>
      {filaments.map((tube, idx) => {
        const pts = tube.map(p => [p[0] * 5, p[1] * 5, p[2] * 5]);
        if (pts.length < 2) return null;
        return (
          <Line
            key={idx}
            points={pts}
            color={color}
            lineWidth={0.8}
            transparent={true}
            opacity={0.35}
          />
        );
      })}
    </group>
  );
}

export default function SynodicViewport({
  system,
  lagrangePoints,
  selectedCj,
  trajectory,
  haloOrbit,
  manifoldTubes,
  showPoincarePlane
}) {
  const haloPoints = useMemo(() => {
    if (!haloOrbit || haloOrbit.length < 2) return null;
    return haloOrbit.map(p => [p[0] * 5, p[1] * 5, p[2] * 5]);
  }, [haloOrbit]);

  const trajectoryPoints = useMemo(() => {
    if (!trajectory || trajectory.length < 2) return null;
    return trajectory.map(p => [p[0] * 5, p[1] * 5, p[2] * 5]);
  }, [trajectory]);

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#020617' }}>
      <Canvas camera={{ position: [2.5, -7.5, 6], fov: 45 }}>
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} />

        {/* Textured Earth, Atmospheric Shader, Moon & Deep Space Stars */}
        <CelestialBodies system={system} />

        {/* Zero-Velocity Surfaces (Hill Stability Region) */}
        <ZeroVelocitySurfaces system={system} targetCj={selectedCj} />

        {/* Poincaré Section Visual Cutting Plane (y = 0) */}
        {showPoincarePlane && (
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[2.5, 0, 0]}>
            <planeGeometry args={[14, 6]} />
            <meshBasicMaterial
              color="#38bdf8"
              transparent={true}
              opacity={0.04}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        )}

        {/* Libration Lagrange Points L1 - L5 */}
        {lagrangePoints && (
          <>
            <LagrangeMarker position={[lagrangePoints.L1.x, lagrangePoints.L1.y, 0]} label="L1" color="#eab308" />
            <LagrangeMarker position={[lagrangePoints.L2.x, lagrangePoints.L2.y, 0]} label="L2" color="#eab308" />
            <LagrangeMarker position={[lagrangePoints.L3.x, lagrangePoints.L3.y, 0]} label="L3" color="#f97316" />
            <LagrangeMarker position={[lagrangePoints.L4.x, lagrangePoints.L4.y, 0]} label="L4" color="#a855f7" />
            <LagrangeMarker position={[lagrangePoints.L5.x, lagrangePoints.L5.y, 0]} label="L5" color="#a855f7" />
          </>
        )}

        {/* Corrected Periodic Halo Orbit */}
        {haloPoints && (
          <Line
            points={haloPoints}
            color="#fbbf24"
            lineWidth={3.0}
          />
        )}

        {/* Manifold Tube Bundles (Unstable W^u & Stable W^s) */}
        {manifoldTubes && (
          <>
            <ManifoldFilaments filaments={manifoldTubes.unstableTube} color="#f43f5e" />
            <ManifoldFilaments filaments={manifoldTubes.stableTube} color="#06b6d4" />
          </>
        )}

        {/* Real-Time Spacecraft Trajectory Line */}
        {trajectoryPoints && (
          <Line
            points={trajectoryPoints}
            color="#22c55e"
            lineWidth={2.4}
          />
        )}
      </Canvas>
    </div>
  );
}
