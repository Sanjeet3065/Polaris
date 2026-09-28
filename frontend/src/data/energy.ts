import { EnergyTelemetry, HourlyPowerDataPoint } from "../types";

export const MOCK_ENERGY: Record<"MAITRI" | "BHARATI" | "ALL", EnergyTelemetry> = {
  MAITRI: {
    stationCode: "MAITRI",
    timestamp: new Date().toISOString(),
    solarGenerationKw: 45,
    dieselGenerationKw: 375,
    totalGenerationKw: 420,
    totalConsumptionKw: 378,
    netPowerBalanceKw: 42,
    batteryPercentage: 82,
    batteryStatus: "STABLE",
    batteryVoltageV: 498.4,
    fuelReservesPercent: 68,
    fuelReservesLiters: 81600,
    fuelAutonomyDaysRemaining: 218
  },
  BHARATI: {
    stationCode: "BHARATI",
    timestamp: new Date().toISOString(),
    solarGenerationKw: 65,
    dieselGenerationKw: 325,
    totalGenerationKw: 390,
    totalConsumptionKw: 365,
    netPowerBalanceKw: 25,
    batteryPercentage: 74,
    batteryStatus: "CHARGING",
    batteryVoltageV: 489.2,
    fuelReservesPercent: 61,
    fuelReservesLiters: 73200,
    fuelAutonomyDaysRemaining: 195
  },
  ALL: {
    stationCode: "BHARATI",
    timestamp: new Date().toISOString(),
    solarGenerationKw: 110,
    dieselGenerationKw: 700,
    totalGenerationKw: 810,
    totalConsumptionKw: 743,
    netPowerBalanceKw: 67,
    batteryPercentage: 78,
    batteryStatus: "CHARGING",
    batteryVoltageV: 493.8,
    fuelReservesPercent: 65,
    fuelReservesLiters: 154800,
    fuelAutonomyDaysRemaining: 206
  }
};

export const MOCK_HOURLY_POWER: Record<"MAITRI" | "BHARATI" | "ALL", HourlyPowerDataPoint[]> = {
  MAITRI: [
    { time: "00:00", generation: 395, consumption: 360 },
    { time: "02:00", generation: 390, consumption: 355 },
    { time: "04:00", generation: 388, consumption: 358 },
    { time: "06:00", generation: 405, consumption: 370 },
    { time: "08:00", generation: 420, consumption: 385 },
    { time: "10:00", generation: 435, consumption: 390 },
    { time: "12:00", generation: 440, consumption: 392 },
    { time: "14:00", generation: 432, consumption: 388 },
    { time: "16:00", generation: 425, consumption: 382 },
    { time: "18:00", generation: 415, consumption: 378 },
    { time: "20:00", generation: 405, consumption: 372 },
    { time: "22:00", generation: 398, consumption: 365 }
  ],
  BHARATI: [
    { time: "00:00", generation: 370, consumption: 345 },
    { time: "02:00", generation: 365, consumption: 342 },
    { time: "04:00", generation: 360, consumption: 340 },
    { time: "06:00", generation: 378, consumption: 355 },
    { time: "08:00", generation: 395, consumption: 370 },
    { time: "10:00", generation: 410, consumption: 380 },
    { time: "12:00", generation: 415, consumption: 382 },
    { time: "14:00", generation: 408, consumption: 375 },
    { time: "16:00", generation: 398, consumption: 368 },
    { time: "18:00", generation: 385, consumption: 360 },
    { time: "20:00", generation: 378, consumption: 352 },
    { time: "22:00", generation: 372, consumption: 348 }
  ],
  ALL: [
    { time: "00:00", generation: 765, consumption: 705 },
    { time: "02:00", generation: 755, consumption: 697 },
    { time: "04:00", generation: 748, consumption: 698 },
    { time: "06:00", generation: 783, consumption: 725 },
    { time: "08:00", generation: 815, consumption: 755 },
    { time: "10:00", generation: 845, consumption: 770 },
    { time: "12:00", generation: 855, consumption: 774 },
    { time: "14:00", generation: 840, consumption: 763 },
    { time: "16:00", generation: 823, consumption: 750 },
    { time: "18:00", generation: 800, consumption: 738 },
    { time: "20:00", generation: 783, consumption: 724 },
    { time: "22:00", generation: 770, consumption: 713 }
  ]
};
