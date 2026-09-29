import { ScenarioDefinition, ScenarioType } from "../models/simulator.types";

export const SCENARIO_CATALOG: Record<ScenarioType, ScenarioDefinition> = {
  NORMAL: {
    type: "NORMAL",
    name: "Nominal Operations",
    description: "Standard Antarctic operations with gentle baseline drift and realistic micro-sensor noise.",
    defaultDurationSeconds: 300,
    defaultIntensity: 0.5,
    targetDomain: "ALL"
  },
  GENERATOR_OVERHEAT: {
    type: "GENERATOR_OVERHEAT",
    name: "Primary Diesel Generator Overheating",
    description: "Generator cooling jacket temperature gradually rises above threshold with increasing mechanical vibration.",
    defaultDurationSeconds: 300,
    defaultIntensity: 0.8,
    targetDomain: "EQUIPMENT"
  },
  BATTERY_LOW: {
    type: "BATTERY_LOW",
    name: "Emergency Battery Depletion",
    description: "Battery bank state-of-charge experiences rapid discharge, threatening station life-support backup.",
    defaultDurationSeconds: 300,
    defaultIntensity: 0.75,
    targetDomain: "ENERGY"
  },
  HIGH_WIND: {
    type: "HIGH_WIND",
    name: "Severe Katabatic Storm / Blizzard",
    description: "Sudden onset of extreme Antarctic blizzard with wind gusts exceeding 100 km/h and near-zero visibility.",
    defaultDurationSeconds: 300,
    defaultIntensity: 0.85,
    targetDomain: "ENVIRONMENT"
  },
  POWER_SHORTAGE: {
    type: "POWER_SHORTAGE",
    name: "Station Microgrid Generation Deficit",
    description: "Combined power generation falls significantly below station life-support consumption demand.",
    defaultDurationSeconds: 300,
    defaultIntensity: 0.7,
    targetDomain: "ENERGY"
  },
  LOW_FUEL: {
    type: "LOW_FUEL",
    name: "Critical Fuel Reserve Depletion",
    description: "Station fuel storage falls below 20% safety threshold, reducing operational autonomy days.",
    defaultDurationSeconds: 300,
    defaultIntensity: 0.8,
    targetDomain: "ENERGY"
  },
  COMMUNICATION_DEGRADED: {
    type: "COMMUNICATION_DEGRADED",
    name: "ISRO Earth Station / Satellite Link Degradation",
    description: "Deep fading of satellite tracking antenna with elevated signal attenuation and RF tracking error.",
    defaultDurationSeconds: 300,
    defaultIntensity: 0.65,
    targetDomain: "EQUIPMENT"
  },
  EQUIPMENT_DEGRADATION: {
    type: "EQUIPMENT_DEGRADATION",
    name: "Multi-Subsystem Mechanical Wear",
    description: "Simultaneous vibration increase and thermal rise across station HVAC, water pumps, and generators.",
    defaultDurationSeconds: 300,
    defaultIntensity: 0.75,
    targetDomain: "EQUIPMENT"
  }
};
