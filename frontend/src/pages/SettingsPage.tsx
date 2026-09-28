import React, { useState } from "react";
import { Sliders, Monitor, Cpu, Radio, Shield, RefreshCw } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { useHealthCheck } from "../hooks/useHealthCheck";

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"system" | "status" | "appearance" | "about">("system");
  const { data: health, isLoading, isError, refetch } = useHealthCheck();

  const services = [
    {
      name: "React 18 Frontend Application",
      subsystem: "Vite + Tailwind CSS UI Shell",
      status: "OPERATIONAL",
      type: "active",
      note: "Phase 1 Frontend UI Active"
    },
    {
      name: "Node.js API Gateway",
      subsystem: "Express + TypeScript Service",
      status: isError ? "OFFLINE" : isLoading ? "CHECKING" : "OPERATIONAL",
      type: isError ? "error" : "active",
      note: health?.version ? `v${health.version} (${health.uptimeSeconds}s uptime)` : "Standby / localhost:5000"
    },
    {
      name: "PostgreSQL Database + Prisma",
      subsystem: "Relational & Time-Series Engine",
      status: "PLANNED (PHASE 2)",
      type: "planned",
      note: "Architecture & retention strategy documented"
    },
    {
      name: "Socket.IO WebSocket Hub",
      subsystem: "Real-time Telemetry Streaming",
      status: "PLANNED (PHASE 5)",
      type: "planned",
      note: "Room-based event channels mapped"
    },
    {
      name: "Python FastAPI AI Engine",
      subsystem: "Predictive Maintenance & RUL",
      status: "PLANNED (PHASE 10)",
      type: "planned",
      note: "FastAPI health check & model schemas ready"
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="border-b border-slate-800/80 pb-4">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Sliders className="h-6 w-6 text-sky-400" />
          <span>System Settings & Operational Diagnostics</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Platform configurations, runtime environment metadata, and subsystem connectivity status
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab("system")}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 ${
            activeTab === "system"
              ? "border-sky-400 text-sky-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          System Metadata
        </button>
        <button
          onClick={() => setActiveTab("status")}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 ${
            activeTab === "status"
              ? "border-sky-400 text-sky-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Subsystem Status
        </button>
        <button
          onClick={() => setActiveTab("appearance")}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 ${
            activeTab === "appearance"
              ? "border-sky-400 text-sky-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Display & Appearance
        </button>
        <button
          onClick={() => setActiveTab("about")}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 ${
            activeTab === "about"
              ? "border-sky-400 text-sky-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          About POLARIS
        </button>
      </div>

      {/* TAB 1: SYSTEM METADATA */}
      {activeTab === "system" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5 bg-polar-900/60 border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-sky-400" />
              Runtime Environment
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Application Version:</span>
                <span className="text-white font-bold">0.1.0 (Phase 1)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Environment:</span>
                <span className="text-sky-300 font-bold">development</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Active Mode:</span>
                <span className="text-amber-300 font-bold">SIMULATION DATA</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Backend API URL:</span>
                <span className="text-slate-300 truncate max-w-[200px]">
                  {import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-polar-900/60 border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Radio className="h-4 w-4 text-emerald-400" />
              Telemetry Pipeline
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Simulation Engine:</span>
                <span className="text-emerald-300 font-bold">Deterministic Mock Layer</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Cadence:</span>
                <span className="text-slate-200">1000ms Heartbeat</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Station Targets:</span>
                <span className="text-slate-200">Maitri & Bharati</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Time Reference:</span>
                <span className="text-sky-300 font-bold">Universal Coordinated Time (UTC)</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: SUBSYSTEM STATUS */}
      {activeTab === "status" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Live status audit across monorepo microservices and architectural tiers
            </p>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Ping Gateway</span>
            </button>
          </div>

          <div className="space-y-3">
            {services.map((svc) => (
              <Card key={svc.name} className="p-4 bg-polar-900/60 border-slate-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{svc.name}</h4>
                    <p className="text-[11px] text-slate-400">{svc.subsystem}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400">{svc.note}</span>
                    <Badge
                      variant={svc.type === "active" ? "success" : svc.type === "error" ? "danger" : "neutral"}
                      size="sm"
                    >
                      {svc.status}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DISPLAY & APPEARANCE */}
      {activeTab === "appearance" && (
        <Card className="p-5 bg-polar-900/60 border-slate-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Monitor className="h-4 w-4 text-sky-400" />
            Visual System Configuration
          </h3>
          <p className="text-xs text-slate-400">
            POLARIS enforces a scientific high-contrast dark polar theme specifically designed to reduce glare and visual fatigue during multi-hour Antarctic operations monitoring.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-lg border border-sky-500/40 bg-sky-950/20 text-xs">
              <span className="font-bold text-sky-300">Deep Polar Dark</span>
              <p className="text-[11px] text-slate-400 mt-1">Default mission-control palette active</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/40 text-xs opacity-60">
              <span className="font-bold text-slate-300">Polar High Contrast</span>
              <p className="text-[11px] text-slate-400 mt-1">Coming in Phase 14 UI polish</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/40 text-xs opacity-60">
              <span className="font-bold text-slate-300">Clean Monochrome</span>
              <p className="text-[11px] text-slate-400 mt-1">Coming in Phase 14 UI polish</p>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 4: ABOUT POLARIS */}
      {activeTab === "about" && (
        <Card className="p-6 bg-polar-900/60 border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 shadow-ice-glow">
              <Shield className="h-6 w-6 text-slate-950" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">POLARIS</h2>
              <p className="text-xs text-slate-400">
                Polar Operations & Logistics Automated Remote Intelligence System
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-4">
            POLARIS is an advanced digital platform developed for the <strong>Smart India Hackathon 2026</strong> under Problem Statement ID <strong>SIH26060</strong>, proposed by the <strong>Ministry of Earth Sciences (MoES)</strong> and the <strong>National Centre for Polar and Ocean Research (NCPOR)</strong>.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-2">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">ORGANIZATION</span>
              <span className="text-slate-200 font-bold font-sans">MoES / NCPOR</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">CATEGORY</span>
              <span className="text-slate-200 font-bold font-sans">Software</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">THEME</span>
              <span className="text-slate-200 font-bold font-sans">Smart Automation</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">CURRENT PHASE</span>
              <span className="text-emerald-400 font-bold font-sans">Phase 1 Deployed</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
