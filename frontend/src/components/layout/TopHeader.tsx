import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Menu,
  ChevronDown,
  Bell,
  Clock,
  Radio
} from "lucide-react";
import { useStation } from "../../context/StationContext";
import { StationFilter } from "../../types";
import { formatUtcTime } from "../../utils/formatters";
import { cn } from "../../lib/utils";

interface TopHeaderProps {
  onOpenMobileSidebar: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenMobileSidebar }) => {
  const { selectedStation, setSelectedStation, kpiSummary, alertsList } = useStation();
  const location = useLocation();

  // Live ticking UTC clock
  const [currentTime, setCurrentTime] = useState<string>(formatUtcTime());
  const [stationDropdownOpen, setStationDropdownOpen] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);

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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-polar-950/80 px-4 sm:px-6 backdrop-blur-md">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium">
          <span className="font-bold text-sky-400">POLARIS</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-200 font-semibold">{getBreadcrumb()}</span>
        </nav>
      </div>

      {/* Center: Primary Station Selector Dropdown */}
      <div className="relative">
        <button
          onClick={() => setStationDropdownOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-lg border border-sky-500/30 bg-slate-900/90 px-3 py-1.5 text-xs font-bold text-sky-200 shadow-sm hover:border-sky-400 hover:bg-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500/40"
          aria-expanded={stationDropdownOpen}
          aria-haspopup="true"
        >
          <Radio className="h-3.5 w-3.5 text-sky-400 animate-pulse" />
          <span>
            {selectedStation === "ALL"
              ? "ALL STATIONS"
              : selectedStation === "MAITRI"
              ? "MAITRI STATION"
              : "BHARATI STATION"}
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-slate-400 transition-transform duration-200",
              stationDropdownOpen && "rotate-180"
            )}
          />
        </button>

        {stationDropdownOpen && (
          <div
            className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 rounded-xl border border-slate-700/80 bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95"
            role="menu"
          >
            <button
              onClick={() => handleSelectStation("MAITRI")}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                selectedStation === "MAITRI"
                  ? "bg-sky-500/20 text-sky-300"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
              role="menuitem"
            >
              <span>Maitri Station</span>
              <span className="text-[10px] font-mono text-emerald-400">98% Health</span>
            </button>
            <button
              onClick={() => handleSelectStation("BHARATI")}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                selectedStation === "BHARATI"
                  ? "bg-sky-500/20 text-sky-300"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
              role="menuitem"
            >
              <span>Bharati Station</span>
              <span className="text-[10px] font-mono text-sky-400">94% Health</span>
            </button>
            <div className="my-1 border-t border-slate-800" />
            <button
              onClick={() => handleSelectStation("ALL")}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                selectedStation === "ALL"
                  ? "bg-sky-500/20 text-sky-300"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
              role="menuitem"
            >
              <span>All Stations (Combined)</span>
              <span className="text-[10px] font-mono text-slate-400">2 Bases</span>
            </button>
          </div>
        )}
      </div>

      {/* Right: Operational Status, Live UTC, Notifications, Avatar */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* System operational pill */}
        <div className="hidden md:flex items-center gap-1.5 rounded-full border border-emerald-800/60 bg-emerald-950/60 px-2.5 py-1 text-xs font-bold text-emerald-300 shadow-aurora-glow">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="tracking-wider">SYSTEM OPERATIONAL</span>
        </div>

        {/* Live ticking UTC clock */}
        <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800">
          <Clock className="h-3.5 w-3.5 text-sky-400" />
          <span>{currentTime}</span>
        </div>

        {/* Notifications Icon with active badge */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen((prev) => !prev)}
            className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors focus:outline-none"
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
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-700/80 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200">Active Station Alarms</span>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  {kpiSummary.totalAlerts} Total
                </span>
              </div>
              <div className="mt-2 divide-y divide-slate-800/60 max-h-60 overflow-y-auto">
                {alertsList.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="py-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 truncate">{alert.title}</span>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0 ml-2">
                        {alert.stationCode}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-1">{alert.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
