import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { StationCode } from "../../types";

interface Props {
  stationCode: StationCode;
  windSpeedKmH: number;
  showEnvironment: boolean;
  activeScenario?: string | null;
}

export const StationEnvironment: React.FC<Props> = ({
  stationCode,
  windSpeedKmH,
  showEnvironment,
  activeScenario
}) => {
  const particlesRef = useRef<THREE.Points>(null);

  const isBlizzard = activeScenario === "HIGH_WIND" || windSpeedKmH > 70;
  const particleCount = isBlizzard ? 800 : 250;

  // Generate snow drifting particle positions
  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const spd = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = Math.random() * 18 + 0.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
      spd[i] = 0.5 + Math.random() * 1.5;
    }
    return [pos, spd];
  }, [particleCount]);

  useFrame((_, delta) => {
    if (particlesRef.current && showEnvironment) {
      const posAttr = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const windMultiplier = Math.max(1, windSpeedKmH / 25);

      for (let i = 0; i < particleCount; i++) {
        // Wind blows snow along X & Z axis
        arr[i * 3] += delta * 12 * windMultiplier * speeds[i];
        arr[i * 3 + 1] -= delta * 2.5 * speeds[i]; // falling
        arr[i * 3 + 2] += delta * 4 * windMultiplier;

        // Wrap around boundary box
        if (arr[i * 3] > 40) arr[i * 3] = -40;
        if (arr[i * 3 + 1] < 0.1) arr[i * 3 + 1] = 16;
        if (arr[i * 3 + 2] > 40) arr[i * 3 + 2] = -40;
      }
      posAttr.needsUpdate = true;
    }
  });

  if (!showEnvironment) return null;

  return (
    <group>
      {/* Polar Lighting Environment */}
      <ambientLight intensity={0.45} color="#e0f2fe" />
      <directionalLight
        position={[25, 20, 15]}
        intensity={1.2}
        color="#ffffff"
        castShadow={false}
      />
      <directionalLight
        position={[-20, 15, -20]}
        intensity={0.3}
        color="#38bdf8"
      />

      {/* Main Ground Plane — Polar Snow & Ice Sheet */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[120, 120, 32, 32]} />
        <meshStandardMaterial
          color={stationCode === "MAITRI" ? "#e2e8f0" : "#f1f5f9"}
          roughness={0.85}
          metalness={0.1}
        />
      </mesh>

      {/* Maitri: Lake Priyadarshini Frozen Meltwater Blue Ice Patch */}
      {stationCode === "MAITRI" && (
        <mesh position={[-20, 0.01, 14]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[14, 32]} />
          <meshStandardMaterial
            color="#0284c7"
            roughness={0.1}
            metalness={0.8}
            transparent
            opacity={0.75}
          />
        </mesh>
      )}

      {/* Bharati: Coastal Prydz Bay Shelf Edge */}
      {stationCode === "BHARATI" && (
        <mesh position={[-25, -0.4, -20]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[40, 80]} />
          <meshStandardMaterial
            color="#0369a1"
            roughness={0.15}
            metalness={0.7}
            transparent
            opacity={0.85}
          />
        </mesh>
      )}

      {/* Low-Poly Polar Rocks & Nunatak Outcrops */}
      {[
        [-18, 0.4, -12, 2.5],
        [22, 0.5, -16, 3.2],
        [-16, 0.3, 20, 2.0],
        [25, 0.6, 18, 3.5],
        [-8, 0.3, -22, 1.8],
        [18, 0.4, -8, 2.2]
      ].map(([x, y, z, s], idx) => (
        <mesh
          key={`rock-${idx}`}
          position={[x, y, z]}
          rotation={[Math.sin(idx), Math.cos(idx), 0]}
        >
          <dodecahedronGeometry args={[s, 0]} />
          <meshStandardMaterial
            color={stationCode === "MAITRI" ? "#475569" : "#64748b"}
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>
      ))}

      {/* Animated Katabatic Wind Snow Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={isBlizzard ? 0.22 : 0.12}
          color="#ffffff"
          transparent
          opacity={isBlizzard ? 0.85 : 0.55}
          sizeAttenuation
        />
      </points>

      {/* Atmospheric Fog */}
      <fog attach="fog" args={["#090d16", 25, 95]} />
    </group>
  );
};
