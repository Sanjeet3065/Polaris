import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { OverviewPage } from "../pages/OverviewPage";
import { PlaceholderPage } from "../pages/PlaceholderPage";
import { SettingsPage } from "../pages/SettingsPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { ArchitectureOverviewPage } from "../pages/ArchitectureOverviewPage";
import { DigitalTwinPage } from "../pages/DigitalTwinPage";
import { LoginPage } from "../pages/LoginPage";
import { UserManagementPage } from "../pages/admin/UserManagementPage";
import { AuthAuditPage } from "../pages/admin/AuthAuditPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { useStation } from "../context/StationContext";
import {
  Zap,
  Wind,
  Settings2,
  Boxes,
  TriangleAlert,
  Wrench,
  ChartNoAxesCombined,
  FileText
} from "lucide-react";

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

        <Route
          path="/energy"
          element={
            <PlaceholderPage
              title="Energy & Microgrid Management"
              subtitle="Solar PV arrays, diesel cogeneration, and battery bank distribution"
              description="Full-scale station microgrid telemetry tracking power generation, consumption loads, sub-zero battery storage dynamics, and fuel farm burn rates."
              icon={Zap}
              targetPhase={7}
              plannedFeatures={[
                "Autonomous load shedding and priority grid circuit control",
                "Solar generation forecasting vs. diesel generator throttling",
                "Sub-zero Lithium-Iron-Phosphate battery degradation curve tracking",
                "Cogeneration thermal heat recovery metrics for living modules"
              ]}
            />
          }
        />

        <Route
          path="/environment"
          element={
            <PlaceholderPage
              title="Environmental & Climate Telemetry"
              subtitle="Extreme microclimate monitoring, Katabatic winds, and blizzard detection"
              description="High-frequency outdoor environmental sensor feeds capturing ambient temperature, atmospheric pressure swings, and Katabatic blizzard wind dynamics."
              icon={Wind}
              targetPhase={7}
              plannedFeatures={[
                "Automated Weather Station (AWS) telemetry from Schirmacher Oasis & Larsemann Hills",
                "Barometric pressure rapid-drop blizzard early warning system",
                "Ultrasonic snow depth and accumulation rate sensors",
                "Solar irradiance and UV radiation index instrumentation"
              ]}
            />
          }
        />

        <Route
          path="/equipment"
          element={
            <PlaceholderPage
              title="Machinery & Equipment Fleet"
              subtitle="Station asset health indices, vibration telemetry, and life-support monitoring"
              description="Continuous diagnostic registry of all active machinery including Caterpillar/Volvo diesel generators, HVAC air handling units, and water desalination plants."
              icon={Settings2}
              targetPhase={10}
              plannedFeatures={[
                "Vibration RMS spectral analysis and bearing wear monitoring",
                "Exhaust gas temperature and lube oil pressure telemetry",
                "Water desalination and Lake Priyadarshini meltwater pump status",
                "C-Band and VSAT satellite tracking terminal telemetry"
              ]}
            />
          }
        />

        <Route
          path="/logistics"
          element={
            <PlaceholderPage
              title="Logistics & Antarctic Inventory"
              subtitle="Fuel reserves, consumables, polar shipping manifests, and supply requests"
              description="Operational logistics tracker for Antarctic bulk fuel farms, freeze-dried ration stores, scientific supplies, and resupply vessels."
              icon={Boxes}
              targetPhase={8}
              plannedFeatures={[
                "Double-walled bulk Arctic Jet A-1 fuel farm inventory tracking",
                "Days of Winter Autonomy predictive depletion calculator",
                "Expedition cargo manifest reconciliation (MV Vasiliy Golovnin)",
                "Digital supply requisition and approval workflow for station leaders"
              ]}
            />
          }
        />

        <Route
          path="/alerts"
          element={
            <PlaceholderPage
              title="Alarms & Incident Triage"
              subtitle="Automated threshold anomaly detection, incident response, and escalation"
              description="Centralized mission-control alarm hub dispatching notifications on thermal excursions, power dips, generator overspeed, and satellite dropouts."
              icon={TriangleAlert}
              targetPhase={9}
              plannedFeatures={[
                "Multi-tiered alert severity classification (INFO, WARNING, CRITICAL, EMERGENCY)",
                "Station operator acknowledgment and triage audit logging",
                "Incident post-mortem reporting and corrective action tracking",
                "Audio alarm cues and multi-channel notification dispatch"
              ]}
            />
          }
        />

        <Route
          path="/maintenance"
          element={
            <PlaceholderPage
              title="Maintenance & Work Orders"
              subtitle="Preventive, corrective, and AI-predicted work order management"
              description="Structured engineering work order system coordinating scheduled overhauls, emergency winter repairs, and technician work orders."
              icon={Wrench}
              targetPhase={10}
              plannedFeatures={[
                "Automated run-hour preventive overhaul scheduling",
                "Digital work order assignment for station engineers",
                "Maintenance spare parts deduction and inventory linking",
                "Detailed inspection checklists and sign-off audit trail"
              ]}
            />
          }
        />

        <Route
          path="/analytics"
          element={
            <PlaceholderPage
              title="Polar Analytics & Scientific Trends"
              subtitle="Longitudinal climate analytics, energy regressions, and operational KPIs"
              description="Advanced analytics studio for exploring multi-year polar operational trends, equipment failure rates, and environmental correlations."
              icon={ChartNoAxesCombined}
              targetPhase={11}
              plannedFeatures={[
                "Seasonal fuel consumption vs. degree-days heating regression",
                "Longitudinal microclimate record aggregation",
                "Mean Time Between Failures (MTBF) tracking for station assets",
                "Cross-station operational efficiency benchmarking"
              ]}
            />
          }
        />

        <Route
          path="/reports"
          element={
            <PlaceholderPage
              title="Compliance Reports & Operational Logs"
              subtitle="Official MoES / NCPOR governance, audit logs, and PDF generation"
              description="Automated reporting suite generating regulatory monthly logs, Antarctic Treaty environmental compliance documentation, and power statements."
              icon={FileText}
              targetPhase={11}
              plannedFeatures={[
                "One-click monthly station summary PDF generation",
                "Antarctic environmental stewardship compliance logs",
                "Annual fuel and carbon emission accountability reports",
                "Exportable telemetry CSV/JSON bundles for research scientists"
              ]}
            />
          }
        />

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
