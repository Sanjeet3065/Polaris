import React from "react";
import * as THREE from "three";
import { StationCode } from "../../types";

interface Props {
  stationCode: StationCode;
  showBuildings: boolean;
}

export const StationBuilding: React.FC<Props> = ({ stationCode, showBuildings }) => {
  if (!showBuildings) return null;

  if (stationCode === "MAITRI") {
    // -------------------------------------------------------------
    // MAITRI STATION: Schirmacher Oasis Modular Construction (1989)
    // -------------------------------------------------------------
    return (
      <group>
        {/* Main Base Complex — Elevated on Heavy Steel Stilts */}
        <group position={[0, 1.6, 0]}>
          {/* Main 2-Story Modular Living & Science Block */}
          <mesh position={[0, 1.0, 0]}>
            <boxGeometry args={[16, 2.8, 8]} />
            <meshStandardMaterial color="#ea580c" roughness={0.5} metalness={0.2} />
          </mesh>

          {/* Roof Ridge with Snow Drift Pitch */}
          <mesh position={[0, 2.55, 0]}>
            <boxGeometry args={[16.2, 0.3, 8.2]} />
            <meshStandardMaterial color="#c2410c" roughness={0.4} metalness={0.4} />
          </mesh>

          {/* Double-Glazed Polar Window Band */}
          <mesh position={[0, 1.3, 4.02]}>
            <planeGeometry args={[14, 0.8]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#0284c7"
              emissiveIntensity={0.3}
              roughness={0.1}
              metalness={0.9}
            />
          </mesh>
          <mesh position={[0, 1.3, -4.02]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[14, 0.8]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#0284c7"
              emissiveIntensity={0.3}
              roughness={0.1}
              metalness={0.9}
            />
          </mesh>

          {/* Thermal Airlock Entry Vestibule */}
          <mesh position={[-7.5, 0.8, 4.8]}>
            <boxGeometry args={[2.5, 2.0, 2.0]} />
            <meshStandardMaterial color="#9a3412" roughness={0.6} />
          </mesh>

          {/* Foundation Stilts (Maitri elevated to prevent snowdrifts) */}
          {[-7, -3.5, 0, 3.5, 7].map((x) =>
            [-3.5, 3.5].map((z) => (
              <mesh key={`stilt-${x}-${z}`} position={[x, -0.8, z]}>
                <cylinderGeometry args={[0.2, 0.25, 1.6, 12]} />
                <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
              </mesh>
            ))
          )}
        </group>

        {/* Generator Building (Separate Safety Power House) */}
        <group position={[12, 1.2, -4]}>
          <mesh position={[0, 0.9, 0]}>
            <boxGeometry args={[7, 2.4, 5]} />
            <meshStandardMaterial color="#475569" roughness={0.6} metalness={0.3} />
          </mesh>
          {/* Generator Roof Exhaust vents */}
          <mesh position={[-1.5, 2.2, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.4, 12]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[1.5, 2.2, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.4, 12]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          {/* Stilts */}
          {[-2.8, 2.8].map((x) =>
            [-1.8, 1.8].map((z) => (
              <mesh key={`gen-stilt-${x}-${z}`} position={[x, -0.6, z]}>
                <cylinderGeometry args={[0.18, 0.2, 1.2, 8]} />
                <meshStandardMaterial color="#1e293b" metalness={0.7} />
              </mesh>
            ))
          )}
        </group>

        {/* Lake Priyadarshini Meltwater Pump House */}
        <group position={[-13.5, 0.8, 5.5]}>
          <mesh position={[0, 0.6, 0]}>
            <boxGeometry args={[3.5, 1.6, 2.8]} />
            <meshStandardMaterial color="#0284c7" roughness={0.5} />
          </mesh>
        </group>

        {/* Elevated Heated Utility Pipes connecting Power & Fuel to Main Base */}
        <mesh position={[6, 0.8, -2]} rotation={[0, -Math.PI / 6, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 7, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} />
        </mesh>
        <mesh position={[-6.5, 0.6, 2.5]} rotation={[0, Math.PI / 4, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 8, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} />
        </mesh>
      </group>
    );
  }

  // -------------------------------------------------------------
  // BHARATI STATION: Aerodynamic Container Superstructure (2012)
  // -------------------------------------------------------------
  return (
    <group>
      {/* Elevated Aerodynamic Main Station (Faceted Aluminum Envelope) */}
      <group position={[0, 2.5, 0]}>
        {/* Main Central Aerodynamic Hull */}
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[20, 3.6, 10]} />
          <meshStandardMaterial
            color="#cbd5e1"
            roughness={0.25}
            metalness={0.65}
          />
        </mesh>

        {/* Aerodynamic Chamfered Wind Deflector Nose */}
        <mesh position={[-10.2, 1.2, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[2.5, 2.5, 9.8]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.7} />
        </mesh>

        {/* Panoramic Glass Observation Facade overlooking Ice Sheet */}
        <mesh position={[0, 1.4, 5.02]}>
          <planeGeometry args={[18, 1.8]} />
          <meshStandardMaterial
            color="#0284c7"
            emissive="#0369a1"
            emissiveIntensity={0.4}
            roughness={0.05}
            metalness={0.95}
          />
        </mesh>

        {/* Rooftop Solar PV Arrays */}
        {[-6, -2, 2, 6].map((x) => (
          <group key={`pv-rack-${x}`} position={[x, 3.2, -1]} rotation={[-Math.PI / 6, 0, 0]}>
            <mesh>
              <boxGeometry args={[3.2, 0.08, 1.8]} />
              <meshStandardMaterial
                color="#1e1b4b"
                emissive="#312e81"
                emissiveIntensity={0.2}
                roughness={0.2}
                metalness={0.8}
              />
            </mesh>
          </group>
        ))}

        {/* Heli-deck Circle Marking on Terrace */}
        <mesh position={[0, 3.02, 2.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 1.7, 32]} />
          <meshBasicMaterial color="#f59e0b" side={THREE.DoubleSide} />
        </mesh>

        {/* Heavy Aerodynamic Hydraulic Support Columns */}
        {[-8, -4, 0, 4, 8].map((x) =>
          [-3.8, 3.8].map((z) => (
            <mesh key={`pylon-${x}-${z}`} position={[x, -1.2, z]}>
              <cylinderGeometry args={[0.35, 0.45, 2.4, 16]} />
              <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.85} />
            </mesh>
          ))
        )}
      </group>

      {/* East Machinery Wing: Cogeneration & Substation Module */}
      <group position={[10, 1.4, -2.5]}>
        <mesh position={[0, 0.8, 0]}>
          <boxGeometry args={[6.5, 2.2, 4.5]} />
          <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.5} />
        </mesh>
      </group>

      {/* Marine RO Desalination & Sea Pumping Annex */}
      <group position={[-12.5, 1.0, 5.0]}>
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[4.0, 1.8, 3.2]} />
          <meshStandardMaterial color="#0284c7" roughness={0.4} metalness={0.6} />
        </mesh>
      </group>

      {/* Arctic Coastal Fuel Bunker Enclosure */}
      <group position={[15.5, 1.2, 5.0]}>
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[5.0, 1.6, 3.8]} />
          <meshStandardMaterial color="#334155" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
};
