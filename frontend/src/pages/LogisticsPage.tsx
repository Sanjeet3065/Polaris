/**
 * POLARIS — Polar Logistics & Inventory Control Center Page
 * Phase 8: Logistics + Inventory Management
 * 
 * Production-quality operational supply and inventory management dashboard for Maitri and Bharati stations.
 * Integrates:
 *   - PostgreSQL / Prisma REST API for Inventory, Stock Movements, and Logistics Shipments
 *   - Deterministic threshold evaluation (IN_STOCK, LOW_STOCK, CRITICAL, OUT_OF_STOCK)
 *   - Concurrency and negative stock protection
 *   - Intra-polar station-to-station transfers (Maitri <-> Bharati)
 *   - Full Cargo Manifest intake and lifecycle timeline tracking
 */

import React, { useState, useEffect, useCallback } from "react";
import { useStation } from "../context/StationContext";
import { useAuth } from "../context/AuthContext";
import { 
  InventoryItem, Shipment, InventoryOverview, LogisticsOverview, 
  ShipmentStatus, ShipmentPriority 
} from "../types/logistics.types";
import { StationFilter } from "../types";
import { logisticsService } from "../services/logisticsService";
import { 
  InventoryOverviewCards, InventoryFilters, InventoryTable, InventoryItemDrawer,
  StockMovementModal, StockTransferModal, CreateItemModal, ReplenishmentPanel,
  LogisticsOverviewCards, ShipmentTable, ShipmentDetailsModal, StationInventoryComparison
} from "../components/logistics";
import { 
  Boxes, Truck, RefreshCw, Plus, ArrowLeftRight, 
  AlertTriangle
} from "lucide-react";

export const LogisticsPage: React.FC = () => {
  const { selectedStation, stationInfo, setSelectedStation } = useStation();
  const { user } = useAuth();
  const userRole = user?.role || "VIEWER";
  const canManage = userRole === "ADMIN" || userRole === "OPERATOR";

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"inventory" | "shipments">("inventory");

  // Filter state for inventory
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState<number>(1);
  const limit = 10;

  // Filter state for shipments
  const [shipmentStatusFilter, setShipmentStatusFilter] = useState<ShipmentStatus | undefined>(undefined);
  const [shipmentPriorityFilter, setShipmentPriorityFilter] = useState<ShipmentPriority | undefined>(undefined);
  const [shipmentSearch, setShipmentSearch] = useState<string>("");

  // Data states
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryPagination, setInventoryPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [inventoryOverview, setInventoryOverview] = useState<InventoryOverview | null>(null);
  const [logisticsOverview, setLogisticsOverview] = useState<LogisticsOverview | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);

  // Station Comparison Data (when selectedStation === 'ALL')
  const [maitriOverview, setMaitriOverview] = useState<InventoryOverview | null>(null);
  const [bharatiOverview, setBharatiOverview] = useState<InventoryOverview | null>(null);
  const [maitriLogistics, setMaitriLogistics] = useState<LogisticsOverview | null>(null);
  const [bharatiLogistics, setBharatiLogistics] = useState<LogisticsOverview | null>(null);

  // Loading & error states
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);
  const [isLoadingShipments, setIsLoadingShipments] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Drawers
  const [selectedItemForDrawer, setSelectedItemForDrawer] = useState<InventoryItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [selectedItemForMovement, setSelectedItemForMovement] = useState<InventoryItem | null>(null);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);

  const [selectedItemForTransfer, setSelectedItemForTransfer] = useState<InventoryItem | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const [isCreateItemModalOpen, setIsCreateItemModalOpen] = useState(false);

  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);

  // Reset page when station changes
  useEffect(() => {
    setPage(1);
  }, [selectedStation]);

  // Fetch Inventory Data
  const fetchInventory = useCallback(async () => {
    try {
      setIsLoadingInventory(true);
      setError(null);
      const res = await logisticsService.getInventory({
        page,
        limit,
        station: selectedStation,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
        search: searchFilter || undefined,
        sortBy,
        sortOrder
      });
      setInventoryItems(res.data || []);
      if (res.pagination) {
        setInventoryPagination(res.pagination);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to fetch inventory records";
      setError(msg);
    } finally {
      setIsLoadingInventory(false);
    }
  }, [selectedStation, page, limit, categoryFilter, statusFilter, searchFilter, sortBy, sortOrder]);

  // Fetch KPI Overviews
  const fetchOverviews = useCallback(async () => {
    try {
      const [invKpi, logKpi] = await Promise.all([
        logisticsService.getInventoryOverview(selectedStation),
        logisticsService.getLogisticsOverview(selectedStation),
      ]);
      setInventoryOverview(invKpi.data);
      setLogisticsOverview(logKpi.data);

      // If 'ALL' is selected, also fetch station breakdown for comparison cards
      if (selectedStation === "ALL") {
        const [mInv, bInv, mLog, bLog] = await Promise.all([
          logisticsService.getInventoryOverview("MAITRI"),
          logisticsService.getInventoryOverview("BHARATI"),
          logisticsService.getLogisticsOverview("MAITRI"),
          logisticsService.getLogisticsOverview("BHARATI"),
        ]);
        setMaitriOverview(mInv.data);
        setBharatiOverview(bInv.data);
        setMaitriLogistics(mLog.data);
        setBharatiLogistics(bLog.data);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch overview metrics", err);
    }
  }, [selectedStation]);

  // Fetch Shipments
  const fetchShipments = useCallback(async () => {
    try {
      setIsLoadingShipments(true);
      const res = await logisticsService.getShipments({
        station: selectedStation,
        status: shipmentStatusFilter,
        priority: shipmentPriorityFilter,
        search: shipmentSearch,
        limit: 20,
      });
      setShipments(res.data || []);
    } catch (err: unknown) {
      console.error("Failed to fetch polar shipments", err);
    } finally {
      setIsLoadingShipments(false);
    }
  }, [selectedStation, shipmentStatusFilter, shipmentPriorityFilter, shipmentSearch]);

  // Initial and reactive data triggers
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  useEffect(() => {
    fetchOverviews();
  }, [fetchOverviews]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  // Master refresh handler
  const handleRefreshAll = () => {
    fetchInventory();
    fetchOverviews();
    fetchShipments();
  };

  const handleResetFilters = () => {
    setCategoryFilter("");
    setStatusFilter("");
    setSearchFilter("");
    setSortBy("name");
    setSortOrder("asc");
    setPage(1);
  };

  // Handlers for Drawer & Actions
  const handleOpenItemDetails = (item: InventoryItem) => {
    setSelectedItemForDrawer(item);
    setIsDrawerOpen(true);
  };

  const handleOpenStockMovement = (item: InventoryItem) => {
    setSelectedItemForMovement(item);
    setIsMovementModalOpen(true);
  };

  const handleOpenStockTransfer = (item: InventoryItem) => {
    setSelectedItemForTransfer(item);
    setIsTransferModalOpen(true);
  };

  const handleOpenShipmentDetails = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setIsShipmentModalOpen(true);
  };

  // Low & critical items for Replenishment Panel
  const lowStockItems = inventoryItems.filter(
    (i) => i.status === "LOW_STOCK" || i.status === "CRITICAL" || i.status === "OUT_OF_STOCK"
  );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
              <Boxes className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                Polar Logistics & Inventory Control Center
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                {selectedStation === "ALL"
                  ? "All Antarctic Stations • Dual-Outpost Supply Network"
                  : `${stationInfo.name} • ${stationInfo.location.region}`}
              </p>
            </div>
          </div>
        </div>

        {/* Global Operational Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={handleRefreshAll}
            className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-300 bg-polar-900 border border-slate-700/80 rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm"
            title="Refresh All Logistics Data"
          >
            <RefreshCw className="w-4 h-4 text-orange-400" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {canManage && (
            <>
              <button
                onClick={() => {
                  if (inventoryItems.length > 0) {
                    setSelectedItemForTransfer(inventoryItems[0]);
                    setIsTransferModalOpen(true);
                  }
                }}
                className="px-3 py-2 text-xs font-semibold text-slate-200 bg-polar-800 hover:bg-polar-750 border border-polar-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-titanium"
              >
                <ArrowLeftRight className="w-4 h-4 text-amber-400" />
                <span>Inter-Station Transfer</span>
              </button>

              <button
                onClick={() => setIsCreateItemModalOpen(true)}
                className="px-3 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 border border-orange-500/40 rounded-xl transition-all flex items-center gap-1.5 shadow-titanium"
              >
                <Plus className="w-4 h-4" />
                <span>Register Supply</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-300 text-xs">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Operational Overview KPIs */}
      <section aria-labelledby="inventory-kpi-heading" className="space-y-4">
        <h2 id="inventory-kpi-heading" className="sr-only">Inventory and Logistics KPIs</h2>
        <InventoryOverviewCards overview={inventoryOverview} loading={isLoadingInventory} />
        <LogisticsOverviewCards overview={logisticsOverview} loading={isLoadingShipments} />
      </section>

      {/* 2. Station Supply Resilience Comparison (Visible in ALL stations view) */}
      {selectedStation === "ALL" && maitriOverview && bharatiOverview && (
        <section aria-labelledby="station-comparison-heading" className="pt-2">
          <h2 id="station-comparison-heading" className="sr-only">Station Logistics Comparison</h2>
          <StationInventoryComparison
            maitriData={{
              stationId: "MAITRI",
              name: "Maitri Research Station",
              location: "Schirmacher Oasis",
              coordinates: "70.77° S, 11.73° E",
              inventoryOverview: maitriOverview,
              logisticsOverview: maitriLogistics,
            }}
            bharatiData={{
              stationId: "BHARATI",
              name: "Bharati Research Station",
              location: "Larsemann Hills",
              coordinates: "69.41° S, 76.19° E",
              inventoryOverview: bharatiOverview,
              logisticsOverview: bharatiLogistics,
            }}
            onSelectStation={(stId) => setSelectedStation(stId as StationFilter)}
          />
        </section>
      )}

      {/* 3. Operational Replenishment Planning Panel (Only if low/critical stock items exist) */}
      {lowStockItems.length > 0 && (
        <section aria-labelledby="replenishment-heading">
          <h2 id="replenishment-heading" className="sr-only">Replenishment Priority Action</h2>
          <ReplenishmentPanel
            items={lowStockItems}
            onSelectItem={handleOpenItemDetails}
            onRecordMovement={handleOpenStockMovement}
            canManage={canManage}
          />
        </section>
      )}

      {/* 4. Tab Navigation Bar */}
      <div className="flex border-b border-polar-750 gap-4 pt-4">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "inventory"
              ? "border-orange-500 text-orange-400 font-bold font-mono"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Station Inventory & Reserves</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-polar-800 text-slate-300 font-mono">
            {inventoryPagination.total}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("shipments")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "shipments"
              ? "border-amber-500 text-amber-400 font-bold font-mono"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Polar Shipments & Resupply Manifests</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-polar-800 text-slate-300 font-mono">
            {shipments.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Inventory Table & Filters */}
      {activeTab === "inventory" && (
        <div className="space-y-4">
          <InventoryFilters
            station={selectedStation}
            onStationChange={(st) => setSelectedStation(st)}
            category={categoryFilter}
            onCategoryChange={setCategoryFilter}
            status={statusFilter}
            onStatusChange={setStatusFilter}
            search={searchFilter}
            onSearchChange={setSearchFilter}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            onReset={handleResetFilters}
          />

          <InventoryTable
            items={inventoryItems}
            loading={isLoadingInventory}
            page={inventoryPagination.page}
            totalPages={inventoryPagination.totalPages}
            totalItems={inventoryPagination.total}
            limit={inventoryPagination.limit}
            onPageChange={(p) => setPage(p)}
            onSelectItem={handleOpenItemDetails}
            onRecordMovement={handleOpenStockMovement}
            onTransferStock={handleOpenStockTransfer}
            canManage={canManage}
          />
        </div>
      )}

      {/* Tab 2: Polar Cargo Shipments */}
      {activeTab === "shipments" && (
        <div className="space-y-4">
          {/* Shipment Filters */}
          <div className="bg-polar-900/60 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Status Filter:</span>
              {(["ALL", "IN_TRANSIT", "ARRIVED", "RECEIVED", "READY", "PLANNED"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setShipmentStatusFilter(st === "ALL" ? undefined : (st as ShipmentStatus))}
                  className={`px-2.5 py-1 rounded-lg border transition-colors ${
                    (st === "ALL" && !shipmentStatusFilter) || shipmentStatusFilter === st
                      ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-semibold"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShipmentPriorityFilter(
                    shipmentPriorityFilter === "CRITICAL"
                      ? undefined
                      : "CRITICAL"
                  );
                }}
                className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${
                  shipmentPriorityFilter === "CRITICAL"
                    ? "bg-rose-500/20 border-rose-500/40 text-rose-300 font-bold"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
              >
                Critical Priority
              </button>

              <input
                type="text"
                placeholder="Search shipment number / carrier..."
                value={shipmentSearch}
                onChange={(e) => setShipmentSearch(e.target.value)}
                className="px-3 py-1.5 bg-polar-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-64"
              />
            </div>
          </div>

          <ShipmentTable
            shipments={shipments}
            isLoading={isLoadingShipments}
            onSelectShipment={handleOpenShipmentDetails}
            onReceiveCargoClick={(shipment) => {
              setSelectedShipment(shipment);
              setIsShipmentModalOpen(true);
            }}
            userRole={userRole}
          />
        </div>
      )}

      {/* Item Details Drawer */}
      <InventoryItemDrawer
        item={selectedItemForDrawer}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onRecordMovement={(item) => {
          setIsDrawerOpen(false);
          handleOpenStockMovement(item);
        }}
        onTransferStock={(item) => {
          setIsDrawerOpen(false);
          handleOpenStockTransfer(item);
        }}
        canManage={canManage}
      />

      {/* Stock Movement Modal */}
      <StockMovementModal
        item={selectedItemForMovement}
        isOpen={isMovementModalOpen}
        onClose={() => {
          setIsMovementModalOpen(false);
          setSelectedItemForMovement(null);
        }}
        onSuccess={() => {
          handleRefreshAll();
        }}
      />

      {/* Inter-Station Stock Transfer Modal */}
      <StockTransferModal
        item={selectedItemForTransfer}
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setSelectedItemForTransfer(null);
        }}
        onSuccess={() => {
          handleRefreshAll();
        }}
      />

      {/* Register New Commodity Modal */}
      <CreateItemModal
        isOpen={isCreateItemModalOpen}
        onClose={() => setIsCreateItemModalOpen(false)}
        onSuccess={() => {
          handleRefreshAll();
        }}
        activeStation={selectedStation}
      />

      {/* Shipment Cargo Manifest & Timeline Modal */}
      <ShipmentDetailsModal
        shipment={selectedShipment}
        isOpen={isShipmentModalOpen}
        onClose={() => {
          setIsShipmentModalOpen(false);
          setSelectedShipment(null);
        }}
        onShipmentUpdated={() => {
          handleRefreshAll();
        }}
        userRole={userRole}
      />
    </div>
  );
};
