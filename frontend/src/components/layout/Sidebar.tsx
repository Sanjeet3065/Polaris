import React from "react";
import { NavLink } from "react-router-dom";
import {
  Compass,
  LayoutDashboard,
  Box,
  Zap,
  Wind,
  Settings2,
  Boxes,
  TriangleAlert,
  Wrench,
  ChartNoAxesCombined,
  FileText,
  Layers,
  Sliders,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Users,
  ShieldAlert,
  Bot,
  X
} from "lucide-react";
import { Tooltip } from "../ui/Tooltip";
import { cn } from "../../lib/utils";
import { useStation } from "../../context/StationContext";
import { useAuth } from "../../context/AuthContext";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile
}) => {
  const { kpiSummary } = useStation();
  const { user } = useAuth();

  const mainNavigation: NavItem[] = [
    { name: "Overview", path: "/overview", icon: LayoutDashboard },
    { name: "Digital Twin", path: "/digital-twin", icon: Box },
    { name: "Energy", path: "/energy", icon: Zap },
    { name: "Environment", path: "/environment", icon: Wind },
    { name: "Equipment", path: "/equipment", icon: Settings2 },
    { name: "Logistics", path: "/logistics", icon: Boxes },
    { name: "Alerts", path: "/alerts", icon: TriangleAlert, badge: kpiSummary.totalAlerts },
    { name: "Maintenance", path: "/maintenance", icon: Wrench },
    { name: "Analytics", path: "/analytics", icon: ChartNoAxesCombined },
    { name: "Reports", path: "/reports", icon: FileText },
    { name: "AI Assistant", path: "/assistant", icon: Bot }
  ];

  const adminNavigation: NavItem[] = [
    { name: "User Management", path: "/admin/users", icon: Users },
    { name: "Security Audit", path: "/admin/auth-events", icon: ShieldAlert }
  ];

  const systemNavigation: NavItem[] = [
    { name: "Architecture Hub", path: "/architecture", icon: Layers },
    { name: "Settings", path: "/settings", icon: Sliders }
  ];

  const renderNavLink = (item: NavItem) => {
    const Icon = item.icon;
    const content = (
      <NavLink
        to={item.path}
        onClick={onCloseMobile}
        className={({ isActive }) =>
          cn(
            "group flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150 relative",
            isActive
              ? "bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-ice-glow"
              : "text-slate-400 hover:bg-slate-900/80 hover:text-slate-200 border border-transparent"
          )
        }
      >
        {({ isActive }) => (
          <>
            <Icon
              className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                isActive ? "text-sky-400" : "text-slate-400 group-hover:text-slate-200"
              )}
            />
            {!collapsed && <span className="truncate">{item.name}</span>}
            {!collapsed && item.badge !== undefined && item.badge > 0 && (
              <span className="ml-auto rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/40">
                {item.badge}
              </span>
            )}
            {isActive && (
              <span className="absolute -left-2 h-4 w-1 rounded-r-full bg-sky-400" />
            )}
          </>
        )}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.path} content={item.name} position="right">
          {content}
        </Tooltip>
      );
    }

    return <div key={item.path}>{content}</div>;
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-slate-800/80 bg-polar-950/95 backdrop-blur-xl transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64",
          // Mobile state
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-indigo-600 shadow-ice-glow">
              <Compass className="h-5 w-5 text-slate-950" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-base font-black tracking-wider polar-gradient-text">
                  POLARIS
                </span>
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  Antarctic Ops
                </span>
              </div>
            )}
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Navigation */}
          <div>
            {!collapsed && (
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Operations
              </span>
            )}
            <nav className="mt-2 space-y-1">{mainNavigation.map(renderNavLink)}</nav>
          </div>

          {/* Administration Navigation - Admin Only */}
          {user?.role === "ADMIN" && (
            <div>
              {!collapsed && (
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-amber-400/90">
                  Administration
                </span>
              )}
              <nav className="mt-2 space-y-1">{adminNavigation.map(renderNavLink)}</nav>
            </div>
          )}

          {/* System Navigation */}
          <div>
            {!collapsed && (
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                System
              </span>
            )}
            <nav className="mt-2 space-y-1">{systemNavigation.map(renderNavLink)}</nav>
          </div>
        </div>

        {/* User Profile & Collapse Toggle Footer */}
        <div className="border-t border-slate-800/80 p-3 bg-polar-900/40">
          {/* User profile capsule */}
          <div className="flex items-center gap-3 rounded-lg p-2 bg-slate-900/60 border border-slate-800">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-950 text-sky-300 border border-sky-700/60 font-bold text-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserCheck className="h-4 w-4" />}
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
            </div>
            {!collapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-xs font-semibold text-slate-200" title={user?.name || "Station Personnel"}>
                  {user?.name || "Station Personnel"}
                </span>
                <span
                  className={cn(
                    "truncate text-[10px] font-mono font-bold uppercase",
                    user?.role === "ADMIN"
                      ? "text-amber-400"
                      : user?.role === "OPERATOR"
                      ? "text-sky-400"
                      : "text-emerald-400"
                  )}
                >
                  {user?.role || "STATION ACCESS"}
                </span>
              </div>
            )}
          </div>

          {/* Desktop collapse button */}
          <button
            onClick={onToggleCollapse}
            className="mt-2 hidden lg:flex w-full items-center justify-center gap-2 rounded-md py-1.5 text-xs text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse Navigation</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
