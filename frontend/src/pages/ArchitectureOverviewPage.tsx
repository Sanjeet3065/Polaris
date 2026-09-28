import React from "react";
import {
  Activity,
  Layers,
  Server,
  Cpu,
  Radio,
  Box,
  CheckCircle2,
  Clock
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { StationSelector } from "../components/station/StationSelector";
import { DEVELOPMENT_PHASES } from "../constants/phases";
import { StationCode } from "../types";
import { useHealthCheck } from "../hooks/useHealthCheck";

interface ArchitectureOverviewPageProps {
  selectedStation: StationCode;
  onSelectStation: (code: StationCode) => void;
}

export const ArchitectureOverviewPage: React.FC<ArchitectureOverviewPageProps> = ({
  selectedStation,
  onSelectStation
}) => {
  const { data: health, isLoading, isError } = useHealthCheck();

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-r from-polar-900 via-polar-850 to-polar-900 p-8 shadow-polar-card">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="ice">Smart India Hackathon 2026</Badge>
            <Badge variant="neutral">Problem ID: SIH26060</Badge>
            <Badge variant="success">Phase 0 Foundation Complete</Badge>
          </div>
          <h1 className="text-3xl font-extrabold sm:text-4xl text-white tracking-tight">
            POLARIS <span className="polar-gradient-text">Architecture Hub</span>
          </h1>
          <p className="mt-2 text-base text-slate-300 leading-relaxed">
            Polar Operations & Logistics Automated Remote Intelligence System — A Digital Twin platform for
            remote management and predictive monitoring of Indian Antarctic Research Stations.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              Maitri & Bharati Integrated
            </span>
            <span>•</span>
            <span>Ministry of Earth Sciences (MoES)</span>
            <span>•</span>
            <span>National Centre for Polar and Ocean Research (NCPOR)</span>
          </div>
        </div>
      </div>

      {/* Primary Station Selector */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Radio className="h-5 w-5 text-sky-400" />
            Station Focus: {selectedStation}
          </h2>
          <span className="text-xs text-slate-400">Click to switch telemetry context</span>
        </div>
        <StationSelector selectedStation={selectedStation} onSelectStation={onSelectStation} />
      </section>

      {/* Backend & AI Health Telemetry */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-400" />
          Foundation Subsystems Telemetry
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Node.js Backend */}
          <Card glow={!isError && !isLoading}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100 text-sm">Node.js API Backend</h3>
                  <p className="text-xs text-slate-400">Express + TypeScript</p>
                </div>
              </div>
              <Badge variant={isError ? "danger" : isLoading ? "warning" : "success"} size="sm">
                {isError ? "OFFLINE" : isLoading ? "PINGING..." : "HEALTHY"}
              </Badge>
            </div>
            <div className="mt-4 space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Port / Namespace:</span>
                <span className="font-mono text-sky-300">5000 /api/v1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Version:</span>
                <span className="font-mono">{health?.version || "0.1.0"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Uptime:</span>
                <span>{health?.uptimeSeconds ? `${health.uptimeSeconds}s` : "Standby"}</span>
              </div>
            </div>
          </Card>

          {/* AI Microservice */}
          <Card>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100 text-sm">AI Prediction Engine</h3>
                  <p className="text-xs text-slate-400">FastAPI + Scikit-Learn</p>
                </div>
              </div>
              <Badge variant="ice" size="sm">READY</Badge>
            </div>
            <div className="mt-4 space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Port / Docs:</span>
                <span className="font-mono text-sky-300">8000 /docs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">RUL Engine:</span>
                <span className="text-emerald-400">Architected</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fuel Depletion:</span>
                <span>Ready for Models</span>
              </div>
            </div>
          </Card>

          {/* 3D Digital Twin Subsystem */}
          <Card>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Box className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100 text-sm">3D Digital Twin Engine</h3>
                  <p className="text-xs text-slate-400">Three.js + R3F + Drei</p>
                </div>
              </div>
              <Badge variant="neutral" size="sm">PHASE 6 PREP</Badge>
            </div>
            <div className="mt-4 space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Rendering Mode:</span>
                <span className="font-mono text-emerald-300">WebGL / Canvas</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Entity Binding:</span>
                <span>Equipment ID Map</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-sky-300">Isolated & Typed</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* SIH Phased Roadmap Tracker */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-400" />
            SIH 2026 Phased Execution Roadmap (Phases 0 — 16)
          </h2>
          <span className="text-xs text-slate-400">Strictly phased development protocol</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {DEVELOPMENT_PHASES.map((p) => {
            const isActive = p.status === "ACTIVE";
            const isCompleted = p.status === "COMPLETED";

            return (
              <div
                key={p.phase}
                className={`p-4 rounded-xl border transition-all ${
                  isActive
                    ? "border-sky-500/80 bg-sky-950/20 shadow-ice-glow"
                    : isCompleted
                    ? "border-emerald-500/40 bg-emerald-950/10"
                    : "border-slate-800/70 bg-polar-900/40 opacity-70"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-sky-400">
                    PHASE {p.phase}
                  </span>
                  {isActive && (
                    <Badge variant="ice" size="sm">
                      <Clock className="h-3 w-3 animate-spin" />
                      IN PROGRESS
                    </Badge>
                  )}
                  {isCompleted && (
                    <Badge variant="success" size="sm">
                      <CheckCircle2 className="h-3 w-3" />
                      COMPLETE
                    </Badge>
                  )}
                  {p.status === "PENDING" && (
                    <Badge variant="neutral" size="sm">
                      PENDING
                    </Badge>
                  )}
                </div>
                <h4 className="mt-2 text-sm font-semibold text-slate-100">{p.name}</h4>
                <p className="mt-1 text-xs text-slate-400 line-clamp-2">{p.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
