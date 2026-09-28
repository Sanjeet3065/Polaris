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
    <Card className="p-5 bg-polar-900/60 border-slate-800/80 space-y-4">
      {/* Table Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-sky-400" />
            Equipment Health Index
          </h3>
          <p className="text-xs text-slate-400">Continuous machinery vibration, thermal, and electrical diagnostics</p>
        </div>
        <Link
          to="/equipment"
          className="flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
        >
          <span>View all machinery</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Equipment List Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="pb-2.5">Machinery / Subsystem</th>
              <th className="pb-2.5">Category</th>
              <th className="pb-2.5">Health Score</th>
              <th className="pb-2.5">Operational State</th>
              <th className="pb-2.5 text-right">Last Diagnostics</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {displayedEquipment.map((eq) => (
              <tr key={eq.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3 font-sans font-semibold text-slate-200">
                  <div className="flex flex-col">
                    <span>{eq.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{eq.modelNumber}</span>
                  </div>
                </td>
                <td className="py-3 text-slate-400 font-sans">
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                    {eq.category}
                  </span>
                </td>
                <td className="py-3 min-w-[130px]">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-slate-200">{eq.healthScore}%</span>
                      <span className="text-[10px] text-slate-400">
                        {eq.healthScore >= 90 ? "Optimal" : eq.healthScore >= 70 ? "Degraded" : "Critical"}
                      </span>
                    </div>
                    <ProgressBar value={eq.healthScore} size="sm" barColor="dynamic" />
                  </div>
                </td>
                <td className="py-3">
                  <StatusBadge status={eq.status} size="sm" />
                </td>
                <td className="py-3 text-right text-slate-400 font-sans text-xs">
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
