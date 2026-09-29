import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
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
import { polarisWebSocketClient } from "../services/websocket/websocketClient";
import {
  RealtimeConnectionStatus,
  WS_EVENT_TYPES,
  WsTelemetryPayload,
  WsAlertPayload,
  WsEquipmentPayload,
  WsStationStatusPayload
} from "../services/websocket/websocket.types";
import { useAuth } from "./AuthContext";

const MAX_REALTIME_POINTS = 60; // Section 31: Rolling window limit to prevent memory leaks
const STALE_THRESHOLD_MS = 20000; // Section 48: Stale data threshold (20 seconds)

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
  realtimeStatus: RealtimeConnectionStatus;
  lastTelemetryAt: Date | null;
  isStale: boolean;
}

const StationContext = createContext<StationContextValue | undefined>(undefined);

export const StationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [selectedStation, setSelectedStation] = useState<StationFilter>("MAITRI");

  // Real-time connectivity state
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeConnectionStatus>("OFFLINE");
  const [lastTelemetryAt, setLastTelemetryAt] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);

  // Live telemetry states (initialized from baseline data)
  const [liveEnvironment, setLiveEnvironment] = useState<Record<string, EnvironmentalTelemetry>>(MOCK_ENVIRONMENT);
  const [liveEnergy, setLiveEnergy] = useState<Record<string, EnergyTelemetry>>(MOCK_ENERGY);
  const [livePowerTrend, setLivePowerTrend] = useState<Record<string, HourlyPowerDataPoint[]>>(MOCK_HOURLY_POWER);
  const [liveTempTrend, setLiveTempTrend] = useState<Record<string, HourlyTemperatureDataPoint[]>>({
    MAITRI: MOCK_TEMPERATURE_TRENDS.MAITRI.data,
    BHARATI: MOCK_TEMPERATURE_TRENDS.BHARATI.data,
    ALL: MOCK_TEMPERATURE_TRENDS.ALL.data
  });
  const [liveEquipment, setLiveEquipment] = useState<Equipment[]>(MOCK_EQUIPMENT);
  const [liveAlerts, setLiveAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [stationHealthOverrides, setStationHealthOverrides] = useState<Record<string, number>>({});

  // 1. Manage WebSocket Connection Lifecycle (Connect on Auth, Disconnect on Logout)
  useEffect(() => {
    if (!isAuthenticated) {
      polarisWebSocketClient.disconnect();
      setRealtimeStatus("OFFLINE");
      return;
    }

    const unsubStatus = polarisWebSocketClient.onStatusChange((status) => {
      setRealtimeStatus(status);
    });

    polarisWebSocketClient.connect();

    return () => {
      unsubStatus();
    };
  }, [isAuthenticated]);

  // 2. Handle Station Subscription Changes (Section 13 & 15)
  useEffect(() => {
    if (isAuthenticated) {
      polarisWebSocketClient.subscribe([selectedStation]);
    }
  }, [isAuthenticated, selectedStation]);

  // 3. Stale Data Watchdog Timer (Section 48)
  useEffect(() => {
    const timer = setInterval(() => {
      if (lastTelemetryAt) {
        const elapsed = Date.now() - lastTelemetryAt.getTime();
        setIsStale(elapsed > STALE_THRESHOLD_MS);
      } else {
        setIsStale(false);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [lastTelemetryAt]);

  // 4. Wire Real-Time Inbound Event Handlers (Sections 30 & 31)
  useEffect(() => {
    // 4.1 Telemetry Update Handler
    const unsubTelemetry = polarisWebSocketClient.on<WsTelemetryPayload>(
      WS_EVENT_TYPES.TELEMETRY_UPDATE,
      (event) => {
        const payload = event.data;
        const code = payload.stationCode;
        const now = new Date(payload.timestamp);
        const timeLabel = now.toISOString().slice(11, 16);

        setLastTelemetryAt(now);
        setIsStale(false);

        // Update Environmental Telemetry State
        setLiveEnvironment((prev) => ({
          ...prev,
          [code]: {
            ...prev[code],
            temperatureCelsius: payload.environment.temperature,
            relativeHumidityPercent: payload.environment.humidity,
            barometricPressureHpa: payload.environment.pressure,
            windSpeedKmH: payload.environment.windSpeed,
            windDirectionCompass: payload.environment.windDirectionCompass,
            windDirectionDegrees: payload.environment.windDirection,
            opticalVisibilityKm: payload.environment.visibility,
            solarIrradianceWm2: payload.environment.solarRadiation,
            timestamp: payload.timestamp
          }
        }));

        // Update Energy Telemetry State
        setLiveEnergy((prev) => {
          let batteryStatus: "CHARGING" | "STABLE" | "DISCHARGING" = "STABLE";
          if (payload.energy.netPowerKw > 2.0) batteryStatus = "CHARGING";
          else if (payload.energy.netPowerKw < -2.0) batteryStatus = "DISCHARGING";

          return {
            ...prev,
            [code]: {
              ...prev[code],
              totalGenerationKw: payload.energy.generationKw,
              solarPhotovoltaicKw: payload.energy.solarKw,
              dieselGeneratorKw: payload.energy.dieselKw,
              totalConsumptionKw: payload.energy.consumptionKw,
              netPowerBalanceKw: payload.energy.netPowerKw,
              batteryPercentage: payload.energy.batteryPercent,
              batteryBusVoltage: payload.energy.batteryVoltage,
              batteryStatus,
              fuelReservesPercent: payload.energy.fuelPercent,
              fuelReserveLiters: payload.energy.fuelLiters,
              estimatedFuelDaysRemaining: payload.energy.fuelDaysRemaining,
              timestamp: payload.timestamp
            }
          };
        });

        // Update Station Health Override
        setStationHealthOverrides((prev) => ({
          ...prev,
          [code]: payload.station.healthPercent
        }));

        // Append to Rolling Power Trend Window (Section 31)
        setLivePowerTrend((prev) => {
          const currentList = prev[code] || [];
          const newPoint: HourlyPowerDataPoint = {
            time: timeLabel,
            generation: payload.energy.generationKw,
            consumption: payload.energy.consumptionKw
          };
          const updated = [...currentList, newPoint];
          return {
            ...prev,
            [code]: updated.length > MAX_REALTIME_POINTS ? updated.slice(updated.length - MAX_REALTIME_POINTS) : updated
          };
        });

        // Append to Rolling Temperature Trend Window (Section 31)
        setLiveTempTrend((prev) => {
          const currentList = prev[code] || [];
          const newPoint: HourlyTemperatureDataPoint = {
            time: timeLabel,
            temperature: payload.environment.temperature,
            windSpeed: payload.environment.windSpeed
          };
          const updated = [...currentList, newPoint];
          return {
            ...prev,
            [code]: updated.length > MAX_REALTIME_POINTS ? updated.slice(updated.length - MAX_REALTIME_POINTS) : updated
          };
        });
      }
    );

    // 4.2 Alert Triggered Handler
    const unsubAlert = polarisWebSocketClient.on<WsAlertPayload>(
      WS_EVENT_TYPES.ALERT_TRIGGERED,
      (event) => {
        const a = event.data;
        const validSources = ["ENVIRONMENT", "ENERGY", "EQUIPMENT", "INVENTORY", "LOGISTICS", "COMMUNICATION", "SYSTEM"] as const;
        const alertSource = (validSources.includes(a.category as any) ? a.category : "SYSTEM") as Alert["source"];

        const newAlert: Alert = {
          id: a.id,
          stationCode: a.stationCode,
          severity: a.severity,
          title: a.title,
          description: a.message,
          source: alertSource,
          status: "OPEN",
          createdAt: a.triggeredAt
        };

        setLiveAlerts((prev) => [newAlert, ...prev.slice(0, 49)]); // keep latest 50
      }
    );

    // 4.3 Equipment Update Handler
    const unsubEquip = polarisWebSocketClient.on<WsEquipmentPayload>(
      WS_EVENT_TYPES.EQUIPMENT_UPDATE,
      (event) => {
        const eq = event.data;
        setLiveEquipment((prev) =>
          prev.map((item) => {
            if (item.id === eq.equipmentId) {
              return {
                ...item,
                healthScore: eq.healthPercent,
                status: eq.status === "OPERATIONAL" ? "HEALTHY" : eq.status === "WARNING" ? "WARNING" : eq.status === "CRITICAL" ? "CRITICAL" : "OFFLINE",
                lastChecked: eq.timestamp
              };
            }
            return item;
          })
        );
      }
    );

    // 4.4 Station Status Update Handler
    const unsubStatus = polarisWebSocketClient.on<WsStationStatusPayload>(
      WS_EVENT_TYPES.STATION_STATUS,
      (event) => {
        const payload = event.data;
        setStationHealthOverrides((prev) => ({
          ...prev,
          [payload.stationCode]: payload.healthPercent
        }));
      }
    );

    return () => {
      unsubTelemetry();
      unsubAlert();
      unsubEquip();
      unsubStatus();
    };
  }, []);

  // Compute Base Station Metadata with Live Overrides
  const stationInfo: Station = useMemo(() => {
    if (selectedStation === "ALL") {
      const avgHealth =
        ((stationHealthOverrides.MAITRI ?? 98) + (stationHealthOverrides.BHARATI ?? 94)) / 2;
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
        systemHealthPercent: Math.round(avgHealth)
      };
    }

    const base = MOCK_STATIONS[selectedStation];
    const liveHealth = stationHealthOverrides[selectedStation];
    if (liveHealth !== undefined) {
      return {
        ...base,
        systemHealthPercent: Math.round(liveHealth)
      };
    }
    return base;
  }, [selectedStation, stationHealthOverrides]);

  const environment = useMemo(() => liveEnvironment[selectedStation] || MOCK_ENVIRONMENT[selectedStation], [liveEnvironment, selectedStation]);
  const energy = useMemo(() => liveEnergy[selectedStation] || MOCK_ENERGY[selectedStation], [liveEnergy, selectedStation]);
  const hourlyPower = useMemo(() => livePowerTrend[selectedStation] || MOCK_HOURLY_POWER[selectedStation], [livePowerTrend, selectedStation]);
  const temperatureTrend = useMemo(() => ({
    ...MOCK_TEMPERATURE_TRENDS[selectedStation],
    data: liveTempTrend[selectedStation] || MOCK_TEMPERATURE_TRENDS[selectedStation].data
  }), [liveTempTrend, selectedStation]);

  const equipmentList = useMemo(() => {
    if (selectedStation === "ALL") return liveEquipment;
    return liveEquipment.filter((eq) => eq.stationId === selectedStation);
  }, [liveEquipment, selectedStation]);

  const alertsList = useMemo(() => {
    if (selectedStation === "ALL") return liveAlerts;
    return liveAlerts.filter((alt) => alt.stationCode === selectedStation);
  }, [liveAlerts, selectedStation]);

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
    kpiSummary,
    realtimeStatus,
    lastTelemetryAt,
    isStale
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
