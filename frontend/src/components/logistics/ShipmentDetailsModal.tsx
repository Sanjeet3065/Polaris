import React, { useState } from 'react';
import { Shipment, ShipmentStatus } from '../../types/logistics.types';
import { logisticsService } from '../../services/logisticsService';
import { ShipmentTimeline } from './ShipmentTimeline';
import { 
  X, Truck, Anchor, CheckCircle2, AlertTriangle, 
  ArrowRight, ShieldCheck, Box, FileText, Loader2
} from 'lucide-react';

interface ShipmentDetailsModalProps {
  shipment: Shipment | null;
  isOpen: boolean;
  onClose: () => void;
  onShipmentUpdated: () => void;
  userRole?: string;
}

export const ShipmentDetailsModal: React.FC<ShipmentDetailsModalProps> = ({
  shipment,
  isOpen,
  onClose,
  onShipmentUpdated,
  userRole = 'OPERATOR',
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !shipment) return null;

  const canEdit = userRole === 'ADMIN' || userRole === 'OPERATOR';
  const isReceived = shipment.status === 'RECEIVED';
  const isCancelled = shipment.status === 'CANCELLED';

  const handleStatusTransition = async (newStatus: ShipmentStatus) => {
    try {
      setIsUpdating(true);
      setError(null);
      setSuccessMsg(null);
      await logisticsService.updateShipmentStatus(shipment.id, { status: newStatus });
      setSuccessMsg(`Shipment status updated to ${newStatus}`);
      onShipmentUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      setError(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReceiveCargo = async () => {
    if (!window.confirm(`Confirm intake of all cargo items for ${shipment.shipmentNumber} into ${shipment.destinationStation?.name || 'station'} inventory? This action is atomic and irreversible.`)) {
      return;
    }
    try {
      setIsUpdating(true);
      setError(null);
      setSuccessMsg(null);
      await logisticsService.receiveShipmentCargo(shipment.id, {
        items: (shipment.items || []).map((item) => ({
          shipmentItemId: item.id,
          receivedQty: item.quantity,
        })),
        notes: `Cargo intake confirmed for ${shipment.shipmentNumber}`,
      });
      setSuccessMsg(`Cargo verified and added to station reserves successfully!`);
      onShipmentUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cargo intake failed';
      setError(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">CRITICAL PRIORITY</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">HIGH PRIORITY</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-700/50 text-slate-300 border border-slate-600">NORMAL PRIORITY</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shipment-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="shipment-modal-title" className="text-lg font-bold text-white tracking-wide">
                  {shipment.shipmentNumber}
                </h3>
                {getPriorityBadge(shipment.priority)}
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>{shipment.origin}</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span className="text-sky-300 font-semibold">{shipment.destinationStation?.name || 'Station'}</span>
                {shipment.carrier && <span className="text-slate-500">• {shipment.carrier}</span>}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-300 text-xs">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-300 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Voyage & Traverse Progression
            </h4>
            <ShipmentTimeline
              status={shipment.status}
              departureDate={shipment.plannedDeparture || shipment.actualDeparture}
              expectedArrival={shipment.estimatedArrival}
              actualArrival={shipment.actualArrival}
            />
          </div>

          {/* Cargo Manifest Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-sky-400" />
                Cargo Manifest Specifications ({shipment.items?.length || 0} commodities)
              </h4>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 uppercase font-medium">
                  <tr>
                    <th className="px-4 py-3">Commodity / Item</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Manifest Qty</th>
                    <th className="px-4 py-3 text-right">Received Qty</th>
                    <th className="px-4 py-3 text-center">Intake Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {shipment.items && shipment.items.length > 0 ? (
                    shipment.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-medium text-white">
                          {item.name}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {item.category || 'GENERAL'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-sky-300">
                          {item.quantity.toLocaleString()} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-400">
                          {item.receivedQty ? item.receivedQty.toLocaleString() : '0'} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.receivedQty && item.receivedQty >= item.quantity ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Fully Stored
                            </span>
                          ) : isReceived ? (
                            <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                              Partially Stored
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                              Pending Unloading
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No specific itemized cargo records found in manifest.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Operational Notes */}
          {shipment.notes && (
            <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-1">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" /> Dispatch Instructions & Notes
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                {shipment.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions (Lifecycle Controls & Stock Receiving) */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Current Phase:</span>
            <span className="text-xs font-bold text-sky-400 font-mono">{shipment.status}</span>
          </div>

          {canEdit && !isReceived && !isCancelled && (
            <div className="flex items-center gap-2 flex-wrap">
              {shipment.status === 'PLANNED' && (
                <button
                  onClick={() => handleStatusTransition('READY')}
                  disabled={isUpdating}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  Mark as Ready for Dispatch
                </button>
              )}

              {shipment.status === 'READY' && (
                <button
                  onClick={() => handleStatusTransition('IN_TRANSIT')}
                  disabled={isUpdating}
                  className="px-3 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-sky-500/20"
                >
                  <Truck className="w-3.5 h-3.5" /> Dispatch (In Transit)
                </button>
              )}

              {shipment.status === 'IN_TRANSIT' && (
                <button
                  onClick={() => handleStatusTransition('ARRIVED')}
                  disabled={isUpdating}
                  className="px-3 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-teal-500/20"
                >
                  <Anchor className="w-3.5 h-3.5" /> Confirm Arrival at Station
                </button>
              )}

              {/* Receive Cargo into Station Inventory */}
              {(shipment.status === 'ARRIVED' || shipment.status === 'IN_TRANSIT') && (
                <button
                  onClick={handleReceiveCargo}
                  disabled={isUpdating}
                  className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                >
                  {isUpdating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  Receive & Ingest Into Inventory
                </button>
              )}
            </div>
          )}

          {isReceived && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Manifest fully verified and ingested into station inventory.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
