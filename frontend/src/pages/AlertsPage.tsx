import React, { useState, useEffect, useCallback } from "react";
import { useStation } from "../context/StationContext";
import { useAuth } from "../context/AuthContext";
import {
  Alert,
  AlertFilterState,
  AlertOverviewKpi,
  Incident,
  IncidentFilterState,
  IncidentOverviewKpi
} from "../types/alert.types";
import {
  AlertSeverity,
  IncidentStatus
} from "../utils/alertRules";
import {
  alertService,
  CreateIncidentData,
  EscalateAlertData
} from "../services/alertService";
import {
  AlertOverviewCards,
  IncidentOverviewCards,
  AlertFilters,
  AlertsTable,
  AlertDetailDrawer,
  IncidentFilters,
  IncidentsTable,
  IncidentDetailDrawer,
  CreateIncidentModal,
  EscalateAlertModal,
  AcknowledgeModal,
  ResolveModal,
  SuppressModal
} from "../components/alerts";
import {
  ShieldAlert,
  Radio,
  Plus,
  RefreshCw,
  Layers,
  Flame
} from "lucide-react";
import { polarisWebSocketClient } from "../services/websocket/websocketClient";

interface AlertsPageProps {
  initialTab?: "alerts" | "incidents";
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ initialTab = "alerts" }) => {
  const { selectedStation, setSelectedStation, realtimeStatus } = useStation();
  const { user } = useAuth();

  // Tab State: "alerts" vs "incidents"
  const [activeTab, setActiveTab] = useState<"alerts" | "incidents">(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Alerts State
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsOverview, setAlertsOverview] = useState<AlertOverviewKpi | null>(null);
  const [isAlertsLoading, setIsAlertsLoading] = useState(true);
  const [alertFilters, setAlertFilters] = useState<AlertFilterState>({
    stationId: selectedStation === "ALL" ? undefined : selectedStation
  });
  const [alertPagination, setAlertPagination] = useState({ page: 1, limit: 15, total: 0 });
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState(false);

  // Incidents State
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentsOverview, setIncidentsOverview] = useState<IncidentOverviewKpi | null>(null);
  const [isIncidentsLoading, setIsIncidentsLoading] = useState(true);
  const [incidentFilters, setIncidentFilters] = useState<IncidentFilterState>({
    stationId: selectedStation === "ALL" ? undefined : selectedStation
  });
  const [incidentPagination, setIncidentPagination] = useState({ page: 1, limit: 15, total: 0 });
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isIncidentDrawerOpen, setIsIncidentDrawerOpen] = useState(false);

  // Modal States
  const [isCreateIncidentOpen, setIsCreateIncidentOpen] = useState(false);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [escalateTargetAlert, setEscalateTargetAlert] = useState<Alert | null>(null);
  const [acknowledgeTargetAlert, setAcknowledgeTargetAlert] = useState<Alert | null>(null);
  const [resolveTargetAlert, setResolveTargetAlert] = useState<Alert | null>(null);
  const [suppressTargetAlert, setSuppressTargetAlert] = useState<Alert | null>(null);

  // Permissions Check
  const canMutate = user?.role === "ADMIN" || user?.role === "OPERATOR";

  // Sync station filter when StationContext changes
  useEffect(() => {
    const stationParam = selectedStation === "ALL" ? undefined : selectedStation;
    setAlertFilters((prev) => ({ ...prev, stationId: stationParam }));
    setIncidentFilters((prev) => ({ ...prev, stationId: stationParam }));
    setAlertPagination((prev) => ({ ...prev, page: 1 }));
    setIncidentPagination((prev) => ({ ...prev, page: 1 }));
  }, [selectedStation]);

  // Load Alerts
  const fetchAlerts = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setIsAlertsLoading(true);
      }
      const [listRes, overviewRes] = await Promise.all([
        alertService.getAlerts({
          page: alertPagination.page,
          limit: alertPagination.limit,
          stationId: alertFilters.stationId,
          severity: alertFilters.severity,
          status: alertFilters.status,
          sourceType: alertFilters.sourceType,
          search: alertFilters.search
        }),
        alertService.getAlertsOverview(alertFilters.stationId)
      ]);
      setAlerts(listRes.items);
      setAlertPagination(listRes.pagination);
      setAlertsOverview(overviewRes);
    } catch (err) {
      console.error("Failed to load alerts:", err);
    } finally {
      if (!silent) {
        setIsAlertsLoading(false);
      }
    }
  }, [
    alertPagination.page,
    alertPagination.limit,
    alertFilters.stationId,
    alertFilters.severity,
    alertFilters.status,
    alertFilters.sourceType,
    alertFilters.search
  ]);

  // Load Incidents
  const fetchIncidents = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setIsIncidentsLoading(true);
      }
      const [listRes, overviewRes] = await Promise.all([
        alertService.getIncidents({
          page: incidentPagination.page,
          limit: incidentPagination.limit,
          stationId: incidentFilters.stationId,
          status: incidentFilters.status,
          severity: incidentFilters.severity,
          category: incidentFilters.category,
          search: incidentFilters.search
        }),
        alertService.getIncidentsOverview(incidentFilters.stationId)
      ]);
      setIncidents(listRes.items);
      setIncidentPagination(listRes.pagination);
      setIncidentsOverview(overviewRes);
    } catch (err) {
      console.error("Failed to load incidents:", err);
    } finally {
      if (!silent) {
        setIsIncidentsLoading(false);
      }
    }
  }, [
    incidentPagination.page,
    incidentPagination.limit,
    incidentFilters.stationId,
    incidentFilters.status,
    incidentFilters.severity,
    incidentFilters.category,
    incidentFilters.search
  ]);

  // Initial and reactive fetch
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Real-Time WebSocket Listener (Silent update to prevent UI flickering)
  useEffect(() => {
    const handleWsEvent = () => {
      fetchAlerts(true);
      fetchIncidents(true);
    };

    const unsubCreated = polarisWebSocketClient.on("alert:created", handleWsEvent);
    const unsubUpdated = polarisWebSocketClient.on("alert:updated", handleWsEvent);
    const unsubAck = polarisWebSocketClient.on("alert:acknowledged", handleWsEvent);
    const unsubEsc = polarisWebSocketClient.on("alert:escalated", handleWsEvent);
    const unsubRes = polarisWebSocketClient.on("alert:resolved", handleWsEvent);
    const unsubIncCreated = polarisWebSocketClient.on("incident:created", handleWsEvent);
    const unsubIncStatus = polarisWebSocketClient.on("incident:status_changed", handleWsEvent);

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubAck();
      unsubEsc();
      unsubRes();
      unsubIncCreated();
      unsubIncStatus();
    };
  }, [fetchAlerts, fetchIncidents]);

  // Handlers for Alert Actions
  const handleAcknowledgeAlert = async (alertId: string, note?: string) => {
    await alertService.acknowledgeAlert(alertId, note);
    await fetchAlerts();
    if (selectedAlert?.id === alertId) {
      const refreshed = await alertService.getAlertById(alertId);
      setSelectedAlert(refreshed);
    }
  };

  const handleResolveAlert = async (alertId: string, note?: string) => {
    await alertService.resolveAlert(alertId, note);
    await fetchAlerts();
    if (selectedAlert?.id === alertId) {
      const refreshed = await alertService.getAlertById(alertId);
      setSelectedAlert(refreshed);
    }
  };

  const handleSuppressAlert = async (alertId: string, reason: string) => {
    await alertService.suppressAlert(alertId, reason);
    await fetchAlerts();
    if (selectedAlert?.id === alertId) {
      const refreshed = await alertService.getAlertById(alertId);
      setSelectedAlert(refreshed);
    }
  };

  const handleEscalateAlert = async (alertId: string, data: EscalateAlertData) => {
    const res = await alertService.escalateAlert(alertId, data);
    await fetchAlerts();
    await fetchIncidents();
    if (selectedAlert?.id === alertId) {
      setSelectedAlert(res.alert);
    }
  };

  // Handlers for Incident Actions
  const handleCreateIncident = async (data: CreateIncidentData) => {
    await alertService.createIncident(data);
    await fetchIncidents();
    setActiveTab("incidents");
  };

  const handleIncidentStatusChange = async (nextStatus: IncidentStatus, resolutionSummary?: string) => {
    if (!selectedIncident) return;
    const updated = await alertService.updateIncidentStatus(
      selectedIncident.id,
      nextStatus,
      undefined,
      resolutionSummary
    );
    setSelectedIncident(updated);
    await fetchIncidents();
  };

  const handleAddIncidentNote = async (content: string) => {
    if (!selectedIncident) return;
    await alertService.addIncidentNote(selectedIncident.id, content);
    const refreshed = await alertService.getIncidentById(selectedIncident.id);
    setSelectedIncident(refreshed);
  };

  const handleUnlinkAlertFromIncident = async (alertId: string) => {
    if (!selectedIncident) return;
    await alertService.unlinkAlert(selectedIncident.id, alertId);
    const refreshed = await alertService.getIncidentById(selectedIncident.id);
    setSelectedIncident(refreshed);
    await fetchAlerts();
  };

  const navigateToIncidentFromAlert = async (incidentId: string) => {
    setIsAlertDrawerOpen(false);
    setActiveTab("incidents");
    try {
      const inc = await alertService.getIncidentById(incidentId);
      setSelectedIncident(inc);
      setIsIncidentDrawerOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header & Command Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-polar-750 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-polar-900 border border-polar-750 shadow-titanium">
              <ShieldAlert className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono uppercase">
                Alert & Incident Command
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
                Real-time deterministic anomaly triage, deduplication matrix, and operational incident dispatch.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Real-time Connection Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-polar-900 border border-polar-750 text-xs shadow-titanium">
            <Radio
              className={`w-3.5 h-3.5 ${
                realtimeStatus === "LIVE"
                  ? "text-emerald-400 animate-pulse"
                  : realtimeStatus === "RECONNECTING"
                  ? "text-amber-400 animate-spin"
                  : "text-rose-400"
              }`}
            />
            <span className="font-mono text-slate-300 font-semibold">{realtimeStatus}</span>
          </div>

          {/* Station Selector Toggle */}
          <div className="flex items-center bg-polar-900 p-1 rounded-xl border border-polar-750 text-xs font-mono font-medium shadow-titanium">
            <button
              onClick={() => setSelectedStation("ALL")}
              className={`px-3 py-1 rounded-lg transition-all ${
                selectedStation === "ALL"
                  ? "bg-orange-500 text-white font-bold shadow-md shadow-orange-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => setSelectedStation("MAITRI")}
              className={`px-3 py-1 rounded-lg transition-all ${
                selectedStation === "MAITRI"
                  ? "bg-amber-500 text-polar-950 font-bold shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              MAITRI
            </button>
            <button
              onClick={() => setSelectedStation("BHARATI")}
              className={`px-3 py-1 rounded-lg transition-all ${
                selectedStation === "BHARATI"
                  ? "bg-orange-500 text-white font-bold shadow-md shadow-orange-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              BHARATI
            </button>
          </div>

          {/* Refresh Action */}
          <button
            onClick={() => {
              fetchAlerts();
              fetchIncidents();
            }}
            title="Refresh Command Feeds"
            className="p-2 rounded-xl bg-polar-900 border border-polar-750 text-slate-400 hover:text-orange-400 hover:border-orange-500/40 transition-colors shadow-titanium"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Log Incident Action */}
          {canMutate && (
            <button
              onClick={() => setIsCreateIncidentOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-titanium transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Log Incident</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Controls */}
      <div className="flex items-center gap-2 border-b border-polar-750 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("alerts")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "alerts"
              ? "border-orange-500 text-orange-400 bg-polar-900/60 font-mono"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-polar-900/30"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Operational Alerts</span>
          {alertsOverview && alertsOverview.activeAlerts > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
              {alertsOverview.activeAlerts}
            </span>
          )}
          {alertsOverview && alertsOverview.criticalAlerts > 0 && (
            <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/20 text-rose-300 font-mono border border-rose-500/40">
              <Flame className="w-3 h-3 text-rose-400" />
              {alertsOverview.criticalAlerts}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("incidents")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "incidents"
              ? "border-amber-500 text-amber-400 bg-polar-900/60 font-mono"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-polar-900/30"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Incident Command Center</span>
          {incidentsOverview && incidentsOverview.openIncidents > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
              {incidentsOverview.openIncidents}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Operational Alerts */}
      {activeTab === "alerts" && (
        <div className="space-y-5">
          <AlertOverviewCards
            overview={alertsOverview}
            isLoading={isAlertsLoading}
            selectedSeverity={alertFilters.severity}
            onSelectSeverity={(sev) => {
              setAlertFilters((prev) => ({ ...prev, severity: sev as AlertSeverity }));
              setAlertPagination((prev) => ({ ...prev, page: 1 }));
            }}
          />

          <AlertFilters
            filters={alertFilters}
            onChange={(newFilters) => {
              setAlertFilters(newFilters);
              setAlertPagination((prev) => ({ ...prev, page: 1 }));
            }}
            onReset={() => {
              setAlertFilters({ stationId: selectedStation === "ALL" ? undefined : selectedStation });
              setAlertPagination((prev) => ({ ...prev, page: 1 }));
            }}
            stationLocked={false}
          />

          <AlertsTable
            alerts={alerts}
            isLoading={isAlertsLoading}
            onSelectAlert={(alert) => {
              setSelectedAlert(alert);
              setIsAlertDrawerOpen(true);
            }}
            onAcknowledge={(alert) => setAcknowledgeTargetAlert(alert)}
            onEscalate={(alert) => {
              setEscalateTargetAlert(alert);
              setIsEscalateModalOpen(true);
            }}
            onResolve={(alert) => setResolveTargetAlert(alert)}
            pagination={alertPagination}
            onPageChange={(page) => setAlertPagination((prev) => ({ ...prev, page }))}
            canMutate={canMutate}
          />
        </div>
      )}

      {/* Tab 2: Incident Command Center */}
      {activeTab === "incidents" && (
        <div className="space-y-5">
          <IncidentOverviewCards
            overview={incidentsOverview}
            isLoading={isIncidentsLoading}
            selectedStatus={incidentFilters.status}
            onSelectStatus={(st) => {
              setIncidentFilters((prev) => ({ ...prev, status: st }));
              setIncidentPagination((prev) => ({ ...prev, page: 1 }));
            }}
          />

          <IncidentFilters
            filters={incidentFilters}
            onChange={(newFilters) => {
              setIncidentFilters(newFilters);
              setIncidentPagination((prev) => ({ ...prev, page: 1 }));
            }}
            onReset={() => {
              setIncidentFilters({ stationId: selectedStation === "ALL" ? undefined : selectedStation });
              setIncidentPagination((prev) => ({ ...prev, page: 1 }));
            }}
            stationLocked={false}
          />

          <IncidentsTable
            incidents={incidents}
            isLoading={isIncidentsLoading}
            onSelectIncident={(incident) => {
              setSelectedIncident(incident);
              setIsIncidentDrawerOpen(true);
            }}
            pagination={incidentPagination}
            onPageChange={(page) => setIncidentPagination((prev) => ({ ...prev, page }))}
          />
        </div>
      )}

      {/* Drawers */}
      <AlertDetailDrawer
        alert={selectedAlert}
        isOpen={isAlertDrawerOpen}
        onClose={() => setIsAlertDrawerOpen(false)}
        onAcknowledge={(alert) => setAcknowledgeTargetAlert(alert)}
        onEscalate={(alert) => {
          setEscalateTargetAlert(alert);
          setIsEscalateModalOpen(true);
        }}
        onResolve={(alert) => setResolveTargetAlert(alert)}
        onSuppress={(alert) => setSuppressTargetAlert(alert)}
        onNavigateToIncident={navigateToIncidentFromAlert}
        canMutate={canMutate}
      />

      <IncidentDetailDrawer
        incident={selectedIncident}
        isOpen={isIncidentDrawerOpen}
        onClose={() => setIsIncidentDrawerOpen(false)}
        onStatusChange={handleIncidentStatusChange}
        onAddNote={handleAddIncidentNote}
        onUnlinkAlert={handleUnlinkAlertFromIncident}
        canMutate={canMutate}
      />

      {/* Modals */}
      <CreateIncidentModal
        isOpen={isCreateIncidentOpen}
        onClose={() => setIsCreateIncidentOpen(false)}
        onSubmit={handleCreateIncident}
        defaultStation={selectedStation}
      />

      <EscalateAlertModal
        alert={escalateTargetAlert}
        isOpen={isEscalateModalOpen}
        onClose={() => {
          setIsEscalateModalOpen(false);
          setEscalateTargetAlert(null);
        }}
        onSubmit={handleEscalateAlert}
      />

      <AcknowledgeModal
        alert={acknowledgeTargetAlert}
        isOpen={!!acknowledgeTargetAlert}
        onClose={() => setAcknowledgeTargetAlert(null)}
        onConfirm={handleAcknowledgeAlert}
      />

      <ResolveModal
        alert={resolveTargetAlert}
        isOpen={!!resolveTargetAlert}
        onClose={() => setResolveTargetAlert(null)}
        onConfirm={handleResolveAlert}
      />

      <SuppressModal
        alert={suppressTargetAlert}
        isOpen={!!suppressTargetAlert}
        onClose={() => setSuppressTargetAlert(null)}
        onConfirm={handleSuppressAlert}
      />
    </div>
  );
};
