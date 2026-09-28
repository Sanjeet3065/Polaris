import React from "react";
import { ArrowLeftRight } from "lucide-react";
import { Card } from "../ui/Card";
import { MOCK_STATION_COMPARISON } from "../../data/comparison";

export const StationComparison: React.FC = () => {
  return (
    <Card className="p-5 bg-polar-900/60 border-slate-800/80 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-indigo-400" />
            Station Operational Baseline Comparison
          </h3>
          <p className="text-xs text-slate-400">Simultaneous telemetry comparison between Maitri & Bharati bases</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono font-bold">
          <span className="flex items-center gap-1.5 text-sky-400">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            MAITRI (Inland Oasis)
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            BHARATI (Coastal Outpost)
          </span>
        </div>
      </div>

      {/* Comparison Rows */}
      <div className="space-y-3 font-mono">
        {MOCK_STATION_COMPARISON.map((item) => {
          // Normalize for comparison bar (0 - 100)
          const total = item.maitriValue + item.bharatiValue;
          const maitriPct = total > 0 ? (item.maitriValue / total) * 100 : 50;
          const bharatiPct = 100 - maitriPct;

          return (
            <div key={item.metric} className="rounded-lg bg-slate-950/50 p-2.5 border border-slate-800/60 text-xs">
              <div className="flex justify-between items-center mb-1.5 text-slate-300">
                <span className="font-semibold font-sans text-slate-200">{item.metric}</span>
                <div className="flex items-center gap-6">
                  <span className="text-sky-300 font-bold">{item.displayMaitri}</span>
                  <span className="text-slate-600">vs</span>
                  <span className="text-emerald-300 font-bold">{item.displayBharati}</span>
                </div>
              </div>

              {/* Dual Ratio Bar */}
              <div className="h-1.5 w-full bg-slate-800/80 rounded-full flex overflow-hidden">
                <div
                  className="h-full bg-sky-500 transition-all duration-500"
                  style={{ width: `${maitriPct}%` }}
                />
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
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
