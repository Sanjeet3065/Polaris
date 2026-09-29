import React from 'react';
import { ShipmentStatus } from '../../types/logistics.types';
import { CheckCircle2, Clock, Truck, Anchor, CheckCheck, XCircle } from 'lucide-react';

interface ShipmentTimelineProps {
  status: ShipmentStatus;
  departureDate?: string | null;
  expectedArrival?: string | null;
  actualArrival?: string | null;
  className?: string;
}

interface StepConfig {
  id: ShipmentStatus;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const LIFECYCLE_STEPS: StepConfig[] = [
  { id: 'PLANNED', label: 'Planned', description: 'Manifest Prepared', icon: Clock },
  { id: 'READY', label: 'Ready', description: 'Staged for Transit', icon: CheckCircle2 },
  { id: 'IN_TRANSIT', label: 'In Transit', description: 'Traverse / Sea Voyage', icon: Truck },
  { id: 'ARRIVED', label: 'Arrived', description: 'Docked at Station', icon: Anchor },
  { id: 'RECEIVED', label: 'Received', description: 'Stock Intake Complete', icon: CheckCheck },
];

const STATUS_ORDER: Record<ShipmentStatus, number> = {
  PLANNED: 0,
  READY: 1,
  IN_TRANSIT: 2,
  ARRIVED: 3,
  RECEIVED: 4,
  CANCELLED: -1,
};

export const ShipmentTimeline: React.FC<ShipmentTimelineProps> = ({
  status,
  departureDate,
  expectedArrival,
  actualArrival,
  className = '',
}) => {
  if (status === 'CANCELLED') {
    return (
      <div className={`p-4 rounded-xl border border-red-500/30 bg-red-950/20 flex items-center gap-3 ${className}`}>
        <XCircle className="w-6 h-6 text-red-400 shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-red-300">Shipment Cancelled</h4>
          <p className="text-xs text-red-400/80">This mission or supply transit was officially aborted or cancelled.</p>
        </div>
      </div>
    );
  }

  const currentIdx = STATUS_ORDER[status] ?? 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Horizontal Step Indicator */}
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-800 -z-0" />
        <div
          className="absolute top-4 left-6 h-0.5 bg-emerald-500 transition-all duration-500 -z-0"
          style={{ width: `${Math.min(100, (currentIdx / (LIFECYCLE_STEPS.length - 1)) * 100)}%` }}
        />

        <div className="relative z-10 flex justify-between items-start">
          {LIFECYCLE_STEPS.map((step, idx) => {
            const isCompleted = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex flex-col items-center text-center max-w-[100px]">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : isCurrent
                      ? 'bg-sky-500 text-slate-950 ring-4 ring-sky-500/20 animate-pulse'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="mt-2">
                  <div
                    className={`text-xs font-semibold ${
                      isCompleted ? 'text-emerald-400' : isCurrent ? 'text-sky-300 font-bold' : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="text-[10px] text-slate-400 hidden sm:block">{step.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date Milestones Grid */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs">
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Departure Date</div>
          <div className="font-mono text-slate-300 font-medium mt-0.5">
            {departureDate ? new Date(departureDate).toLocaleDateString() : 'Pending'}
          </div>
        </div>
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Expected Arrival (ETA)</div>
          <div className="font-mono text-sky-400 font-medium mt-0.5">
            {expectedArrival ? new Date(expectedArrival).toLocaleDateString() : 'Pending'}
          </div>
        </div>
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Actual Intake Date</div>
          <div className="font-mono text-emerald-400 font-medium mt-0.5">
            {actualArrival ? new Date(actualArrival).toLocaleDateString() : 'Awaiting arrival'}
          </div>
        </div>
      </div>
    </div>
  );
};
