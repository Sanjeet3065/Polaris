import React, { useState } from "react";
import { Html } from "@react-three/drei";
import { Equipment3DState } from "./types";
import { EquipmentStatusLight } from "./EquipmentStatusLight";
import { AlertIndicator3D } from "./AlertIndicator3D";
import { ShieldCheck, AlertTriangle, AlertCircle, Wrench } from "lucide-react";

interface Props {
  equipment: Equipment3DState;
  position: [number, number, number];
  isSelected: boolean;
  onSelect: () => void;
}

export const EquipmentMarker: React.FC<Props> = ({
  equipment,
  position,
  isSelected,
  onSelect
}) => {
  const [hovered, setHovered] = useState(false);

  const getStatusIcon = () => {
    switch (equipment.status) {
      case "HEALTHY":
        return <ShieldCheck className="w-3 h-3 text-emerald-400" />;
      case "WARNING":
        return <AlertTriangle className="w-3 h-3 text-amber-400" />;
      case "CRITICAL":
        return <AlertCircle className="w-3 h-3 text-red-400" />;
      default:
        return <Wrench className="w-3 h-3 text-slate-400" />;
    }
  };

  return (
    <group position={position}>
      {/* 3D Status Light Indicator */}
      <EquipmentStatusLight
        status={equipment.status}
        position={[0, 0.4, 0]}
        size={isSelected ? 0.2 : 0.14}
        showPointLight={isSelected || hovered}
      />

      {/* Active Alert Floating Beacon if Alert is Present */}
      {equipment.hasActiveAlert && equipment.activeAlertSeverity && (
        <AlertIndicator3D
          severity={equipment.activeAlertSeverity}
          title={equipment.activeAlertTitle || "Equipment Alert Active"}
          position={[0, 1.1, 0]}
          onClick={onSelect}
        />
      )}

      {/* Selection Cylinder Highlight / Pedestal */}
      {isSelected && (
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.9, 0.9, 0.05, 32]} />
          <meshBasicMaterial color="#06b6d4" transparent opacity={0.4} />
        </mesh>
      )}

      {/* HTML Hover Tooltip / Status Badge */}
      <Html
        position={[0, 0.7, 0]}
        center
        distanceFactor={18}
        zIndexRange={[50, 0]}
      >
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className={`cursor-pointer transition-all duration-200 select-none ${
            hovered || isSelected ? "opacity-100 scale-105" : "opacity-80 scale-95"
          }`}
        >
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-md shadow-lg border transition-colors ${
              isSelected
                ? "bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-cyan-500/20"
                : hovered
                ? "bg-slate-900/90 border-slate-600 text-white"
                : "bg-slate-950/80 border-slate-800 text-slate-300"
            }`}
          >
            {getStatusIcon()}
            <span className="text-xs font-semibold whitespace-nowrap">
              {equipment.name.split("(")[0].trim()}
            </span>

            {/* Health pill */}
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                equipment.healthScore >= 90
                  ? "bg-emerald-500/20 text-emerald-300"
                  : equipment.healthScore >= 75
                  ? "bg-amber-500/20 text-amber-300"
                  : "bg-red-500/20 text-red-300"
              }`}
            >
              {equipment.healthScore}%
            </span>
          </div>
        </div>
      </Html>
    </group>
  );
};
