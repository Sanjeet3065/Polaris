import React from "react";
import { Link } from "react-router-dom";
import { Settings2, ArrowRight } from "lucide-react";
import { Card } from "../ui/Card";
import { ProgressBar } from "../ui/ProgressBar";
import { StatusBadge } from "../ui/StatusBadge";
import { useStation } from "../../context/StationContext";

export const EquipmentHealthTable: React.FC = () => {
  const { equipmentList } = useStation();

  // Show top 6 equipment on overview
  const displayedEquipment = equipmentList.slice(0, 6);

  return (
    <Card className="p-4 sm:p-5 bg-polar-900/75 border-polar-750 shadow-titanium space-y-4">
      {/* Table Header */}
      <div className="flex items-center justify-between border-b border-polar-750 pb-3">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-orange-400" />
            <span>Equipment Health Index</span>
          </h3>
          <p className="text-[11px] text-slate-400">Continuous machinery vibration, thermal, and electrical diagnostics</p>
        </div>
        <Link
          to="/equipment"
          className="flex items-center gap-1.5 text-xs font-mono font-semibold text-orange-400 hover:text-orange-300 transition-colors"
        >
          <span>All machinery</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Equipment List Table */}
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <table className="w-full text-left text-xs min-w-[500px]">
          <thead>
            <tr className="border-b border-polar-750 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              <th className="pb-2.5">Subsystem</th>
              <th className="pb-2.5">Category</th>
              <th className="pb-2.5">Health</th>
              <th className="pb-2.5">Status</th>
              <th className="pb-2.5 text-right">Telemetry Sync</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-polar-750/70 font-mono">
            {displayedEquipment.map((eq) => (
              <tr key={eq.id} className="hover:bg-polar-800/40 transition-colors">
                <td className="py-2.5 font-sans font-semibold text-slate-200">
                  <div className="flex flex-col">
                    <span className="text-xs">{eq.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{eq.modelNumber}</span>
                  </div>
                </td>
                <td className="py-2.5 text-slate-400 font-sans">
                  <span className="rounded bg-polar-800 border border-polar-700 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                    {eq.category}
                  </span>
                </td>
                <td className="py-2.5 min-w-[120px]">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-slate-200 tabular-nums">{eq.healthScore}%</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {eq.healthScore >= 90 ? "Nominal" : eq.healthScore >= 70 ? "Degraded" : "Critical"}
                      </span>
                    </div>
                    <ProgressBar value={eq.healthScore} size="sm" barColor="dynamic" />
                  </div>
                </td>
                <td className="py-2.5">
                  <StatusBadge status={eq.status} size="sm" />
                </td>
                <td className="py-2.5 text-right text-slate-400 font-mono text-[11px]">
                  {eq.lastChecked}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
