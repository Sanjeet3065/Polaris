import React from "react";
import {
  KpiCardsSection,
  EnvironmentalSnapshot,
  PowerEnergyChart,
  TemperatureTrendChart,
  EquipmentHealthTable,
  ActiveAlertsPanel,
  StationComparison,
  StationLocationCard,
  OperationalTimeline,
  QuickActions
} from "../components/dashboard";
import { useStation } from "../context/StationContext";

export const OverviewPage: React.FC = () => {
  const { stationInfo, selectedStation } = useStation();

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-polar-750 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span className="polar-gradient-text">Mission Overview</span>
            <span className="rounded-lg bg-polar-850 border border-cyan-500/30 px-2.5 py-0.5 text-[11px] font-mono text-cyan-300 font-bold uppercase tracking-wider">
              {selectedStation}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Remote telemetry stream, microgrid telemetry, and environmental diagnostics for {stationInfo.name}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-polar-900/60 px-3 py-1.5 rounded-lg border border-polar-750 self-start sm:self-auto">
          <span>Lat: <strong className="text-slate-200 tabular-nums">{stationInfo.location.lat}°S</strong></span>
          <span className="text-polar-700">•</span>
          <span>Lng: <strong className="text-slate-200 tabular-nums">{stationInfo.location.lng}°E</strong></span>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <section aria-label="Key Performance Indicators">
        <KpiCardsSection />
      </section>

      {/* 3. Environmental Snapshot */}
      <section aria-label="Environmental Metrics">
        <EnvironmentalSnapshot />
      </section>

      {/* 4. Energy & Temperature Charts Grid */}
      <section aria-label="Telemetry Trajectories" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PowerEnergyChart />
        <TemperatureTrendChart />
      </section>

      {/* 5. Equipment Health & Active Alerts Grid */}
      <section aria-label="Machinery and Alarms" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <EquipmentHealthTable />
        </div>
        <div>
          <ActiveAlertsPanel />
        </div>
      </section>

      {/* 6. Station Baseline Comparison */}
      <section aria-label="Station Baseline Comparison">
        <StationComparison />
      </section>

      {/* 7. Geospatial Location & Timeline Grid */}
      <section aria-label="Geospatial and Chronology" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StationLocationCard />
        <OperationalTimeline />
      </section>

      {/* 8. Mission Control Quick Actions */}
      <section aria-label="Mission Control Quick Actions">
        <QuickActions />
      </section>
    </div>
  );
};
