import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { maintenanceService, CreateWorkOrderData } from "../services/maintenanceService";
import {
  DetailedPredictionView,
  HealthOverviewStats,
  MaintenancePrediction,
  PredictionFilterState
} from "../types/maintenance.types";
import { MaintenanceOverviewCards } from "../components/maintenance/MaintenanceOverviewCards";
import { MaintenanceFilters } from "../components/maintenance/MaintenanceFilters";
import { EquipmentRiskTable } from "../components/maintenance/EquipmentRiskTable";
import { PredictionDetailDrawer } from "../components/maintenance/PredictionDetailDrawer";
import { CreateWorkOrderModal } from "../components/maintenance/CreateWorkOrderModal";
import { useStation } from "../context/StationContext";
import { Wrench, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

export const MaintenancePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { selectedStation } = useStation();

  // Filters State
  const [filters, setFilters] = useState<PredictionFilterState>({
    stationId: selectedStation === "ALL" ? "ALL" : selectedStation,
    riskBand: "ALL",
    search: "",
    page: 1,
    limit: 50
  });

  // Sync with global station context
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      stationId: selectedStation === "ALL" ? "ALL" : selectedStation,
      page: 1
    }));
  }, [selectedStation]);

  // Selected Equipment Drawer State
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [isRefreshingItem, setIsRefreshingItem] = useState(false);

  // Work Order Modal State
  const [workOrderTarget, setWorkOrderTarget] = useState<{ id: string; code: string } | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Query Health Overview KPIs
  const {
    data: stats,
    isLoading: isStatsLoading,
    refetch: refetchStats
  } = useQuery<HealthOverviewStats>({
    queryKey: ["maintenance-health-overview", filters.stationId],
    queryFn: () => maintenanceService.getHealthOverview(filters.stationId),
    refetchInterval: 30000 // 30s background poll
  });

  // 2. Query Predictions List
  const {
    data: predictionsData,
    isLoading: isPredictionsLoading,
    isFetching: isPredictionsFetching,
    refetch: refetchPredictions
  } = useQuery<{ items: MaintenancePrediction[]; meta: any }>({
    queryKey: ["maintenance-predictions", filters],
    queryFn: () => maintenanceService.getPredictions(filters),
    refetchInterval: 30000
  });

  // 3. Query Selected Equipment Detail (for Drawer)
  const {
    data: selectedDetail,
    isLoading: _isDetailLoading,
    refetch: refetchDetail
  } = useQuery<DetailedPredictionView>({
    queryKey: ["maintenance-prediction-detail", selectedEquipmentId],
    queryFn: () => maintenanceService.getPredictionByEquipmentId(selectedEquipmentId!),
    enabled: Boolean(selectedEquipmentId)
  });

  // Refresh All Action
  const handleRefreshAll = async () => {
    await Promise.all([refetchStats(), refetchPredictions()]);
    showToast("Predictive maintenance queue synchronized.", "success");
  };

  // Refresh Single Prediction Action
  const handleRefreshSingle = async (equipmentId: string) => {
    try {
      setIsRefreshingItem(true);
      await maintenanceService.refreshPrediction(equipmentId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["maintenance-predictions"] }),
        queryClient.invalidateQueries({ queryKey: ["maintenance-health-overview"] }),
        refetchDetail()
      ]);
      showToast("Asset predictive evaluation recalculated successfully.", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to recalculate prediction", "error");
    } finally {
      setIsRefreshingItem(false);
    }
  };

  // Create Work Order Action
  const handleCreateWorkOrder = async (equipmentId: string, data: CreateWorkOrderData) => {
    await maintenanceService.createWorkOrder(equipmentId, data);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["maintenance-predictions"] }),
      queryClient.invalidateQueries({ queryKey: ["maintenance-prediction-detail", equipmentId] })
    ]);
    showToast(`Work order "${data.title}" scheduled successfully.`, "success");
  };

  const handleFilterChange = (newFilters: Partial<PredictionFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-semibold shadow-xl backdrop-blur-md animate-fade-in ${
            toastMessage.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-300"
              : "bg-rose-950/90 border-rose-500/40 text-rose-300"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
              <Wrench className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Predictive Maintenance Center
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
                <Sparkles className="w-3 h-3" />
                AI-Assisted
              </span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
            Continuous failure risk detection, degradation trend estimation, and explainable maintenance advisory for Indian Antarctic Research Stations (Maitri & Bharati).
          </p>
        </div>

        {/* Station Badge Indicator */}
        <div className="text-right">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">Active Operational Filter</span>
          <span className="font-mono text-sm font-bold text-cyan-400">
            {filters.stationId === "ALL" ? "Pan-Antarctic Fleet" : `${filters.stationId} Station`}
          </span>
        </div>
      </div>

      {/* Top Level KPI Cards */}
      <MaintenanceOverviewCards stats={stats ?? null} isLoading={isStatsLoading} />

      {/* Interactive Operational Filters */}
      <MaintenanceFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onRefreshAll={handleRefreshAll}
        isRefreshing={isPredictionsFetching}
        telemetryStatus="LIVE"
      />

      {/* Main Operational Equipment Table */}
      <EquipmentRiskTable
        predictions={predictionsData?.items ?? []}
        isLoading={isPredictionsLoading}
        onSelectEquipment={(id) => setSelectedEquipmentId(id)}
        onOpenWorkOrderModal={(id, code) => setWorkOrderTarget({ id, code })}
      />

      {/* Detailed Diagnostic & Explainability Drawer */}
      <PredictionDetailDrawer
        detail={selectedDetail ?? null}
        isOpen={Boolean(selectedEquipmentId)}
        onClose={() => setSelectedEquipmentId(null)}
        onRefresh={handleRefreshSingle}
        isRefreshing={isRefreshingItem}
        onOpenWorkOrderModal={(id, code) => setWorkOrderTarget({ id, code })}
      />

      {/* Create Work Order Modal */}
      {workOrderTarget && (
        <CreateWorkOrderModal
          isOpen={Boolean(workOrderTarget)}
          equipmentId={workOrderTarget.id}
          equipmentCode={workOrderTarget.code}
          onClose={() => setWorkOrderTarget(null)}
          onSubmit={handleCreateWorkOrder}
        />
      )}
    </div>
  );
};
