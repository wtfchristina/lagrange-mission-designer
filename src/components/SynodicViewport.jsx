import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';
import CelestialBodies from './CelestialBodies';

// 3D Bent Spacetime Metric Sheet (Gravitational Wells + Lagrange Saddles)
function SpacetimeCurvatureGrid({ system }) {
  const meshRef = useRef();
  const mu = system.mu;

  const { geometry, colors } = useMemo(() => {
    const res = 140; // High resolution grid
    const size = 3.6 * 5; // Span full synodic domain
    const geom = new THREE.PlaneGeometry(size, size, res, res);
    const pos = geom.attributes.position;
    const colArray = new Float32Array(pos.count * 3);

    // Color gradient palette for spacetime tension
    const cFlat = new THREE.Color('#030712');   // Unbent asymptotic flat space
    const cMid = new THREE.Color('#1e3a8a');    // Moderate synodic curvature
    const cSaddle = new THREE.Color('#0284c7'); // L1/L2 saddle neck tension
    const cWell = new THREE.Color('#38bdf8');   // Deep relativistic well throat

    for (let i = 0; i < pos.count; i++) {
      // Unscale to dimensionless synodic coordinates
      const x = pos.getX(i) / 5;
      const y = pos.getY(i) / 5;

      const r1 = Math.sqrt((x + mu) ** 2 + y ** 2) + 0.035;
      const r2 = Math.sqrt((x - 1 + mu) ** 2 + y ** 2) + 0.018;

      // Gravitational potential well + synodic centrifugal curvature
      const gravWell = (1 - mu) / r1 + mu / r2;
      const centrifugal = 0.5 * (x ** 2 + y ** 2);
      
      // Total potential dip: clamped to create smooth deep funnels beneath bodies
      const depth = -Math.min(gravWell * 0.38 - centrifugal * 0.12, 3.8);

      // Set z displacement (scaled by 5 to match scene)
      pos.setZ(i, depth);

      // Color mapping according to local spacetime curvature / gradient
      const curvatureIntensity = Math.min(Math.abs(depth) / 3.0, 1.0);
      let vertexColor;
      if (curvatureIntensity < 0.25) {
        vertexColor = cFlat.clone().lerp(cMid, curvatureIntensity / 0.25);
      } else if (curvatureIntensity < 0.7) {
        vertexColor = cMid.clone().lerp(cSaddle, (curvatureIntensity - 0.25) / 0.45);
      } else {
        vertexColor = cSaddle.clone().lerp(cWell, (curvatureIntensity - 0.7) / 0.3);
      }

      colArray[i * 3] = vertexColor.r;
      colArray[i * 3 + 1] = vertexColor.g;
      colArray[i * 3 + 2] = vertexColor.b;
    }

    geom.setAttribute('color', new THREE.BufferAttribute(colArray, 3));
    geom.computeVertexNormals();
    return { geometry: geom };
  }, [mu]);

  return (
    <group position={[0, 0, -0.2]}>
      {/* Curved Spacetime Surface with Depth Shading */}
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial
          vertexColors={true}
          roughness={0.4}
          metalness={0.3}
          wireframe={false}
          transparent={true}
          opacity={0.82}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Luminous Coordinate Grid Overlay showing tensor line deformation */}
      <mesh geometry={geometry} position={[0, 0, 0.005]}>
        <meshBasicMaterial
          color="#38bdf8"
          wireframe={true}
          transparent={true}
          opacity={0.22}
        />
      </mesh>
    </group>
  );
}

function LagrangeMarker({ position, label, color = '#facc15' }) {
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
            lineWidth={1.8}
            transparent={true}
            opacity={0.8}
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
      <Canvas camera={{ position: [2.5, -8.5, 7.5], fov: 45 }}>
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} />

        {/* Textured Earth, Drifting Clouds, Moon & Starfield */}
        <CelestialBodies system={system} />

        {/* BENT SPACETIME METRIC SHEET (Gravitational Wells + Saddle Necks) */}
        <SpacetimeCurvatureGrid system={system} />

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

        {/* Lagrange Points */}
        {lagrangePoints && (
          <>
            <LagrangeMarker position={[lagrangePoints.L1.x, lagrangePoints.L1.y, 0]} label="L1" color="#facc15" />
            <LagrangeMarker position={[lagrangePoints.L2.x, lagrangePoints.L2.y, 0]} label="L2" color="#facc15" />
            <LagrangeMarker position={[lagrangePoints.L3.x, lagrangePoints.L3.y, 0]} label="L3" color="#fb923c" />
            <LagrangeMarker position={[lagrangePoints.L4.x, lagrangePoints.L4.y, 0]} label="L4" color="#c084fc" />
            <LagrangeMarker position={[lagrangePoints.L5.x, lagrangePoints.L5.y, 0]} label="L5" color="#c084fc" />
          </>
        )}

        {/* Corrected Periodic Orbit */}
        {haloPoints && (
          <Line
            points={haloPoints}
            color="#fbbf24"
            lineWidth={3.4}
          />
        )}

        {/* Invariant Manifold Tubes */}
        {manifoldTubes && (
          <>
            <ManifoldFilaments filaments={manifoldTubes.unstableTube} color="#fb7185" />
            <ManifoldFilaments filaments={manifoldTubes.stableTube} color="#22d3ee" />
          </>
        )}

        {/* Spacecraft Trajectory Trail with Optical Glow */}
        {trajectoryPoints && (
          <>
            <Line
              points={trajectoryPoints}
              color="#4ade80"
              lineWidth={5.5}
              transparent={true}
              opacity={0.35}
            />
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
