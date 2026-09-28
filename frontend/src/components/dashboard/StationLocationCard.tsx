import React from "react";
import { Globe } from "lucide-react";
import { Card } from "../ui/Card";

export const StationLocationCard: React.FC = () => {
  return (
    <Card className="p-5 bg-polar-900/60 border-slate-800/80 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Globe className="h-4 w-4 text-sky-400" />
            Antarctic Geodetic Reference
          </h3>
          <p className="text-xs text-slate-400">Official NCPOR geospatial coordinates & terrain profile</p>
        </div>
        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
          WGS-84 REFERENCE
        </span>
      </div>

      {/* Side-by-side location cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* MAITRI CARD */}
        <div className="rounded-xl border border-sky-500/20 bg-slate-950/70 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                Maitri Research Base
              </h4>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Est. 1989</span>
          </div>

          <div className="space-y-1 font-mono text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-400">Latitude:</span>
              <span className="font-bold text-sky-300">70.7667° S</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Longitude:</span>
              <span className="font-bold text-sky-300">11.7333° E</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Altitude:</span>
              <span className="text-slate-200">117 m ASL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Terrain:</span>
              <span className="text-slate-200 font-sans">Schirmacher Oasis</span>
            </div>
          </div>
        </div>

        {/* BHARATI CARD */}
        <div className="rounded-xl border border-emerald-500/20 bg-slate-950/70 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                Bharati Research Base
              </h4>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Est. 2012</span>
          </div>

          <div className="space-y-1 font-mono text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-400">Latitude:</span>
              <span className="font-bold text-emerald-300">69.4072° S</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Longitude:</span>
              <span className="font-bold text-emerald-300">76.1917° E</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Altitude:</span>
              <span className="text-slate-200">35 m ASL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Terrain:</span>
              <span className="text-slate-200 font-sans">Larsemann Hills</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
