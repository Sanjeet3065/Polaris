import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Equipment3DPosition, Equipment3DState } from "./types";
import { EquipmentMarker } from "./EquipmentMarker";

interface Props {
  positionData: Equipment3DPosition;
  stateData: Equipment3DState;
  isSelected: boolean;
  onSelect: () => void;
  activeScenario?: string | null;
}

export const EquipmentModel: React.FC<Props> = ({
  positionData,
  stateData,
  isSelected,
  onSelect,
  activeScenario
}) => {
  const meshGroupRef = useRef<THREE.Group>(null);
  const fanRef = useRef<THREE.Mesh>(null);
  const dishRef = useRef<THREE.Group>(null);
  const heatGlowRef = useRef<THREE.Mesh>(null);

  const isOverheating =
    activeScenario === "GENERATOR_OVERHEAT" &&
    positionData.modelType === "GENERATOR";

  // Dynamic animation updates
  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Rotate HVAC fans
    if (fanRef.current && stateData.status !== "OFFLINE") {
      fanRef.current.rotation.y = time * 8;
    }

    // Gentle tracking sweep for satellite antenna
    if (dishRef.current && stateData.status !== "OFFLINE") {
      dishRef.current.rotation.y = Math.sin(time * 0.2) * 0.4;
    }

    // Generator Overheat heat shimmer pulsation
    if (heatGlowRef.current) {
      if (isOverheating) {
        const pulse = 1.0 + 0.3 * Math.sin(time * 8);
        heatGlowRef.current.scale.set(pulse, pulse, pulse);
      }
    }
  });

  const baseMaterialColor = isSelected ? "#38bdf8" : "#475569";
  const metalRoughness = 0.4;
  const metalness = 0.6;

  // Render specific procedural equipment meshes
  const renderEquipmentGeometry = () => {
    switch (positionData.modelType) {
      case "GENERATOR":
        return (
          <group>
            {/* Base Skid */}
            <mesh position={[0, 0.1, 0]}>
              <boxGeometry args={[1.6, 0.2, 0.9]} />
              <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.5} />
            </mesh>

            {/* Engine Main Block */}
            <mesh position={[-0.2, 0.45, 0]}>
              <boxGeometry args={[0.9, 0.5, 0.7]} />
              <meshStandardMaterial
                color={isOverheating ? "#7f1d1d" : baseMaterialColor}
                emissive={isOverheating ? "#ef4444" : "#000000"}
                emissiveIntensity={isOverheating ? 0.8 : 0}
                roughness={metalRoughness}
                metalness={metalness}
              />
            </mesh>

            {/* Alternator Housing */}
            <mesh position={[0.45, 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.3, 0.3, 0.6, 16]} />
              <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.7} />
            </mesh>

            {/* Exhaust Stack */}
            <mesh position={[-0.4, 0.9, 0.2]}>
              <cylinderGeometry args={[0.06, 0.06, 0.6, 12]} />
              <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
            </mesh>

            {/* Radiator Shroud */}
            <mesh position={[-0.7, 0.5, 0]}>
              <boxGeometry args={[0.15, 0.6, 0.7]} />
              <meshStandardMaterial color="#1e293b" roughness={0.6} />
            </mesh>

            {/* Overheat Heat Shimmer Aura */}
            {isOverheating && (
              <mesh ref={heatGlowRef} position={[-0.2, 0.5, 0]}>
                <sphereGeometry args={[0.8, 16, 16]} />
                <meshBasicMaterial color="#ef4444" transparent opacity={0.25} />
              </mesh>
            )}
          </group>
        );

      case "HVAC":
        return (
          <group>
            {/* Main Air Handling Unit Housing */}
            <mesh position={[0, 0.35, 0]}>
              <boxGeometry args={[1.4, 0.7, 0.9]} />
              <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.5} />
            </mesh>

            {/* Rooftop Dual Fan Cowling */}
            <mesh position={[-0.35, 0.75, 0]}>
              <cylinderGeometry args={[0.25, 0.28, 0.15, 16]} />
              <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[0.35, 0.75, 0]}>
              <cylinderGeometry args={[0.25, 0.28, 0.15, 16]} />
              <meshStandardMaterial color="#334155" />
            </mesh>

            {/* Rotating Fan Blades */}
            <mesh ref={fanRef} position={[-0.35, 0.8, 0]}>
              <boxGeometry args={[0.42, 0.02, 0.06]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>

            {/* Side Intake Duct Louvers */}
            <mesh position={[0, 0.35, 0.46]}>
              <boxGeometry args={[1.0, 0.4, 0.05]} />
              <meshStandardMaterial color="#1e293b" roughness={0.8} />
            </mesh>
          </group>
        );

      case "CONVERTER":
        return (
          <group>
            {/* Electrical Inverter Cabinet */}
            <mesh position={[0, 0.6, 0]}>
              <boxGeometry args={[0.7, 1.2, 0.6]} />
              <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.7} />
            </mesh>

            {/* Front Panel Screen */}
            <mesh position={[0, 0.85, 0.31]}>
              <planeGeometry args={[0.4, 0.25]} />
              <meshStandardMaterial
                color="#06b6d4"
                emissive="#0891b2"
                emissiveIntensity={0.6}
              />
            </mesh>

            {/* Conduit Pipe */}
            <mesh position={[0, 1.25, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.3, 12]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} />
            </mesh>
          </group>
        );

      case "ANTENNA":
        return (
          <group>
            {/* Support Lattice Mast */}
            <mesh position={[0, 0.6, 0]}>
              <cylinderGeometry args={[0.08, 0.18, 1.2, 8]} />
              <meshStandardMaterial color="#475569" roughness={0.5} metalness={0.7} />
            </mesh>

            {/* Steerable Dish Assembly */}
            <group ref={dishRef} position={[0, 1.2, 0]}>
              {/* Parabolic Dish Bowl */}
              <mesh rotation={[Math.PI / 4, 0, 0]}>
                <sphereGeometry args={[0.6, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial
                  color="#f8fafc"
                  roughness={0.2}
                  metalness={0.3}
                  side={THREE.DoubleSide}
                />
              </mesh>

              {/* Central Feedhorn Struts */}
              <mesh position={[0, 0.25, 0.25]}>
                <cylinderGeometry args={[0.02, 0.04, 0.4, 8]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>
            </group>
          </group>
        );

      case "WATER_PUMP":
        return (
          <group>
            {/* Pump Pedestal */}
            <mesh position={[0, 0.1, 0]}>
              <boxGeometry args={[0.9, 0.2, 0.6]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>

            {/* Centrifugal Motor */}
            <mesh position={[-0.2, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.18, 0.18, 0.5, 16]} />
              <meshStandardMaterial color="#0284c7" roughness={0.4} metalness={0.6} />
            </mesh>

            {/* Pump Volute & Impeller Chamber */}
            <mesh position={[0.2, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.25, 0.25, 0.2, 16]} />
              <meshStandardMaterial color="#0369a1" roughness={0.4} metalness={0.6} />
            </mesh>

            {/* Vertical Discharge Pipe */}
            <mesh position={[0.2, 0.65, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.4, 12]} />
              <meshStandardMaterial color="#64748b" metalness={0.8} />
            </mesh>
          </group>
        );

      case "BATTERY":
        return (
          <group>
            {/* Battery Enclosure Container */}
            <mesh position={[0, 0.6, 0]}>
              <boxGeometry args={[1.5, 1.2, 0.9]} />
              <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.6} />
            </mesh>

            {/* Exterior Diagnostic LED Bar */}
            <mesh position={[0.65, 0.6, 0.46]}>
              <boxGeometry args={[0.06, 0.8, 0.04]} />
              <meshStandardMaterial
                color={stateData.status === "HEALTHY" ? "#10b981" : "#f59e0b"}
                emissive={stateData.status === "HEALTHY" ? "#059669" : "#d97706"}
                emissiveIntensity={0.8}
              />
            </mesh>

            {/* Roof Air Exhaust Cap */}
            <mesh position={[0, 1.25, 0]}>
              <boxGeometry args={[0.8, 0.1, 0.4]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
          </group>
        );

      case "FUEL_TANK":
        return (
          <group>
            {/* Spill Containment Berm */}
            <mesh position={[0, 0.1, 0]}>
              <boxGeometry args={[1.8, 0.2, 1.4]} />
              <meshStandardMaterial color="#334155" roughness={0.8} />
            </mesh>

            {/* Horizontal Cylindrical Tank */}
            <mesh position={[0, 0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.4, 0.4, 1.4, 24]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.3} metalness={0.7} />
            </mesh>

            {/* Tank Manifold & Valve Pipe */}
            <mesh position={[0.5, 0.4, 0.6]}>
              <cylinderGeometry args={[0.04, 0.04, 0.6, 12]} />
              <meshStandardMaterial color="#f59e0b" roughness={0.4} metalness={0.8} />
            </mesh>
          </group>
        );

      default:
        return (
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[0.8, 0.8, 0.8]} />
            <meshStandardMaterial color={baseMaterialColor} />
          </mesh>
        );
    }
  };

  return (
    <group
      ref={meshGroupRef}
      position={positionData.position}
      rotation={positionData.rotation || [0, 0, 0]}
      scale={positionData.scale || [1, 1, 1]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Procedural 3D Mesh Geometry */}
      {renderEquipmentGeometry()}

      {/* Floating 3D Anchor Marker & HTML Tooltip */}
      <EquipmentMarker
        equipment={stateData}
        position={[0, 1.1, 0]}
        isSelected={isSelected}
        onSelect={onSelect}
      />
    </group>
  );
};
