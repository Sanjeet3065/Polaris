import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { EquipmentStatus } from "../../types";

interface Props {
  status: EquipmentStatus;
  position?: [number, number, number];
  size?: number;
  showPointLight?: boolean;
}

const STATUS_COLORS: Record<EquipmentStatus, { color: string; emissive: string; intensity: number }> = {
  HEALTHY: { color: "#10b981", emissive: "#059669", intensity: 1.2 },
  WARNING: { color: "#f59e0b", emissive: "#d97706", intensity: 2.0 },
  CRITICAL: { color: "#ef4444", emissive: "#dc2626", intensity: 3.5 },
  OFFLINE: { color: "#64748b", emissive: "#334155", intensity: 0.2 }
};

export const EquipmentStatusLight: React.FC<Props> = ({
  status,
  position = [0, 0, 0],
  size = 0.15,
  showPointLight = true
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const config = STATUS_COLORS[status] || STATUS_COLORS.OFFLINE;

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (status === "CRITICAL" && meshRef.current) {
      // Urgent, controlled red pulse
      const pulse = 1.0 + 0.35 * Math.sin(time * 6);
      meshRef.current.scale.set(pulse, pulse, pulse);
      if (ringRef.current) {
        const ringScale = 1.2 + 0.5 * Math.abs(Math.sin(time * 4));
        ringRef.current.scale.set(ringScale, ringScale, ringScale);
        ringRef.current.rotation.z = time * 2;
      }
      if (lightRef.current) {
        lightRef.current.intensity = config.intensity * (0.8 + 0.4 * Math.sin(time * 6));
      }
    } else if (status === "WARNING" && meshRef.current) {
      // Gentle warning glow breathing
      const pulse = 1.0 + 0.18 * Math.sin(time * 3);
      meshRef.current.scale.set(pulse, pulse, pulse);
      if (lightRef.current) {
        lightRef.current.intensity = config.intensity * (0.85 + 0.25 * Math.sin(time * 3));
      }
    } else if (meshRef.current) {
      meshRef.current.scale.set(1, 1, 1);
      if (lightRef.current) {
        lightRef.current.intensity = config.intensity;
      }
    }
  });

  return (
    <group position={position}>
      {/* Central Indicator Sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial
          color={config.color}
          emissive={config.emissive}
          emissiveIntensity={config.intensity}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Outer Pulse Ring for Warnings/Criticals */}
      {(status === "WARNING" || status === "CRITICAL") && (
        <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * 1.5, size * 2.0, 24]} />
          <meshBasicMaterial
            color={config.color}
            transparent
            opacity={status === "CRITICAL" ? 0.7 : 0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Point light casting subtle illumination on surrounding equipment mesh */}
      {showPointLight && (
        <pointLight
          ref={lightRef}
          color={config.color}
          intensity={config.intensity}
          distance={size * 12}
          decay={2}
        />
      )}
    </group>
  );
};
