import React from 'react';
import { InventoryOverview, LogisticsOverview } from '../../types/logistics.types';
import { MapPin, ShieldAlert, CheckCircle2, Truck, AlertTriangle } from 'lucide-react';

interface StationComparisonData {
  stationId: string;
  name: string;
  location: string;
  coordinates: string;
  inventoryOverview: InventoryOverview | null;
  logisticsOverview: LogisticsOverview | null;
}

interface StationInventoryComparisonProps {
  maitriData: StationComparisonData;
  bharatiData: StationComparisonData;
  onSelectStation?: (stationId: string) => void;
}

export const StationInventoryComparison: React.FC<StationInventoryComparisonProps> = ({
  maitriData,
  bharatiData,
  onSelectStation,
}) => {
  const renderStationCard = (data: StationComparisonData) => {
    const totalItems = data.inventoryOverview?.totalItems || 0;
    const criticalItems = data.inventoryOverview?.criticalStock || 0;
    const lowStockItems = data.inventoryOverview?.lowStock || 0;
    const inStockItems = data.inventoryOverview?.inStock || 0;
    const outOfStockItems = data.inventoryOverview?.outOfStock || 0;
    const inTransitShipments = data.logisticsOverview?.inTransit || 0;

    const healthRate = totalItems > 0 
      ? Math.round((inStockItems / totalItems) * 100) 
      : 100;

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
        {/* Top ambient accent glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-indigo-500" />

        <div>
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-wide">{data.name}</h3>
                <p className="text-xs text-slate-400 font-mono">{data.location} • {data.coordinates}</p>
              </div>
            </div>
            {onSelectStation && (
              <button
                onClick={() => onSelectStation(data.stationId)}
                className="text-xs font-semibold px-3 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg border border-slate-700 transition-colors"
              >
                Focus Station
              </button>
            )}
          </div>

          {/* Supply Health Bar */}
          <div className="mt-5 p-4 bg-slate-950/40 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400 font-medium">Supply Resilience Index</span>
              <span className={`font-mono font-bold ${
                healthRate >= 85 ? 'text-emerald-400' : healthRate >= 65 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {healthRate}% Optimal
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 transition-all duration-500"
                style={{ width: `${(inStockItems / (totalItems || 1)) * 100}%` }}
                title={`In Stock: ${inStockItems}`}
              />
              <div
                className="bg-amber-500 transition-all duration-500"
                style={{ width: `${(lowStockItems / (totalItems || 1)) * 100}%` }}
                title={`Low Stock: ${lowStockItems}`}
              />
              <div
                className="bg-rose-500 transition-all duration-500"
                style={{ width: `${((criticalItems + outOfStockItems) / (totalItems || 1)) * 100}%` }}
                title={`Critical / Out: ${criticalItems + outOfStockItems}`}
              />
            </div>
          </div>

          {/* Inventory Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Lines</div>
              <div className="text-xl font-bold font-mono text-white mt-1">{totalItems}</div>
            </div>

            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Nominal
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{inStockItems}</div>
            </div>

            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Low Stock
              </div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-1">{lowStockItems}</div>
            </div>

            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] text-rose-400 uppercase tracking-wider flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Critical
              </div>
              <div className="text-xl font-bold font-mono text-rose-400 mt-1">{criticalItems}</div>
            </div>
          </div>
        </div>

        {/* In Transit Resupply Indicator */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Truck className="w-4 h-4 text-sky-400" />
            <span>Active Resupply Shipments:</span>
          </div>
          <span className="font-mono font-bold text-sky-300 bg-sky-950/40 px-2.5 py-0.5 rounded-full border border-sky-500/20">
            {inTransitShipments} in transit
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">
            Station Supply Resilience Comparison
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational parity assessment between Maitri (Schirmacher Oasis) and Bharati (Larsemann Hills).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderStationCard(maitriData)}
        {renderStationCard(bharatiData)}
      </div>
    </div>
  );
};
