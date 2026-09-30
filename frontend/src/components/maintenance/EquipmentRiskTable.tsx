import React from "react";
import { MaintenancePrediction, RiskBand } from "../../types/maintenance.types";
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  Cpu,
  Flame,
  Gauge,
  ShieldCheck,
  Wrench
} from "lucide-react";

interface Props {
  predictions: MaintenancePrediction[];
  isLoading: boolean;
  onSelectEquipment: (equipmentId: string) => void;
  onOpenWorkOrderModal: (equipmentId: string, equipmentCode: string) => void;
}

export const EquipmentRiskTable: React.FC<Props> = ({
  predictions,
  isLoading,
  onSelectEquipment,
  onOpenWorkOrderModal
}) => {
  const getRiskBadge = (band: RiskBand) => {
    switch (band) {
      case "CRITICAL":
        return {
          bg: "bg-rose-500/15 text-rose-300 border-rose-500/40",
          symbol: "⚠ CRITICAL",
          icon: Flame
        };
      case "HIGH":
        return {
          bg: "bg-orange-500/15 text-orange-300 border-orange-500/40",
          symbol: "▲ HIGH",
          icon: AlertTriangle
        };
      case "MODERATE":
        return {
          bg: "bg-amber-500/15 text-amber-300 border-amber-500/40",
          symbol: "■ MODERATE",
          icon: Gauge
        };
      case "GUARDED":
        return {
          bg: "bg-blue-500/15 text-blue-300 border-blue-500/40",
          symbol: "◆ GUARDED",
          icon: ShieldCheck
        };
      case "LOW":
      default:
        return {
          bg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
          symbol: "● LOW",
          icon: ShieldCheck
        };
    }
  };

  const getHealthBarColor = (health: number) => {
    if (health >= 85) return "bg-emerald-500";
    if (health >= 70) return "bg-blue-500";
    if (health >= 55) return "bg-amber-500";
    if (health >= 40) return "bg-orange-500";
    return "bg-rose-500";
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center">
        <div className="inline-block w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-slate-400">Loading predictive health evaluations...</p>
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-12 text-center">
        <Cpu className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-200">No Equipment Assets Found</h3>
        <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
          No equipment matches the selected station or risk band filters. Clear filters or initiate a telemetry cycle.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-polar-900/80 border border-polar-750 rounded-xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300 min-w-[760px]">
          <thead className="bg-polar-950/80 border-b border-polar-750 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <tr>
              <th scope="col" className="py-3 px-4">Equipment Asset</th>
              <th scope="col" className="py-3 px-3">Station</th>
              <th scope="col" className="py-3 px-3">Category</th>
              <th scope="col" className="py-3 px-4 min-w-[130px]">Health Index</th>
              <th scope="col" className="py-3 px-3">Risk Assessment</th>
              <th scope="col" className="py-3 px-3">Est. RUL</th>
              <th scope="col" className="py-3 px-3">Confidence / Quality</th>
              <th scope="col" className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {predictions.map((p) => {
              const risk = getRiskBadge(p.riskBand);
              const eq = p.equipment;
              const station = p.station;

              return (
                <tr
                  key={p.id}
                  className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  onClick={() => onSelectEquipment(p.equipmentId)}
                >
                  {/* Asset Tag & Name */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-white group-hover:text-orange-400 transition-colors">
                        {eq?.name || "Machinery Asset"}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {eq?.code || p.equipmentId}
                      </span>
                    </div>
                  </td>

                  {/* Station */}
                  <td className="py-3 px-3">
                    <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                      {station?.code || "MAITRI"}
                    </span>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-3">
                    <span className="text-[11px] text-slate-400 uppercase">
                      {eq?.category?.replace(/_/g, " ") || "EQUIPMENT"}
                    </span>
                  </td>

                  {/* Health Index Bar */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full ${getHealthBarColor(p.healthScore)} transition-all`}
                          style={{ width: `${Math.max(5, p.healthScore)}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-100 min-w-[32px]">
                        {p.healthScore}%
                      </span>
                    </div>
                  </td>

                  {/* Risk Score & Band Badge */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-bold tracking-wide ${risk.bg}`}
                      >
                        {risk.symbol}
                      </span>
                      <span className="font-mono font-medium text-slate-300 text-[11px]">
                        {p.riskScore}%
                      </span>
                    </div>
                  </td>

                  {/* Estimated RUL */}
                  <td className="py-3 px-3">
                    {p.estimatedRulDays != null ? (
                      <div className="flex items-center gap-1.5 font-medium text-slate-200">
                        <Clock className="w-3.5 h-3.5 text-orange-400" />
                        <span>{p.estimatedRulDays} days</span>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic text-[11px]">
                        {p.healthScore >= 75 ? "Stable" : "Unavailable"}
                      </span>
                    )}
                  </td>

                  {/* Confidence & Data Quality */}
                  <td className="py-3 px-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-slate-300 font-medium">
                        {p.confidence}% conf.
                      </span>
                      <span
                        className={`text-[10px] font-semibold uppercase ${
                          p.dataQuality === "GOOD"
                            ? "text-emerald-400"
                            : p.dataQuality === "LIMITED"
                            ? "text-amber-400"
                            : "text-rose-400"
                        }`}
                      >
                        {p.dataQuality} QUALITY
                      </span>
                    </div>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenWorkOrderModal(p.equipmentId, eq?.code || p.equipmentId)}
                        aria-label={`Schedule Work Order for ${eq?.code}`}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 transition-colors"
                        title="Schedule Work Order"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectEquipment(p.equipmentId)}
                        aria-label={`Inspect ${eq?.code}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 rounded-md border border-cyan-500/30 text-[11px] font-medium transition-colors"
                      >
                        <span>Diagnostics</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
