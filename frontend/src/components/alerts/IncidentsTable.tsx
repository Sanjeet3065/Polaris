import React from "react";
import { Incident } from "../../types/alert.types";
import {
  SEVERITY_CONFIG,
  INCIDENT_STATUS_CONFIG,
  IncidentSeverity
} from "../../utils/alertRules";
import {
  Flame,
  AlertTriangle,
  AlertCircle,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  UserCheck,
  Layers
} from "lucide-react";

interface IncidentsTableProps {
  incidents: Incident[];
  isLoading: boolean;
  onSelectIncident: (incident: Incident) => void;
  pagination: { page: number; limit: number; total: number };
  onPageChange: (page: number) => void;
}

export const IncidentsTable: React.FC<IncidentsTableProps> = ({
  incidents,
  isLoading,
  onSelectIncident,
  pagination,
  onPageChange
}) => {
  const getSeverityIcon = (sev: IncidentSeverity) => {
    switch (sev) {
      case "CRITICAL":
        return <Flame className="w-3.5 h-3.5 text-rose-400" />;
      case "HIGH":
        return <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />;
      case "MEDIUM":
        return <AlertCircle className="w-3.5 h-3.5 text-amber-400" />;
      case "LOW":
      default:
        return <AlertCircle className="w-3.5 h-3.5 text-orange-400" />;
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case "CRITICAL":
        return "bg-rose-500/20 text-rose-400 border border-rose-500/40";
      case "HIGH":
        return "bg-orange-500/20 text-orange-400 border border-orange-500/40";
      case "MEDIUM":
        return "bg-amber-500/20 text-amber-400 border border-amber-500/40";
      case "LOW":
        return "bg-orange-500/15 text-orange-400 border border-orange-500/30";
      default:
        return "bg-polar-800 text-slate-400 border border-polar-700";
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-polar-750 bg-polar-900/50 p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 rounded-lg bg-polar-800/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="rounded-xl border border-polar-750 bg-polar-900/40 p-12 text-center shadow-titanium">
        <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-300 font-mono">No Operational Incidents Logged</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          No active or historical incidents recorded for the selected station and filters.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-polar-750 bg-polar-900/90 overflow-hidden shadow-titanium">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300 min-w-[700px]">
          <thead className="bg-polar-950/90 text-[10px] text-slate-400 uppercase tracking-wider border-b border-polar-750 font-mono">
            <tr>
              <th className="py-3 px-4">Incident #</th>
              <th className="py-3 px-3">Severity</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-4">Title & Description</th>
              <th className="py-3 px-3">Station</th>
              <th className="py-3 px-3">Category / Impact</th>
              <th className="py-3 px-3">Assignee</th>
              <th className="py-3 px-3">Alerts</th>
              <th className="py-3 px-3">Started</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {incidents.map((incident) => {
              const sev = SEVERITY_CONFIG[incident.severity] || SEVERITY_CONFIG.INFO;
              const statusCfg = INCIDENT_STATUS_CONFIG[incident.status] || INCIDENT_STATUS_CONFIG.OPEN;
              const alertsCount = incident._count?.alerts ?? incident.alerts?.length ?? 0;

              return (
                <tr
                  key={incident.id}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  onClick={() => onSelectIncident(incident)}
                >
                  {/* Incident # */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-mono text-xs font-bold text-purple-400 bg-purple-950/50 px-2 py-0.5 rounded border border-purple-800/50">
                      {incident.incidentNumber}
                    </span>
                  </td>

                  {/* Severity */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${sev.badge}`}
                    >
                      {getSeverityIcon(incident.severity)}
                      {sev.label}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${statusCfg.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                      {statusCfg.label}
                    </span>
                  </td>

                  {/* Title & Description */}
                  <td className="py-3 px-4 min-w-[220px]">
                    <div className="font-semibold text-slate-200 group-hover:text-purple-300 transition-colors">
                      {incident.title}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-sm mt-0.5">
                      {incident.description}
                    </div>
                  </td>

                  {/* Station */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono font-medium text-slate-300 border border-slate-700">
                      {incident.station?.code || incident.stationId}
                    </span>
                  </td>

                  {/* Category & Impact */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-medium text-slate-300">{incident.category}</div>
                    <div className="mt-0.5">
                      <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-semibold ${getImpactBadge(incident.impact)}`}>
                        {incident.impact} IMPACT
                      </span>
                    </div>
                  </td>

                  {/* Assignee */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {incident.assignedUser ? (
                      <div className="flex items-center gap-1 text-slate-300">
                        <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="font-medium">{incident.assignedUser.name}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">Unassigned</span>
                    )}
                  </td>

                  {/* Linked Alerts Count */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-slate-300 font-mono text-[11px]">
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      <span>{alertsCount}</span>
                    </div>
                  </td>

                  {/* Started Time */}
                  <td className="py-3 px-3 whitespace-nowrap text-[11px] text-slate-400 font-mono">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(incident.startedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(incident.startedAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric"
                      })}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onSelectIncident(incident)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors border border-slate-700"
                    >
                      <Eye className="w-3.5 h-3.5 text-purple-400" />
                      <span>Manage</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div>
          Showing{" "}
          <span className="font-semibold text-slate-200">
            {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-slate-200">
            {Math.min(pagination.page * pagination.limit, pagination.total)}
          </span>{" "}
          of <span className="font-semibold text-slate-200">{pagination.total}</span> incidents
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="p-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-mono text-[11px] text-slate-300">
            Page {pagination.page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= totalPages}
            className="p-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
