import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  ChevronDown,
  Bell,
  Clock,
  User,
  LogOut,
  KeyRound,
  Shield
} from "lucide-react";

import { useStation } from "../../context/StationContext";
import { useAuth } from "../../context/AuthContext";
import { StationFilter } from "../../types";
import { formatUtcTime } from "../../utils/formatters";
import { ChangePasswordModal } from "../auth/ChangePasswordModal";
import { cn } from "../../lib/utils";

interface TopHeaderProps {
  onOpenMobileSidebar: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenMobileSidebar }) => {
  const { selectedStation, setSelectedStation, kpiSummary, alertsList, realtimeStatus, isStale } = useStation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Live ticking UTC clock
  const [currentTime, setCurrentTime] = useState<string>(formatUtcTime());
  const [stationDropdownOpen, setStationDropdownOpen] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatUtcTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format breadcrumb based on route
  const getBreadcrumb = () => {
    const path = location.pathname.replace("/", "");
    if (!path || path === "overview") return "Overview";
    return path
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleSelectStation = (station: StationFilter) => {
    setSelectedStation(station);
    setStationDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-polar-750 bg-polar-950/90 px-3 sm:px-6 backdrop-blur-xl">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          className="rounded-lg p-2 text-slate-400 hover:bg-polar-850 hover:text-white lg:hidden touch-target flex items-center justify-center"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 sm:gap-2 text-xs font-medium truncate">
          <span className="font-bold text-cyan-400 font-mono tracking-wider">POLARIS</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-200 font-semibold truncate max-w-[90px] sm:max-w-none">{getBreadcrumb()}</span>
        </nav>
      </div>

      {/* Center: Primary Station Selector Dropdown */}
      <div className="relative">
        <button
          onClick={() => setStationDropdownOpen((prev) => !prev)}
          className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-cyan-500/30 bg-polar-900/90 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-cyan-200 shadow-titanium hover:border-cyan-400 hover:bg-polar-850 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          aria-expanded={stationDropdownOpen}
          aria-haspopup="true"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="hidden sm:inline tracking-wide font-mono text-[11px]">
            {selectedStation === "ALL"
              ? "ALL STATIONS (96% Avg)"
              : selectedStation === "MAITRI"
              ? "MAITRI (98% Health)"
              : "BHARATI (94% Health)"}
          </span>
          <span className="sm:hidden tracking-wide font-mono text-[11px]">
            {selectedStation === "ALL" ? "ALL (96%)" : selectedStation}
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-slate-400 transition-transform duration-200 shrink-0",
              stationDropdownOpen && "rotate-180"
            )}
          />
        </button>

        {stationDropdownOpen && (
          <div
            className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 max-w-[calc(100vw-32px)] rounded-xl border border-polar-750 bg-polar-900/95 p-2 shadow-hud backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95"
            role="menu"
          >
            <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold border-b border-polar-750 mb-1">
              Select Antarctic Research Base
            </div>

            <button
              onClick={() => handleSelectStation("MAITRI")}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-colors text-left",
                selectedStation === "MAITRI"
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-300 hover:bg-polar-800 hover:text-white"
              )}
              role="menuitem"
            >
              <div>
                <div className="font-bold flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>MAITRI</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">● OPERATIONAL</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">Health 98%</span>
            </button>

            <button
              onClick={() => handleSelectStation("BHARATI")}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-colors text-left mt-1",
                selectedStation === "BHARATI"
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-300 hover:bg-polar-800 hover:text-white"
              )}
              role="menuitem"
            >
              <div>
                <div className="font-bold flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>BHARATI</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">● OPERATIONAL</span>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-400">Health 94%</span>
            </button>

            <div className="my-1 border-t border-polar-750" />

            <button
              onClick={() => handleSelectStation("ALL")}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-colors text-left",
                selectedStation === "ALL"
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-300 hover:bg-polar-800 hover:text-white"
              )}
              role="menuitem"
            >
              <div>
                <div className="font-bold flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  <span>ALL BASES</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Combined Fleet Overview</span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-300">2 Stations</span>
            </button>
          </div>
        )}
      </div>

      {/* Right: Operational Status, Live UTC, Notifications, Avatar */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Real-time WebSocket connection indicator */}
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2 sm:px-2.5 py-1 text-[11px] font-mono font-bold transition-colors",
            realtimeStatus === "LIVE" && !isStale && "border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 shadow-[0_0_8px_rgba(0,229,200,0.2)]",
            realtimeStatus === "LIVE" && isStale && "border border-amber-500/30 bg-amber-950/50 text-amber-300",
            realtimeStatus === "RECONNECTING" && "border border-amber-500/30 bg-amber-950/50 text-amber-300",
            realtimeStatus === "OFFLINE" && "border border-rose-500/30 bg-rose-950/50 text-rose-400"
          )}
          title={`WebSocket Status: ${realtimeStatus}${isStale ? " (Telemetry Stale)" : ""}`}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full",
              realtimeStatus === "LIVE" && !isStale && "bg-cyan-400 animate-pulse",
              realtimeStatus === "LIVE" && isStale && "bg-amber-400",
              realtimeStatus === "RECONNECTING" && "bg-amber-400 animate-ping",
              realtimeStatus === "OFFLINE" && "bg-rose-500"
            )}
          />
          <span className="tracking-wider text-[10px] sm:text-[11px]">
            {realtimeStatus === "LIVE"
              ? isStale
                ? "STALE"
                : "LIVE"
              : realtimeStatus === "RECONNECTING"
              ? "RECONNECT"
              : "OFFLINE"}
          </span>
        </div>

        {/* System operational pill */}
        <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1 text-[11px] font-mono font-bold text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="tracking-wider">NOMINAL OPS</span>
        </div>

        {/* Live ticking UTC clock */}
        <div className="hidden md:flex items-center gap-1.5 font-mono text-[11px] font-semibold text-slate-300 bg-polar-900/80 px-2.5 py-1 rounded-lg border border-polar-750">
          <Clock className="h-3.5 w-3.5 text-cyan-400" />
          <span>{currentTime}</span>
        </div>

        {/* Notifications Icon with active badge */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen((prev) => !prev)}
            className="relative rounded-lg p-2 text-slate-400 hover:bg-polar-850 hover:text-slate-100 transition-colors focus:outline-none touch-target flex items-center justify-center"
            aria-label="View alerts and notifications"
          >
            <Bell className="h-4 w-4" />
            {kpiSummary.totalAlerts > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>
            )}
          </button>

          {/* Quick Notification Dropdown Preview */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-24px)] rounded-xl border border-polar-750 bg-polar-900/95 p-3 shadow-hud backdrop-blur-2xl z-50 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-polar-750 pb-2">
                <span className="text-xs font-bold text-slate-200">Active Station Alarms</span>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300">
                  {kpiSummary.totalAlerts} Total
                </span>
              </div>
              <div className="mt-2 divide-y divide-polar-750 max-h-60 overflow-y-auto">
                {alertsList.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-500 font-mono">
                    No active alarm telemetry
                  </div>
                ) : (
                  alertsList.slice(0, 3).map((alert) => (
                    <div key={alert.id} className="py-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200 truncate">{alert.title}</span>
                        <span className="font-mono text-[10px] text-cyan-400 shrink-0 ml-2">
                          {alert.stationCode}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-1">{alert.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account Capsule & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-xl border border-polar-750 bg-polar-900/80 p-1.5 hover:border-cyan-500/40 hover:bg-polar-850 transition-all focus:outline-none touch-target"
            aria-label="User account menu"
            aria-expanded={userMenuOpen}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-polar-800 border border-cyan-500/30 text-xs font-mono font-bold text-cyan-300 shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200 leading-tight max-w-[110px] truncate">
                {user?.name || "Station User"}
              </span>
              <span
                className={cn(
                  "text-[9px] font-mono font-bold leading-tight uppercase",
                  user?.role === "ADMIN"
                    ? "text-amber-400"
                    : user?.role === "OPERATOR"
                    ? "text-cyan-400"
                    : "text-emerald-400"
                )}
              >
                {user?.role || "OPERATOR"}
              </span>
            </div>
            <ChevronDown
              className={cn(
                "h-3 w-3 text-slate-400 transition-transform duration-200 hidden md:block",
                userMenuOpen && "rotate-180"
              )}
            />
          </button>

          {/* User Dropdown Menu */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-24px)] rounded-xl border border-polar-750 bg-polar-900/95 p-2 shadow-hud backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-polar-750">
                <div className="font-semibold text-xs text-slate-100 truncate">{user?.name}</div>
                <div className="text-[10px] font-mono text-slate-400 truncate">{user?.email}</div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold border",
                      user?.role === "ADMIN"
                        ? "bg-amber-950/80 text-amber-300 border-amber-700/60"
                        : user?.role === "OPERATOR"
                        ? "bg-cyan-950/80 text-cyan-300 border-cyan-700/60"
                        : "bg-emerald-950/80 text-emerald-300 border-emerald-700/60"
                    )}
                  >
                    <Shield className="h-2.5 w-2.5" />
                    <span>{user?.role}</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Active Gateway</span>
                  </span>
                </div>
              </div>

              <div className="py-1">
                {user?.role === "ADMIN" && (
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate("/admin/users");
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-polar-800 hover:text-white transition-colors"
                  >
                    <Shield className="h-3.5 w-3.5 text-amber-400" />
                    <span>Manage Personnel</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    setChangePasswordOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-polar-800 hover:text-white transition-colors"
                >
                  <KeyRound className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Change Password</span>
                </button>
              </div>

              <div className="border-t border-polar-750 pt-1">
                <button
                  onClick={async () => {
                    setUserMenuOpen(false);
                    await logout();
                    navigate("/login");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out of Station</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Dialog */}
      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </header>
  );
};
