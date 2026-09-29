import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { StationCode, Alert } from "../../types";
import {
  Equipment3DState,
  DigitalTwinCameraPreset,
  DigitalTwinLayerState
} from "./types";
import { DigitalTwinErrorBoundary } from "./DigitalTwinErrorBoundary";
import { Loading3DScene } from "./Loading3DScene";
import { StationEnvironment } from "./StationEnvironment";
import { StationModel } from "./StationModel";
import { DigitalTwinControls } from "./DigitalTwinControls";
import { DigitalTwinToolbar } from "./DigitalTwinToolbar";
import { DigitalTwinLegend } from "./DigitalTwinLegend";
import { getEquipmentPosition } from "./equipmentPositions";

interface Props {
  stationCode: StationCode;
  equipmentStates: Equipment3DState[];
  alerts: Alert[];
  windSpeedKmH: number;
  selectedEquipmentId: string | null;
  onSelectEquipment: (id: string | null) => void;
  preset: DigitalTwinCameraPreset;
  onSetPreset: (preset: DigitalTwinCameraPreset) => void;
  layers: DigitalTwinLayerState;
  onToggleLayer: (layer: keyof DigitalTwinLayerState) => void;
  activeScenario?: string | null;
}

export const DigitalTwinCanvas: React.FC<Props> = ({
  stationCode,
  equipmentStates,
  alerts,
  windSpeedKmH,
  selectedEquipmentId,
  onSelectEquipment,
  preset,
  onSetPreset,
  layers,
  onToggleLayer,
  activeScenario
}) => {
  // Find focus target coordinates if an asset is selected
  const targetFocusPosition = selectedEquipmentId
    ? getEquipmentPosition(stationCode, selectedEquipmentId)?.position || null
    : null;

  return (
    <DigitalTwinErrorBoundary>
      <div className="relative w-full h-full min-h-[520px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
        {/* R3F WebGL 3D Canvas */}
        <Canvas
          camera={{ position: [24, 18, 28], fov: 45 }}
          gl={{
            antialias: true,
            powerPreference: "high-performance",
            alpha: false
          }}
          onPointerMissed={() => onSelectEquipment(null)}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          <color attach="background" args={["#080c14"]} />

          <Suspense fallback={<Loading3DScene />}>
            {/* Polar Environment, Terrain, Nunataks & Katabatic Wind Snow Particles */}
            <StationEnvironment
              stationCode={stationCode}
              windSpeedKmH={windSpeedKmH}
              showEnvironment={layers.environment}
              activeScenario={activeScenario}
            />

            {/* Station Physical Infrastructure & Equipment Assets */}
            <StationModel
              stationCode={stationCode}
              equipmentStates={equipmentStates}
              alerts={alerts}
              selectedEquipmentId={selectedEquipmentId}
              onSelectEquipment={onSelectEquipment}
              layers={layers}
              activeScenario={activeScenario}
            />

            {/* Smooth Orbit & Preset Camera Controls */}
            <DigitalTwinControls
              preset={preset}
              targetFocusPosition={targetFocusPosition}
              onPresetApplied={() => onSetPreset("default")}
            />
          </Suspense>
        </Canvas>

        {/* Top Floating Controls & Layer Toolbar */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
          <DigitalTwinToolbar
            preset={preset}
            onSetPreset={onSetPreset}
            layers={layers}
            onToggleLayer={onToggleLayer}
          />
        </div>

        {/* Bottom Left Status Legend */}
        <div className="absolute bottom-4 left-4 pointer-events-none z-10 hidden sm:block">
          <DigitalTwinLegend />
        </div>
      </div>
    </DigitalTwinErrorBoundary>
  );
};
