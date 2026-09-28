import { Equipment } from "../types";

export const MOCK_EQUIPMENT: Equipment[] = [
  {
    id: "eq-m-gen-01",
    stationId: "MAITRI",
    name: "Generator 01 (Caterpillar 3306)",
    category: "POWER",
    healthScore: 94,
    status: "HEALTHY",
    lastChecked: "2 min ago",
    modelNumber: "CAT-3306-DITA"
  },
  {
    id: "eq-m-gen-02",
    stationId: "MAITRI",
    name: "Generator 02 (Auxiliary Standby)",
    category: "POWER",
    healthScore: 88,
    status: "WARNING",
    lastChecked: "5 min ago",
    modelNumber: "CAT-3304-NA"
  },
  {
    id: "eq-m-hvac-01",
    stationId: "MAITRI",
    name: "Central HVAC Heating Unit",
    category: "HVAC",
    healthScore: 92,
    status: "HEALTHY",
    lastChecked: "1 min ago",
    modelNumber: "DAIKIN-POLAR-400"
  },
  {
    id: "eq-m-conv-01",
    stationId: "MAITRI",
    name: "DC-AC Power Converter Bus",
    category: "POWER",
    healthScore: 96,
    status: "HEALTHY",
    lastChecked: "4 min ago",
    modelNumber: "ABB-SOLO-50K"
  },
  {
    id: "eq-m-comm-01",
    stationId: "MAITRI",
    name: "VSAT Satellite Primary Terminal",
    category: "COMMUNICATION",
    healthScore: 91,
    status: "HEALTHY",
    lastChecked: "30 sec ago",
    modelNumber: "COBHAM-EXPLORER-8100"
  },
  {
    id: "eq-m-water-01",
    stationId: "MAITRI",
    name: "Lake Priyadarshini Water Pump",
    category: "WATER_SYSTEM",
    healthScore: 82,
    status: "WARNING",
    lastChecked: "12 min ago",
    modelNumber: "GRUNDFOS-CRNE-10"
  },
  {
    id: "eq-m-bat-01",
    stationId: "MAITRI",
    name: "Emergency Battery Bank Strings",
    category: "POWER",
    healthScore: 95,
    status: "HEALTHY",
    lastChecked: "3 min ago",
    modelNumber: "SAFT-LFP-48V"
  },
  {
    id: "eq-m-fuel-01",
    stationId: "MAITRI",
    name: "Fuel Farm Manifold & Heating",
    category: "LIFE_SUPPORT",
    healthScore: 90,
    status: "HEALTHY",
    lastChecked: "6 min ago",
    modelNumber: "TITAN-ARCTIC-MANIFOLD"
  },
  // BHARATI Equipment
  {
    id: "eq-b-gen-01",
    stationId: "BHARATI",
    name: "Generator 01 (Volvo Penta Primary)",
    category: "POWER",
    healthScore: 92,
    status: "HEALTHY",
    lastChecked: "3 min ago",
    modelNumber: "VOLVO-D13-HEAVY"
  },
  {
    id: "eq-b-gen-02",
    stationId: "BHARATI",
    name: "Generator 02 (Cogeneration DG2)",
    category: "POWER",
    healthScore: 78,
    status: "WARNING",
    lastChecked: "8 min ago",
    modelNumber: "VOLVO-D13-CHP"
  },
  {
    id: "eq-b-hvac-01",
    stationId: "BHARATI",
    name: "Air Handling Unit (AHU Block A)",
    category: "HVAC",
    healthScore: 95,
    status: "HEALTHY",
    lastChecked: "1 min ago",
    modelNumber: "SYSTEMAIR-GENIOX"
  },
  {
    id: "eq-b-conv-01",
    stationId: "BHARATI",
    name: "Hybrid Microgrid Inverter Rack",
    category: "POWER",
    healthScore: 98,
    status: "HEALTHY",
    lastChecked: "2 min ago",
    modelNumber: "SCHNEIDER-CONEXT-XW"
  },
  {
    id: "eq-b-comm-01",
    stationId: "BHARATI",
    name: "C-Band Earth Station Tracking Dish",
    category: "COMMUNICATION",
    healthScore: 96,
    status: "HEALTHY",
    lastChecked: "1 min ago",
    modelNumber: "INTELCAN-TRACK-4M"
  },
  {
    id: "eq-b-water-01",
    stationId: "BHARATI",
    name: "Reverse Osmosis Seawater Desal Unit",
    category: "WATER_SYSTEM",
    healthScore: 86,
    status: "WARNING",
    lastChecked: "15 min ago",
    modelNumber: "ECOLOTEC-RO-POLAR"
  },
  {
    id: "eq-b-bat-01",
    stationId: "BHARATI",
    name: "Main Lithium-Iron Substation Battery",
    category: "POWER",
    healthScore: 89,
    status: "WARNING",
    lastChecked: "4 min ago",
    modelNumber: "TESLA-MEGAPACK-MICRO"
  },
  {
    id: "eq-b-fuel-01",
    stationId: "BHARATI",
    name: "Double-Walled Arctic Fuel Enclosure",
    category: "LIFE_SUPPORT",
    healthScore: 94,
    status: "HEALTHY",
    lastChecked: "10 min ago",
    modelNumber: "WESTERN-TRANS-TANK"
  }
];
