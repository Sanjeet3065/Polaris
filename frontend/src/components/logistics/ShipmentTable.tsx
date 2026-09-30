import React from 'react';
import { Shipment, ShipmentStatus, ShipmentPriority } from '../../types/logistics.types';
import { 
  Truck, Anchor, ArrowRight, Eye, CheckCircle2, 
  Calendar, AlertCircle, Clock, Plane
} from 'lucide-react';

interface ShipmentTableProps {
  shipments: Shipment[];
  isLoading: boolean;
  onSelectShipment: (shipment: Shipment) => void;
  onReceiveCargoClick?: (shipment: Shipment) => void;
  userRole?: string;
}

export const ShipmentTable: React.FC<ShipmentTableProps> = ({
  shipments,
  isLoading,
  onSelectShipment,
  onReceiveCargoClick,
  userRole = 'OPERATOR',
}) => {
  const getStatusBadge = (status: ShipmentStatus) => {
    switch (status) {
      case 'IN_TRANSIT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 animate-pulse">
            <Truck className="w-3.5 h-3.5" /> In Transit
          </span>
        );
      case 'ARRIVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Anchor className="w-3.5 h-3.5" /> Arrived at Port
          </span>
        );
      case 'RECEIVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Ingested / Stored
          </span>
        );
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Clock className="w-3.5 h-3.5" /> Ready for Dispatch
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700/50 text-slate-300 border border-slate-600">
            <Clock className="w-3.5 h-3.5" /> Planned
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: ShipmentPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">HIGH</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">NORMAL</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
        <div className="inline-block w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-slate-400">Loading polar logistics shipments...</p>
      </div>
    );
  }

  if (shipments.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
        <Truck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h4 className="text-base font-semibold text-slate-300">No Polar Shipments Found</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          No current or planned resupply traverses, maritime cargo runs, or inter-station transfers match your current filter.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-polar-900/60 border border-polar-750 rounded-xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[700px]">
          <thead className="bg-polar-950/80 text-slate-400 uppercase font-medium border-b border-polar-750">
            <tr>
              <th className="px-4 py-3.5">Shipment Reference</th>
              <th className="px-4 py-3.5">Route</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Priority</th>
              <th className="px-4 py-3.5 text-center">Cargo Items</th>
              <th className="px-4 py-3.5">Schedule (ETA)</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-300">
            {shipments.map((shipment) => {
              const itemCount = shipment.items?.length || 0;
              const isArrivalReady = shipment.status === 'ARRIVED' || shipment.status === 'IN_TRANSIT';
              const isReceived = shipment.status === 'RECEIVED';

              return (
                <tr
                  key={shipment.id}
                  className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  onClick={() => onSelectShipment(shipment)}
                >
                  {/* Reference & Carrier */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        {shipment.carrier?.toLowerCase().includes('flight') || shipment.carrier?.toLowerCase().includes('il-76') ? (
                          <Plane className="w-4 h-4" />
                        ) : (
                          <Truck className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-mono font-bold text-white group-hover:text-sky-300 transition-colors">
                          {shipment.shipmentNumber}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {shipment.carrier || 'Polar Logistics Service'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Route */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="text-slate-300">{shipment.origin}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-sky-300 font-semibold">
                        {shipment.destinationStation?.name || 'Station'}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    {getStatusBadge(shipment.status)}
                  </td>

                  {/* Priority */}
                  <td className="px-4 py-3.5">
                    {getPriorityBadge(shipment.priority)}
                  </td>

                  {/* Cargo count */}
                  <td className="px-4 py-3.5 text-center font-mono font-medium">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {itemCount} {itemCount === 1 ? 'line' : 'lines'}
                    </span>
                  </td>

                  {/* Schedule */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-mono text-slate-300">
                        {shipment.estimatedArrival
                          ? new Date(shipment.estimatedArrival).toLocaleDateString()
                          : 'TBD'}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onSelectShipment(shipment)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                        title="View Manifest & Timeline"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {isArrivalReady && !isReceived && (userRole === 'ADMIN' || userRole === 'OPERATOR') && (
                        <button
                          onClick={() => {
                            if (onReceiveCargoClick) {
                              onReceiveCargoClick(shipment);
                            } else {
                              onSelectShipment(shipment);
                            }
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-md transition-colors flex items-center gap-1 shadow-sm shadow-emerald-500/20"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Receive Cargo
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
