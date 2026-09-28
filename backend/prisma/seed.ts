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
  UserRole
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
  // 5. ALERTS (ACTIVE & ACKNOWLEDGED)
  // ------------------------------------------------------------
  console.log("Seeding operational alerts...");

  await prisma.alert.createMany({
    data: [
      {
        stationId: maitri.id,
        equipmentId: mWater.id,
        severity: AlertSeverity.WARNING,
        title: "RO Water Intake Pre-Filter Differential Pressure High",
        description: "Differential pressure across primary 5-micron pre-filter exceeded 1.8 bar threshold.",
        status: AlertStatus.ACTIVE,
        source: "WATER_SYSTEM",
        occurredAt: hoursAgo(4)
      },
      {
        stationId: maitri.id,
        severity: AlertSeverity.INFO,
        title: "Photovoltaic Solar Farm Winterization Mode Active",
        description: "Solar array angle automatically tilted to 78° for maximum reflection mitigation.",
        status: AlertStatus.ACKNOWLEDGED,
        source: "ENERGY",
        occurredAt: hoursAgo(18),
        acknowledgedAt: hoursAgo(16)
      },
      {
        stationId: bharati.id,
        severity: AlertSeverity.WARNING,
        title: "Katabatic Wind Warning Issued for Larsemann Hills",
        description: "Coastal wind gusts forecasted to reach 65 km/h over next 6 hours.",
        status: AlertStatus.ACTIVE,
        source: "ENVIRONMENT",
        occurredAt: hoursAgo(2)
      },
      {
        stationId: bharati.id,
        equipmentId: bGen1.id,
        severity: AlertSeverity.INFO,
        title: "CHP Generator #1 Periodic Lube Oil Sample Dispatched",
        description: "Spectrometric oil analysis sample logged for upcoming supply ship transit.",
        status: AlertStatus.RESOLVED,
        source: "EQUIPMENT",
        occurredAt: daysAgo(3),
        acknowledgedAt: daysAgo(3),
        resolvedAt: daysAgo(2)
      }
    ]
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
  // 7. INVENTORY ITEMS (ANTARCTIC STATION LOGISTICS)
  // ------------------------------------------------------------
  console.log("Seeding inventory and logistics items...");

  await prisma.inventoryItem.createMany({
    data: [
      // Maitri Inventory
      {
        stationId: maitri.id,
        sku: "MAITRI-FUEL-ATF",
        name: "Aviation Turbine Fuel (Jet A-1 Polar Spec)",
        category: "Fuel & Lubricants",
        quantity: 81600.0,
        unit: "Liters",
        minimumQuantity: 30000.0,
        status: InventoryStatus.IN_STOCK,
        lastUpdatedAt: hoursAgo(4)
      },
      {
        stationId: maitri.id,
        sku: "MAITRI-RO-FILT-5M",
        name: "5-Micron Spun Polypropylene RO Sediment Filter Cartridges",
        category: "Spare Parts",
        quantity: 14.0,
        unit: "Units",
        minimumQuantity: 20.0,
        status: InventoryStatus.LOW_STOCK,
        lastUpdatedAt: hoursAgo(6)
      },
      {
        stationId: maitri.id,
        sku: "MAITRI-RATION-DRY",
        name: "Emergency Freeze-Dried Nutritional Ration Packs (6-Person / 30-Day)",
        category: "Food & Rations",
        quantity: 48.0,
        unit: "Packs",
        minimumQuantity: 25.0,
        status: InventoryStatus.IN_STOCK,
        lastUpdatedAt: daysAgo(5)
      },
      {
        stationId: maitri.id,
        sku: "MAITRI-MED-TRAUMA",
        name: "Cold-Weather Trauma & Hyperthermia Treatment Kits",
        category: "Medical Supplies",
        quantity: 12.0,
        unit: "Kits",
        minimumQuantity: 6.0,
        status: InventoryStatus.IN_STOCK,
        lastUpdatedAt: daysAgo(12)
      },

      // Bharati Inventory
      {
        stationId: bharati.id,
        sku: "BHARATI-FUEL-ATF",
        name: "Aviation Turbine Fuel (Jet A-1 Polar Spec)",
        category: "Fuel & Lubricants",
        quantity: 73200.0,
        unit: "Liters",
        minimumQuantity: 30000.0,
        status: InventoryStatus.IN_STOCK,
        lastUpdatedAt: hoursAgo(2)
      },
      {
        stationId: bharati.id,
        sku: "BHARATI-GEN-OIL-15W40",
        name: "Polar Heavy Duty Synthetic Engine Oil 0W-40",
        category: "Fuel & Lubricants",
        quantity: 1200.0,
        unit: "Liters",
        minimumQuantity: 500.0,
        status: InventoryStatus.IN_STOCK,
        lastUpdatedAt: daysAgo(3)
      },
      {
        stationId: bharati.id,
        sku: "BHARATI-SAT-LNB",
        name: "Cryogenic Low-Noise Block Downconverter (X-Band)",
        category: "Scientific & Telecom",
        quantity: 2.0,
        unit: "Units",
        minimumQuantity: 3.0,
        status: InventoryStatus.LOW_STOCK,
        lastUpdatedAt: daysAgo(7)
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
