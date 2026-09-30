import React from "react";
import { AlertOverviewKpi } from "../../types/alert.types";
import { TriangleAlert, Flame, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";

interface AlertOverviewCardsProps {
  overview: AlertOverviewKpi | null;
  isLoading: boolean;
  selectedSeverity?: string;
  onSelectSeverity?: (severity?: string) => void;
}

export const AlertOverviewCards: React.FC<AlertOverviewCardsProps> = ({
  overview,
  isLoading,
  selectedSeverity,
  onSelectSeverity
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 rounded-lg bg-slate-900/60 border border-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Active Alerts",
      count: overview?.activeAlerts ?? 0,
      sub: `${overview?.totalAlerts ?? 0} Total Logged`,
      icon: TriangleAlert,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      activeRing: selectedSeverity === undefined ? "ring-2 ring-amber-500/50" : "",
      filterValue: undefined
    },
    {
      label: "Critical",
      count: overview?.criticalAlerts ?? 0,
      sub: "Urgent Intervention",
      icon: Flame,
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/20",
      activeRing: selectedSeverity === "CRITICAL" ? "ring-2 ring-rose-500/50" : "",
      filterValue: "CRITICAL"
    },
    {
      label: "High Priority",
      count: overview?.highAlerts ?? 0,
      sub: "Operational Risk",
      icon: AlertCircle,
      color: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/20",
      activeRing: selectedSeverity === "HIGH" ? "ring-2 ring-orange-500/50" : "",
      filterValue: "HIGH"
    },
    {
      label: "Acknowledged",
      count: overview?.acknowledgedAlerts ?? 0,
      sub: "Operator Assigned",
      icon: CheckCircle2,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/20",
      activeRing: "",
      filterValue: undefined
    },
    {
      label: "Unacknowledged",
      count: overview?.unacknowledgedAlerts ?? 0,
      sub: "Requires Triage",
      icon: ShieldAlert,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
      activeRing: "",
      filterValue: undefined
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const isClickable = !!onSelectSeverity;

        return (
          <div
            key={idx}
            onClick={() => onSelectSeverity && onSelectSeverity(card.filterValue)}
            className={`p-3.5 rounded-lg border backdrop-blur-md transition-all duration-200 ${card.bg} ${card.activeRing} ${
              isClickable ? "cursor-pointer hover:scale-[1.01]" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{card.label}</span>
              <Icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <div className="mt-2 flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-bold font-mono text-slate-100">{card.count}</span>
              <span className="text-[11px] text-slate-400 leading-snug">{card.sub}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
