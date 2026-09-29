import React from "react";
import { TopKpiCard } from "../../types/analytics.types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  kpiCards: TopKpiCard[];
  isLoading: boolean;
}

export const AnalyticsKpiGrid: React.FC<Props> = ({ kpiCards, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 h-28 animate-pulse flex flex-col justify-between"
          >
            <div className="h-3 bg-slate-800 rounded w-2/3" />
            <div className="h-7 bg-slate-800 rounded w-1/2" />
            <div className="h-3 bg-slate-800 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  const renderTrendIcon = (trend: TopKpiCard["trend"]) => {
    switch (trend) {
      case "RISING":
        return <TrendingUp className="w-3.5 h-3.5" />;
      case "FALLING":
        return <TrendingDown className="w-3.5 h-3.5" />;
      case "STABLE":
        return <Minus className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  const getStatusBorder = (status: TopKpiCard["status"]) => {
    switch (status) {
      case "CRITICAL":
        return "border-rose-500/40 bg-rose-500/5";
      case "WARNING":
        return "border-amber-500/40 bg-amber-500/5";
      default:
        return "border-slate-800 bg-slate-900/80";
    }
  };

  const getChangeBadge = (card: TopKpiCard) => {
    if (card.changePercent === null) {
      return (
        <span className="text-[10px] text-slate-500 flex items-center gap-1">
          <Minus className="w-3 h-3" /> No prior data
        </span>
      );
    }

    const isPositive = card.changePercent > 0;
    const sign = isPositive ? "+" : "";

    // If neutral change (e.g. power generation/consumption), use neutral blue/cyan badge
    if (card.neutralChange) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
          {renderTrendIcon(card.trend)}
          {sign}
          {card.changePercent}%
        </span>
      );
    }

    // Contextual: for alerts/incidents/risk, rising is bad, falling is good
    const isRiskMetric =
      card.key === "open_alerts" ||
      card.key === "open_incidents" ||
      card.key === "maintenance_risk" ||
      card.key === "critical_inventory";

    const isGood = isRiskMetric ? card.changePercent <= 0 : card.changePercent >= 0;

    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
          isGood
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
        }`}
      >
        {renderTrendIcon(card.trend)}
        {sign}
        {card.changePercent}%
      </span>
    );
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
      {kpiCards.map((card) => (
        <div
          key={card.key}
          className={`border rounded-xl p-3.5 shadow-sm transition-all hover:border-slate-700 flex flex-col justify-between ${getStatusBorder(
            card.status
          )}`}
        >
          <div>
            <div className="text-[11px] font-medium text-slate-400 truncate tracking-wide">
              {card.label}
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-white tracking-tight">
                {card.currentValue !== null ? card.currentValue : "N/A"}
              </span>
              <span className="text-xs font-normal text-slate-400">{card.unit}</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
            <div>{getChangeBadge(card)}</div>
            {card.previousValue !== null && (
              <span className="text-[10px] text-slate-500">
                prev {card.previousValue}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
