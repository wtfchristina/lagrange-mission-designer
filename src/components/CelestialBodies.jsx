import React, { useMemo } from 'react';
import * as THREE from 'three';

// Procedural Earth surface map
function createEarthTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0a2342';
  ctx.fillRect(0, 0, 1024, 512);

  // Continents
  ctx.fillStyle = '#1e3f20';
  for (let i = 0; i < 48; i++) {
    const x = Math.sin(i * 137.5) * 450 + 512;
    const y = Math.cos(i * 93.3) * 180 + 256;
    const r = (Math.sin(i * 12.3) + 1.8) * 35;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cloud layer swirls
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  for (let i = 0; i < 30; i++) {
    const cx = (i * 38) % 1024;
    const cy = 256 + Math.sin(i * 0.8) * 120;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 70, 18, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

// Procedural Moon crater surface map
function createMoonTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(0, 0, 512, 256);

  // Maria basalt basins
  ctx.fillStyle = '#475569';
  for (let i = 0; i < 18; i++) {
    const x = Math.sin(i * 47) * 200 + 256;
    const y = Math.cos(i * 31) * 90 + 128;
    ctx.beginPath();
    ctx.arc(x, y, (Math.sin(i) + 1.2) * 25, 0, Math.PI * 2);
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

// Earth with Atmospheric Glow Shell
export function RealisticPrimary({ position, radius = 0.28 }) {
  const texture = useMemo(() => createEarthTexture(), []);

  return (
    <group position={position}>
      {/* Surface */}
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial map={texture} roughness={0.4} metalness={0.1} />
      </mesh>
      {/* Rayleigh Atmospheric Rim Glow */}
      <mesh>
        <sphereGeometry args={[radius * 1.15, 32, 32]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.18}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

// Tidally-Locked Secondary Body
export function RealisticSecondary({ position, radius = 0.12 }) {
  const texture = useMemo(() => createMoonTexture(), []);

  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial map={texture} roughness={0.8} metalness={0.05} />
    </mesh>
  );
}

// Synodic Reference Frame Rotation Vector (omega = +z)
export function SynodicRotationVector({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      <arrowHelper
        args={[
          new THREE.Vector3(0, 0, 1),
          new THREE.Vector3(0, 0, 0),
          1.8,
          0x38bdf8,
          0.25,
          0.12
        ]}
      />
    </group>
  );
}
