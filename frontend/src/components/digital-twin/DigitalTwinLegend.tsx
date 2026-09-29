import React from "react";
import { BellRing } from "lucide-react";

export const DigitalTwinLegend: React.FC = () => {
  return (
    <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 shadow-xl text-xs text-slate-300 pointer-events-auto">
      <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold mb-2">
        Operational Status
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-medium">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          <span className="text-slate-200">Healthy</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
          <span className="text-slate-200">Warning</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50 animate-pulse" />
          <span className="text-slate-200">Critical</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
          <span className="text-slate-400">Offline</span>
        </div>

        <div className="col-span-2 pt-1 mt-1 border-t border-slate-800/80 flex items-center gap-1.5 text-red-400">
          <BellRing className="w-3.5 h-3.5 animate-bounce" />
          <span className="text-[11px] font-semibold">Active Operational Alert</span>
        </div>
      </div>
    </div>
  );
};
