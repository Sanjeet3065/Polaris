import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { OverviewPage } from "../pages/OverviewPage";
import { SettingsPage } from "../pages/SettingsPage";
import { NotFoundPage } from "../pages/NotFoundPage";

import { ArchitectureOverviewPage } from "../pages/ArchitectureOverviewPage";
import { DigitalTwinPage } from "../pages/DigitalTwinPage";
import { LoginPage } from "../pages/LoginPage";
import { UserManagementPage } from "../pages/admin/UserManagementPage";
import { AuthAuditPage } from "../pages/admin/AuthAuditPage";
import { EnergyPage } from "../pages/EnergyPage";
import { EnvironmentPage } from "../pages/EnvironmentPage";
import { LogisticsPage } from "../pages/LogisticsPage";
import { AlertsPage } from "../pages/AlertsPage";
import { MaintenancePage } from "../pages/MaintenancePage";
import { AnalyticsPage } from "../pages/AnalyticsPage";
import { ReportsPage } from "../pages/ReportsPage";
import { AssistantPage } from "../pages/AssistantPage";
import { EquipmentPage } from "../pages/EquipmentPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { useStation } from "../context/StationContext";


export const AppRoutes: React.FC = () => {
  const { selectedStation, setSelectedStation } = useStation();

  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Polar Operations Terminal */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          {/* Default route redirect to Overview */}
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<OverviewPage />} />

        {/* Phase 6 — Interactive 3D Digital Twin Subsystem */}
        <Route path="/digital-twin" element={<DigitalTwinPage />} />

        {/* Phase 7 — Energy & Microgrid Management */}
        <Route path="/energy" element={<EnergyPage />} />

        {/* Phase 7 — Environmental & Climate Telemetry */}
        <Route path="/environment" element={<EnvironmentPage />} />

        <Route path="/equipment" element={<EquipmentPage />} />


        <Route path="/logistics" element={<LogisticsPage />} />

        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/incidents" element={<AlertsPage initialTab="incidents" />} />

        <Route path="/maintenance" element={<MaintenancePage />} />

        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/reports" element={<ReportsPage />} />

        {/* Phase 12 — AI Operations Assistant */}
        <Route path="/assistant" element={<AssistantPage />} />

        {/* Phase 0 Architecture Overview Page Preserved */}
        <Route
          path="/architecture"
          element={
            <ArchitectureOverviewPage
              selectedStation={selectedStation === "ALL" ? "MAITRI" : selectedStation}
              onSelectStation={(code) => setSelectedStation(code)}
            />
          }
        />

        {/* System Settings & Diagnostics */}
        <Route path="/settings" element={<SettingsPage />} />

        {/* Administration Routes - Restricted to ADMIN */}
        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/admin/auth-events" element={<AuthAuditPage />} />
        </Route>

        {/* 404 Catch-All Page */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Route>
  </Routes>
);
};
