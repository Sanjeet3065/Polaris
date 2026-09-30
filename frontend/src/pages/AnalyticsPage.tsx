import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { analyticsService, AnalyticsFilterQuery } from "../services/analyticsService";
import { useStation } from "../context/StationContext";
import { TimeRangeOption } from "../types/analytics.types";
import { AnalyticsFilters } from "../components/analytics/AnalyticsFilters";
import { AnalyticsKpiGrid } from "../components/analytics/AnalyticsKpiGrid";
import { ExecutiveSummaryCard } from "../components/analytics/ExecutiveSummaryCard";
import { EnergyAnalyticsSection } from "../components/analytics/EnergyAnalyticsSection";
import { EnvironmentAnalyticsSection } from "../components/analytics/EnvironmentAnalyticsSection";
import { EquipmentAnalyticsSection } from "../components/analytics/EquipmentAnalyticsSection";
import { MaintenanceAnalyticsSection } from "../components/analytics/MaintenanceAnalyticsSection";
import { AlertsIncidentsAnalyticsSection } from "../components/analytics/AlertsIncidentsAnalyticsSection";
import { LogisticsAnalyticsSection } from "../components/analytics/LogisticsAnalyticsSection";
import { StationComparisonSection } from "../components/analytics/StationComparisonSection";
import {
  BarChart3,
  Zap,
  Wind,
  Settings2,
  Wrench,
  Bell,
  Boxes,
  Scale
} from "lucide-react";

type ActiveTab =
  | "overview"
  | "energy"
  | "environment"
  | "equipment"
  | "maintenance"
  | "alerts_incidents"
  | "logistics"
  | "comparison";

export const AnalyticsPage: React.FC = () => {
  const { selectedStation, setSelectedStation } = useStation();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [timeRange, setTimeRange] = useState<TimeRangeOption>("24h");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const filterParams: AnalyticsFilterQuery = {
    stationId: selectedStation,
    timeRange,
    startDate: timeRange === "custom" ? startDate : undefined,
    endDate: timeRange === "custom" ? endDate : undefined
  };

  // Queries
  const {
    data: overviewData,
    isLoading: isOverviewLoading,
    refetch: refetchOverview
  } = useQuery({
    queryKey: ["analytics-overview", filterParams],
    queryFn: () => analyticsService.getOverview(filterParams),
    refetchInterval: 30000
  });

  const {
    data: energyData,
    isLoading: isEnergyLoading,
    refetch: refetchEnergy
  } = useQuery({
    queryKey: ["analytics-energy", filterParams],
    queryFn: () => analyticsService.getEnergy(filterParams),
    enabled: activeTab === "energy",
    refetchInterval: 30000
  });

  const {
    data: envData,
    isLoading: isEnvLoading,
    refetch: refetchEnv
  } = useQuery({
    queryKey: ["analytics-environment", filterParams],
    queryFn: () => analyticsService.getEnvironment(filterParams),
    enabled: activeTab === "environment",
    refetchInterval: 30000
  });

  const {
    data: eqData,
    isLoading: isEqLoading,
    refetch: refetchEq
  } = useQuery({
    queryKey: ["analytics-equipment", filterParams],
    queryFn: () => analyticsService.getEquipment(filterParams),
    enabled: activeTab === "equipment",
    refetchInterval: 30000
  });

  const {
    data: maintData,
    isLoading: isMaintLoading,
    refetch: refetchMaint
  } = useQuery({
    queryKey: ["analytics-maintenance", filterParams],
    queryFn: () => analyticsService.getMaintenance(filterParams),
    enabled: activeTab === "maintenance",
    refetchInterval: 30000
  });

  const {
    data: alertData,
    isLoading: isAlertLoading,
    refetch: refetchAlert
  } = useQuery({
    queryKey: ["analytics-alerts", filterParams],
    queryFn: () => analyticsService.getAlerts(filterParams),
    enabled: activeTab === "alerts_incidents",
    refetchInterval: 30000
  });

  const {
    data: incidentData,
    isLoading: isIncidentLoading,
    refetch: refetchIncident
  } = useQuery({
    queryKey: ["analytics-incidents", filterParams],
    queryFn: () => analyticsService.getIncidents(filterParams),
    enabled: activeTab === "alerts_incidents",
    refetchInterval: 30000
  });

  const {
    data: logData,
    isLoading: isLogLoading,
    refetch: refetchLog
  } = useQuery({
    queryKey: ["analytics-logistics", filterParams],
    queryFn: () => analyticsService.getLogistics(filterParams),
    enabled: activeTab === "logistics",
    refetchInterval: 30000
  });

  const {
    data: compData,
    isLoading: isCompLoading,
    refetch: refetchComp
  } = useQuery({
    queryKey: ["analytics-comparison", filterParams],
    queryFn: () => analyticsService.getStationComparison(filterParams),
    enabled: activeTab === "comparison",
    refetchInterval: 30000
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["analytics-overview"] });
    if (activeTab === "overview") refetchOverview();
    if (activeTab === "energy") refetchEnergy();
    if (activeTab === "environment") refetchEnv();
    if (activeTab === "equipment") refetchEq();
    if (activeTab === "maintenance") refetchMaint();
    if (activeTab === "alerts_incidents") {
      refetchAlert();
      refetchIncident();
    }
    if (activeTab === "logistics") refetchLog();
    if (activeTab === "comparison") refetchComp();
  };

  const tabs: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Executive Overview", icon: BarChart3 },
    { id: "energy", label: "Energy & Microgrid", icon: Zap },
    { id: "environment", label: "Atmospheric & Climate", icon: Wind },
    { id: "equipment", label: "Machinery Fleet", icon: Settings2 },
    { id: "maintenance", label: "AI Predictive Maintenance", icon: Wrench },
    { id: "alerts_incidents", label: "Alarms & Incidents", icon: Bell },
    { id: "logistics", label: "Logistics & Supply", icon: Boxes },
    { id: "comparison", label: "Station Comparison", icon: Scale }
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-polar-750 gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5 font-mono">
            <BarChart3 className="w-5 h-5 text-orange-400" />
            <span>ANALYTICS & OPERATIONAL INTELLIGENCE</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Historical operational performance, microgrid telemetry, and station insights
          </p>
        </div>
      </div>

      {/* Global Filter Bar */}
      <AnalyticsFilters
        stationId={selectedStation}
        onStationChange={(st) => setSelectedStation(st as any)}
        timeRange={timeRange}
        onTimeRangeChange={(tr) => setTimeRange(tr)}
        startDate={startDate}
        endDate={endDate}
        onCustomDateChange={(start, end) => {
          setStartDate(start);
          setEndDate(end);
        }}
        onRefresh={handleRefresh}
        isLoading={isOverviewLoading || isEnergyLoading || isEnvLoading}
      />

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-polar-750 flex overflow-x-auto gap-2 pb-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
                isActive
                  ? "border-orange-500 text-orange-400 bg-orange-500/10 font-mono"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "overview" && (
          <div className="space-y-6">
            {overviewData && (
              <>
                <ExecutiveSummaryCard
                  summary={overviewData.summary}
                  dataQuality={overviewData.dataQuality}
                />
                <AnalyticsKpiGrid
                  kpiCards={overviewData.kpiCards}
                  isLoading={isOverviewLoading}
                />
              </>
            )}
          </div>
        )}

        {activeTab === "energy" && energyData && (
          <EnergyAnalyticsSection data={energyData} isLoading={isEnergyLoading} />
        )}

        {activeTab === "environment" && envData && (
          <EnvironmentAnalyticsSection data={envData} isLoading={isEnvLoading} />
        )}

        {activeTab === "equipment" && eqData && (
          <EquipmentAnalyticsSection data={eqData} isLoading={isEqLoading} />
        )}

        {activeTab === "maintenance" && maintData && (
          <MaintenanceAnalyticsSection data={maintData} isLoading={isMaintLoading} />
        )}

        {activeTab === "alerts_incidents" && alertData && incidentData && (
          <AlertsIncidentsAnalyticsSection
            alertData={alertData}
            incidentData={incidentData}
            isLoading={isAlertLoading || isIncidentLoading}
          />
        )}

        {activeTab === "logistics" && logData && (
          <LogisticsAnalyticsSection data={logData} isLoading={isLogLoading} />
        )}

        {activeTab === "comparison" && compData && (
          <StationComparisonSection data={compData} isLoading={isCompLoading} />
        )}
      </div>
    </div>
  );
};
