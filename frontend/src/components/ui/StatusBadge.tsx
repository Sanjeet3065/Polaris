import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  PowerOff,
  ShieldAlert,
  Radio,
  RefreshCw,
  Clock,
  Sparkles
} from "lucide-react";
import { StationStatus } from "../../types";
import { cn } from "../../lib/utils";

export type PolarisOperationalStatus =
  | StationStatus
  | "HEALTHY"
  | "NORMAL"
  | "STALE"
  | "RECONNECTING"
  | "LIVE"
  | "SIMULATION";

interface StatusBadgeProps {
  status: PolarisOperationalStatus | string;
  className?: string;
  size?: "sm" | "md" | "lg";
  showDotOnly?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
  size = "md",
  showDotOnly = false
}) => {
  const normalized = (status || "").toUpperCase();

  const configMap: Record<
    string,
    {
      label: string;
      icon: React.ElementType;
      dotClass: string;
      containerClass: string;
      symbol: string;
    }
  > = {
    OPERATIONAL: {
      label: "OPERATIONAL",
      icon: CheckCircle2,
      dotClass: "bg-emerald-400",
      containerClass: "bg-emerald-950/70 text-emerald-300 border-emerald-800/60 shadow-aurora-glow",
      symbol: "●"
    },
    HEALTHY: {
      label: "OPERATIONAL",
      icon: CheckCircle2,
      dotClass: "bg-emerald-400",
      containerClass: "bg-emerald-950/70 text-emerald-300 border-emerald-800/60 shadow-aurora-glow",
      symbol: "●"
    },
    NORMAL: {
      label: "OPERATIONAL",
      icon: CheckCircle2,
      dotClass: "bg-emerald-400",
      containerClass: "bg-emerald-950/70 text-emerald-300 border-emerald-800/60 shadow-aurora-glow",
      symbol: "●"
    },
    LIVE: {
      label: "LIVE",
      icon: Radio,
      dotClass: "bg-cyan-400 animate-pulse",
      containerClass: "bg-cyan-950/70 text-cyan-300 border-cyan-800/60 shadow-[0_0_12px_rgba(6,182,212,0.3)]",
      symbol: "●"
    },
    SIMULATION: {
      label: "SIMULATION",
      icon: Sparkles,
      dotClass: "bg-sky-400",
      containerClass: "bg-sky-950/70 text-sky-300 border-sky-800/60",
      symbol: "✦"
    },
    WARNING: {
      label: "WARNING",
      icon: AlertTriangle,
      dotClass: "bg-amber-400",
      containerClass: "bg-amber-950/70 text-amber-300 border-amber-800/60",
      symbol: "▲"
    },
    DEGRADED: {
      label: "DEGRADED",
      icon: AlertTriangle,
      dotClass: "bg-amber-400",
      containerClass: "bg-amber-950/70 text-amber-300 border-amber-800/60",
      symbol: "▲"
    },
    STALE: {
      label: "STALE",
      icon: Clock,
      dotClass: "bg-amber-400",
      containerClass: "bg-amber-950/70 text-amber-300 border-amber-800/60",
      symbol: "◌"
    },
    RECONNECTING: {
      label: "RECONNECTING",
      icon: RefreshCw,
      dotClass: "bg-amber-400 animate-spin",
      containerClass: "bg-amber-950/70 text-amber-300 border-amber-800/60",
      symbol: "◌"
    },
    CRITICAL: {
      label: "CRITICAL",
      icon: AlertOctagon,
      dotClass: "bg-red-400 animate-pulse",
      containerClass: "bg-red-950/70 text-red-300 border-red-800/60 shadow-alert-glow",
      symbol: "■"
    },
    OFFLINE: {
      label: "OFFLINE",
      icon: PowerOff,
      dotClass: "bg-slate-500",
      containerClass: "bg-slate-900 text-slate-400 border-slate-700",
      symbol: "○"
    }
  };

  const config = configMap[normalized] || {
    label: normalized || "UNKNOWN",
    icon: ShieldAlert,
    dotClass: "bg-slate-400",
    containerClass: "bg-slate-900 text-slate-400 border-slate-800",
    symbol: "●"
  };

  const Icon = config.icon;

  if (showDotOnly) {
    return (
      <span
        title={config.label}
        aria-label={`Status: ${config.label}`}
        className={cn("inline-block h-2.5 w-2.5 rounded-full ring-2 ring-slate-950", config.dotClass, className)}
      />
    );
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] font-medium gap-1",
    md: "px-2.5 py-1 text-xs font-semibold gap-1.5",
    lg: "px-3 py-1.5 text-xs font-bold gap-2"
  };

  return (
    <span
      role="status"
      aria-label={`System Status: ${config.label}`}
      className={cn(
        "inline-flex items-center rounded-full border transition-all duration-200 select-none font-mono",
        sizeClasses[size],
        config.containerClass,
        className
      )}
    >
      <Icon className={size === "sm" ? "h-3 w-3 shrink-0" : "h-3.5 w-3.5 shrink-0"} aria-hidden="true" />
      <span className="tracking-wide uppercase">{config.label}</span>
    </span>
  );
};

