import dotenv from "dotenv";
import path from "path";

// Load environment variables for seed execution
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import {
  PrismaClient,
  StationStatus,
  EquipmentCategory,
  EquipmentStatus,
  AlertSeverity,
  AlertStatus,
  InventoryStatus,
  MaintenanceType,
  MaintenanceStatus,
  TelemetryStatus,
  UserRole,
  StockMovementType,
  ShipmentStatus,
  ShipmentPriority,
  IncidentStatus,
  IncidentSeverity,
  IncidentCategory,
  IncidentImpact,
  RiskBand,
  DataQuality
} from "@prisma/client";
import { PasswordService } from "../src/utils/password";

const prisma = new PrismaClient();

// ============================================================
// DETERMINISTIC HISTORICAL TIME HELPERS (UTC)
// ============================================================
const NOW = new Date("2026-09-28T18:00:00.000Z");
const hoursAgo = (hours: number): Date => new Date(NOW.getTime() - hours * 3600 * 1000);
const daysAgo = (days: number): Date => new Date(NOW.getTime() - days * 24 * 3600 * 1000);

async function main() {
  console.log("=================================================");
  console.log("POLARIS Phase 2: Seeding Deterministic Demo Data");
  console.log("Notice: All values are for SIMULATION / DEMO only");
  console.log("=================================================");

  // ------------------------------------------------------------
  // 1. STATION: MAITRI
  // ------------------------------------------------------------
  console.log("Seeding Station 1: MAITRI...");
  const maitri = await prisma.station.upsert({
    where: { code: "MAITRI" },
    update: {
      name: "Maitri Research Station",
      tagline: "India's Second Permanent Antarctic Research Facility",
      description:
        "Commissioned in 1989 in the Schirmacher Oasis, Queen Maud Land. Houses scientific laboratories for meteorology, geomagnetism, and glaciology.",
      latitude: -70.767,
      longitude: 11.733,
      altitude: 117.0,
      timezone: "UTC+05:00",
      status: StationStatus.OPERATIONAL,
      healthPercent: 98.0,
      commissionedYear: 1989,
      personnelCapacity: 65,
      currentPersonnel: 24
    },
    create: {
      code: "MAITRI",
      name: "Maitri Research Station",
      tagline: "India's Second Permanent Antarctic Research Facility",
      description:
        "Commissioned in 1989 in the Schirmacher Oasis, Queen Maud Land. Houses scientific laboratories for meteorology, geomagnetism, and glaciology.",
      latitude: -70.767,
      longitude: 11.733,
      altitude: 117.0,
      timezone: "UTC+05:00",
      status: StationStatus.OPERATIONAL,
      healthPercent: 98.0,
      commissionedYear: 1989,
      personnelCapacity: 65,
      currentPersonnel: 24
    }
  });

  // ------------------------------------------------------------
  // 2. STATION: BHARATI
  // ------------------------------------------------------------
  console.log("Seeding Station 2: BHARATI...");
  const bharati = await prisma.station.upsert({
    where: { code: "BHARATI" },
    update: {
      name: "Bharati Research Station",
      tagline: "India's State-of-the-Art Polar Research Facility",
      description:
        "Commissioned in 2012 in the Larsemann Hills. Constructed from 134 prefabricated shipping containers on stilts with minimal environmental footprint.",
      latitude: -69.407,
      longitude: 76.187,
      altitude: 35.0,
      timezone: "UTC+05:00",
      status: StationStatus.OPERATIONAL,
      healthPercent: 94.0,
      commissionedYear: 2012,
      personnelCapacity: 47,
      currentPersonnel: 18
    },
    create: {
      code: "BHARATI",
      name: "Bharati Research Station",
      tagline: "India's State-of-the-Art Polar Research Facility",
      description:
        "Commissioned in 2012 in the Larsemann Hills. Constructed from 134 prefabricated shipping containers on stilts with minimal environmental footprint.",
      latitude: -69.407,
      longitude: 76.187,
      altitude: 35.0,
      timezone: "UTC+05:00",
      status: StationStatus.OPERATIONAL,
      healthPercent: 94.0,
      commissionedYear: 2012,
      personnelCapacity: 47,
      currentPersonnel: 18
    }
  });

  // Clean existing dependent demo records for idempotency
  const stationIds = [maitri.id, bharati.id];
  await prisma.stationTelemetry.deleteMany({ where: { stationId: { in: stationIds } } });
  await prisma.energyReading.deleteMany({ where: { stationId: { in: stationIds } } });
  await prisma.environmentalReading.deleteMany({ where: { stationId: { in: stationIds } } });
  await prisma.operationalEvent.deleteMany({ where: { stationId: { in: stationIds } } });
  await prisma.alert.deleteMany({ where: { stationId: { in: stationIds } } });
  await prisma.inventoryItem.deleteMany({ where: { stationId: { in: stationIds } } });
  await prisma.equipment.deleteMany({ where: { stationId: { in: stationIds } } });

  // ------------------------------------------------------------
  // 3. TELEMETRY & ENVIRONMENTAL & ENERGY (HISTORICAL 24 HOURS)
  // ------------------------------------------------------------
  console.log("Seeding historical telemetry and energy time-series (past 24h)...");

  for (let i = 24; i >= 0; i--) {
    const timestamp = hoursAgo(i);

    // Maitri deterministic curve
    const mTempOffset = Math.sin((i / 24) * Math.PI * 2) * 2.5;
    const mWindOffset = Math.cos((i / 24) * Math.PI * 2) * 4.0;
    const mSolarGen = i >= 6 && i <= 18 ? 145 + Math.sin(((i - 6) / 12) * Math.PI) * 40 : 15;
    const mDieselGen = 275 - (mSolarGen - 80) * 0.4;
    const mTotalGen = mSolarGen + mDieselGen;
    const mConsumption = 378 + Math.cos(i * 0.5) * 8;

    // Maitri Station Telemetry
    await prisma.stationTelemetry.create({
      data: {
        stationId: maitri.id,
        recordedAt: timestamp,
        temperature: Number((-31.4 + mTempOffset).toFixed(1)),
        humidity: Number((72.0 + Math.sin(i) * 2.0).toFixed(1)),
        pressure: Number((982.0 + Math.cos(i * 0.3) * 3.0).toFixed(1)),
        windSpeed: Number((38.0 + mWindOffset).toFixed(1)),
        windDirection: 145.0,
        visibility: 15.0
      }
    });

    // Maitri Environmental Reading
    await prisma.environmentalReading.create({
      data: {
        stationId: maitri.id,
        recordedAt: timestamp,
        temperature: Number((-31.4 + mTempOffset).toFixed(1)),
        humidity: Number((72.0 + Math.sin(i) * 2.0).toFixed(1)),
        pressure: Number((982.0 + Math.cos(i * 0.3) * 3.0).toFixed(1)),
        windSpeed: Number((38.0 + mWindOffset).toFixed(1)),
        windDirection: 145.0,
        windDirectionCompass: "SE",
        visibility: 15.0,
        solarRadiation: Number((mSolarGen * 3.2).toFixed(1)),
        snowfallRate: i === 2 ? 1.2 : 0.0,
        status: TelemetryStatus.NORMAL
      }
    });

    // Maitri Energy Reading
    await prisma.energyReading.create({
      data: {
        stationId: maitri.id,
        recordedAt: timestamp,
        generationKw: Number(mTotalGen.toFixed(1)),
        solarKw: Number(mSolarGen.toFixed(1)),
        dieselKw: Number(mDieselGen.toFixed(1)),
        consumptionKw: Number(mConsumption.toFixed(1)),
        netPowerKw: Number((mTotalGen - mConsumption).toFixed(1)),
        batteryPercent: Number((82.0 + (i === 0 ? 0 : Math.sin(i * 0.2) * 3)).toFixed(1)),
        batteryVoltage: 48.6,
        fuelPercent: 68.0,
        fuelLiters: 81600.0,
        fuelDaysRemaining: 68.0
      }
    });

    // Bharati deterministic curve
    const bTempOffset = Math.sin((i / 24) * Math.PI * 2) * 3.0;
    const bWindOffset = Math.cos((i / 24) * Math.PI * 2) * 5.0;
    const bSolarGen = i >= 6 && i <= 18 ? 110 + Math.sin(((i - 6) / 12) * Math.PI) * 35 : 10;
    const bDieselGen = 280 - (bSolarGen - 60) * 0.4;
    const bTotalGen = bSolarGen + bDieselGen;
    const bConsumption = 365 + Math.sin(i * 0.6) * 10;

    // Bharati Station Telemetry
    await prisma.stationTelemetry.create({
      data: {
        stationId: bharati.id,
        recordedAt: timestamp,
        temperature: Number((-28.7 + bTempOffset).toFixed(1)),
        humidity: Number((69.0 + Math.sin(i * 0.8) * 2.5).toFixed(1)),
        pressure: Number((978.0 + Math.cos(i * 0.4) * 2.0).toFixed(1)),
        windSpeed: Number((44.0 + bWindOffset).toFixed(1)),
        windDirection: 180.0,
        visibility: 12.0
      }
    });

    // Bharati Environmental Reading
    await prisma.environmentalReading.create({
      data: {
        stationId: bharati.id,
        recordedAt: timestamp,
        temperature: Number((-28.7 + bTempOffset).toFixed(1)),
        humidity: Number((69.0 + Math.sin(i * 0.8) * 2.5).toFixed(1)),
        pressure: Number((978.0 + Math.cos(i * 0.4) * 2.0).toFixed(1)),
        windSpeed: Number((44.0 + bWindOffset).toFixed(1)),
        windDirection: 180.0,
        windDirectionCompass: "S",
        visibility: 12.0,
        solarRadiation: Number((bSolarGen * 3.4).toFixed(1)),
        snowfallRate: 0.0,
        status: TelemetryStatus.NORMAL
      }
    });

    // Bharati Energy Reading
    await prisma.energyReading.create({
      data: {
        stationId: bharati.id,
        recordedAt: timestamp,
        generationKw: Number(bTotalGen.toFixed(1)),
        solarKw: Number(bSolarGen.toFixed(1)),
        dieselKw: Number(bDieselGen.toFixed(1)),
        consumptionKw: Number(bConsumption.toFixed(1)),
        netPowerKw: Number((bTotalGen - bConsumption).toFixed(1)),
        batteryPercent: Number((74.0 + (i === 0 ? 0 : Math.sin(i * 0.3) * 2)).toFixed(1)),
        batteryVoltage: 47.9,
        fuelPercent: 61.0,
        fuelLiters: 73200.0,
        fuelDaysRemaining: 61.0
      }
    });
  }

  // ------------------------------------------------------------
  // 4. EQUIPMENT & DIAGNOSTIC HEALTH (MAITRI & BHARATI)
  // ------------------------------------------------------------
  console.log("Seeding equipment and diagnostic health records...");

  // Maitri Equipment
  const mGen1 = await prisma.equipment.create({
    data: {
      stationId: maitri.id,
      code: "MAITRI-GEN-01",
      name: "Primary Diesel Generator #1",
      category: EquipmentCategory.GENERATOR,
      status: EquipmentStatus.OPERATIONAL,
      healthPercent: 96.0,
      manufacturer: "Caterpillar",
      model: "CAT C15 400kW",
      installedAt: new Date("2018-02-15T00:00:00.000Z"),
      lastServiceAt: daysAgo(14),
      healthRecords: {
        create: [
          {
            recordedAt: hoursAgo(12),
            healthPercent: 96.5,
            temperature: 82.4,
            vibration: 1.8,
            runtimeHours: 8420.0,
            status: EquipmentStatus.OPERATIONAL,
            notes: "Normal thermal gradient across cylinder bank."
          },
          {
            recordedAt: hoursAgo(1),
            healthPercent: 96.0,
            temperature: 83.1,
            vibration: 1.9,
            runtimeHours: 8431.0,
            status: EquipmentStatus.OPERATIONAL,
            notes: "Stable combustion pressure and exhaust temperature."
          }
        ]
      },
      maintenanceRecords: {
        create: [
          {
            title: "250-Hour Lube Oil & Filter Service",
            description: "Replace synthetic lubricant and secondary fuel filter elements.",
            type: MaintenanceType.PREVENTIVE,
            status: MaintenanceStatus.COMPLETED,
            scheduledAt: daysAgo(14),
            startedAt: daysAgo(14),
            completedAt: daysAgo(14),
            notes: "Completed on schedule. Oil viscosity within operational spec."
          },
          {
            title: "Borescope Cylinder Inspection",
            description: "Perform internal visual inspection of combustion chambers.",
            type: MaintenanceType.INSPECTION,
            status: MaintenanceStatus.SCHEDULED,
            scheduledAt: new Date("2026-10-15T08:00:00.000Z"),
            notes: "Scheduled ahead of Austral summer intensive science season."
          }
        ]
      }
    }
  });

  const mGen2 = await prisma.equipment.create({
    data: {
      stationId: maitri.id,
      code: "MAITRI-GEN-02",
      name: "Secondary Diesel Generator #2",
      category: EquipmentCategory.GENERATOR,
      status: EquipmentStatus.OPERATIONAL,
      healthPercent: 88.0,
      manufacturer: "Caterpillar",
      model: "CAT C15 400kW",
      installedAt: new Date("2018-02-15T00:00:00.000Z"),
      lastServiceAt: daysAgo(20),
      healthRecords: {
        create: [
          {
            recordedAt: hoursAgo(2),
            healthPercent: 88.0,
            temperature: 79.4,
            vibration: 1.4,
            runtimeHours: 6410.0,
            status: EquipmentStatus.OPERATIONAL,
            notes: "Secondary generator tested on load bank. Nominal performance."
          }
        ]
      }
    }
  });

  const mHvac = await prisma.equipment.create({
    data: {
      stationId: maitri.id,
      code: "MAITRI-HVAC-MAIN",
      name: "Habitation Central Air Handling Unit",
      category: EquipmentCategory.HVAC,
      status: EquipmentStatus.OPERATIONAL,
      healthPercent: 98.0,
      manufacturer: "Carrier PolarSpec",
      model: "AHU-3000E",
      installedAt: new Date("2020-01-10T00:00:00.000Z"),
      lastServiceAt: daysAgo(30),
      healthRecords: {
        create: [
          {
            recordedAt: hoursAgo(2),
            healthPercent: 98.0,
            temperature: 21.5,
            vibration: 0.9,
            runtimeHours: 14200.0,
            status: EquipmentStatus.OPERATIONAL,
            notes: "Optimal heat-wheel recovery efficiency at 84%."
          }
        ]
      }
    }
  });

  const mWater = await prisma.equipment.create({
    data: {
      stationId: maitri.id,
      code: "MAITRI-WTR-RO",
      name: "Lake Priyadarshini RO Water Plant",
      category: EquipmentCategory.WATER_SYSTEM,
      status: EquipmentStatus.WARNING,
      healthPercent: 78.0,
      manufacturer: "Veolia Water",
      model: "SWRO Polar Modular",
      installedAt: new Date("2019-11-20T00:00:00.000Z"),
      lastServiceAt: daysAgo(45),
      healthRecords: {
        create: [
          {
            recordedAt: hoursAgo(3),
            healthPercent: 78.0,
            temperature: 8.2,
            vibration: 2.7,
            runtimeHours: 9850.0,
            status: EquipmentStatus.WARNING,
            notes: "Filter differential pressure rising. Micron pre-filter backwash advised."
          }
        ]
      }
    }
  });

  const mBattery = await prisma.equipment.create({
    data: {
      stationId: maitri.id,
      code: "MAITRI-BAT-MAIN",
      name: "Central Lithium Iron Phosphate Storage Bank",
      category: EquipmentCategory.BATTERY,
      status: EquipmentStatus.OPERATIONAL,
      healthPercent: 99.0,
      manufacturer: "Exide Polar Safe",
      model: "LiFePO4 500kWh 48V",
      installedAt: new Date("2022-03-05T00:00:00.000Z"),
      lastServiceAt: daysAgo(60),
      healthRecords: {
        create: [
          {
            recordedAt: hoursAgo(1),
            healthPercent: 99.0,
            temperature: 18.0,
            vibration: 0.1,
            runtimeHours: 23500.0,
            status: EquipmentStatus.OPERATIONAL,
            notes: "Cell voltage balance across all 16 strings within ±0.012V."
          }
        ]
      }
    }
  });

  // Bharati Equipment
  const bGen1 = await prisma.equipment.create({
    data: {
      stationId: bharati.id,
      code: "BHARATI-GEN-01",
      name: "Main Combined Heat & Power Unit #1",
      category: EquipmentCategory.GENERATOR,
      status: EquipmentStatus.OPERATIONAL,
      healthPercent: 92.0,
      manufacturer: "Volvo Penta",
      model: "D16-MG 450kVA",
      installedAt: new Date("2021-01-20T00:00:00.000Z"),
      lastServiceAt: daysAgo(10),
      healthRecords: {
        create: [
          {
            recordedAt: hoursAgo(2),
            healthPercent: 92.0,
            temperature: 85.0,
            vibration: 2.1,
            runtimeHours: 7120.0,
            status: EquipmentStatus.OPERATIONAL,
            notes: "Coolant jacket temperature slightly elevated due to low outside air mixing."
          }
        ]
      }
    }
  });

  const bSatCom = await prisma.equipment.create({
    data: {
      stationId: bharati.id,
      code: "BHARATI-COM-GSAT",
      name: "ISRO Earth Station Polar Radome & Tracking Antenna",
      category: EquipmentCategory.COMMUNICATION,
      status: EquipmentStatus.OPERATIONAL,
      healthPercent: 97.0,
      manufacturer: "ISRO / Bharat Electronics",
      model: "BEL-X/S Band 7.5m",
      installedAt: new Date("2012-03-18T00:00:00.000Z"),
      lastServiceAt: daysAgo(18),
      healthRecords: {
        create: [
          {
            recordedAt: hoursAgo(1),
            healthPercent: 97.0,
            temperature: -5.4,
            vibration: 0.8,
            runtimeHours: 42000.0,
            status: EquipmentStatus.OPERATIONAL,
            notes: "Radome de-icing heaters drawing 14 kW. Servo azimuth tracking error < 0.02°."
          }
        ]
      }
    }
  });

  const bHvac = await prisma.equipment.create({
    data: {
      stationId: bharati.id,
      code: "BHARATI-HVAC-LAB",
      name: "Cleanroom Laboratory Positive Pressure HVAC",
      category: EquipmentCategory.HVAC,
      status: EquipmentStatus.OPERATIONAL,
      healthPercent: 95.0,
      manufacturer: "Klimor Polar Line",
      model: "MCK-2000",
      installedAt: new Date("2021-02-14T00:00:00.000Z"),
      lastServiceAt: daysAgo(22),
      healthRecords: {
        create: [
          {
            recordedAt: hoursAgo(2),
            healthPercent: 95.0,
            temperature: 20.0,
            vibration: 1.1,
            runtimeHours: 11400.0,
            status: EquipmentStatus.OPERATIONAL,
            notes: "HEPA H14 pressure drop within standard bounds."
          }
        ]
      }
    }
  });

  // ------------------------------------------------------------
  // 5. ALERTS (ACTIVE, ACKNOWLEDGED, ESCALATED, RESOLVED)
  // ------------------------------------------------------------
  console.log("Seeding operational alerts (Phase 9)...");

  // Clear existing alerts to prevent conflict on re-seed
  await prisma.incidentAlert.deleteMany({});
  await prisma.incidentNote.deleteMany({});
  await prisma.incident.deleteMany({});
  await prisma.alert.deleteMany({});

  const alert1 = await prisma.alert.create({
    data: {
      stationId: maitri.id,
      equipmentId: mWater.id,
      severity: AlertSeverity.WARNING,
      title: "RO Water Intake Pre-Filter Differential Pressure High",
      description: "Differential pressure across primary 5-micron pre-filter exceeded 1.8 bar threshold.",
      message: "Differential pressure across primary 5-micron pre-filter exceeded 1.8 bar threshold.",
      status: AlertStatus.ACTIVE,
      source: "WATER_SYSTEM",
      sourceType: "EQUIPMENT",
      sourceId: "mWater",
      ruleCode: "EQUIPMENT_PRESSURE_WARNING",
      triggerValue: 1.95,
      thresholdValue: 1.8,
      unit: "bar",
      occurrenceCount: 4,
      occurredAt: hoursAgo(4),
      firstDetectedAt: hoursAgo(4),
      lastDetectedAt: hoursAgo(1)
    }
  });

  const alert2 = await prisma.alert.create({
    data: {
      stationId: maitri.id,
      severity: AlertSeverity.INFO,
      title: "Photovoltaic Solar Farm Winterization Mode Active",
      description: "Solar array angle automatically tilted to 78° for maximum reflection mitigation.",
      message: "Solar array angle automatically tilted to 78° for maximum reflection mitigation.",
      status: AlertStatus.ACKNOWLEDGED,
      source: "ENERGY",
      sourceType: "ENERGY",
      ruleCode: "ENERGY_SOLAR_MODE",
      occurrenceCount: 1,
      occurredAt: hoursAgo(18),
      firstDetectedAt: hoursAgo(18),
      lastDetectedAt: hoursAgo(18),
      acknowledgedAt: hoursAgo(16),
      acknowledgedBy: "Vikram Malhotra"
    }
  });

  const alert3 = await prisma.alert.create({
    data: {
      stationId: maitri.id,
      equipmentId: mGen1.id,
      severity: AlertSeverity.CRITICAL,
      title: "Primary Generator #1 Core Overheat Critical",
      description: "Internal cylinder head temperature exceeded 98.4°C under peak auxiliary heating load.",
      message: "Internal cylinder head temperature exceeded 98.4°C under peak auxiliary heating load.",
      status: AlertStatus.ESCALATED,
      source: "EQUIPMENT",
      sourceType: "EQUIPMENT",
      sourceId: "MAITRI-GEN-01",
      ruleCode: "EQUIPMENT_OVERHEAT_CRITICAL",
      triggerValue: 98.4,
      thresholdValue: 95.0,
      unit: "°C",
      occurrenceCount: 14,
      occurredAt: hoursAgo(3),
      firstDetectedAt: hoursAgo(3),
      lastDetectedAt: hoursAgo(1)
    }
  });

  const alert4 = await prisma.alert.create({
    data: {
      stationId: maitri.id,
      severity: AlertSeverity.HIGH,
      title: "Schirmacher Oasis Blizzard Warning",
      description: "Katabatic surface wind gusts recorded at 88.5 km/h over Priyadarshini moraine.",
      message: "Katabatic surface wind gusts recorded at 88.5 km/h over Priyadarshini moraine.",
      status: AlertStatus.OPEN,
      source: "ENVIRONMENT",
      sourceType: "ENVIRONMENT",
      sourceId: "windSpeed",
      ruleCode: "ENV_WIND_HIGH",
      triggerValue: 88.5,
      thresholdValue: 80.0,
      unit: "km/h",
      occurrenceCount: 6,
      occurredAt: hoursAgo(2),
      firstDetectedAt: hoursAgo(2),
      lastDetectedAt: hoursAgo(1)
    }
  });

  const alert5 = await prisma.alert.create({
    data: {
      stationId: bharati.id,
      severity: AlertSeverity.WARNING,
      title: "Katabatic Wind Warning Issued for Larsemann Hills",
      description: "Coastal wind gusts forecasted to reach 65 km/h over next 6 hours.",
      message: "Coastal wind gusts forecasted to reach 65 km/h over next 6 hours.",
      status: AlertStatus.ACTIVE,
      source: "ENVIRONMENT",
      sourceType: "ENVIRONMENT",
      sourceId: "windSpeed",
      ruleCode: "ENV_WIND_WARNING",
      triggerValue: 65.0,
      thresholdValue: 50.0,
      unit: "km/h",
      occurrenceCount: 2,
      occurredAt: hoursAgo(2),
      firstDetectedAt: hoursAgo(2),
      lastDetectedAt: hoursAgo(1)
    }
  });

  const alert6 = await prisma.alert.create({
    data: {
      stationId: bharati.id,
      equipmentId: bGen1.id,
      severity: AlertSeverity.INFO,
      title: "CHP Generator #1 Periodic Lube Oil Sample Dispatched",
      description: "Spectrometric oil analysis sample logged for upcoming supply ship transit.",
      message: "Spectrometric oil analysis sample logged for upcoming supply ship transit.",
      status: AlertStatus.RESOLVED,
      source: "EQUIPMENT",
      sourceType: "EQUIPMENT",
      sourceId: "BHARATI-GEN-01",
      ruleCode: "EQUIPMENT_SERVICE_SAMPLE",
      occurrenceCount: 1,
      occurredAt: daysAgo(3),
      firstDetectedAt: daysAgo(3),
      lastDetectedAt: daysAgo(3),
      acknowledgedAt: daysAgo(3),
      acknowledgedBy: "Vikram Malhotra",
      resolvedAt: daysAgo(2),
      resolvedBy: "Dr. Rajesh Sharma"
    }
  });

  const alert7 = await prisma.alert.create({
    data: {
      stationId: bharati.id,
      severity: AlertSeverity.CRITICAL,
      title: "Katabatic Blizzard Gale Exceeded",
      description: "Hurricane-force katabatic winds clocked at 126.2 km/h across Promontory hill ridge.",
      message: "Hurricane-force katabatic winds clocked at 126.2 km/h across Promontory hill ridge.",
      status: AlertStatus.ESCALATED,
      source: "ENVIRONMENT",
      sourceType: "ENVIRONMENT",
      sourceId: "windSpeed",
      ruleCode: "ENV_WIND_BLIZZARD_GALE",
      triggerValue: 126.2,
      thresholdValue: 120.0,
      unit: "km/h",
      occurrenceCount: 22,
      occurredAt: hoursAgo(5),
      firstDetectedAt: hoursAgo(5),
      lastDetectedAt: hoursAgo(1)
    }
  });

  const alert8 = await prisma.alert.create({
    data: {
      stationId: bharati.id,
      severity: AlertSeverity.HIGH,
      title: "Larsemann Hills Optical Whiteout Hazard",
      description: "Severe optical blowing snow visibility restriction: 0.75 km.",
      message: "Severe optical blowing snow visibility restriction: 0.75 km.",
      status: AlertStatus.OPEN,
      source: "ENVIRONMENT",
      sourceType: "ENVIRONMENT",
      sourceId: "visibility",
      ruleCode: "ENV_VISIBILITY_WHITEOUT",
      triggerValue: 0.75,
      thresholdValue: 1.0,
      unit: "km",
      occurrenceCount: 7,
      occurredAt: hoursAgo(3),
      firstDetectedAt: hoursAgo(3),
      lastDetectedAt: hoursAgo(1)
    }
  });

  // ------------------------------------------------------------
  // 6. OPERATIONAL EVENTS (TIMELINE)
  // ------------------------------------------------------------
  console.log("Seeding timeline operational events...");

  await prisma.operationalEvent.createMany({
    data: [
      {
        stationId: maitri.id,
        type: "TELEMETRY",
        title: "Routine Environmental Telemetry Synchronized",
        description: "Hourly meteorological packet received via satellite link with zero packet loss.",
        occurredAt: hoursAgo(1),
        metadata: JSON.stringify({ packetId: "PKT-MET-8841", link: "GSAT-7A", snrDb: 18.4 })
      },
      {
        stationId: maitri.id,
        type: "BATTERY",
        title: "Battery Storage Bank Float Charge Reached",
        description: "Battery state-of-charge reached 82% following optimal solar generation window.",
        occurredAt: hoursAgo(3),
        metadata: JSON.stringify({ socPercent: 82, busVoltage: 48.6 })
      },
      {
        stationId: maitri.id,
        type: "HEALTH_CHECK",
        title: "Automated Life Support Health Diagnostics Executed",
        description: "All life support sub-systems evaluated with composite score of 98%.",
        occurredAt: hoursAgo(6),
        metadata: JSON.stringify({ healthScore: 98, passingChecks: 24, totalChecks: 24 })
      },
      {
        stationId: bharati.id,
        type: "WEATHER",
        title: "Barometric Pressure Stabilization Logged",
        description: "Barometric pressure settled at 978 hPa following passing coastal squall.",
        occurredAt: hoursAgo(2),
        metadata: JSON.stringify({ pressureHpa: 978, deltaHpa: +1.2 })
      },
      {
        stationId: bharati.id,
        type: "MAINTENANCE",
        title: "ISRO Radome De-icing Heater Self-Test Succeeded",
        description: "All heating elements verified in anticipation of katabatic wind front.",
        occurredAt: hoursAgo(5),
        metadata: JSON.stringify({ elementsActive: 12, powerDrawKw: 14.2 })
      }
    ]
  });

  // ------------------------------------------------------------
  // ------------------------------------------------------------
  // 7. INVENTORY ITEMS (ANTARCTIC STATION LOGISTICS)
  // ------------------------------------------------------------
  console.log("Seeding inventory and logistics items...");

  // Clean previous records if re-seeding
  await prisma.shipmentItem.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.inventoryItem.deleteMany();

  // Maitri Inventory Items
  const mFuelAtf = await prisma.inventoryItem.create({
    data: {
      stationId: maitri.id,
      sku: "MAITRI-FUEL-ATF",
      name: "Aviation Turbine Fuel (Jet A-1 Polar Spec)",
      category: "Fuel & Lubricants",
      quantity: 81600.0,
      unit: "Liters",
      minimumQuantity: 30000.0,
      criticalQuantity: 15000.0,
      reservedQuantity: 5000.0,
      storageLocation: "Maitri Bulk Fuel Farm (Tank 1 & 2)",
      description: "Low-temperature aviation kerosene fuel with anti-icing additive MIL-DTL-83133.",
      status: InventoryStatus.IN_STOCK,
      lastUpdatedAt: hoursAgo(4)
    }
  });

  const mFilterRo = await prisma.inventoryItem.create({
    data: {
      stationId: maitri.id,
      sku: "MAITRI-RO-FILT-5M",
      name: "5-Micron Spun Polypropylene RO Sediment Filter Cartridges",
      category: "Spare Parts & Tools",
      quantity: 14.0,
      unit: "Units",
      minimumQuantity: 20.0,
      criticalQuantity: 5.0,
      reservedQuantity: 0.0,
      storageLocation: "Lake Priyadarshini Water Treatment Plant Bay 2",
      description: "Primary pre-filter cartridges for potable water reverse osmosis purification unit.",
      status: InventoryStatus.LOW_STOCK,
      lastUpdatedAt: hoursAgo(6)
    }
  });

  const mRation = await prisma.inventoryItem.create({
    data: {
      stationId: maitri.id,
      sku: "MAITRI-RATION-DRY",
      name: "Emergency Freeze-Dried Nutritional Ration Packs (6-Person / 30-Day)",
      category: "Food & Rations",
      quantity: 48.0,
      unit: "Packs",
      minimumQuantity: 25.0,
      criticalQuantity: 10.0,
      reservedQuantity: 0.0,
      storageLocation: "Main Living Module Pantry Reserve",
      description: "Vacuum-sealed high-calorie expedition dietary ration packs for winter-over personnel.",
      status: InventoryStatus.IN_STOCK,
      lastUpdatedAt: daysAgo(5)
    }
  });

  const mTrauma = await prisma.inventoryItem.create({
    data: {
      stationId: maitri.id,
      sku: "MAITRI-MED-TRAUMA",
      name: "Cold-Weather Trauma & Hyperthermia Treatment Kits",
      category: "Medical Supplies",
      quantity: 12.0,
      unit: "Kits",
      minimumQuantity: 6.0,
      criticalQuantity: 3.0,
      reservedQuantity: 2.0,
      storageLocation: "Station Surgery / Emergency Ward",
      description: "Field emergency kits containing active rewarming blankets, suture supplies, and plasma volume expanders.",
      status: InventoryStatus.IN_STOCK,
      lastUpdatedAt: daysAgo(12)
    }
  });

  const mOxygen = await prisma.inventoryItem.create({
    data: {
      stationId: maitri.id,
      sku: "MAITRI-MED-O2",
      name: "Medical Grade Oxygen Cylinders (High-Pressure 50L)",
      category: "Medical Supplies",
      quantity: 3.0,
      unit: "Cylinders",
      minimumQuantity: 10.0,
      criticalQuantity: 4.0,
      reservedQuantity: 1.0,
      storageLocation: "Hospital Gas Manifold Store",
      description: "Pressurized medical oxygen for life support and emergency hyperbaric treatment.",
      status: InventoryStatus.CRITICAL,
      lastUpdatedAt: hoursAgo(1)
    }
  });

  const mWeatherBalloons = await prisma.inventoryItem.create({
    data: {
      stationId: maitri.id,
      sku: "MAITRI-MET-BALLOON",
      name: "High-Altitude Meteorological Radiosonde Sounding Balloons (800g)",
      category: "Scientific Consumables",
      quantity: 0.0,
      unit: "Units",
      minimumQuantity: 15.0,
      criticalQuantity: 5.0,
      reservedQuantity: 0.0,
      storageLocation: "Meteorology Observation Hut A",
      description: "Upper-air meteorological sounding balloons. Stock fully depleted pending sea voyage resupply.",
      status: InventoryStatus.OUT_OF_STOCK,
      lastUpdatedAt: hoursAgo(12)
    }
  });

  // Bharati Inventory Items
  const bFuelAtf = await prisma.inventoryItem.create({
    data: {
      stationId: bharati.id,
      sku: "BHARATI-FUEL-ATF",
      name: "Aviation Turbine Fuel (Jet A-1 Polar Spec)",
      category: "Fuel & Lubricants",
      quantity: 73200.0,
      unit: "Liters",
      minimumQuantity: 30000.0,
      criticalQuantity: 15000.0,
      reservedQuantity: 0.0,
      storageLocation: "Bharati Double-Walled Fuel Farm (Tanks 1-4)",
      description: "Dedicated polar diesel and turbine fuel reserves powering main cogeneration generators.",
      status: InventoryStatus.IN_STOCK,
      lastUpdatedAt: hoursAgo(2)
    }
  });

  const bEngineOil = await prisma.inventoryItem.create({
    data: {
      stationId: bharati.id,
      sku: "BHARATI-GEN-OIL-15W40",
      name: "Polar Heavy Duty Synthetic Engine Oil 0W-40",
      category: "Fuel & Lubricants",
      quantity: 1200.0,
      unit: "Liters",
      minimumQuantity: 500.0,
      criticalQuantity: 200.0,
      reservedQuantity: 100.0,
      storageLocation: "Powerhouse Lubricant Storage Bay",
      description: "Synthetic engine lubricant engineered for low-temperature cold starts down to -50°C.",
      status: InventoryStatus.IN_STOCK,
      lastUpdatedAt: daysAgo(3)
    }
  });

  const bSatLnb = await prisma.inventoryItem.create({
    data: {
      stationId: bharati.id,
      sku: "BHARATI-SAT-LNB",
      name: "Cryogenic Low-Noise Block Downconverter (X-Band)",
      category: "Satellite & Telecom",
      quantity: 2.0,
      unit: "Units",
      minimumQuantity: 3.0,
      criticalQuantity: 1.0,
      reservedQuantity: 0.0,
      storageLocation: "Ground Station Radome Level 3",
      description: "High-sensitivity X-Band RF downconverter receiving polar orbiting remote sensing satellites.",
      status: InventoryStatus.LOW_STOCK,
      lastUpdatedAt: daysAgo(7)
    }
  });

  const bBatteryModule = await prisma.inventoryItem.create({
    data: {
      stationId: bharati.id,
      sku: "BHARATI-BAT-MOD",
      name: "480V LiFePO4 Energy Storage Replacement Battery Modules (50kWh)",
      category: "Electrical & Batteries",
      quantity: 1.0,
      unit: "Units",
      minimumQuantity: 4.0,
      criticalQuantity: 2.0,
      reservedQuantity: 0.0,
      storageLocation: "BESS Battery Storage Vault",
      description: "Station microgrid battery buffer module for solar peak shaving and transient backup.",
      status: InventoryStatus.CRITICAL,
      lastUpdatedAt: hoursAgo(8)
    }
  });

  // ------------------------------------------------------------
  // 8. POLAR SHIPMENTS & LOGISTICS VOYAGES (PHASE 8)
  // ------------------------------------------------------------
  console.log("Seeding Phase 8 polar shipments and cargo manifests...");

  const shp1 = await prisma.shipment.create({
    data: {
      shipmentNumber: "POL-SHP-2026-01",
      title: "45th Indian Scientific Expedition — Main Sea Voyage 1",
      origin: "Cape Town Port / NCPOR Forward Logistics Hub",
      destinationStationId: bharati.id,
      destination: "Bharati Station (Promontory Wharf)",
      status: ShipmentStatus.IN_TRANSIT,
      priority: ShipmentPriority.HIGH,
      carrier: "MV Vasiliy Golovnin (Polar Icebreaker / Cargo)",
      plannedDeparture: daysAgo(18),
      actualDeparture: daysAgo(17),
      estimatedArrival: new Date(NOW.getTime() + 3 * 24 * 3600 * 1000), // In 3 days
      notes: "Main summer expedition resupply vessel carrying bulk fuel drums, fresh provisions, and replacement BESS battery cells.",
      items: {
        create: [
          {
            itemId: bFuelAtf.id,
            name: "Polar Diesel Fuel (Jet A-1 ISO Tank)",
            category: "Fuel & Lubricants",
            quantity: 50000.0,
            unit: "Liters",
            receivedQty: 0
          },
          {
            itemId: bBatteryModule.id,
            name: "LiFePO4 Replacement Battery Modules (50kWh)",
            category: "Electrical & Batteries",
            quantity: 4.0,
            unit: "Units",
            receivedQty: 0
          },
          {
            name: "Hydroponic Nutrient Concentrate & Fresh Seeds",
            category: "Food & Rations",
            quantity: 250.0,
            unit: "Kg",
            receivedQty: 0
          }
        ]
      }
    }
  });

  const shp2 = await prisma.shipment.create({
    data: {
      shipmentNumber: "POL-SHP-2026-02",
      title: "Larsemann-to-Schirmacher Winter Traverse Convoy",
      origin: "Bharati Station",
      destinationStationId: maitri.id,
      destination: "Maitri Station",
      status: ShipmentStatus.PLANNED,
      priority: ShipmentPriority.NORMAL,
      carrier: "PistenBully 300 Polar Traverse Convoy (3 Sledges)",
      plannedDeparture: new Date(NOW.getTime() + 10 * 24 * 3600 * 1000),
      estimatedArrival: new Date(NOW.getTime() + 18 * 24 * 3600 * 1000),
      notes: "Overland tracked vehicle convoy transferring specialized seismic calibration instruments and medical trauma replenishment.",
      items: {
        create: [
          {
            name: "Broadband Seismometer Sensors & Thermal Insulators",
            category: "Scientific Consumables",
            quantity: 4.0,
            unit: "Units",
            receivedQty: 0
          },
          {
            itemId: mFilterRo.id,
            name: "5-Micron RO Filter Cartridge Packs",
            category: "Spare Parts & Tools",
            quantity: 20.0,
            unit: "Units",
            receivedQty: 0
          }
        ]
      }
    }
  });

  const shp3 = await prisma.shipment.create({
    data: {
      shipmentNumber: "POL-SHP-2026-03",
      title: "DROMLAN Early Season Air Bridge — Heavy Airlift",
      origin: "Cape Town International Airport (CPT)",
      destinationStationId: maitri.id,
      destination: "Maitri Station (Novo Blue Ice Runway)",
      status: ShipmentStatus.RECEIVED,
      priority: ShipmentPriority.CRITICAL,
      carrier: "IL-76TD-90VD Polar Strategic Transport",
      plannedDeparture: daysAgo(20),
      actualDeparture: daysAgo(20),
      estimatedArrival: daysAgo(14),
      actualArrival: daysAgo(14),
      notes: "Priority intercontinental air flight delivering urgent medical supplies and replacement RO components prior to runway melt season.",
      items: {
        create: [
          {
            itemId: mTrauma.id,
            name: "Emergency Hypothermia Treatment Kits",
            category: "Medical Supplies",
            quantity: 6.0,
            unit: "Kits",
            receivedQty: 6.0
          },
          {
            name: "Caterpillar 3406 Diesel Alternator Stator Assembly",
            category: "Spare Parts & Tools",
            quantity: 1.0,
            unit: "Units",
            receivedQty: 1.0
          }
        ]
      }
    }
  });

  // ------------------------------------------------------------
  // 9. INVENTORY LEDGER MOVEMENTS (PHASE 8 AUDIT TRAIL)
  // ------------------------------------------------------------
  console.log("Seeding Phase 8 historical inventory movements...");

  await prisma.inventoryMovement.createMany({
    data: [
      {
        itemId: mFuelAtf.id,
        stationId: maitri.id,
        type: StockMovementType.CONSUMED,
        quantity: 1200.0,
        previousStock: 82800.0,
        newStock: 81600.0,
        source: "Maitri Bulk Fuel Farm",
        destination: "Cogeneration Generator 1 & 2 Day Tanks",
        reference: "WO-PWR-2026-088",
        reason: "Daily scheduled powerhouse fuel replenishment",
        createdAt: hoursAgo(4)
      },
      {
        itemId: mFilterRo.id,
        stationId: maitri.id,
        type: StockMovementType.CONSUMED,
        quantity: 2.0,
        previousStock: 16.0,
        newStock: 14.0,
        source: "Lake Priyadarshini RO Plant Bay 2",
        destination: "Potable Water Production Rack",
        reference: "WO-WTR-2026-014",
        reason: "Scheduled bi-weekly sediment pre-filter replacement",
        createdAt: hoursAgo(6)
      },
      {
        itemId: mTrauma.id,
        stationId: maitri.id,
        type: StockMovementType.RECEIVED,
        quantity: 6.0,
        previousStock: 6.0,
        newStock: 12.0,
        source: "Cape Town Airport (CPT)",
        destination: "Station Surgery",
        reference: "POL-SHP-2026-03",
        reason: "Airlift delivery intake from IL-76TD-90VD flight",
        createdAt: daysAgo(14)
      },
      {
        itemId: bFuelAtf.id,
        stationId: bharati.id,
        type: StockMovementType.CONSUMED,
        quantity: 950.0,
        previousStock: 74150.0,
        newStock: 73200.0,
        source: "Bharati Fuel Farm",
        destination: "Volvo Penta Generator 1",
        reference: "WO-PWR-2026-102",
        reason: "Station continuous thermal & electric cogeneration",
        createdAt: hoursAgo(2)
      },
      {
        itemId: bEngineOil.id,
        stationId: bharati.id,
        type: StockMovementType.CONSUMED,
        quantity: 50.0,
        previousStock: 1250.0,
        newStock: 1200.0,
        source: "Powerhouse Lubricant Bay",
        destination: "Generator 2 Sump Overhaul",
        reference: "WO-PWR-2026-095",
        reason: "500-hour oil and filter preventive maintenance",
        createdAt: daysAgo(3)
      }
    ]
  });

  // ------------------------------------------------------------
  // 10. AUTHENTICATION & ACCESS CONTROL SEED (PHASE 3)
  // ------------------------------------------------------------
  console.log("Seeding Phase 3 Authentication Users (Idempotent)...");
  
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@polaris.local").toLowerCase().trim();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Polaris@Admin2026!";
  const adminHash = await PasswordService.hashPassword(adminPassword);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Dr. Rajesh Sharma (Lead Commander)",
      role: UserRole.ADMIN,
      isActive: true
    },
    create: {
      email: adminEmail,
      name: "Dr. Rajesh Sharma (Lead Commander)",
      passwordHash: adminHash,
      role: UserRole.ADMIN,
      isActive: true
    }
  });

  const operatorEmail = "operator@polaris.local";
  const operatorPassword = process.env.SEED_OPERATOR_PASSWORD || "Polaris@Operator2026!";
  const operatorHash = await PasswordService.hashPassword(operatorPassword);

  const operatorUser = await prisma.user.upsert({
    where: { email: operatorEmail },
    update: {
      name: "Vikram Malhotra (Operations Lead)",
      role: UserRole.OPERATOR,
      isActive: true
    },
    create: {
      email: operatorEmail,
      name: "Vikram Malhotra (Operations Lead)",
      passwordHash: operatorHash,
      role: UserRole.OPERATOR,
      isActive: true
    }
  });

  const viewerEmail = "viewer@polaris.local";
  const viewerPassword = process.env.SEED_VIEWER_PASSWORD || "Polaris@Viewer2026!";
  const viewerHash = await PasswordService.hashPassword(viewerPassword);

  const viewerUser = await prisma.user.upsert({
    where: { email: viewerEmail },
    update: {
      name: "Dr. Ananya Sen (Research Scientist)",
      role: UserRole.VIEWER,
      isActive: true
    },
    create: {
      email: viewerEmail,
      name: "Dr. Ananya Sen (Research Scientist)",
      passwordHash: viewerHash,
      role: UserRole.VIEWER,
      isActive: true
    }
  });

  // ------------------------------------------------------------
  // 11. OPERATIONAL INCIDENTS & LINKED ALERTS (PHASE 9)
  // ------------------------------------------------------------
  console.log("Seeding Phase 9 Operational Incidents & Notes...");

  // Incident 1: Maitri Generator Overheating
  const incident1 = await prisma.incident.create({
    data: {
      stationId: maitri.id,
      incidentNumber: "INC-MAI-2026-001",
      title: "Primary Diesel Generator #1 Core Overheat",
      description: "Generator #1 head temperature reached 98.4°C during high thermal load; operator initiated auxiliary coolant loop.",
      severity: IncidentSeverity.CRITICAL,
      status: IncidentStatus.INVESTIGATING,
      category: IncidentCategory.EQUIPMENT,
      impact: IncidentImpact.HIGH,
      source: "EQUIPMENT",
      startedAt: hoursAgo(3),
      acknowledgedAt: hoursAgo(2),
      assignedTo: operatorUser.id,
      createdById: operatorUser.id,
      notes: {
        create: [
          {
            authorId: operatorUser.id,
            authorName: operatorUser.name,
            content: "Thermal excursion confirmed via SCADA. Coolant pump pressure normal. Inspecting radiator bypass valve.",
            createdAt: hoursAgo(2)
          },
          {
            authorId: adminUser.id,
            authorName: adminUser.name,
            content: "Authorized switching life-support grid to auxiliary backup Generator #2 if temperature remains >95°C for 30 minutes.",
            createdAt: hoursAgo(1)
          }
        ]
      },
      alerts: {
        create: [
          {
            alertId: alert3.id
          }
        ]
      }
    }
  });

  // Incident 2: Bharati Katabatic Storm & Whiteout Condition
  const incident2 = await prisma.incident.create({
    data: {
      stationId: bharati.id,
      incidentNumber: "INC-BHA-2026-001",
      title: "Severe Katabatic Storm & Optical Whiteout Condition",
      description: "Sustained winds exceeding 126 km/h with optical visibility below 800m. Station outdoor perimeter lock initiated.",
      severity: IncidentSeverity.CRITICAL,
      status: IncidentStatus.MITIGATING,
      category: IncidentCategory.ENVIRONMENT,
      impact: IncidentImpact.CRITICAL,
      source: "ENVIRONMENT",
      startedAt: hoursAgo(5),
      acknowledgedAt: hoursAgo(4),
      assignedTo: adminUser.id,
      createdById: adminUser.id,
      notes: {
        create: [
          {
            authorId: adminUser.id,
            authorName: adminUser.name,
            content: "Red storm alert broadcast to all expedition personnel. External traverses and field science operations halted.",
            createdAt: hoursAgo(4)
          },
          {
            authorId: operatorUser.id,
            authorName: operatorUser.name,
            content: "Emergency shelter survival packs verified. Satellite radome defroster heaters placed on continuous cycle.",
            createdAt: hoursAgo(3)
          }
        ]
      },
      alerts: {
        create: [
          {
            alertId: alert7.id
          }
        ]
      }
    }
  });

  // Operational Event Logs for Incidents
  await prisma.operationalEvent.createMany({
    data: [
      {
        stationId: maitri.id,
        type: "INCIDENT",
        title: "INCIDENT_CREATED: INC-MAI-2026-001",
        description: "Primary Diesel Generator #1 Core Overheat escalated from Alert",
        occurredAt: hoursAgo(3),
        metadata: JSON.stringify({ incidentId: incident1.id, incidentNumber: incident1.incidentNumber })
      },
      {
        stationId: bharati.id,
        type: "INCIDENT",
        title: "INCIDENT_CREATED: INC-BHA-2026-001",
        description: "Severe Katabatic Storm & Optical Whiteout Condition escalated from Alert",
        occurredAt: hoursAgo(5),
        metadata: JSON.stringify({ incidentId: incident2.id, incidentNumber: incident2.incidentNumber })
      }
    ]
  });

  // ------------------------------------------------------------
  // 10. AI PREDICTIVE MAINTENANCE (PHASE 10 SEED DATA)
  // Notice: Clearly marked as synthetic demo predictions for POLARIS SIH evaluation
  // ------------------------------------------------------------
  console.log("Seeding AI Predictive Maintenance snapshots (Phase 10)...");
  await prisma.maintenancePrediction.deleteMany({});

  // Maitri: Generator 01 (HIGH RISK - progressive degradation)
  // Historical snapshots (3 days ago, 2 days ago, 1 day ago) for Trend Chart
  await prisma.maintenancePrediction.create({
    data: {
      equipmentId: mGen1.id,
      stationId: maitri.id,
      healthScore: 78.0,
      riskScore: 42.0,
      riskBand: RiskBand.MODERATE,
      estimatedRulHours: 624.0,
      estimatedRulDays: 26.0,
      confidence: 84.0,
      dataQuality: DataQuality.GOOD,
      predictionHorizon: "14d",
      modelName: "polaris-degradation-baseline-v1",
      modelVersion: "1.0.0",
      featureVersion: "1.0",
      topFactors: JSON.stringify([
        { factor: "Mild Temperature Rise", category: "THERMAL", severity: "MEDIUM", impactPercent: 20, description: "Operating at 84°C (+4°C over baseline)" }
      ]),
      recommendation: "Continue routine monitoring and verify lube oil levels.",
      generatedAt: daysAgo(3),
      expiresAt: daysAgo(2)
    }
  });

  await prisma.maintenancePrediction.create({
    data: {
      equipmentId: mGen1.id,
      stationId: maitri.id,
      healthScore: 70.0,
      riskScore: 58.0,
      riskBand: RiskBand.MODERATE,
      estimatedRulHours: 432.0,
      estimatedRulDays: 18.0,
      confidence: 86.0,
      dataQuality: DataQuality.GOOD,
      predictionHorizon: "14d",
      modelName: "polaris-degradation-baseline-v1",
      modelVersion: "1.0.0",
      featureVersion: "1.0",
      topFactors: JSON.stringify([
        { factor: "Elevated Core Temperature", category: "THERMAL", severity: "HIGH", impactPercent: 35, description: "Core coolant temperature rose to 91°C" },
        { factor: "Negative Health Trend", category: "HEALTH_TREND", severity: "MEDIUM", impactPercent: 25, description: "Health index declined by 8% over 48 hours" }
      ]),
      recommendation: "Review radiator airflow and inspect secondary coolant loop.",
      generatedAt: daysAgo(1),
      expiresAt: hoursAgo(12)
    }
  });

  // Current Prediction: Maitri Gen 01 (Health: 61, Risk: 74, HIGH)
  await prisma.maintenancePrediction.create({
    data: {
      equipmentId: mGen1.id,
      stationId: maitri.id,
      healthScore: 61.0,
      riskScore: 74.0,
      riskBand: RiskBand.HIGH,
      estimatedRulHours: 348.0,
      estimatedRulDays: 14.5,
      confidence: 88.0,
      dataQuality: DataQuality.GOOD,
      predictionHorizon: "14d",
      modelName: "polaris-degradation-baseline-v1",
      modelVersion: "1.0.0",
      featureVersion: "1.0",
      topFactors: JSON.stringify([
        { factor: "Critical Core Temperature Rise", category: "THERMAL", severity: "CRITICAL", impactPercent: 40, description: "Continuous operating temperature at 96.2°C exceeding critical threshold" },
        { factor: "Active Overheat Alerts", category: "ALERT", severity: "CRITICAL", impactPercent: 30, description: "2 high/critical alerts logged in 24 hours" },
        { factor: "Active Operational Incident", category: "INCIDENT", severity: "HIGH", impactPercent: 20, description: "Linked to active incident INC-MAI-2026-001" },
        { factor: "Mechanical Vibration Drift", category: "VIBRATION", severity: "MEDIUM", impactPercent: 10, description: "Vibration amplitude at 3.1 mm/s (+106% of baseline)" }
      ]),
      recommendation: "HIGH RISK WARNING: Schedule generator inspection within 48-72 hours. Inspect coolant bypass thermostat and heat exchanger fins.",
      generatedAt: hoursAgo(1),
      expiresAt: new Date(NOW.getTime() + 2 * 3600 * 1000)
    }
  });

  // Maitri: Generator 02 (Health: 88, Risk: 22, GUARDED)
  await prisma.maintenancePrediction.create({
    data: {
      equipmentId: mGen2.id,
      stationId: maitri.id,
      healthScore: 88.0,
      riskScore: 22.0,
      riskBand: RiskBand.GUARDED,
      estimatedRulHours: 1152.0,
      estimatedRulDays: 48.0,
      confidence: 91.0,
      dataQuality: DataQuality.GOOD,
      predictionHorizon: "30d",
      modelName: "polaris-degradation-baseline-v1",
      modelVersion: "1.0.0",
      featureVersion: "1.0",
      topFactors: JSON.stringify([
        { factor: "Nominal Operating State", category: "TELEMETRY", severity: "INFO", impactPercent: 5, description: "Operating at 79.4°C and 1.4 mm/s vibration within optimal envelope" }
      ]),
      recommendation: "GUARDED STATUS: Equipment operates normally. Maintain planned borescope inspection schedule.",
      generatedAt: hoursAgo(2),
      expiresAt: new Date(NOW.getTime() + 4 * 3600 * 1000)
    }
  });

  // Maitri: Battery Bank (Health: 53, Risk: 81, CRITICAL)
  await prisma.maintenancePrediction.create({
    data: {
      equipmentId: mBattery.id,
      stationId: maitri.id,
      healthScore: 53.0,
      riskScore: 81.0,
      riskBand: RiskBand.CRITICAL,
      estimatedRulHours: 108.0,
      estimatedRulDays: 4.5,
      confidence: 89.0,
      dataQuality: DataQuality.GOOD,
      predictionHorizon: "7d",
      modelName: "polaris-degradation-baseline-v1",
      modelVersion: "1.0.0",
      featureVersion: "1.0",
      topFactors: JSON.stringify([
        { factor: "Cell Voltage Imbalance", category: "LOAD", severity: "CRITICAL", impactPercent: 45, description: "String #3 terminal voltage sagging under 30 kW discharge load" },
        { factor: "Accelerated Capacity Fade", category: "HEALTH_TREND", severity: "HIGH", impactPercent: 35, description: "State of health declined from 68% to 53% over previous 10 days" },
        { factor: "Critical Low Charge Warnings", category: "ALERT", severity: "HIGH", impactPercent: 20, description: "Low SoC events logged during polar blizzard peak loading" }
      ]),
      recommendation: "CRITICAL ADVISORY: Immediately prioritize engineering dispatch. Perform individual cell impedance testing and isolate degrading String #3 module.",
      generatedAt: hoursAgo(1),
      expiresAt: new Date(NOW.getTime() + 2 * 3600 * 1000)
    }
  });

  // Maitri: RO Water Plant (Health: 74, Risk: 42, MODERATE)
  await prisma.maintenancePrediction.create({
    data: {
      equipmentId: mWater.id,
      stationId: maitri.id,
      healthScore: 74.0,
      riskScore: 42.0,
      riskBand: RiskBand.MODERATE,
      estimatedRulHours: 528.0,
      estimatedRulDays: 22.0,
      confidence: 82.0,
      dataQuality: DataQuality.GOOD,
      predictionHorizon: "14d",
      modelName: "polaris-degradation-baseline-v1",
      modelVersion: "1.0.0",
      featureVersion: "1.0",
      topFactors: JSON.stringify([
        { factor: "Filter Differential Pressure", category: "TELEMETRY", severity: "MEDIUM", impactPercent: 40, description: "Pre-filter pressure at 1.95 bar exceeding normal 1.5 bar threshold" },
        { factor: "High Vibration Warning", category: "VIBRATION", severity: "MEDIUM", impactPercent: 30, description: "High pressure feed pump vibration at 2.7 mm/s" }
      ]),
      recommendation: "MODERATE NOTICE: Schedule pre-filter membrane backwash and replace 5-micron spun cartridges within 5 days.",
      generatedAt: hoursAgo(3),
      expiresAt: new Date(NOW.getTime() + 3 * 3600 * 1000)
    }
  });

  // Maitri: Habitation HVAC (Health: 96, Risk: 12, LOW)
  await prisma.maintenancePrediction.create({
    data: {
      equipmentId: mHvac.id,
      stationId: maitri.id,
      healthScore: 96.0,
      riskScore: 12.0,
      riskBand: RiskBand.LOW,
      estimatedRulHours: 2280.0,
      estimatedRulDays: 95.0,
      confidence: 94.0,
      dataQuality: DataQuality.GOOD,
      predictionHorizon: "30d",
      modelName: "polaris-degradation-baseline-v1",
      modelVersion: "1.0.0",
      featureVersion: "1.0",
      topFactors: JSON.stringify([
        { factor: "Nominal Air Handling Operation", category: "TELEMETRY", severity: "INFO", impactPercent: 5, description: "All telemetry parameters well within polar operational specifications" }
      ]),
      recommendation: "Continue routine polar telemetry monitoring. No immediate maintenance intervention indicated.",
      generatedAt: hoursAgo(2),
      expiresAt: new Date(NOW.getTime() + 6 * 3600 * 1000)
    }
  });

  // Bharati: Cleanroom Lab HVAC (Health: 76, Risk: 43, MODERATE)
  await prisma.maintenancePrediction.create({
    data: {
      equipmentId: bHvac.id,
      stationId: bharati.id,
      healthScore: 76.0,
      riskScore: 43.0,
      riskBand: RiskBand.MODERATE,
      estimatedRulHours: 672.0,
      estimatedRulDays: 28.0,
      confidence: 85.0,
      dataQuality: DataQuality.GOOD,
      predictionHorizon: "14d",
      modelName: "polaris-degradation-baseline-v1",
      modelVersion: "1.0.0",
      featureVersion: "1.0",
      topFactors: JSON.stringify([
        { factor: "HEPA Differential Pressure Creep", category: "TELEMETRY", severity: "MEDIUM", impactPercent: 35, description: "HEPA filter pressure drop has increased by 18% over the past 30 days" },
        { factor: "Blower Motor Duty Cycle", category: "LOAD", severity: "LOW", impactPercent: 20, description: "Continuous fan operation during exterior whiteout gale" }
      ]),
      recommendation: "MODERATE NOTICE: Inspect laboratory pre-filters and schedule HEPA differential pressure audit.",
      generatedAt: hoursAgo(2),
      expiresAt: new Date(NOW.getTime() + 4 * 3600 * 1000)
    }
  });

  // Bharati: ISRO Earth Station Tracking Antenna (Health: 69, Risk: 64, HIGH)
  await prisma.maintenancePrediction.create({
    data: {
      equipmentId: bSatCom.id,
      stationId: bharati.id,
      healthScore: 69.0,
      riskScore: 64.0,
      riskBand: RiskBand.HIGH,
      estimatedRulHours: 432.0,
      estimatedRulDays: 18.0,
      confidence: 87.0,
      dataQuality: DataQuality.GOOD,
      predictionHorizon: "14d",
      modelName: "polaris-degradation-baseline-v1",
      modelVersion: "1.0.0",
      featureVersion: "1.0",
      topFactors: JSON.stringify([
        { factor: "Elevation Drive Servo Torque Rise", category: "LOAD", severity: "HIGH", impactPercent: 40, description: "Antenna elevation gear motor torque drawing +35% above calm weather baseline" },
        { factor: "Extreme Blizzard Wind Stress", category: "TELEMETRY", severity: "HIGH", impactPercent: 30, description: "Subjected to 110+ km/h katabatic gales on Larsemann Hills promontory" },
        { factor: "De-icing Heating Element Fault", category: "ALERT", severity: "MEDIUM", impactPercent: 20, description: "Sector B radome heating element intermittent circuit flag" }
      ]),
      recommendation: "HIGH RISK WARNING: Schedule antenna pedestal mechanical inspection when winds abate below 50 km/h. Inspect elevation gearbox lubrication.",
      generatedAt: hoursAgo(1),
      expiresAt: new Date(NOW.getTime() + 2 * 3600 * 1000)
    }
  });

  console.log("=================================================");
  console.log("✅ Seed completed successfully!");
  console.log(`- Stations created/updated: 2 (Maitri & Bharati)`);
  console.log(`- Telemetry records: 50 (25 hours per station)`);
  console.log(`- Energy readings: 50`);
  console.log(`- Environmental readings: 50`);
  console.log(`- Equipment items: 7`);
  console.log(`- Diagnostic health records: 8`);
  console.log(`- Alerts: 4`);
  console.log(`- Operational timeline events: 5`);
  console.log(`- Inventory items: 7`);
  console.log(`- Users seeded (ADMIN, OPERATOR, VIEWER): 3`);
  console.log("=================================================");
}

main()
  .catch((e) => {
    console.error("❌ Seed script failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
