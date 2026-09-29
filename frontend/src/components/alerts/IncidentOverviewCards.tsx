import React from "react";
import { IncidentOverviewKpi } from "../../types/alert.types";
import { AlertOctagon, Search, Wrench, CheckCircle, ShieldAlert } from "lucide-react";
import { IncidentStatus } from "../../utils/alertRules";

interface IncidentOverviewCardsProps {
  overview: IncidentOverviewKpi | null;
  isLoading: boolean;
  selectedStatus?: IncidentStatus;
  onSelectStatus?: (status?: IncidentStatus) => void;
}

export const IncidentOverviewCards: React.FC<IncidentOverviewCardsProps> = ({
  overview,
  isLoading,
  selectedStatus,
  onSelectStatus
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

  const cards: Array<{
    label: string;
    count: number;
    sub: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    activeRing: string;
    filterValue?: IncidentStatus;
  }> = [
    {
      label: "Open Incidents",
      count: overview?.openIncidents ?? 0,
      sub: `${overview?.totalIncidents ?? 0} Total Recorded`,
      icon: AlertOctagon,
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/20",
      activeRing: selectedStatus === "OPEN" ? "ring-2 ring-rose-500/50" : "",
      filterValue: "OPEN"
    },
    {
      label: "Investigating",
      count: overview?.investigatingIncidents ?? 0,
      sub: "Active Diagnosis",
      icon: Search,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      activeRing: selectedStatus === "INVESTIGATING" ? "ring-2 ring-amber-500/50" : "",
      filterValue: "INVESTIGATING"
    },
    {
      label: "Mitigating",
      count: overview?.mitigatingIncidents ?? 0,
      sub: "Action In Progress",
      icon: Wrench,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/20",
      activeRing: selectedStatus === "MITIGATING" ? "ring-2 ring-cyan-500/50" : "",
      filterValue: "MITIGATING"
    },
    {
      label: "Resolved",
      count: (overview?.resolvedIncidents ?? 0) + (overview?.closedIncidents ?? 0),
      sub: `${overview?.closedIncidents ?? 0} Closed & Archived`,
      icon: CheckCircle,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      activeRing: selectedStatus === "RESOLVED" ? "ring-2 ring-emerald-500/50" : "",
      filterValue: "RESOLVED"
    },
    {
      label: "Critical Impact",
      count: overview?.criticalImpact ?? 0,
      sub: `${overview?.criticalSeverity ?? 0} Critical Severity`,
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
        const isClickable = !!onSelectStatus && card.filterValue !== undefined;

        return (
          <div
            key={idx}
            onClick={() => {
              if (onSelectStatus && card.filterValue !== undefined) {
                onSelectStatus(selectedStatus === card.filterValue ? undefined : card.filterValue);
              }
            }}
            className={`p-3.5 rounded-lg border backdrop-blur-md transition-all duration-200 ${card.bg} ${card.activeRing} ${
              isClickable ? "cursor-pointer hover:scale-[1.01]" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{card.label}</span>
              <Icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-100">{card.count}</span>
              <span className="text-[11px] text-slate-400 truncate">{card.sub}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
