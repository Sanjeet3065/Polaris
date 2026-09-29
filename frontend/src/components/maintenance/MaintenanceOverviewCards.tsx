import React from "react";
import { HealthOverviewStats } from "../../types/maintenance.types";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Gauge,
  ShieldAlert,
  Wrench
} from "lucide-react";

interface Props {
  stats: HealthOverviewStats | null;
  isLoading: boolean;
}

export const MaintenanceOverviewCards: React.FC<Props> = ({ stats, isLoading }) => {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {Array.from({ length: 7 }).map((_, idx) => (
          <div
            key={idx}
            className="h-24 rounded-xl border border-slate-800 bg-slate-900/60 animate-pulse p-4"
          />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Assets Monitored",
      value: stats.monitoredCount,
      sublabel: "Active Polar Systems",
      icon: Activity,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      symbol: "●"
    },
    {
      label: "Healthy Assets",
      value: stats.healthyCount + stats.goodCount,
      sublabel: "Nominal Operating State",
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      symbol: "✓"
    },
    {
      label: "Watch / Moderate",
      value: stats.watchCount + stats.degradedCount,
      sublabel: "Trend Deterioration",
      icon: Gauge,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      symbol: "■"
    },
    {
      label: "High Risk",
      value: stats.highRiskCount,
      sublabel: "Intervention Advisable",
      icon: AlertTriangle,
      color: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/20",
      symbol: "▲"
    },
    {
      label: "Critical Risk",
      value: stats.criticalRiskCount,
      sublabel: "Prioritize Dispatch",
      icon: Flame,
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/20",
      symbol: "⚠"
    },
    {
      label: "Avg Health Score",
      value: `${stats.averageHealthScore}%`,
      sublabel: "Across Fleet",
      icon: ShieldAlert,
      color: stats.averageHealthScore >= 75 ? "text-emerald-400" : stats.averageHealthScore >= 55 ? "text-amber-400" : "text-rose-400",
      bg: "bg-slate-900/60 border-slate-800",
      symbol: "◆"
    },
    {
      label: "Avg Risk Score",
      value: `${stats.averageRiskScore}%`,
      sublabel: "Failure Likelihood Index",
      icon: Wrench,
      color: stats.averageRiskScore < 30 ? "text-emerald-400" : stats.averageRiskScore < 60 ? "text-amber-400" : "text-rose-400",
      bg: "bg-slate-900/60 border-slate-800",
      symbol: "✦"
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            tabIndex={0}
            aria-label={`${card.label}: ${card.value}`}
            className={`p-3.5 rounded-xl border ${card.bg} transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-cyan-500/40`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider truncate">
                {card.label}
              </span>
              <span className={`text-xs font-bold ${card.color}`} aria-hidden="true">
                {card.symbol}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className={`text-2xl font-bold tracking-tight ${card.color}`}>
                {card.value}
              </div>
              <Icon className={`w-4 h-4 ${card.color} opacity-70`} />
            </div>
            <p className="text-[10px] text-slate-400 mt-1 truncate">
              {card.sublabel}
            </p>
          </div>
        );
      })}
    </div>
  );
};
