/**
 * POLARIS — 3D Spatial Layout & Equipment Coordinate Mappings
 * Phase 6 Architecture (Section 8: Centralized Equipment Mapping)
 */

import { StationCode } from "../../types";
import { Equipment3DPosition } from "./types";

export const EQUIPMENT_POSITIONS: Record<StationCode, Equipment3DPosition[]> = {
  MAITRI: [
    {
      equipmentId: "eq-m-gen-01",
      stationCode: "MAITRI",
      name: "Generator 01 (Caterpillar 3306)",
      category: "POWER",
      position: [10.5, 0.8, -4],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      buildingRef: "bldg-m-generator-shed",
      modelType: "GENERATOR",
      description: "Primary Caterpillar 3306 diesel generator providing 125 kVA base continuous power."
    },
    {
      equipmentId: "eq-m-gen-02",
      stationCode: "MAITRI",
      name: "Generator 02 (Auxiliary Standby)",
      category: "POWER",
      position: [13.5, 0.8, -4],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      buildingRef: "bldg-m-generator-shed",
      modelType: "GENERATOR",
      description: "Auxiliary standby generator synchronized to the main emergency station microgrid."
    },
    {
      equipmentId: "eq-m-conv-01",
      stationCode: "MAITRI",
      name: "DC-AC Power Converter Bus",
      category: "POWER",
      position: [12.0, 0.8, -1.2],
      rotation: [0, Math.PI / 2, 0],
      scale: [1, 1, 1],
      buildingRef: "bldg-m-generator-shed",
      modelType: "CONVERTER",
      description: "Central solid-state power conditioning and frequency stabilization converter bus."
    },
    {
      equipmentId: "eq-m-hvac-01",
      stationCode: "MAITRI",
      name: "Central HVAC Heating Unit",
      category: "HVAC",
      position: [0.0, 3.4, 1.2],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      buildingRef: "bldg-m-main-block",
      modelType: "HVAC",
      description: "Closed-loop glycol heat exchanger and positive-pressure ventilation air unit."
    },
    {
      equipmentId: "eq-m-comm-01",
      stationCode: "MAITRI",
      name: "VSAT Satellite Primary Terminal",
      category: "COMMUNICATION",
      position: [-6.5, 4.4, -6.0],
      rotation: [0, -Math.PI / 4, 0],
      scale: [1, 1, 1],
      buildingRef: "bldg-m-comms-mast",
      modelType: "ANTENNA",
      description: "Heated C-band satellite tracking dish maintaining mission-critical voice & data uplink."
    },
    {
      equipmentId: "eq-m-water-01",
      stationCode: "MAITRI",
      name: "Lake Priyadarshini Water Pump",
      category: "WATER_SYSTEM",
      position: [-13.5, 0.6, 5.5],
      rotation: [0, Math.PI / 6, 0],
      scale: [1, 1, 1],
      buildingRef: "bldg-m-pump-station",
      modelType: "WATER_PUMP",
      description: "Submerged meltwater intake pump with traced heat line from Lake Priyadarshini."
    },
    {
      equipmentId: "eq-m-bat-01",
      stationCode: "MAITRI",
      name: "Emergency Battery Bank Strings",
      category: "POWER",
      position: [6.0, 0.8, 6.5],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      buildingRef: "bldg-m-battery-container",
      modelType: "BATTERY",
      description: "Lithium-Iron-Phosphate (LFP) reserve energy storage modules for vital life support."
    },
    {
      equipmentId: "eq-m-fuel-01",
      stationCode: "MAITRI",
      name: "Fuel Farm Manifold & Heating",
      category: "LIFE_SUPPORT",
      position: [14.5, 1.0, 6.0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      buildingRef: "bldg-m-fuel-storage",
      modelType: "FUEL_TANK",
      description: "Insulated bulk Arctic diesel storage tanks with heated manifold valve distribution."
    }
  ],

  BHARATI: [
    {
      equipmentId: "eq-b-gen-01",
      stationCode: "BHARATI",
      name: "Generator 01 (Volvo Penta Primary)",
      category: "POWER",
      position: [8.5, 1.0, -3.5],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      buildingRef: "bldg-b-east-wing",
      modelType: "GENERATOR",
      description: "Volvo Penta D13 low-emission Tier 3 diesel generator with waste heat recovery."
    },
    {
      equipmentId: "eq-b-gen-02",
      stationCode: "BHARATI",
      name: "Generator 02 (Cogeneration DG2)",
      category: "POWER",
      position: [11.5, 1.0, -3.5],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      buildingRef: "bldg-b-east-wing",
      modelType: "GENERATOR",
      description: "Secondary cogeneration generator providing synchronized grid peak load leveling."
    },
    {
      equipmentId: "eq-b-conv-01",
      stationCode: "BHARATI",
      name: "Hybrid Microgrid Inverter Rack",
      category: "POWER",
      position: [10.0, 1.0, 0.0],
      rotation: [0, Math.PI / 2, 0],
      scale: [1, 1, 1],
      buildingRef: "bldg-b-east-wing",
      modelType: "CONVERTER",
      description: "Multi-string smart hybrid inverter integrating rooftop PV and diesel generator output."
    },
    {
      equipmentId: "eq-b-hvac-01",
      stationCode: "BHARATI",
      name: "Air Handling Unit (AHU Block A)",
      category: "HVAC",
      position: [0.0, 5.0, 2.0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      buildingRef: "bldg-b-main-superstructure",
      modelType: "HVAC",
      description: "Aero-plenum thermal recovery HVAC unit maintaining steady 21°C interior comfort."
    },
    {
      equipmentId: "eq-b-comm-01",
      stationCode: "BHARATI",
      name: "C-Band Earth Station Tracking Dish",
      category: "COMMUNICATION",
      position: [-10.5, 3.2, -6.5],
      rotation: [0, -Math.PI / 3, 0],
      scale: [1, 1, 1],
      buildingRef: "bldg-b-tracking-station",
      modelType: "ANTENNA",
      description: "Motorized 4-meter parabolic radome receiving Indian remote sensing satellite passes."
    },
    {
      equipmentId: "eq-b-water-01",
      stationCode: "BHARATI",
      name: "Reverse Osmosis Seawater Desal Unit",
      category: "WATER_SYSTEM",
      position: [-12.5, 0.8, 5.0],
      rotation: [0, Math.PI / 4, 0],
      scale: [1, 1, 1],
      buildingRef: "bldg-b-desal-annex",
      modelType: "WATER_PUMP",
      description: "Dual-stage high-pressure polar reverse osmosis plant producing 2,500 L/day fresh water."
    },
    {
      equipmentId: "eq-b-bat-01",
      stationCode: "BHARATI",
      name: "Main Lithium-Iron Substation Battery",
      category: "POWER",
      position: [7.5, 0.8, 6.0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      buildingRef: "bldg-b-substation-module",
      modelType: "BATTERY",
      description: "High-density 250 kWh sub-zero rated Lithium-Iron energy storage pack."
    },
    {
      equipmentId: "eq-b-fuel-01",
      stationCode: "BHARATI",
      name: "Double-Walled Arctic Fuel Enclosure",
      category: "LIFE_SUPPORT",
      position: [15.5, 1.1, 5.0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      buildingRef: "bldg-b-fuel-enclosure",
      modelType: "FUEL_TANK",
      description: "Automated climate-shielded Arctic Jet A-1 fuel farm with spill-containment basin."
    }
  ]
};

export const getEquipmentPosition = (
  stationCode: StationCode,
  equipmentId: string
): Equipment3DPosition | undefined => {
  const stationList = EQUIPMENT_POSITIONS[stationCode] || [];
  return stationList.find((p) => p.equipmentId === equipmentId);
};
