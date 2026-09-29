import React, { useState, useMemo } from "react";
import { useStation } from "../context/StationContext";
import {
  DigitalTwinCanvas,
  EquipmentInfoPanel,
  StationInfoPanel,
  EquipmentStatusStrip,
  DigitalTwinCameraPreset,
  DigitalTwinLayerState,
  Equipment3DState,
  getEquipmentPosition
} from "../components/digital-twin";
import { StationCode } from "../types";
import {
  Box,
  Compass,
  Clock,
  ArrowRight,
  Sparkles
} from "lucide-react";

export const DigitalTwinPage: React.FC = () => {
  const {
    selectedStation,
    setSelectedStation,
    stationInfo,
    environment,
    energy,
    equipmentList,
    alertsList,
    realtimeStatus,
    lastTelemetryAt,
    isStale
  } = useStation();

  // 3D Digital Twin UI States
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [cameraPreset, setCameraPreset] = useState<DigitalTwinCameraPreset>("default");
  const [layers, setLayers] = useState<DigitalTwinLayerState>({
    buildings: true,
    equipment: true,
    alerts: true,
    environment: true
  });

  // Toggle specific 3D layer
  const handleToggleLayer = (layer: keyof DigitalTwinLayerState) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  // Convert generic Equipment domain entities into enhanced Equipment3DState
  const equipmentStates: Equipment3DState[] = useMemo(() => {
    return equipmentList.map((eq) => {
      // Find matching active alert for this equipment
      const matchingAlert = alertsList.find(
        (a) =>
          a.description.toLowerCase().includes(eq.name.toLowerCase()) ||
          a.title.toLowerCase().includes(eq.name.toLowerCase()) ||
          (eq.category === "POWER" && a.source === "ENERGY") ||
          (eq.category === "HVAC" && a.source === "ENVIRONMENT")
      );

      let temperature: number | undefined;
      let loadPercent: number | undefined;

      if (eq.category === "POWER") {
        temperature = 75.0 + (100 - eq.healthScore) * 0.45;
        loadPercent = Math.min(98, Math.round((energy.totalConsumptionKw / (energy.totalGenerationKw || 1)) * 75));
      } else if (eq.category === "HVAC") {
        temperature = 22.5;
        loadPercent = 65;
      }

      return {
        id: eq.id,
        name: eq.name,
        category: eq.category,
        status: eq.status,
        healthScore: eq.healthScore,
        temperature: temperature ? parseFloat(temperature.toFixed(1)) : undefined,
        loadPercent,
        lastChecked: eq.lastChecked,
        modelNumber: eq.modelNumber,
        hasActiveAlert: !!matchingAlert,
        activeAlertSeverity: matchingAlert?.severity,
        activeAlertTitle: matchingAlert?.title
      };
    });
  }, [equipmentList, alertsList, energy]);

  // Selected Equipment Details
  const selectedEquipment = useMemo(() => {
    if (!selectedEquipmentId) return null;
    return equipmentStates.find((eq) => eq.id === selectedEquipmentId) || null;
  }, [selectedEquipmentId, equipmentStates]);

  const activeStationCode: StationCode =
    selectedStation === "ALL" ? "MAITRI" : selectedStation;

  const selectedPositionInfo = useMemo(() => {
    if (!selectedEquipmentId) return undefined;
    return getEquipmentPosition(activeStationCode, selectedEquipmentId);
  }, [selectedEquipmentId, activeStationCode]);

  // Active alerts for selected equipment
  const selectedEquipmentAlerts = useMemo(() => {
    if (!selectedEquipment) return [];
    return alertsList.filter(
      (a) =>
        a.description.toLowerCase().includes(selectedEquipment.name.toLowerCase()) ||
        a.title.toLowerCase().includes(selectedEquipment.name.toLowerCase())
    );
  }, [selectedEquipment, alertsList]);

  // Detected scenario from active alerts
  const activeScenario = useMemo(() => {
    const alertTitles = alertsList.map((a) => a.title.toUpperCase()).join(" ");
    if (alertTitles.includes("OVERHEAT")) return "GENERATOR_OVERHEAT";
    if (alertTitles.includes("BATTERY") || alertTitles.includes("DISCHARGE")) return "BATTERY_LOW";
    if (alertTitles.includes("WIND") || alertTitles.includes("BLIZZARD") || environment.windSpeedKmh > 75) return "HIGH_WIND";
    if (alertTitles.includes("FUEL")) return "LOW_FUEL";
    return null;
  }, [alertsList, environment.windSpeedKmh]);

  return (
    <div className="space-y-5 pb-10">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Box className="w-3.5 h-3.5" />
              PHASE 6 • 3D DIGITAL TWIN
            </span>

            {/* Connection Status Pill */}
            <span
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                realtimeStatus === "LIVE"
                  ? isStale
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : realtimeStatus === "RECONNECTING"
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  realtimeStatus === "LIVE"
                    ? isStale
                      ? "bg-amber-400"
                      : "bg-emerald-400"
                    : realtimeStatus === "RECONNECTING"
                    ? "bg-amber-400 animate-ping"
                    : "bg-rose-400"
                }`}
              />
              {realtimeStatus === "LIVE"
                ? isStale
                  ? "DATA STALE"
                  : "● LIVE STREAM"
                : realtimeStatus === "RECONNECTING"
                ? "RECONNECTING"
                : "OFFLINE"}
            </span>

            {/* Scenario Badge if Active */}
            {activeScenario && (
              <span className="hidden md:flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                SCENARIO: {activeScenario}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
            <span>Spatial Operations Twin</span>
            <span className="text-slate-500 font-light">|</span>
            <span className="text-cyan-300 text-lg font-mono font-medium">
              {selectedStation === "ALL" ? "Multi-Station Network" : stationInfo.name}
            </span>
          </h1>
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Telemetry:{" "}
              <strong className="text-slate-200">
                {lastTelemetryAt ? lastTelemetryAt.toISOString().slice(11, 19) + " UTC" : "Waiting for Stream"}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Area: Either ALL Station Selector or Single Station 3D View */}
      {selectedStation === "ALL" ? (
        // ALL STATIONS: Multi-Twin Hub Selector (Section 14)
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 text-slate-200 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400" />
              Select Antarctic Research Station Digital Twin
            </h3>
            <p className="text-sm text-slate-400 max-w-2xl mb-6">
              POLARIS operates high-fidelity 3D spatial twins for both Indian Antarctic bases. 
              Select a station below to enter its real-time 3D operational canvas.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Maitri Station Card */}
              <div
                onClick={() => setSelectedStation("MAITRI")}
                className="group relative p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-orange-500/50 transition-all cursor-pointer shadow-lg hover:shadow-orange-500/10"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-orange-400 font-semibold">
                      Second Indian Station • Est. 1989
                    </span>
                    <h4 className="text-xl font-bold text-white mt-1 group-hover:text-orange-300 transition-colors">
                      Maitri Research Base
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Schirmacher Oasis, Queen Maud Land
                    </p>
                  </div>
                  <span className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 group-hover:scale-110 transition-transform">
                    <Box className="w-6 h-6" />
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]">HEALTH SCORE</span>
                    <span className="text-base font-bold text-emerald-400">94%</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]">ARCHITECTURE</span>
                    <span className="text-xs font-semibold text-slate-200">Modular Oasis on Stilts</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-orange-400 pt-2 border-t border-slate-800/80">
                  <span>Enter Maitri 3D Twin</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Bharati Station Card */}
              <div
                onClick={() => setSelectedStation("BHARATI")}
                className="group relative p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer shadow-lg hover:shadow-cyan-500/10"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                      Third Indian Station • Est. 2012
                    </span>
                    <h4 className="text-xl font-bold text-white mt-1 group-hover:text-cyan-300 transition-colors">
                      Bharati Research Base
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Larsemann Hills, Prydz Bay Coast
                    </p>
                  </div>
                  <span className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform">
                    <Box className="w-6 h-6" />
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]">HEALTH SCORE</span>
                    <span className="text-base font-bold text-emerald-400">96%</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]">ARCHITECTURE</span>
                    <span className="text-xs font-semibold text-slate-200">Aerodynamic Containers</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-cyan-400 pt-2 border-t border-slate-800/80">
                  <span>Enter Bharati 3D Twin</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // SINGLE STATION 3D DIGITAL TWIN VIEW
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch min-h-[560px]">
            {/* 3. Left/Center 3D Canvas Viewport (75% on Desktop) */}
            <div className="lg:col-span-3 h-[520px] lg:h-[620px] relative">
              <DigitalTwinCanvas
                stationCode={activeStationCode}
                equipmentStates={equipmentStates}
                alerts={alertsList}
                windSpeedKmH={environment.windSpeedKmh}
                selectedEquipmentId={selectedEquipmentId}
                onSelectEquipment={(id) => setSelectedEquipmentId(id)}
                preset={cameraPreset}
                onSetPreset={(p) => setCameraPreset(p)}
                layers={layers}
                onToggleLayer={handleToggleLayer}
                activeScenario={activeScenario}
              />
            </div>

            {/* 4. Right Diagnostics & Information Sidebar (25% on Desktop) */}
            <div className="lg:col-span-1 h-[520px] lg:h-[620px]">
              {selectedEquipment ? (
                <EquipmentInfoPanel
                  stationCode={activeStationCode}
                  equipment={selectedEquipment}
                  positionInfo={selectedPositionInfo}
                  activeAlerts={selectedEquipmentAlerts}
                  onClose={() => setSelectedEquipmentId(null)}
                  onFocus={() => setCameraPreset("equipment")}
                />
              ) : (
                <StationInfoPanel
                  station={stationInfo}
                  environment={environment}
                  energy={energy}
                  alerts={alertsList}
                  equipmentCount={equipmentList.length}
                />
              )}
            </div>
          </div>

          {/* 5. Bottom Subsystem Quick Navigation & Status Strip */}
          <EquipmentStatusStrip
            equipmentList={equipmentStates}
            selectedEquipmentId={selectedEquipmentId}
            onSelectEquipment={(id) => {
              setSelectedEquipmentId(id);
              setCameraPreset("equipment");
            }}
          />
        </div>
      )}
    </div>
  );
};
