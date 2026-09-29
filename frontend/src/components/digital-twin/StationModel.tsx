import React from "react";
import { StationCode, Alert } from "../../types";
import { Equipment3DState, DigitalTwinLayerState } from "./types";
import { EQUIPMENT_POSITIONS } from "./equipmentPositions";
import { StationBuilding } from "./StationBuilding";
import { EquipmentModel } from "./EquipmentModel";

interface Props {
  stationCode: StationCode;
  equipmentStates: Equipment3DState[];
  alerts: Alert[];
  selectedEquipmentId: string | null;
  onSelectEquipment: (id: string) => void;
  layers: DigitalTwinLayerState;
  activeScenario?: string | null;
}

export const StationModel: React.FC<Props> = ({
  stationCode,
  equipmentStates,
  alerts: _alerts,
  selectedEquipmentId,
  onSelectEquipment,
  layers,
  activeScenario
}) => {
  const positions = EQUIPMENT_POSITIONS[stationCode] || [];

  return (
    <group>
      {/* 3D Physical Buildings & Infrastructure */}
      <StationBuilding
        stationCode={stationCode}
        showBuildings={layers.buildings}
      />

      {/* Interactive 3D Equipment Models */}
      {layers.equipment &&
        positions.map((pos) => {
          const stateData = equipmentStates.find(
            (eq) => eq.id === pos.equipmentId
          ) || {
            id: pos.equipmentId,
            name: pos.name,
            category: pos.category,
            status: "HEALTHY",
            healthScore: 95,
            lastChecked: "Live",
            modelNumber: pos.modelType
          };

          const isSelected = selectedEquipmentId === pos.equipmentId;

          return (
            <EquipmentModel
              key={pos.equipmentId}
              positionData={pos}
              stateData={stateData}
              isSelected={isSelected}
              onSelect={() => onSelectEquipment(pos.equipmentId)}
              activeScenario={activeScenario}
            />
          );
        })}
    </group>
  );
};
