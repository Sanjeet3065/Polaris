import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { AlertSeverity } from "../../types";

interface Props {
  severity: AlertSeverity;
  title: string;
  position: [number, number, number];
  onClick?: () => void;
}

export const AlertIndicator3D: React.FC<Props> = ({
  severity,
  title,
  position,
  onClick
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const isCritical = severity === "CRITICAL" || severity === "EMERGENCY";
  const beaconColor = isCritical ? "#ef4444" : "#f59e0b";

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (groupRef.current) {
      // Gentle floating bob
      groupRef.current.position.y = position[1] + 0.15 * Math.sin(time * 3);
    }
    if (ringRef.current) {
      // Rotating warning ring
      ringRef.current.rotation.z = time * 2;
      const s = 1.0 + 0.25 * Math.sin(time * 4);
      ringRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* 3D Visual Beacon */}
      <mesh onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
        <octahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial
          color={beaconColor}
          emissive={beaconColor}
          emissiveIntensity={isCritical ? 3.0 : 1.8}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Pulsing Alert Ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.38, 16]} />
        <meshBasicMaterial
          color={beaconColor}
          transparent
          opacity={isCritical ? 0.8 : 0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Point Light for Dramatic Polar Lighting */}
      <pointLight
        color={beaconColor}
        intensity={isCritical ? 3.5 : 2.0}
        distance={4}
        decay={2}
      />

      {/* HTML Floating Badge Anchor */}
      <Html
        position={[0, 0.45, 0]}
        center
        distanceFactor={15}
        zIndexRange={[100, 0]}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase shadow-lg backdrop-blur-md cursor-pointer transition-transform hover:scale-110 ${
            isCritical
              ? "bg-red-500/90 text-white border border-red-300 shadow-red-500/30 animate-bounce"
              : "bg-amber-500/90 text-slate-950 border border-amber-300 shadow-amber-500/30"
          }`}
          title={title}
        >
          {isCritical ? (
            <AlertCircle className="w-3.5 h-3.5" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5" />
          )}
          <span>{severity}</span>
        </button>
      </Html>
    </group>
  );
};
