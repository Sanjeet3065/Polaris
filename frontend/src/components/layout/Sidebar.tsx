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

  // Close mobile sidebar on Escape key
  React.useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseMobile();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  const renderNavLink = (item: NavItem) => {
    const Icon = item.icon;
    const content = (
      <NavLink
        to={item.path}
        onClick={onCloseMobile}
        className={({ isActive }) =>
          cn(
            "group flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 touch-target sm:min-h-0",
            isActive
              ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 shadow-[inset_0_1px_0_0_rgba(0,229,200,0.12)]"
              : "text-slate-400 hover:bg-polar-850 hover:text-slate-100 border border-transparent"
          )
        }
      >
        {({ isActive }) => (
          <>
            <Icon
              className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-200"
              )}
              aria-hidden="true"
            />
            {!collapsed && <span className="truncate">{item.name}</span>}
            {!collapsed && item.badge !== undefined && item.badge > 0 && (
              <span className="ml-auto rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 border border-amber-500/30">
                {item.badge}
              </span>
            )}
            {isActive && (
              <>
                <span className="sr-only">(current page)</span>
                <span className="absolute -left-2 h-4 w-1 rounded-r-full bg-cyan-400" />
              </>
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
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        aria-label="Polar Operations Navigation"
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-polar-750 bg-polar-950/95 backdrop-blur-2xl transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none",
          collapsed ? "lg:w-16" : "lg:w-64",
          "w-64",
          // Mobile responsive drawer state
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-polar-750">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-polar-800 to-polar-900 border border-cyan-500/30 shadow-titanium">
              <Compass className="h-5 w-5 text-cyan-400" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-base font-black tracking-wider polar-gradient-text">
                  POLARIS
                </span>
                <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                  Antarctic Ops • SIH26
                </span>
              </div>
            )}
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-2 text-slate-400 hover:bg-polar-800 hover:text-white lg:hidden"
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
              <span className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Mission Operations
              </span>
            )}
            <nav className="mt-2 space-y-1">{mainNavigation.map(renderNavLink)}</nav>
          </div>

          {/* Administration Navigation - Admin Only */}
          {user?.role === "ADMIN" && (
            <div>
              {!collapsed && (
                <span className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400/90">
                  Security & Admin
                </span>
              )}
              <nav className="mt-2 space-y-1">{adminNavigation.map(renderNavLink)}</nav>
            </div>
          )}

          {/* System Navigation */}
          <div>
            {!collapsed && (
              <span className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                System Infrastructure
              </span>
            )}
            <nav className="mt-2 space-y-1">{systemNavigation.map(renderNavLink)}</nav>
          </div>
        </div>

        {/* User Profile & Collapse Toggle Footer */}
        <div className="border-t border-polar-750 p-3 bg-polar-900/60">
          {/* User profile capsule */}
          <div className="flex items-center gap-3 rounded-lg p-2 bg-polar-950/80 border border-polar-750">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-polar-800 text-cyan-300 border border-cyan-500/30 font-bold text-xs font-mono">
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserCheck className="h-4 w-4" />}
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-polar-950" />
            </div>
            {!collapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-xs font-semibold text-slate-100" title={user?.name || "Station Personnel"}>
                  {user?.name || "Station Personnel"}
                </span>
                <span
                  className={cn(
                    "truncate text-[9px] font-mono font-bold uppercase",
                    user?.role === "ADMIN"
                      ? "text-amber-400"
                      : user?.role === "OPERATOR"
                      ? "text-cyan-400"
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
            className="mt-2 hidden lg:flex w-full items-center justify-center gap-2 rounded-md py-1.5 text-xs text-slate-400 hover:bg-polar-800 hover:text-slate-100 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="font-mono text-[11px]">Collapse View</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
