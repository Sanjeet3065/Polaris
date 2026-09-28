import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  Monitor,
  Loader2,
  X
} from "lucide-react";
import { authService } from "../../services/authService";
import { AuthEvent } from "../../types/auth";
import { cn } from "../../lib/utils";

export const AuthAuditPage: React.FC = () => {
  const [events, setEvents] = useState<AuthEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authService.getAuthEvents({ limit: 100 });
      setEvents(data.events);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load audit logs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter((ev) => {
    const matchesType = eventTypeFilter === "ALL" || ev.eventType === eventTypeFilter;
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "SUCCESS" ? ev.success : !ev.success);
    const matchesSearch =
      (ev.user?.name && ev.user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ev.user?.email && ev.user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ev.ipAddress && ev.ipAddress.includes(searchQuery)) ||
      ev.eventType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  // KPI calculations
  const totalEvents = events.length;
  const loginSuccessCount = events.filter((e) => e.eventType === "LOGIN_SUCCESS").length;
  const loginFailedCount = events.filter((e) => e.eventType === "LOGIN_FAILED").length;
  const securityChangesCount = events.filter((e) =>
    ["PASSWORD_CHANGED", "ROLE_CHANGED", "STATUS_CHANGED"].includes(e.eventType)
  ).length;

  const getEventBadge = (eventType: string, success: boolean) => {
    if (!success) {
      return "bg-red-950/80 text-red-300 border-red-700/60";
    }

    switch (eventType) {
      case "LOGIN_SUCCESS":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-700/60";
      case "LOGOUT":
        return "bg-slate-900 text-slate-300 border-slate-700";
      case "REFRESH":
        return "bg-sky-950/80 text-sky-300 border-sky-700/60";
      case "PASSWORD_CHANGED":
        return "bg-amber-950/80 text-amber-300 border-amber-700/60";
      case "ROLE_CHANGED":
        return "bg-indigo-950/80 text-indigo-300 border-indigo-700/60";
      case "STATUS_CHANGED":
        return "bg-purple-950/80 text-purple-300 border-purple-700/60";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-100 tracking-wide">
                Security & Authentication Audit Trail
              </h1>
              <p className="text-xs text-slate-400">
                Immutable event stream of polar mission logins, token rotations, and access modifications.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchEvents}
          disabled={isLoading}
          className="flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          <span>Refresh Audit Stream</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Audit Records
          </div>
          <div className="mt-1 text-2xl font-black text-slate-100 font-mono">{totalEvents}</div>
          <div className="mt-1 text-[10px] text-slate-500">Last 100 system events</div>
        </div>

        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4">
          <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
            Successful Logins
          </div>
          <div className="mt-1 text-2xl font-black text-emerald-300 font-mono">
            {loginSuccessCount}
          </div>
          <div className="mt-1 text-[10px] text-emerald-500/80">Authorized polar operators</div>
        </div>

        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4">
          <div className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">
            Failed Logins
          </div>
          <div className="mt-1 text-2xl font-black text-red-300 font-mono">
            {loginFailedCount}
          </div>
          <div className="mt-1 text-[10px] text-red-500/80">Rejected credentials</div>
        </div>

        <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4">
          <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
            Security Mutations
          </div>
          <div className="mt-1 text-2xl font-black text-amber-300 font-mono">
            {securityChangesCount}
          </div>
          <div className="mt-1 text-[10px] text-amber-500/80">Roles, passwords, statuses</div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by user, email, IP, or event type..."
            className="w-full rounded-lg border border-slate-700 bg-slate-950/80 pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Event:</span>
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950/80 px-2.5 py-1.5 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
            >
              <option value="ALL">All Event Types</option>
              <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
              <option value="LOGIN_FAILED">LOGIN_FAILED</option>
              <option value="LOGOUT">LOGOUT</option>
              <option value="REFRESH">REFRESH</option>
              <option value="PASSWORD_CHANGED">PASSWORD_CHANGED</option>
              <option value="ROLE_CHANGED">ROLE_CHANGED</option>
              <option value="STATUS_CHANGED">STATUS_CHANGED</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Outcome:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950/80 px-2.5 py-1.5 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
            >
              <option value="ALL">All Outcomes</option>
              <option value="SUCCESS">Success Only</option>
              <option value="FAILURE">Failures Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Stream Table */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-bold tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Security Event</th>
                <th className="py-3 px-4">Subject Personnel</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Origin IP</th>
                <th className="py-3 px-4">Client Agent</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-sky-400 mb-2" />
                    <span>Loading security audit records...</span>
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <ShieldCheck className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                    <span>No security events found matching the filter criteria.</span>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-800/30 transition-colors font-mono">
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span>{new Date(ev.createdAt).toISOString().replace("T", " ").substring(0, 19)}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border font-sans",
                          getEventBadge(ev.eventType, ev.success)
                        )}
                      >
                        {ev.eventType}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-sans">
                      {ev.user ? (
                        <div>
                          <div className="font-semibold text-slate-200">{ev.user.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{ev.user.email}</div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Unauthenticated User</span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-sans">
                      {ev.success ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>SUCCESS</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-400 font-bold text-[11px]">
                          <XCircle className="h-3.5 w-3.5" />
                          <span>FAILED</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-[11px] text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3 text-slate-500" />
                        <span>{ev.ipAddress || "::1"}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-[10px] text-slate-400 max-w-[180px] truncate" title={ev.userAgent || ""}>
                      <div className="flex items-center gap-1">
                        <Monitor className="h-3 w-3 text-slate-500 shrink-0" />
                        <span className="truncate">{ev.userAgent || "Unknown client"}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-[10px] text-slate-400 font-mono max-w-[200px] truncate">
                      {ev.metadata ? JSON.stringify(ev.metadata) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
