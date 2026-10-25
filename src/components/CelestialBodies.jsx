import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Custom Fresnel Atmospheric Shader for planetary rim lighting
const AtmosphereShader = {
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vec3 viewDir = normalize(-vPosition);
      float intensity = pow(0.65 - dot(vNormal, viewDir), 2.2);
      gl_FragColor = vec4(color, clamp(intensity * 1.8, 0.0, 1.0));
    }
  `
};

// Deep Space Starfield Component with Stellar Color Temperatures
function DeepSpaceStars({ count = 3500 }) {
  const pointsRef = useRef();

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    // Stellar spectral classification colors
    const starPalette = [
      new THREE.Color('#93c5fd'), // O/B: Blue Giant
      new THREE.Color('#e0f2fe'), // A: Bluish-white
      new THREE.Color('#ffffff'), // F: Pure White
      new THREE.Color('#fef08a'), // G: Yellow (Sun-like)
      new THREE.Color('#fdba74'), // K: Orange
      new THREE.Color('#fca5a5')  // M: Red Dwarf
    ];

    for (let i = 0; i < count; i++) {
      // Uniform spherical shell distribution at large orbital radius
      const r = 25.0 + Math.random() * 45.0;
      const theta = 2.0 * Math.PI * Math.random();
      const phi = Math.acos(2.0 * Math.random() - 1.0);

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const picked = starPalette[Math.floor(Math.random() * starPalette.length)];
      // Slight brightness variation
      const luminance = 0.5 + Math.random() * 0.5;
      col[i * 3] = picked.r * luminance;
      col[i * 3 + 1] = picked.g * luminance;
      col[i * 3 + 2] = picked.b * luminance;
    }

    return [pos, col];
  }, [count]);

  // Slow galactic orientation drift
  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.002;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        vertexColors={true}
        transparent={true}
        opacity={0.88}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </points>
  );
}

export default function CelestialBodies({ system }) {
  const cloudRef = useRef();
  const earthRef = useRef();
  const secondaryRef = useRef();

  const mu = system.mu;
  const isEarth = system.primaryName === 'Earth';
  const isJupiter = system.primaryName === 'Jupiter';
  const isSun = system.primaryName === 'Sun';

  const primaryPos = [-mu, 0, 0];
  const secondaryPos = [1 - mu, 0, 0];

  const primaryRadius = isSun ? 0.07 : isJupiter ? 0.055 : 0.045;
  const secondaryRadius = 0.018;

  useFrame((_, delta) => {
    if (cloudRef.current) cloudRef.current.rotation.y += delta * 0.06;
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.03;
    if (secondaryRef.current) secondaryRef.current.rotation.y += delta * 0.02;
  });

  const textureLoader = new THREE.TextureLoader();
  const earthDayMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg');
  const earthCloudsMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png');
  const earthSpecular = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg');
  const earthNormal = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg');
  const moonMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg');

  return (
    <group>
      {/* ================= 3D ASTRONOMICAL STARFIELD ================= */}
      <DeepSpaceStars count={4000} />

      {/* ================= PRIMARY BODY ================= */}
      <group position={primaryPos}>
        {isEarth ? (
          <>
            {/* Core Earth Sphere */}
            <mesh ref={earthRef}>
              <sphereGeometry args={[primaryRadius, 64, 64]} />
              <meshStandardMaterial
                map={earthDayMap}
                normalMap={earthNormal}
                normalScale={new THREE.Vector2(0.85, 0.85)}
                roughnessMap={earthSpecular}
                roughness={0.4}
                metalness={0.1}
              />
            </mesh>

            {/* Dynamic Translucent Cloud Layer */}
            <mesh ref={cloudRef}>
              <sphereGeometry args={[primaryRadius * 1.018, 64, 64]} />
              <meshStandardMaterial
                map={earthCloudsMap}
                transparent={true}
                opacity={0.75}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>

            {/* Rayleigh Atmospheric Glow */}
            <mesh>
              <sphereGeometry args={[primaryRadius * 1.15, 64, 64]} />
              <shaderMaterial
                vertexShader={AtmosphereShader.vertexShader}
                fragmentShader={AtmosphereShader.fragmentShader}
                uniforms={{ color: { value: new THREE.Color(0x38bdf8) } }}
                transparent={true}
                blending={THREE.AdditiveBlending}
                side={THREE.BackSide}
              />
            </mesh>
          </>
        ) : isJupiter ? (
          <mesh ref={earthRef}>
            <sphereGeometry args={[primaryRadius, 64, 64]} />
            <meshStandardMaterial color="#c28c5a" roughness={0.7} />
          </mesh>
        ) : (
          <mesh>
            <sphereGeometry args={[primaryRadius, 64, 64]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
        )}

        {/* Primary Barycentric Anchor Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[primaryRadius * 1.3, primaryRadius * 1.34, 48]} />
          <meshBasicMaterial color="#38bdf8" transparent={true} opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ================= SECONDARY BODY ================= */}
      <group position={secondaryPos}>
        <mesh ref={secondaryRef}>
          <sphereGeometry args={[secondaryRadius, 32, 32]} />
          <meshStandardMaterial
            map={isEarth ? moonMap : null}
            color={isEarth ? '#e2e8f0' : '#cbd5e1'}
            roughness={0.8}
            metalness={0.05}
          />
        </mesh>

        {/* Secondary Sub-orbital Orbit Ring Indicator */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[secondaryRadius * 1.4, secondaryRadius * 1.45, 36]} />
          <meshBasicMaterial color="#94a3b8" transparent={true} opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}
