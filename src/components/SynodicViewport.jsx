import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';
import CelestialBodies from './CelestialBodies';

function ZeroVelocitySurfaces({ system, targetCj }) {
  const meshData = useMemo(() => {
    const res = 48;
    const size = 3.2 * 5;
    const geom = new THREE.PlaneGeometry(size, size, res, res);
    const pos = geom.attributes.position;
    const mu = system.mu;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) / 5;
      const y = pos.getY(i) / 5;

      const r1 = Math.sqrt((x + mu) ** 2 + y ** 2) + 1e-4;
      const r2 = Math.sqrt((x - 1 + mu) ** 2 + y ** 2) + 1e-4;
      const omega = 0.5 * (x ** 2 + y ** 2) + (1 - mu) / r1 + mu / r2;
      const cj = 2 * omega;

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
      <mesh>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.09, 0.12, 24]} />
        <meshBasicMaterial color={color} transparent={true} opacity={0.65} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Enhanced High-Visibility Manifold Filaments
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
            lineWidth={1.7}
            transparent={true}
            opacity={0.78}
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

        {/* Textured Earth, Clouds, Moon & Starfield */}
        <CelestialBodies system={system} />

        {/* Zero-Velocity Surfaces */}
        <ZeroVelocitySurfaces system={system} targetCj={selectedCj} />

        {/* Poincaré Section Plane (y = 0) */}
        {showPoincarePlane && (
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[2.5, 0, 0]}>
            <planeGeometry args={[14, 6]} />
            <meshBasicMaterial
              color="#38bdf8"
              transparent={true}
              opacity={0.05}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        )}

        {/* Lagrange Libration Points */}
        {lagrangePoints && (
          <>
            <LagrangeMarker position={[lagrangePoints.L1.x, lagrangePoints.L1.y, 0]} label="L1" color="#facc15" />
            <LagrangeMarker position={[lagrangePoints.L2.x, lagrangePoints.L2.y, 0]} label="L2" color="#facc15" />
            <LagrangeMarker position={[lagrangePoints.L3.x, lagrangePoints.L3.y, 0]} label="L3" color="#fb923c" />
            <LagrangeMarker position={[lagrangePoints.L4.x, lagrangePoints.L4.y, 0]} label="L4" color="#c084fc" />
            <LagrangeMarker position={[lagrangePoints.L5.x, lagrangePoints.L5.y, 0]} label="L5" color="#c084fc" />
          </>
        )}

        {/* Corrected Periodic Halo Orbit */}
        {haloPoints && (
          <Line
            points={haloPoints}
            color="#fbbf24"
            lineWidth={3.4}
          />
        )}

        {/* High-Luminance Manifold Tubes (Unstable W^u: Rose Red | Stable W^s: Electric Cyan) */}
        {manifoldTubes && (
          <>
            <ManifoldFilaments filaments={manifoldTubes.unstableTube} color="#fb7185" />
            <ManifoldFilaments filaments={manifoldTubes.stableTube} color="#22d3ee" />
          </>
        )}

        {/* High-Intensity Spacecraft Trajectory Trail with Optical Bloom Sheath */}
        {trajectoryPoints && (
          <>
            {/* Outer Diffusion Glow Sheath */}
            <Line
              points={trajectoryPoints}
              color="#4ade80"
              lineWidth={5.5}
              transparent={true}
              opacity={0.35}
            />
            {/* Inner High-Intensity Laser Core */}
            <Line
              points={trajectoryPoints}
              color="#86efac"
              lineWidth={2.2}
            />
          </>
        )}
      </Canvas>
    </div>
  );
}
