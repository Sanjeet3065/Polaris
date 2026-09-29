import React from "react";
import {
  X,
  Crosshair,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Thermometer,
  Zap,
  Gauge,
  Clock,
  Building
} from "lucide-react";
import { Equipment3DState, Equipment3DPosition } from "./types";
import { StationCode, Alert } from "../../types";

interface Props {
  stationCode: StationCode;
  equipment: Equipment3DState;
  positionInfo?: Equipment3DPosition;
  activeAlerts: Alert[];
  onClose: () => void;
  onFocus: () => void;
}

export const EquipmentInfoPanel: React.FC<Props> = ({
  stationCode,
  equipment,
  positionInfo,
  activeAlerts,
  onClose,
  onFocus
}) => {
  const getStatusBadge = () => {
    switch (equipment.status) {
      case "HEALTHY":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            OPERATIONAL
          </span>
        );
      case "WARNING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            WARNING
          </span>
        );
      case "CRITICAL":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" />
            CRITICAL FAULT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30">
            OFFLINE
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col h-full text-slate-100 overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono tracking-wider text-cyan-400 uppercase font-semibold">
              {equipment.category} • {stationCode}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            {equipment.name}
          </h3>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Close Panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Primary Status Card */}
      <div className="my-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 block mb-1">Operational State</span>
          {getStatusBadge()}
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 block mb-1">Health Index</span>
          <span
            className={`text-2xl font-black font-mono ${
              equipment.healthScore >= 90
                ? "text-emerald-400"
                : equipment.healthScore >= 75
                ? "text-amber-400"
                : "text-red-400"
            }`}
          >
            {equipment.healthScore}%
          </span>
        </div>
      </div>

      {/* Focus in 3D Button */}
      <button
        onClick={onFocus}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 font-semibold text-xs tracking-wide transition-all shadow-sm mb-4"
      >
        <Crosshair className="w-4 h-4" />
        Focus Camera on Asset
      </button>

      {/* Subsystem Metrics & Diagnostics */}
      <div className="space-y-3 flex-1">
        <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold">
          Live Diagnostics
        </h4>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Estimated Load / Power */}
          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Est. Load</span>
            </div>
            <span className="text-base font-bold font-mono text-white">
              {equipment.loadPercent ?? (equipment.status === "HEALTHY" ? 72 : 45)}%
            </span>
          </div>

          {/* Core Temperature */}
          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Temperature</span>
            </div>
            <span className="text-base font-bold font-mono text-white">
              {equipment.temperature ?? (equipment.category === "POWER" ? 78.4 : 21.0)}°C
            </span>
          </div>

          {/* Model Number */}
          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/60 col-span-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Gauge className="w-3.5 h-3.5 text-blue-400" />
              <span>Hardware Specification</span>
            </div>
            <span className="text-xs font-mono font-medium text-slate-200">
              {equipment.modelNumber || "POLAR-STD-REV4"}
            </span>
          </div>

          {/* Physical Location Anchor */}
          {positionInfo && (
            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/60 col-span-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Building className="w-3.5 h-3.5 text-emerald-400" />
                <span>Station Module</span>
              </div>
              <span className="text-xs font-medium text-slate-200">
                {positionInfo.buildingRef.replace("bldg-", "").replace(/-/g, " ").toUpperCase()}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                {positionInfo.description}
              </p>
            </div>
          )}
        </div>

        {/* Active Alerts for this Equipment */}
        {activeAlerts.length > 0 && (
          <div className="pt-2">
            <h4 className="text-xs uppercase font-mono tracking-wider text-red-400 font-semibold mb-2 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Active Subsystem Alerts ({activeAlerts.length})
            </h4>
            <div className="space-y-2">
              {activeAlerts.map((alt) => (
                <div
                  key={alt.id}
                  className="p-3 rounded-lg bg-red-950/30 border border-red-500/30 text-xs"
                >
                  <div className="font-semibold text-red-300 mb-1">{alt.title}</div>
                  <div className="text-slate-400 text-[11px]">{alt.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Timestamp */}
      <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Last Monitored:
        </span>
        <span>{equipment.lastChecked}</span>
      </div>
    </div>
  );
};
