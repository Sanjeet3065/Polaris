import React from "react";
import { Clock, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { Card } from "../ui/Card";
import { MOCK_TIMELINE_EVENTS } from "../../data/timeline";

export const OperationalTimeline: React.FC = () => {
  return (
    <Card className="p-4 sm:p-5 bg-polar-900/75 border-polar-750 shadow-titanium space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-polar-750 pb-3">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-400" />
            <span>Operational Chronology</span>
          </h3>
          <p className="text-[11px] text-slate-400">Sequential telemetry handshakes & diagnostics event stream</p>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>ACTIVE CHRONO</span>
        </span>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 space-y-3.5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-polar-750">
        {MOCK_TIMELINE_EVENTS.map((event) => (
          <div key={event.id} className="relative group">
            {/* Timeline node icon */}
            <div className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-polar-900 border border-polar-750 text-orange-400 shadow-sm">
              {event.status === "SUCCESS" ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              ) : event.status === "WARNING" ? (
                <AlertTriangle className="h-3 w-3 text-amber-400" />
              ) : (
                <Info className="h-3 w-3 text-slate-400" />
              )}
            </div>

            {/* Event Content */}
            <div className="rounded-xl border border-polar-750 bg-polar-950/80 p-2.5 hover:border-polar-700 transition-colors">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-orange-400 font-semibold text-[11px]">{event.timeFormatted}</span>
                <span className="rounded bg-polar-800 px-1.5 py-0.5 text-[9px] font-mono text-slate-400 border border-polar-700 uppercase">
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
