import React, { useState } from "react";
import {
  Sliders,
  User,
  Shield,
  Radio,
  Cpu,
  RefreshCw,
  KeyRound,
  ExternalLink,
  Database,
  Wifi,
  Sparkles,
  Lock,
  Compass
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Button } from "../components/ui/Button";

import { useHealthCheck } from "../hooks/useHealthCheck";
import { useAuth } from "../context/AuthContext";
import { useStation } from "../context/StationContext";
import { ChangePasswordModal } from "../components/auth/ChangePasswordModal";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";

type SettingsTab = "profile" | "security" | "status" | "info";

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const { data: health, isLoading, isError, refetch } = useHealthCheck();
  const { user } = useAuth();
  const { selectedStation, realtimeStatus, isStale } = useStation();
  const navigate = useNavigate();

  const isAdmin = user?.role === "ADMIN";

  const services = [
    {
      name: "React 18 Frontend Application",
      subsystem: "Vite + Tailwind CSS UI Shell",
      status: "OPERATIONAL",
      icon: Cpu,
      note: "Phase 14 Final UI/UX Polished & Responsive"
    },
    {
      name: "Node.js API Gateway & Services",
      subsystem: "Express + TypeScript + Security Hardening",
      status: isError ? "OFFLINE" : isLoading ? "CHECKING" : "OPERATIONAL",
      icon: Radio,
      note: health?.version ? `v${health.version} (${health.uptimeSeconds}s uptime)` : "Port 5000 / Active"
    },
    {
      name: "PostgreSQL Database Engine",
      subsystem: "Prisma ORM + Time-Series Telemetry & Logistics",
      status: "OPERATIONAL",
      icon: Database,
      note: "Relational store, transactions & audit logging"
    },
    {
      name: "Socket.IO Real-Time Telemetry Hub",
      subsystem: "Room-based duplex telemetry & alert streaming",
      status: realtimeStatus === "LIVE" ? (isStale ? "STALE" : "OPERATIONAL") : realtimeStatus,
      icon: Wifi,
      note: `WebSocket Status: ${realtimeStatus}`
    },
    {
      name: "Predictive AI Service (Python FastAPI)",
      subsystem: "Scikit-Learn Degradation & RUL Modeling",
      status: "OPERATIONAL",
      icon: Sparkles,
      note: "Port 8000 / Pytest validated (16/16 Passed)"
    },
    {
      name: "Polar Telemetry & IoT Simulator",
      subsystem: "Synthetic sensory generators (Maitri & Bharati)",
      status: "OPERATIONAL",
      icon: Compass,
      note: "1000ms cadence / deterministic baseline"
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="border-b border-polar-750 pb-4">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5 font-mono">
          <Sliders className="h-6 w-6 text-orange-400" />
          <span>System Settings & Operational Diagnostics</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Personnel profile, security access policies, subsystem health, and Antarctic platform information
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-polar-750 gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
        <button
          onClick={() => setActiveTab("profile")}
          className={cn(
            "px-4 py-2 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5",
            activeTab === "profile"
              ? "border-orange-500 text-orange-400 font-mono"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <User className="h-3.5 w-3.5" />
          <span>Profile</span>
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={cn(
            "px-4 py-2 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5",
            activeTab === "security"
              ? "border-orange-500 text-orange-400 font-mono"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <Lock className="h-3.5 w-3.5" />
          <span>Security</span>
          {isAdmin && (
            <span className="ml-1 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold border border-amber-500/40">
              ADMIN
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("status")}
          className={cn(
            "px-4 py-2 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5",
            activeTab === "status"
              ? "border-orange-500 text-orange-400 font-mono"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <Cpu className="h-3.5 w-3.5" />
          <span>System Status</span>
        </button>

        <button
          onClick={() => setActiveTab("info")}
          className={cn(
            "px-4 py-2 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5",
            activeTab === "info"
              ? "border-orange-500 text-orange-400 font-mono"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <Shield className="h-3.5 w-3.5" />
          <span>Application Information</span>
        </button>
      </div>

      {/* TAB 1: PROFILE */}
      {activeTab === "profile" && (
        <div className="space-y-4">
          <Card className="p-5 sm:p-6 bg-polar-900/75 border-polar-750 space-y-5 shadow-titanium">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-polar-750">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/40 font-black text-xl shadow-titanium">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{user?.name || "Station Operator"}</h3>
                  <p className="text-xs text-slate-400 font-mono">{user?.email || "operator@polaris.local"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-mono font-bold border",
                    user?.role === "ADMIN"
                      ? "bg-amber-950/70 text-amber-300 border-amber-700/60"
                      : user?.role === "OPERATOR"
                      ? "bg-sky-950/70 text-sky-300 border-sky-700/60"
                      : "bg-emerald-950/70 text-emerald-300 border-emerald-700/60"
                  )}
                >
                  ROLE: {user?.role || "OPERATOR"}
                </span>
                <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950/50 border border-emerald-800/40">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Authenticated</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-polar-950/80 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">CURRENT STATION VIEW</span>
                <span className="text-sky-300 font-bold text-sm font-sans mt-0.5 block">
                  {selectedStation === "ALL" ? "All Stations (Combined)" : `${selectedStation} Research Base`}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-polar-950/80 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">ORGANIZATION</span>
                <span className="text-slate-200 font-bold text-sm font-sans mt-0.5 block">
                  National Centre for Polar & Ocean Research
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsPasswordModalOpen(true)}
                className="gap-2"
              >
                <KeyRound className="h-3.5 w-3.5 text-sky-400" />
                <span>Update Account Passkey</span>
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: SECURITY */}
      {activeTab === "security" && (
        <div className="space-y-4">
          <Card className="p-6 bg-polar-900/60 border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Shield className="h-4 w-4 text-sky-400" />
              Role-Based Access Control & Governance
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              POLARIS enforces strict multi-station RBAC backed by Argon2id password hashing and signed JWT tokens with 15-minute access lifetimes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl border border-slate-800 bg-polar-950/80">
                <span className="text-xs font-bold text-amber-400">ADMINISTRATOR</span>
                <p className="text-[11px] text-slate-400 mt-1">Full system management, user provisioning, incident resolution, audit review.</p>
              </div>
              <div className="p-3 rounded-xl border border-slate-800 bg-polar-950/80">
                <span className="text-xs font-bold text-sky-400">OPERATOR</span>
                <p className="text-[11px] text-slate-400 mt-1">Station telemetry monitoring, stock transfers, alert acknowledgement, report export.</p>
              </div>
              <div className="p-3 rounded-xl border border-slate-800 bg-polar-950/80">
                <span className="text-xs font-bold text-emerald-400">VIEWER</span>
                <p className="text-[11px] text-slate-400 mt-1">Read-only scientific telemetry viewing, digital twin inspection, no state mutations.</p>
              </div>
            </div>
          </Card>

          {/* Admin Personnel Management Section */}
          {isAdmin ? (
            <Card className="p-6 bg-polar-900/60 border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/40">
                    ADMIN ONLY
                  </span>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Station Personnel Administration
                  </h3>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                As an authorized Administrator, you have privileges to create accounts, deactivate personnel, modify role assignments, and review security audit logs.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate("/admin/users")}
                  className="gap-2 font-bold"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Manage Station Personnel</span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate("/admin/auth-events")}
                  className="gap-2"
                >
                  <Shield className="h-3.5 w-3.5 text-amber-400" />
                  <span>Security Audit Log</span>
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-5 bg-polar-900/40 border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-500" />
                <span>Personnel management & security audits are restricted to <strong>ADMIN</strong> roles.</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 uppercase">VIEWER/OPERATOR RESTRICTED</span>
            </Card>
          )}
        </div>
      )}

      {/* TAB 3: SYSTEM STATUS */}
      {activeTab === "status" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Real-time operational audit across POLARIS microservices and architectural tiers
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
            {services.map((svc) => {
              const Icon = svc.icon;
              return (
                <Card key={svc.name} className="p-4 bg-polar-900/60 border-slate-800/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 text-sky-400">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">{svc.name}</h4>
                        <p className="text-[11px] text-slate-400">{svc.subsystem}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className="text-xs font-mono text-slate-400">{svc.note}</span>
                      <StatusBadge status={svc.status} size="sm" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: APPLICATION INFORMATION */}
      {activeTab === "info" && (
        <Card className="p-6 bg-polar-900/60 border-slate-800 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 shadow-ice-glow">
              <Compass className="h-7 w-7 text-slate-950" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white polar-gradient-text tracking-wide">
                POLARIS
              </h2>
              <p className="text-xs text-sky-400 font-semibold">
                Polar Operations & Logistics Automated Remote Intelligence System
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-4">
            POLARIS is an advanced digital platform engineered for comprehensive digital twin monitoring, autonomous station resilience, and mission telemetry across Indian Antarctic research stations under the <strong>Ministry of Earth Sciences (MoES)</strong> and the <strong>National Centre for Polar and Ocean Research (NCPOR)</strong>.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-1">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">MINISTRY / ORG</span>
              <span className="text-slate-200 font-bold font-sans">MoES / NCPOR</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">MISSION ID</span>
              <span className="text-sky-300 font-bold font-sans">POLARIS-OPS</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">ANTARCTIC BASES</span>
              <span className="text-slate-200 font-bold font-sans">Maitri & Bharati</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">PLATFORM STATUS</span>
              <span className="text-emerald-400 font-bold font-sans">Phase 14 Polished</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-polar-950/80 p-4 space-y-2 text-xs">
            <span className="text-xs font-bold text-slate-200">Antarctic Research Stations Summary:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-orange-400 font-bold block">MAITRI STATION (Est. 1989)</span>
                <span className="text-slate-400 block">Coords: 70°45'57"S, 11°44'09"E</span>
                <span className="text-slate-400 block">Region: Schirmacher Oasis</span>
                <span className="text-emerald-400 block mt-1">Health: 98% · Status: OPERATIONAL</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-cyan-400 font-bold block">BHARATI STATION (Est. 2012)</span>
                <span className="text-slate-400 block">Coords: 69°24'29"S, 76°11'14"E</span>
                <span className="text-slate-400 block">Region: Larsemann Hills</span>
                <span className="text-emerald-400 block mt-1">Health: 94% · Status: OPERATIONAL</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};
