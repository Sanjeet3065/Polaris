import React from "react";
import { Ship, Navigation, Calendar, Anchor, CheckCircle2 } from "lucide-react";
import { Card } from "../ui/Card";
import { LogisticsOverview } from "../../types/logistics.types";

interface LogisticsOverviewCardsProps {
  overview: LogisticsOverview | null;
  loading?: boolean;
}

export const LogisticsOverviewCards: React.FC<LogisticsOverviewCardsProps> = ({
  overview,
  loading = false
}) => {
  const total = overview?.totalShipments || 0;
  const inTransit = overview?.inTransit || 0;
  const planned = overview?.planned || 0;
  const arrived = overview?.arrived || 0;
  const received = overview?.received || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Total Shipments */}
      <Card className="p-4 bg-polar-900/60 border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Ship className="h-4 w-4 text-cyan-400" />
            Total Manifests
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
            Season 2026
          </span>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-slate-100">
            {loading ? "..." : total}
          </div>
          <div className="mt-2 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/70">
            Monitored polar shipments
          </div>
        </div>
      </Card>

      {/* 2. In Transit */}
      <Card className="p-4 bg-polar-900/60 border-slate-800/80 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Navigation className="h-4 w-4 text-cyan-400 animate-pulse" />
            In Transit
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
            Active Voyages
          </span>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-cyan-400 flex items-center gap-2">
            {loading ? "..." : inTransit}
            {inTransit > 0 && <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />}
          </div>
          <div className="mt-2 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/70">
            En route to Antarctic bases
          </div>
        </div>
      </Card>

      {/* 3. Planned / Scheduled */}
      <Card className="p-4 bg-polar-900/60 border-slate-800/80 hover:border-slate-600 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-slate-400" />
            Planned
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700 bg-slate-800/60 text-slate-300">
            Scheduled
          </span>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-slate-200">
            {loading ? "..." : planned}
          </div>
          <div className="mt-2 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/70">
            Staging & loading manifests
          </div>
        </div>
      </Card>

      {/* 4. Arrived at Anchorage */}
      <Card className="p-4 bg-polar-900/60 border-slate-800/80 hover:border-amber-500/40 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Anchor className="h-4 w-4 text-amber-400" />
            Arrived
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400">
            Unloading
          </span>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-amber-400">
            {loading ? "..." : arrived}
          </div>
          <div className="mt-2 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/70">
            Awaiting station cargo intake
          </div>
        </div>
      </Card>

      {/* 5. Fully Received */}
      <Card className="p-4 bg-polar-900/60 border-slate-800/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Received
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            Completed
          </span>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {loading ? "..." : received}
          </div>
          <div className="mt-2 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/70">
            Reconciled with station stock
          </div>
        </div>
      </Card>
    </div>
  );
};
