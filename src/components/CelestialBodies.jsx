import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Procedural high-res Earth texture generator (no CORS, no external network lag)
function createProceduralEarthTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Deep space ocean gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
  oceanGrad.addColorStop(0, '#0c2d48');
  oceanGrad.addColorStop(0.5, '#145da0');
  oceanGrad.addColorStop(1, '#0c2d48');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, 1024, 512);

  // Procedural continental landmasses
  ctx.fillStyle = '#2e6f40';
  const drawLandmass = (cx, cy, rx, ry, angle) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Americas
  drawLandmass(280, 180, 80, 110, -0.2);
  drawLandmass(340, 340, 60, 120, 0.4);
  // Eurasia & Africa
  drawLandmass(580, 170, 130, 90, 0.1);
  drawLandmass(570, 300, 75, 100, -0.1);
  // Australia
  drawLandmass(820, 360, 45, 35, 0.2);

  // Mountain ridges / terrain accents
  ctx.fillStyle = '#8d7b68';
  drawLandmass(260, 170, 20, 90, -0.3);
  drawLandmass(620, 180, 90, 25, 0.1);

  // Polar ice caps
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 1024, 28);
  ctx.fillRect(0, 484, 1024, 28);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// Procedural cloud cover texture
function createProceduralCloudsTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, 1024, 512);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 1024;
    const y = 80 + Math.random() * 350;
    const w = 60 + Math.random() * 140;
    const h = 15 + Math.random() * 35;
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, (Math.random() - 0.5) * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

// Astronomical Starfield
function Starfield({ count = 2500 }) {
  const starsRef = useRef();

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const palette = [
      new THREE.Color('#38bdf8'), // O/B blue
      new THREE.Color('#ffffff'), // White
      new THREE.Color('#fef08a'), // Yellow
      new THREE.Color('#fb923c'), // Amber
      new THREE.Color('#cbd5e1')  // Soft silver
    ];

    for (let i = 0; i < count; i++) {
      // Keep stars within visible camera frustum (r: 6 to 18)
      const r = 7.0 + Math.random() * 12.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      // Centered near the barycenter of the Earth-Moon system (x ~ 0.5)
      pos[i * 3] = 0.5 + r * Math.sin(phi) * Math.cos(theta);
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
    if (starsRef.current) {
      starsRef.current.rotation.y += delta * 0.003;
    }
  });

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={1.6}
        sizeAttenuation={false}
        vertexColors={true}
        transparent={true}
        opacity={0.9}
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

  const primaryPos = [-mu, 0, 0];
  const secondaryPos = [1 - mu, 0, 0];

  const primaryRadius = isSun ? 0.065 : isJupiter ? 0.055 : 0.045;
  const secondaryRadius = 0.018;

  const earthTex = useMemo(() => createProceduralEarthTexture(), []);
  const cloudsTex = useMemo(() => createProceduralCloudsTexture(), []);

  useFrame((_, delta) => {
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.04;
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.07;
    if (moonRef.current) moonRef.current.rotation.y += delta * 0.02;
  });

  return (
    <group>
      {/* Autonomous Dedicated Lighting */}
      <ambientLight intensity={1.2} />
      <directionalLight position={[4, 6, 5]} intensity={2.2} />
      <pointLight position={primaryPos} intensity={0.8} distance={3} color="#38bdf8" />

      {/* 3D Starfield */}
      <Starfield count={2500} />

      {/* PRIMARY BODY */}
      <group position={primaryPos}>
        {isEarth ? (
          <>
            {/* Earth Core with Continents & Oceans */}
            <mesh ref={earthRef}>
              <sphereGeometry args={[primaryRadius, 48, 48]} />
              <meshStandardMaterial
                map={earthTex}
                roughness={0.4}
                metalness={0.1}
                emissive="#061e38"
                emissiveIntensity={0.25}
              />
            </mesh>

            {/* Cloud Layer */}
            <mesh ref={cloudsRef}>
              <sphereGeometry args={[primaryRadius * 1.02, 48, 48]} />
              <meshStandardMaterial
                map={cloudsTex}
                transparent={true}
                opacity={0.65}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>

            {/* Atmospheric Cyan Rim Glow */}
            <mesh>
              <sphereGeometry args={[primaryRadius * 1.12, 32, 32]} />
              <meshBasicMaterial
                color="#38bdf8"
                transparent={true}
                opacity={0.16}
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

        {/* Primary Barycentric Target Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[primaryRadius * 1.35, primaryRadius * 1.4, 48]} />
          <meshBasicMaterial color="#38bdf8" transparent={true} opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* SECONDARY BODY (MOON / EUROPA) */}
      <group position={secondaryPos}>
        <mesh ref={moonRef}>
          <sphereGeometry args={[secondaryRadius, 32, 32]} />
          <meshStandardMaterial
            color="#e2e8f0"
            roughness={0.8}
            metalness={0.05}
            emissive="#1e293b"
            emissiveIntensity={0.2}
          />
        </mesh>

        {/* Secondary Sub-orbital Orbit Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[secondaryRadius * 1.45, secondaryRadius * 1.5, 36]} />
          <meshBasicMaterial color="#94a3b8" transparent={true} opacity={0.45} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}
