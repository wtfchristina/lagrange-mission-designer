import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Procedural detailed Earth canvas texture
function createProceduralEarthTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Deep ocean gradient
  const ocean = ctx.createLinearGradient(0, 0, 0, 512);
  ocean.addColorStop(0, '#02182b');
  ocean.addColorStop(0.5, '#0d47a1');
  ocean.addColorStop(1, '#02182b');
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, 1024, 512);

  // Continental landmasses
  ctx.fillStyle = '#2d6a4f';
  const drawMass = (cx, cy, rx, ry, rot) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  drawMass(260, 180, 80, 110, -0.2); // North America
  drawMass(330, 340, 55, 110, 0.3);  // South America
  drawMass(570, 180, 140, 95, 0.1);  // Eurasia
  drawMass(560, 310, 75, 100, -0.1); // Africa
  drawMass(820, 350, 50, 40, 0.2);   // Australia

  // Terrain ridges
  ctx.fillStyle = '#9c6644';
  drawMass(240, 170, 20, 90, -0.3);
  drawMass(610, 190, 80, 30, 0.1);

  // Polar ice caps
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 1024, 30);
  ctx.fillRect(0, 482, 1024, 30);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// Procedural clouds
function createCloudsTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, 1024, 512);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  for (let i = 0; i < 45; i++) {
    const x = Math.random() * 1024;
    const y = 80 + Math.random() * 350;
    const rx = 60 + Math.random() * 130;
    const ry = 15 + Math.random() * 30;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, (Math.random() - 0.5) * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

// Procedural cratered Moon texture
function createMoonTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(0, 0, 512, 256);

  // Craters and lunar maria
  ctx.fillStyle = '#64748b';
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 256;
    const r = 10 + Math.random() * 35;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

function Starfield({ count = 3000 }) {
  const starsRef = useRef();

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#60a5fa'),
      new THREE.Color('#ffffff'),
      new THREE.Color('#fef08a'),
      new THREE.Color('#fb923c'),
      new THREE.Color('#cbd5e1')
    ];

    for (let i = 0; i < count; i++) {
      const r = 12.0 + Math.random() * 30.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      // Centered at scaled synodic midpoint
      pos[i * 3] = 2.5 + r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const color = palette[Math.floor(Math.random() * palette.length)];
      const lum = 0.5 + Math.random() * 0.5;
      col[i * 3] = color.r * lum;
      col[i * 3 + 1] = color.g * lum;
      col[i * 3 + 2] = color.b * lum;
    }
    return [pos, col];
  }, [count]);

  useFrame((_, delta) => {
    if (starsRef.current) starsRef.current.rotation.y += delta * 0.002;
  });

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={1.8}
        sizeAttenuation={false}
        vertexColors={true}
        transparent={true}
        opacity={0.92}
        depthWrite={false}
      />
    </points>
  );
}

export default function CelestialBodies({ system }) {
  const earthRef = useRef();
  const cloudsRef = useRef();
  const moonRef = useRef();

  const mu = system.mu;
  const isEarth = system.primaryName === 'Earth';
  const isJupiter = system.primaryName === 'Jupiter';
  const isSun = system.primaryName === 'Sun';

  // Position multiplied by 5 to match the 5x synodic scale
  const primaryPos = [-mu * 5, 0, 0];
  const secondaryPos = [(1 - mu) * 5, 0, 0];

  const primaryRadius = (isSun ? 0.075 : isJupiter ? 0.065 : 0.05) * 5;
  const secondaryRadius = 0.02 * 5;

  const earthTex = useMemo(() => createProceduralEarthTexture(), []);
  const cloudsTex = useMemo(() => createCloudsTexture(), []);
  const moonTex = useMemo(() => createMoonTexture(), []);

  useFrame((_, delta) => {
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.05;
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.08;
    if (moonRef.current) moonRef.current.rotation.y += delta * 0.02;
  });

  return (
    <group>
      {/* Lighting */}
      <ambientLight intensity={1.0} />
      <directionalLight position={[10, -10, 8]} intensity={2.5} />
      <pointLight position={primaryPos} intensity={1.2} distance={15} color="#38bdf8" />

      {/* 3,000 Star Points */}
      <Starfield count={3000} />

      {/* PRIMARY BODY */}
      <group position={primaryPos}>
        {isEarth ? (
          <>
            {/* Earth Sphere */}
            <mesh ref={earthRef}>
              <sphereGeometry args={[primaryRadius, 48, 48]} />
              <meshStandardMaterial
                map={earthTex}
                roughness={0.4}
                metalness={0.1}
                emissive="#061e38"
                emissiveIntensity={0.2}
              />
            </mesh>

            {/* Cloud Layer */}
            <mesh ref={cloudsRef}>
              <sphereGeometry args={[primaryRadius * 1.025, 48, 48]} />
              <meshStandardMaterial
                map={cloudsTex}
                transparent={true}
                opacity={0.65}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>

            {/* Atmospheric Cyan Rim */}
            <mesh>
              <sphereGeometry args={[primaryRadius * 1.14, 32, 32]} />
              <meshBasicMaterial
                color="#38bdf8"
                transparent={true}
                opacity={0.2}
                side={THREE.BackSide}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </>
        ) : isJupiter ? (
          <mesh ref={earthRef}>
            <sphereGeometry args={[primaryRadius, 48, 48]} />
            <meshStandardMaterial color="#c28c5a" roughness={0.6} />
          </mesh>
        ) : (
          <mesh>
            <sphereGeometry args={[primaryRadius, 48, 48]} />
            <meshBasicMaterial color="#fde047" />
          </mesh>
        )}

        {/* Primary Equatorial Anchor Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[primaryRadius * 1.3, primaryRadius * 1.35, 48]} />
          <meshBasicMaterial color="#38bdf8" transparent={true} opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* SECONDARY BODY */}
      <group position={secondaryPos}>
        <mesh ref={moonRef}>
          <sphereGeometry args={[secondaryRadius, 32, 32]} />
          <meshStandardMaterial
            map={moonTex}
            roughness={0.8}
            metalness={0.05}
          />
        </mesh>

        {/* Secondary Equatorial Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[secondaryRadius * 1.35, secondaryRadius * 1.4, 36]} />
          <meshBasicMaterial color="#94a3b8" transparent={true} opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}
