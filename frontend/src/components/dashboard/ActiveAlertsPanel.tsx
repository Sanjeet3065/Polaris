import React from "react";
import { Link } from "react-router-dom";
import { TriangleAlert, AlertOctagon, Info, ArrowRight, ShieldCheck } from "lucide-react";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { useStation } from "../../context/StationContext";
import { AlertSeverity } from "../../types";

export const ActiveAlertsPanel: React.FC = () => {
  const { alertsList } = useStation();

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case "CRITICAL":
      case "EMERGENCY":
        return {
          icon: AlertOctagon,
          bg: "bg-red-500/15 border-red-500/30 text-red-300",
          iconColor: "text-red-400"
        };
      case "WARNING":
        return {
          icon: TriangleAlert,
          bg: "bg-amber-500/15 border-amber-500/30 text-amber-300",
          iconColor: "text-amber-400"
        };
      case "INFO":
      default:
        return {
          icon: Info,
          bg: "bg-sky-500/15 border-sky-500/30 text-sky-300",
          iconColor: "text-sky-400"
        };
    }
  };

  return (
    <Card className="p-4 sm:p-5 bg-polar-900/75 border-polar-750 shadow-titanium space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-polar-750 pb-3">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <TriangleAlert className="h-4 w-4 text-amber-400" />
            <span>Active Alarms</span>
          </h3>
          <p className="text-[11px] text-slate-400">Real-time threshold breaches & telemetry flags</p>
        </div>
        <Link
          to="/alerts"
          className="flex items-center gap-1.5 text-xs font-mono font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <span>All alerts</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Alerts Stream */}
      {alertsList.length === 0 ? (
        <EmptyState
          title="All systems within nominal limits"
          description="Zero active warnings or emergency alerts are logged for this station."
          icon={ShieldCheck}
        />
      ) : (
        <div className="space-y-2.5">
          {alertsList.map((alert) => {
            const badge = getSeverityBadge(alert.severity);
            const Icon = badge.icon;

            return (
              <div
                key={alert.id}
                className="flex items-start gap-3 rounded-lg border border-polar-750 bg-polar-950/80 p-3 hover:border-polar-700 transition-colors"
              >
                <div className={`p-1.5 rounded-lg border shrink-0 ${badge.bg}`}>
                  <Icon className={`h-4 w-4 ${badge.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-100 truncate">
                      {alert.title}
                    </span>
                    <span className="font-mono text-[10px] text-cyan-400 uppercase shrink-0 font-bold">
                      {alert.stationCode}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {alert.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
