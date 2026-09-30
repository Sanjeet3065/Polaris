import React from "react";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "./Card";
import { cn } from "../../lib/utils";

export interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  statusText?: string;
  statusVariant?: "nominal" | "warning" | "critical" | "info" | "neutral";
  icon?: LucideIcon;
  trend?: {
    value: string | number;
    direction?: "up" | "down" | "neutral";
    label?: string;
  };
  timestamp?: string;
  subtext?: string;
  className?: string;
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  unit,
  statusText,
  statusVariant = "neutral",
  icon: Icon,
  trend,
  timestamp,
  subtext,
  className,
  onClick
}) => {
  const variantStyles = {
    nominal: {
      border: "hover:border-emerald-500/40",
      iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      statusText: "text-emerald-400",
      trendText: "text-emerald-400"
    },
    warning: {
      border: "hover:border-amber-500/40",
      iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      statusText: "text-amber-400",
      trendText: "text-amber-400"
    },
    critical: {
      border: "hover:border-rose-500/40",
      iconBg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      statusText: "text-rose-400",
      trendText: "text-rose-400"
    },
    info: {
      border: "hover:border-sky-500/40",
      iconBg: "bg-sky-500/10 text-sky-400 border-sky-500/20",
      statusText: "text-sky-400",
      trendText: "text-sky-400"
    },
    neutral: {
      border: "hover:border-slate-700",
      iconBg: "bg-slate-800 text-slate-300 border-slate-700/60",
      statusText: "text-slate-400",
      trendText: "text-slate-400"
    }
  }[statusVariant];

  return (
    <Card
      onClick={onClick}
      className={cn(
        "relative overflow-hidden border-slate-800/80 bg-slate-900/60 transition-all duration-200 select-none",
        variantStyles.border,
        onClick && "cursor-pointer active:scale-[0.99]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 leading-snug block">
            {label}
          </span>
          <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {value}
            </span>
            {unit && (
              <span className="text-xs font-bold text-slate-400 font-mono">
                {unit}
              </span>
            )}
            {statusText && (
              <span className={cn("text-xs font-semibold ml-1 leading-snug", variantStyles.statusText)}>
                {statusText}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
              variantStyles.iconBg
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
      </div>

      {(trend || subtext || timestamp) && (
        <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-2.5 text-xs text-slate-400">
          {trend ? (
            <span className={cn("flex items-center gap-1 font-mono text-[11px]", variantStyles.trendText)}>
              {trend.direction === "up" ? (
                <TrendingUp className="h-3 w-3" />
              ) : trend.direction === "down" ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              <span>{trend.value}</span>
              {trend.label && <span className="text-slate-500 font-sans">({trend.label})</span>}
            </span>
          ) : subtext ? (
            <span className="text-[11px] text-slate-400 leading-snug">{subtext}</span>
          ) : (
            <span />
          )}

          {timestamp && (
            <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-auto">
              {timestamp}
            </span>
          )}
        </div>
      )}
    </Card>
  );
};
