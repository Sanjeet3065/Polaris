import React from "react";
import { Clock, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { Card } from "../ui/Card";
import { MOCK_TIMELINE_EVENTS } from "../../data/timeline";

export const OperationalTimeline: React.FC = () => {
  return (
    <Card className="p-5 bg-polar-900/60 border-slate-800/80 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Clock className="h-4 w-4 text-sky-400" />
            Operational Event Log
          </h3>
          <p className="text-xs text-slate-400">Sequential telemetry handshakes & diagnostics chronology</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          ACTIVE STREAM
        </span>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {MOCK_TIMELINE_EVENTS.map((event) => (
          <div key={event.id} className="relative group">
            {/* Timeline node icon */}
            <div className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 border border-slate-700 text-sky-400 shadow-sm">
              {event.status === "SUCCESS" ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              ) : event.status === "WARNING" ? (
                <AlertTriangle className="h-3 w-3 text-amber-400" />
              ) : (
                <Info className="h-3 w-3 text-sky-400" />
              )}
            </div>

            {/* Event Content */}
            <div className="rounded-lg border border-slate-800/70 bg-slate-950/50 p-2.5 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-sky-300 font-semibold">{event.timeFormatted}</span>
                <span className="rounded bg-slate-850 px-1.5 py-0.5 text-[9px] font-mono text-slate-400 border border-slate-700/60 uppercase">
                  {event.eventType}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-300 leading-snug">{event.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
