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
    <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-2.5 shadow-xl flex flex-wrap items-center gap-3 text-xs text-slate-200 pointer-events-auto">
      {/* Camera Presets */}
      <div className="flex items-center bg-slate-900/90 rounded-lg p-1 border border-slate-800">
        <button
          onClick={() => onSetPreset("default")}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium transition-colors ${
            preset === "default"
              ? "bg-cyan-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
          title="Reset to default isometric angle"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>

        <button
          onClick={() => onSetPreset("top")}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium transition-colors ${
            preset === "top"
              ? "bg-cyan-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
          title="Top-down structural cutaway view"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Top View</span>
        </button>

        <button
          onClick={() => onSetPreset("station")}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium transition-colors ${
            preset === "station"
              ? "bg-cyan-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
          title="Wide operational station perimeter view"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Station View</span>
        </button>
      </div>

      <div className="h-4 w-px bg-slate-800" />

      {/* Layer Toggles */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onToggleLayer("buildings")}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors ${
            layers.buildings
              ? "bg-slate-800 text-cyan-400 border border-cyan-500/30 font-semibold"
              : "text-slate-500 hover:text-slate-400"
          }`}
          title="Toggle Building Shells"
        >
          <Building className="w-3.5 h-3.5" />
          <span>Buildings</span>
        </button>

        <button
          onClick={() => onToggleLayer("equipment")}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors ${
            layers.equipment
              ? "bg-slate-800 text-cyan-400 border border-cyan-500/30 font-semibold"
              : "text-slate-500 hover:text-slate-400"
          }`}
          title="Toggle Equipment Models"
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Equipment</span>
        </button>

        <button
          onClick={() => onToggleLayer("alerts")}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors ${
            layers.alerts
              ? "bg-slate-800 text-cyan-400 border border-cyan-500/30 font-semibold"
              : "text-slate-500 hover:text-slate-400"
          }`}
          title="Toggle Alert Beacons"
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Alerts</span>
        </button>

        <button
          onClick={() => onToggleLayer("environment")}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors ${
            layers.environment
              ? "bg-slate-800 text-cyan-400 border border-cyan-500/30 font-semibold"
              : "text-slate-500 hover:text-slate-400"
          }`}
          title="Toggle Katabatic Snow & Polar Terrain"
        >
          <CloudSnow className="w-3.5 h-3.5" />
          <span>Weather</span>
        </button>
      </div>
    </div>
  );
};
