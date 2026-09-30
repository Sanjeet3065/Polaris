import React from "react";
import { Globe } from "lucide-react";
import { Card } from "../ui/Card";

export const StationLocationCard: React.FC = () => {
  return (
    <Card className="p-4 sm:p-5 bg-polar-900/75 border-polar-750 shadow-titanium space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-polar-750 pb-3">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Globe className="h-4 w-4 text-cyan-400" />
            <span>Antarctic Geodetic Reference</span>
          </h3>
          <p className="text-[11px] text-slate-400">Official NCPOR geospatial coordinates & terrain profile</p>
        </div>
        <span className="rounded bg-polar-800 border border-polar-700 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
          WGS-84
        </span>
      </div>

      {/* Side-by-side location cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* MAITRI CARD */}
        <div className="rounded-xl border border-polar-750 bg-polar-950/80 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wide font-mono">
                Maitri Research Base
              </h4>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Est. 1989</span>
          </div>

          <div className="space-y-1 font-mono text-xs text-slate-300 bg-polar-900/90 p-2.5 rounded-lg border border-polar-750">
            <div className="flex justify-between">
              <span className="text-slate-400">Latitude:</span>
              <span className="font-bold text-cyan-300 tabular-nums">70.7667° S</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Longitude:</span>
              <span className="font-bold text-cyan-300 tabular-nums">11.7333° E</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Altitude:</span>
              <span className="text-slate-200 tabular-nums">117 m ASL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Terrain:</span>
              <span className="text-slate-200 font-sans text-xs">Schirmacher Oasis</span>
            </div>
          </div>
        </div>

        {/* BHARATI CARD */}
        <div className="rounded-xl border border-polar-750 bg-polar-950/80 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wide font-mono">
                Bharati Research Base
              </h4>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Est. 2012</span>
          </div>

          <div className="space-y-1 font-mono text-xs text-slate-300 bg-polar-900/90 p-2.5 rounded-lg border border-polar-750">
            <div className="flex justify-between">
              <span className="text-slate-400">Latitude:</span>
              <span className="font-bold text-emerald-300 tabular-nums">69.4072° S</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Longitude:</span>
              <span className="font-bold text-emerald-300 tabular-nums">76.1917° E</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Altitude:</span>
              <span className="text-slate-200 tabular-nums">35 m ASL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Terrain:</span>
              <span className="text-slate-200 font-sans text-xs">Larsemann Hills</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
