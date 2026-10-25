import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';
import { calculatePotential } from '../logic/cr3bpEngine';
import { RealisticPrimary, RealisticSecondary, SynodicRotationVector } from './CelestialBodies';

function ZeroVelocityContours({ mu, targetCj }) {
  const points = useMemo(() => {
    const gridPoints = [];
    const resolution = 55;
    const size = 2.4;
    const half = size / 2;
    const step = size / resolution;

    for (let x = -half; x <= half; x += step) {
      for (let y = -half; y <= half; y += step) {
        const cj = 2.0 * calculatePotential(x, y, 0, mu);
        if (Math.abs(cj - targetCj) < 0.08) {
          gridPoints.push(new THREE.Vector3(x * 5, y * 5, -0.05));
        }
      }
    }
    return gridPoints;
  }, [mu, targetCj]);

  const positions = useMemo(() => {
    const arr = new Float32Array(points.length * 3);
    for (let i = 0; i < points.length; i++) {
      arr[i * 3] = points[i].x;
      arr[i * 3 + 1] = points[i].y;
      arr[i * 3 + 2] = points[i].z;
    }
    return arr;
  }, [points]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#38bdf8" transparent opacity={0.35} />
    </points>
  );
}

function ManifoldTube({ filaments, color }) {
  if (!filaments || filaments.length === 0) return null;
  return (
    <group>
      {filaments.map((f, idx) => (
        <Line
          key={idx}
          points={f.map(p => [p[0] * 5, p[1] * 5, p[2] * 5])}
          color={color}
          lineWidth={1.2}
          transparent
          opacity={0.35}
        />
      ))}
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
  const mu = system.mu;
  const primaryPos = [-mu * 5, 0, 0];
  const secondaryPos = [(1 - mu) * 5, 0, 0];

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#030712' }}>
      <Canvas camera={{ position: [2, -6, 5], fov: 45 }}>
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, -10, 8]} intensity={2.2} />

        <gridHelper args={[24, 24, '#1e293b', '#0f172a']} rotation={[Math.PI / 2, 0, 0]} />

        {/* Realistic Earth & Moon */}
        <RealisticPrimary position={primaryPos} radius={0.32} />
        <RealisticSecondary position={secondaryPos} radius={0.14} />

        {/* Synodic Rotation Vector (omega = +z) at Barycenter */}
        <SynodicRotationVector position={[0, 0, 0]} />

        {/* 5 Libration Points */}
        {Object.entries(lagrangePoints).map(([key, lp]) => (
          <group key={key} position={[lp.x * 5, lp.y * 5, 0]}>
            <mesh>
              <octahedronGeometry args={[0.08]} />
              <meshBasicMaterial color="#eab308" wireframe />
            </mesh>
          </group>
        ))}

        {/* Poincaré Section Plane (y = 0) */}
        {showPoincarePlane && (
          <mesh position={[2, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[12, 6]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.08} side={THREE.DoubleSide} />
          </mesh>
        )}

        <ZeroVelocityContours mu={mu} targetCj={selectedCj} />

        {haloOrbit && haloOrbit.length > 1 && (
          <Line
            points={haloOrbit.map(p => [p[0] * 5, p[1] * 5, p[2] * 5])}
            color="#fbbf24"
            lineWidth={3.0}
          />
        )}

        {manifoldTubes && (
          <>
            <ManifoldTube filaments={manifoldTubes.unstableTube} color="#f43f5e" />
            <ManifoldTube filaments={manifoldTubes.stableTube} color="#06b6d4" />
          </>
        )}

        {trajectory.length > 1 && (
          <Line
            points={trajectory.map(p => [p[0] * 5, p[1] * 5, p[2] * 5])}
            color="#22c55e"
            lineWidth={2.2}
          />
        )}
      </Canvas>
    </div>
  );
}
