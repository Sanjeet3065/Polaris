import React from "react";
import { StationComparisonData } from "../../types/analytics.types";
import { Scale, Info } from "lucide-react";

interface Props {
  data: StationComparisonData;
  isLoading: boolean;
}

export const StationComparisonSection: React.FC<Props> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 h-48 animate-pulse" />
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 h-48 animate-pulse" />
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 h-96 animate-pulse" />
      </div>
    );
  }

  const { stations, comparisonTable, observations } = data;

  const maitriStation = stations.find((s) => s.code === "MAITRI");
  const bharatiStation = stations.find((s) => s.code === "BHARATI");

  return (
    <div className="space-y-6">
      {/* Objective Benchmark Notice */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
          <Scale className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Objective Polar Research Station Benchmarking
          </h3>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
            Side-by-side comparative operations review between Maitri Station (Schirmacher Oasis, inland rocky ice-free plateau)
            and Bharati Station (Larsemann Hills, coastal marine promontory). Metrics reflect differing environmental topographies
            and infrastructure layouts.
          </p>
        </div>
      </div>

      {/* Station Profile Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Maitri Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div>
              <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Station 01 • Inland Base</div>
              <h4 className="text-lg font-bold text-white mt-0.5">Maitri Station</h4>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-semibold text-slate-400 uppercase">Health Index</div>
              <div className="text-xl font-bold text-emerald-400">{maitriStation?.healthPercent ?? "N/A"}%</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-850">
              <span className="text-slate-400">Microgrid Generation:</span>
              <div className="text-sm font-bold text-white mt-1">
                {maitriStation?.energy.avgGenerationKw ?? 0} kW
              </div>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-850">
              <span className="text-slate-400">Station Load:</span>
              <div className="text-sm font-bold text-white mt-1">
                {maitriStation?.energy.avgConsumptionKw ?? 0} kW
              </div>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-850">
              <span className="text-slate-400">Battery SoC:</span>
              <div className="text-sm font-bold text-emerald-400 mt-1">
                {maitriStation?.energy.avgBatteryPercent ?? 0}%
              </div>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-850">
              <span className="text-slate-400">Fuel Reserves:</span>
              <div className="text-sm font-bold text-sky-400 mt-1">
                {maitriStation?.energy.fuelPercent ?? 0}%
              </div>
            </div>
          </div>
        </div>

        {/* Bharati Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div>
              <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Station 02 • Coastal Base</div>
              <h4 className="text-lg font-bold text-white mt-0.5">Bharati Station</h4>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-semibold text-slate-400 uppercase">Health Index</div>
              <div className="text-xl font-bold text-emerald-400">{bharatiStation?.healthPercent ?? "N/A"}%</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-850">
              <span className="text-slate-400">Microgrid Generation:</span>
              <div className="text-sm font-bold text-white mt-1">
                {bharatiStation?.energy.avgGenerationKw ?? 0} kW
              </div>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-850">
              <span className="text-slate-400">Station Load:</span>
              <div className="text-sm font-bold text-white mt-1">
                {bharatiStation?.energy.avgConsumptionKw ?? 0} kW
              </div>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-850">
              <span className="text-slate-400">Battery SoC:</span>
              <div className="text-sm font-bold text-emerald-400 mt-1">
                {bharatiStation?.energy.avgBatteryPercent ?? 0}%
              </div>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-850">
              <span className="text-slate-400">Fuel Reserves:</span>
              <div className="text-sm font-bold text-sky-400 mt-1">
                {bharatiStation?.energy.fuelPercent ?? 0}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparative Matrix Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-white mb-1">Maitri vs Bharati Operational Benchmark Matrix</h3>
        <p className="text-[11px] text-slate-400 mb-4">Neutral operational metrics compared side-by-side</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3 px-3">Operational Metric</th>
                <th className="pb-3 px-3">Unit</th>
                <th className="pb-3 px-3 text-sky-300">Maitri Station</th>
                <th className="pb-3 px-3 text-sky-300">Bharati Station</th>
                <th className="pb-3 px-3">Engineering Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {comparisonTable.map((row) => (
                <tr key={row.metric} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-semibold text-white">{row.metric}</td>
                  <td className="py-3 px-3 text-slate-400 font-mono">{row.unit}</td>
                  <td className="py-3 px-3 font-bold text-slate-100">{row.maitriValue ?? "N/A"}</td>
                  <td className="py-3 px-3 font-bold text-slate-100">{row.bharatiValue ?? "N/A"}</td>
                  <td className="py-3 px-3 text-slate-400 text-[11px]">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Observations Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-sky-400" />
          <span>Cross-Station Comparative Observations</span>
        </h4>
        <ul className="space-y-1.5 text-xs text-slate-300">
          {observations.map((obs, idx) => (
            <li key={idx} className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded border border-slate-850">
              <span className="text-sky-400 font-bold shrink-0 mt-0.5">•</span>
              <span className="leading-relaxed">{obs}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
