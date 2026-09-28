import React, { createContext, useContext, useState, useMemo } from "react";
import {
  StationFilter,
  Station,
  EnvironmentalTelemetry,
  EnergyTelemetry,
  HourlyPowerDataPoint,
  HourlyTemperatureDataPoint,
  Equipment,
  Alert
} from "../types";
import { MOCK_STATIONS } from "../data/stations";
import { MOCK_ENVIRONMENT } from "../data/telemetry";
import { MOCK_ENERGY, MOCK_HOURLY_POWER } from "../data/energy";
import { MOCK_TEMPERATURE_TRENDS } from "../data/environment";
import { MOCK_EQUIPMENT } from "../data/equipment";
import { MOCK_ALERTS } from "../data/alerts";

export interface KpiSummary {
  healthScore: number;
  healthStatus: "Excellent" | "Good" | "Warning" | "Critical";
  healthTrend: string;
  generationKw: number;
  consumptionKw: number;
  netPowerKw: number;
  batteryPercent: number;
  batteryStatus: "CHARGING" | "STABLE" | "DISCHARGING";
  fuelPercent: number;
  totalAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  infoAlerts: number;
}

interface StationContextValue {
  selectedStation: StationFilter;
  setSelectedStation: (station: StationFilter) => void;
  stationInfo: Station;
  environment: EnvironmentalTelemetry;
  energy: EnergyTelemetry;
  hourlyPower: HourlyPowerDataPoint[];
  temperatureTrend: {
    trendLabel: string;
    trendDelta: string;
    direction: "cooling" | "warming" | "stable";
    data: HourlyTemperatureDataPoint[];
  };
  equipmentList: Equipment[];
  alertsList: Alert[];
  kpiSummary: KpiSummary;
}

const StationContext = createContext<StationContextValue | undefined>(undefined);

export const StationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedStation, setSelectedStation] = useState<StationFilter>("MAITRI");

  const stationInfo: Station = useMemo(() => {
    if (selectedStation === "ALL") {
      return {
        id: "station-all",
        code: "MAITRI",
        name: "All Antarctic Stations (Combined)",
        tagline: "Centralized Polar Overview: Maitri & Bharati Operations",
        location: {
          lat: -70.0869,
          lng: 43.9625,
          altitudeMeters: 76,
          region: "East Antarctica Multi-Base Sector"
        },
        commissionedYear: 1989,
        operationalStatus: "OPERATIONAL",
        personnelCapacity: 72,
        currentPersonnelCount: 41,
        systemHealthPercent: 96
      };
    }
    return MOCK_STATIONS[selectedStation];
  }, [selectedStation]);

  const environment = useMemo(() => MOCK_ENVIRONMENT[selectedStation], [selectedStation]);
  const energy = useMemo(() => MOCK_ENERGY[selectedStation], [selectedStation]);
  const hourlyPower = useMemo(() => MOCK_HOURLY_POWER[selectedStation], [selectedStation]);
  const temperatureTrend = useMemo(() => MOCK_TEMPERATURE_TRENDS[selectedStation], [selectedStation]);

  const equipmentList = useMemo(() => {
    if (selectedStation === "ALL") return MOCK_EQUIPMENT;
    return MOCK_EQUIPMENT.filter((eq) => eq.stationId === selectedStation);
  }, [selectedStation]);

  const alertsList = useMemo(() => {
    if (selectedStation === "ALL") return MOCK_ALERTS;
    return MOCK_ALERTS.filter((alt) => alt.stationCode === selectedStation);
  }, [selectedStation]);

  const kpiSummary: KpiSummary = useMemo(() => {
    const criticalCount = alertsList.filter((a) => a.severity === "CRITICAL" || a.severity === "EMERGENCY").length;
    const warningCount = alertsList.filter((a) => a.severity === "WARNING").length;
    const infoCount = alertsList.filter((a) => a.severity === "INFO").length;

    let healthStatus: KpiSummary["healthStatus"] = "Excellent";
    if (stationInfo.systemHealthPercent < 75) healthStatus = "Critical";
    else if (stationInfo.systemHealthPercent < 90) healthStatus = "Warning";
    else if (stationInfo.systemHealthPercent < 95) healthStatus = "Good";

    return {
      healthScore: stationInfo.systemHealthPercent,
      healthStatus,
      healthTrend: selectedStation === "MAITRI" ? "+0.8% today" : selectedStation === "BHARATI" ? "-0.4% today" : "+0.2% today",
      generationKw: energy.totalGenerationKw,
      consumptionKw: energy.totalConsumptionKw,
      netPowerKw: energy.netPowerBalanceKw,
      batteryPercent: energy.batteryPercentage,
      batteryStatus: energy.batteryStatus,
      fuelPercent: energy.fuelReservesPercent,
      totalAlerts: alertsList.length,
      criticalAlerts: criticalCount,
      warningAlerts: warningCount,
      infoAlerts: infoCount
    };
  }, [alertsList, energy, selectedStation, stationInfo.systemHealthPercent]);

  const value = {
    selectedStation,
    setSelectedStation,
    stationInfo,
    environment,
    energy,
    hourlyPower,
    temperatureTrend,
    equipmentList,
    alertsList,
    kpiSummary
  };

  return <StationContext.Provider value={value}>{children}</StationContext.Provider>;
};

export const useStation = (): StationContextValue => {
  const context = useContext(StationContext);
  if (!context) {
    throw new Error("useStation must be used within a StationProvider");
  }
  return context;
};
