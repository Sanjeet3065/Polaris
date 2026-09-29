import React from "react";
import { Equipment3DState } from "./types";
import {
  Zap,
  Wind,
  Battery,
  Droplets,
  Radio,
  Fuel
} from "lucide-react";

interface Props {
  equipmentList: Equipment3DState[];
  selectedEquipmentId: string | null;
  onSelectEquipment: (id: string) => void;
}

export const EquipmentStatusStrip: React.FC<Props> = ({
  equipmentList,
  selectedEquipmentId,
  onSelectEquipment
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "POWER":
        return <Zap className="w-4 h-4 text-amber-400" />;
      case "HVAC":
        return <Wind className="w-4 h-4 text-cyan-400" />;
      case "COMMUNICATION":
        return <Radio className="w-4 h-4 text-blue-400" />;
      case "WATER_SYSTEM":
        return <Droplets className="w-4 h-4 text-indigo-400" />;
      case "LIFE_SUPPORT":
        return <Fuel className="w-4 h-4 text-emerald-400" />;
      default:
        return <Battery className="w-4 h-4 text-purple-400" />;
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case "HEALTHY":
        return <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />;
      case "WARNING":
        return <span className="w-2 h-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />;
      case "CRITICAL":
        return <span className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/50 animate-pulse" />;
      default:
        return <span className="w-2 h-2 rounded-full bg-slate-500" />;
    }
  };

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-xl overflow-x-auto">
      <div className="flex items-center gap-3 min-w-max">
        <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-semibold pl-1 pr-2 border-r border-slate-800 hidden md:block">
          Subsystem Fleet
        </span>

        {equipmentList.map((eq) => {
          const isSelected = selectedEquipmentId === eq.id;

          return (
            <button
              key={eq.id}
              onClick={() => onSelectEquipment(eq.id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all ${
                isSelected
                  ? "bg-cyan-950/80 border-cyan-500/80 text-white shadow-md shadow-cyan-500/10 scale-102"
                  : "bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700"
              }`}
            >
              <div className="p-1 rounded bg-slate-800/80 flex items-center justify-center">
                {getCategoryIcon(eq.category)}
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold whitespace-nowrap text-slate-100">
                    {eq.name.split("(")[0].trim()}
                  </span>
                  {getStatusIndicator(eq.status)}
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span>{eq.healthScore}% Health</span>
                  {eq.hasActiveAlert && (
                    <span className="text-red-400 font-bold">ALERT</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
