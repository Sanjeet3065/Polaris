-- CreateEnum
CREATE TYPE "StationStatus" AS ENUM ('OPERATIONAL', 'DEGRADED', 'WARNING', 'CRITICAL', 'OFFLINE');

-- CreateEnum
CREATE TYPE "EquipmentCategory" AS ENUM ('GENERATOR', 'HVAC', 'POWER_CONVERTER', 'COMMUNICATION', 'WATER_SYSTEM', 'BATTERY', 'FUEL_SYSTEM', 'OTHER');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('OPERATIONAL', 'DEGRADED', 'WARNING', 'CRITICAL', 'OFFLINE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('PREVENTIVE', 'CORRECTIVE', 'INSPECTION', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TelemetryStatus" AS ENUM ('NORMAL', 'WARNING', 'CRITICAL');

-- CreateTable
CREATE TABLE "stations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tagline" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "altitude" DOUBLE PRECISION NOT NULL,
    "timezone" TEXT NOT NULL,
    "status" "StationStatus" NOT NULL DEFAULT 'OPERATIONAL',
    "healthPercent" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "commissionedYear" INTEGER,
    "personnelCapacity" INTEGER,
    "currentPersonnel" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "station_telemetry" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "pressure" DOUBLE PRECISION NOT NULL,
    "windSpeed" DOUBLE PRECISION NOT NULL,
    "windDirection" DOUBLE PRECISION NOT NULL,
    "visibility" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "station_telemetry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "energy_readings" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "generationKw" DOUBLE PRECISION NOT NULL,
    "solarKw" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dieselKw" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "consumptionKw" DOUBLE PRECISION NOT NULL,
    "netPowerKw" DOUBLE PRECISION NOT NULL,
    "batteryPercent" DOUBLE PRECISION NOT NULL,
    "batteryVoltage" DOUBLE PRECISION NOT NULL,
    "fuelPercent" DOUBLE PRECISION NOT NULL,
    "fuelLiters" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fuelDaysRemaining" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "energy_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "environmental_readings" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "pressure" DOUBLE PRECISION NOT NULL,
    "windSpeed" DOUBLE PRECISION NOT NULL,
    "windDirection" DOUBLE PRECISION NOT NULL,
    "windDirectionCompass" TEXT,
    "visibility" DOUBLE PRECISION NOT NULL,
    "solarRadiation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "snowfallRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "TelemetryStatus" NOT NULL DEFAULT 'NORMAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "environmental_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "EquipmentCategory" NOT NULL,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'OPERATIONAL',
    "healthPercent" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "manufacturer" TEXT,
    "model" TEXT,
    "installedAt" TIMESTAMP(3),
    "lastServiceAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_health" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "healthPercent" DOUBLE PRECISION NOT NULL,
    "temperature" DOUBLE PRECISION,
    "vibration" DOUBLE PRECISION,
    "runtimeHours" DOUBLE PRECISION,
    "status" "EquipmentStatus" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_health_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "equipmentId" TEXT,
    "severity" "AlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operational_events" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operational_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "minimumQuantity" DOUBLE PRECISION NOT NULL,
    "status" "InventoryStatus" NOT NULL DEFAULT 'IN_STOCK',
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_records" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "MaintenanceType" NOT NULL DEFAULT 'PREVENTIVE',
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stations_code_key" ON "stations"("code");

-- CreateIndex
CREATE INDEX "station_telemetry_stationId_recordedAt_idx" ON "station_telemetry"("stationId", "recordedAt");

-- CreateIndex
CREATE INDEX "energy_readings_stationId_recordedAt_idx" ON "energy_readings"("stationId", "recordedAt");

-- CreateIndex
CREATE INDEX "environmental_readings_stationId_recordedAt_idx" ON "environmental_readings"("stationId", "recordedAt");

-- CreateIndex
CREATE INDEX "equipment_stationId_status_idx" ON "equipment"("stationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_stationId_code_key" ON "equipment"("stationId", "code");

-- CreateIndex
CREATE INDEX "equipment_health_equipmentId_recordedAt_idx" ON "equipment_health"("equipmentId", "recordedAt");

-- CreateIndex
CREATE INDEX "alerts_stationId_status_idx" ON "alerts"("stationId", "status");

-- CreateIndex
CREATE INDEX "alerts_stationId_severity_idx" ON "alerts"("stationId", "severity");

-- CreateIndex
CREATE INDEX "alerts_occurredAt_idx" ON "alerts"("occurredAt");

-- CreateIndex
CREATE INDEX "operational_events_stationId_occurredAt_idx" ON "operational_events"("stationId", "occurredAt");

-- CreateIndex
CREATE INDEX "inventory_items_stationId_status_idx" ON "inventory_items"("stationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_stationId_sku_key" ON "inventory_items"("stationId", "sku");

-- CreateIndex
CREATE INDEX "maintenance_records_equipmentId_status_idx" ON "maintenance_records"("equipmentId", "status");

-- CreateIndex
CREATE INDEX "maintenance_records_scheduledAt_idx" ON "maintenance_records"("scheduledAt");

-- AddForeignKey
ALTER TABLE "station_telemetry" ADD CONSTRAINT "station_telemetry_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "energy_readings" ADD CONSTRAINT "energy_readings_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environmental_readings" ADD CONSTRAINT "environmental_readings_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_health" ADD CONSTRAINT "equipment_health_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_events" ADD CONSTRAINT "operational_events_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
