import { apiClient } from "../lib/apiClient";
import {
  InventoryItem,
  InventoryMovement,
  InventoryOverview,
  LogisticsOverview,
  Shipment,
  ShipmentPriority,
  ShipmentStatus,
  StockMovementType
} from "../types/logistics.types";
import { ApiResponseEnvelope, StationFilter } from "../types";

export interface InventoryQueryParams {
  page?: number;
  limit?: number;
  station?: StationFilter;
  category?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ShipmentQueryParams {
  page?: number;
  limit?: number;
  station?: StationFilter;
  status?: ShipmentStatus;
  priority?: ShipmentPriority;
  search?: string;
}

export interface MovementQueryParams {
  page?: number;
  limit?: number;
  station?: StationFilter;
  itemId?: string;
  type?: StockMovementType;
  from?: string;
  to?: string;
}

export interface CreateInventoryItemData {
  stationId: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minimumQuantity: number;
  criticalQuantity?: number;
  reservedQuantity?: number;
  storageLocation?: string;
  description?: string;
}

export interface UpdateInventoryItemData {
  name?: string;
  category?: string;
  minimumQuantity?: number;
  criticalQuantity?: number;
  storageLocation?: string;
  description?: string;
}

export interface RecordMovementData {
  type: StockMovementType;
  quantity: number;
  source?: string;
  destination?: string;
  reference?: string;
  reason: string;
}

export interface TransferStockData {
  sourceStationId: string;
  targetStationId: string;
  itemId: string;
  quantity: number;
  reference?: string;
  reason: string;
}

export interface CreateShipmentData {
  shipmentNumber?: string;
  title: string;
  origin: string;
  destinationStationId?: string;
  destination: string;
  priority?: ShipmentPriority;
  plannedDeparture?: string;
  estimatedArrival?: string;
  carrier?: string;
  notes?: string;
  items: {
    itemId?: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
  }[];
}

export interface ReceiveCargoData {
  items: {
    shipmentItemId: string;
    receivedQty: number;
  }[];
  notes?: string;
}

export const logisticsService = {
  /**
   * Retrieves paginated inventory items
   */
  async getInventory(params: InventoryQueryParams = {}): Promise<ApiResponseEnvelope<InventoryItem[]>> {
    const query = new URLSearchParams();
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));
    if (params.station && params.station !== "ALL") query.append("station", params.station);
    if (params.category) query.append("category", params.category);
    if (params.status) query.append("status", params.status);
    if (params.search) query.append("search", params.search);
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.sortOrder) query.append("sortOrder", params.sortOrder);

    const queryString = query.toString();
    const url = `/inventory${queryString ? `?${queryString}` : ""}`;
    return (await apiClient.get(url)) as unknown as ApiResponseEnvelope<InventoryItem[]>;
  },

  /**
   * Retrieves inventory KPI overview metrics
   */
  async getInventoryOverview(station?: StationFilter): Promise<ApiResponseEnvelope<InventoryOverview>> {
    const url = station && station !== "ALL"
      ? `/inventory/overview?station=${station}`
      : `/inventory/overview`;
    return (await apiClient.get(url)) as unknown as ApiResponseEnvelope<InventoryOverview>;
  },

  /**
   * Retrieves single inventory item by ID
   */
  async getInventoryItem(id: string): Promise<ApiResponseEnvelope<InventoryItem>> {
    return (await apiClient.get(`/inventory/${id}`)) as unknown as ApiResponseEnvelope<InventoryItem>;
  },

  /**
   * Creates a new inventory item
   */
  async createInventoryItem(data: CreateInventoryItemData): Promise<ApiResponseEnvelope<InventoryItem>> {
    return (await apiClient.post("/inventory", data)) as unknown as ApiResponseEnvelope<InventoryItem>;
  },

  /**
   * Updates an existing inventory item
   */
  async updateInventoryItem(id: string, data: UpdateInventoryItemData): Promise<ApiResponseEnvelope<InventoryItem>> {
    return (await apiClient.patch(`/inventory/${id}`, data)) as unknown as ApiResponseEnvelope<InventoryItem>;
  },

  /**
   * Records a stock movement (CONSUMED, RECEIVED, ADJUSTED, RESERVED, RELEASED)
   */
  async recordMovement(itemId: string, data: RecordMovementData): Promise<ApiResponseEnvelope<any>> {
    return (await apiClient.post(`/inventory/${itemId}/movements`, data)) as unknown as ApiResponseEnvelope<any>;
  },

  /**
   * Transfers stock between stations
   */
  async transferStock(data: TransferStockData): Promise<ApiResponseEnvelope<any>> {
    return (await apiClient.post("/inventory/transfer", data)) as unknown as ApiResponseEnvelope<any>;
  },

  /**
   * Retrieves stock movement ledger audit logs
   */
  async getMovements(params: MovementQueryParams = {}): Promise<ApiResponseEnvelope<InventoryMovement[]>> {
    const query = new URLSearchParams();
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));
    if (params.station && params.station !== "ALL") query.append("station", params.station);
    if (params.itemId) query.append("itemId", params.itemId);
    if (params.type) query.append("type", params.type);
    if (params.from) query.append("from", params.from);
    if (params.to) query.append("to", params.to);

    const queryString = query.toString();
    const url = `/inventory/movements${queryString ? `?${queryString}` : ""}`;
    return (await apiClient.get(url)) as unknown as ApiResponseEnvelope<InventoryMovement[]>;
  },

  /**
   * Retrieves polar supply shipments
   */
  async getShipments(params: ShipmentQueryParams = {}): Promise<ApiResponseEnvelope<Shipment[]>> {
    const query = new URLSearchParams();
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));
    if (params.station && params.station !== "ALL") query.append("station", params.station);
    if (params.status) query.append("status", params.status);
    if (params.priority) query.append("priority", params.priority);
    if (params.search) query.append("search", params.search);

    const queryString = query.toString();
    const url = `/logistics${queryString ? `?${queryString}` : ""}`;
    return (await apiClient.get(url)) as unknown as ApiResponseEnvelope<Shipment[]>;
  },

  /**
   * Retrieves logistics shipments KPI overview
   */
  async getLogisticsOverview(station?: StationFilter): Promise<ApiResponseEnvelope<LogisticsOverview>> {
    const url = station && station !== "ALL"
      ? `/logistics/overview?station=${station}`
      : `/logistics/overview`;
    return (await apiClient.get(url)) as unknown as ApiResponseEnvelope<LogisticsOverview>;
  },

  /**
   * Retrieves shipment manifest details by ID
   */
  async getShipment(id: string): Promise<ApiResponseEnvelope<Shipment>> {
    return (await apiClient.get(`/logistics/${id}`)) as unknown as ApiResponseEnvelope<Shipment>;
  },

  /**
   * Creates a new polar supply shipment
   */
  async createShipment(data: CreateShipmentData): Promise<ApiResponseEnvelope<Shipment>> {
    return (await apiClient.post("/logistics", data)) as unknown as ApiResponseEnvelope<Shipment>;
  },

  /**
   * Updates shipment lifecycle status
   */
  async updateShipmentStatus(id: string, data: { status: ShipmentStatus; actualDeparture?: string; actualArrival?: string; notes?: string }): Promise<ApiResponseEnvelope<Shipment>> {
    return (await apiClient.patch(`/logistics/${id}`, data)) as unknown as ApiResponseEnvelope<Shipment>;
  },

  /**
   * Receives verified cargo items into station inventory
   */
  async receiveShipmentCargo(id: string, data: ReceiveCargoData): Promise<ApiResponseEnvelope<any>> {
    return (await apiClient.post(`/logistics/${id}/receive`, data)) as unknown as ApiResponseEnvelope<any>;
  }
};
