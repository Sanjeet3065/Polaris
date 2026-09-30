import React from "react";
import { ArrowLeftRight } from "lucide-react";
import { Card } from "../ui/Card";
import { MOCK_STATION_COMPARISON } from "../../data/comparison";

export const StationComparison: React.FC = () => {
  return (
    <Card className="p-4 sm:p-5 bg-polar-900/75 border-polar-750 shadow-titanium space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-polar-750 pb-3">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-cyan-400" />
            <span>Station Operational Baseline Comparison</span>
          </h3>
          <p className="text-[11px] text-slate-400">Simultaneous telemetry comparison between Maitri & Bharati bases</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono font-bold">
          <span className="flex items-center gap-1.5 text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            <span>MAITRI (Inland)</span>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>BHARATI (Coast)</span>
          </span>
        </div>
      </div>

      {/* Comparison Rows */}
      <div className="space-y-2.5 font-mono">
        {MOCK_STATION_COMPARISON.map((item) => {
          // Normalize for comparison bar (0 - 100)
          const total = item.maitriValue + item.bharatiValue;
          const maitriPct = total > 0 ? (item.maitriValue / total) * 100 : 50;
          const bharatiPct = 100 - maitriPct;

          return (
            <div key={item.metric} className="rounded-xl bg-polar-950/80 p-2.5 sm:p-3 border border-polar-750 text-xs">
              <div className="flex justify-between items-center mb-1.5 text-slate-300">
                <span className="font-semibold font-sans text-slate-200 text-[11px] sm:text-xs">{item.metric}</span>
                <div className="flex items-center gap-4 sm:gap-6 text-xs">
                  <span className="text-cyan-300 font-bold tabular-nums">{item.displayMaitri}</span>
                  <span className="text-polar-700 text-[10px]">VS</span>
                  <span className="text-emerald-300 font-bold tabular-nums">{item.displayBharati}</span>
                </div>
              </div>

              {/* Dual Ratio Bar */}
              <div className="h-1.5 w-full bg-polar-800 rounded-full flex overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-500"
                  style={{ width: `${maitriPct}%` }}
                />
                <div
                  className="h-full bg-emerald-400 transition-all duration-500"
                  style={{ width: `${bharatiPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
