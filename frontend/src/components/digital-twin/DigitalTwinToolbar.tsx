import React from "react";
import {
  RotateCcw,
  Eye,
  Maximize2,
  Building,
  Wrench,
  Bell,
  CloudSnow
} from "lucide-react";
import { DigitalTwinCameraPreset, DigitalTwinLayerState } from "./types";

interface Props {
  preset: DigitalTwinCameraPreset;
  onSetPreset: (preset: DigitalTwinCameraPreset) => void;
  layers: DigitalTwinLayerState;
  onToggleLayer: (layer: keyof DigitalTwinLayerState) => void;
}

export const DigitalTwinToolbar: React.FC<Props> = ({
  preset,
  onSetPreset,
  layers,
  onToggleLayer
}) => {
  return (
    <div className="bg-polar-950/90 backdrop-blur-xl border border-polar-750 rounded-xl p-1.5 sm:p-2 shadow-hud flex items-center gap-1.5 sm:gap-2.5 text-xs text-slate-200 pointer-events-auto max-w-[calc(100vw-32px)] overflow-x-auto">
      {/* Camera Presets */}
      <div className="flex items-center bg-polar-900 rounded-lg p-0.5 sm:p-1 border border-polar-750 shrink-0">
        <button
          onClick={() => onSetPreset("default")}
          className={`flex items-center gap-1 px-2 py-1 rounded-md font-medium font-mono text-[11px] transition-colors ${
            preset === "default"
              ? "bg-orange-500 text-white font-bold shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-polar-800"
          }`}
          title="Reset to default isometric angle"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
          <span className="sm:hidden text-[10px]">RST</span>
        </button>

        <button
          onClick={() => onSetPreset("top")}
          className={`flex items-center gap-1 px-2 py-1 rounded-md font-medium font-mono text-[11px] transition-colors ${
            preset === "top"
              ? "bg-orange-500 text-white font-bold shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-polar-800"
          }`}
          title="Top-down structural cutaway view"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Top</span>
          <span className="sm:hidden text-[10px]">TOP</span>
        </button>

        <button
          onClick={() => onSetPreset("station")}
          className={`flex items-center gap-1 px-2 py-1 rounded-md font-medium font-mono text-[11px] transition-colors ${
            preset === "station"
              ? "bg-orange-500 text-white font-bold shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-polar-800"
          }`}
          title="Wide operational station perimeter view"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Station</span>
          <span className="sm:hidden text-[10px]">BASE</span>
        </button>
      </div>

      <div className="h-4 w-px bg-polar-750 shrink-0" />

      {/* Layer Toggles */}
      <div className="flex items-center gap-1 shrink-0 font-mono text-[11px]">
        <button
          onClick={() => onToggleLayer("buildings")}
          className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
            layers.buildings
              ? "bg-polar-850 text-orange-400 border border-orange-500/30 font-semibold"
              : "text-slate-500 hover:text-slate-300"
          }`}
          title="Toggle Building Shells"
        >
          <Building className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Buildings</span>
        </button>

        <button
          onClick={() => onToggleLayer("equipment")}
          className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
            layers.equipment
              ? "bg-polar-850 text-orange-400 border border-orange-500/30 font-semibold"
              : "text-slate-500 hover:text-slate-300"
          }`}
          title="Toggle Equipment Models"
        >
          <Wrench className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Equipment</span>
        </button>

        <button
          onClick={() => onToggleLayer("alerts")}
          className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
            layers.alerts
              ? "bg-polar-850 text-amber-400 border border-amber-500/30 font-semibold"
              : "text-slate-500 hover:text-slate-300"
          }`}
          title="Toggle Alert Beacons"
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Alerts</span>
        </button>

        <button
          onClick={() => onToggleLayer("environment")}
          className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
            layers.environment
              ? "bg-polar-850 text-amber-400 border border-amber-500/30 font-semibold"
              : "text-slate-500 hover:text-slate-300"
          }`}
          title="Toggle Katabatic Snow & Polar Terrain"
        >
          <CloudSnow className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Weather</span>
        </button>
      </div>
    </div>
  );
};
