import { InventoryItem, InventoryStatus, Prisma, StockMovementType } from "@prisma/client";
import { prisma } from "../config/prisma";
import { inventoryRepository, InventoryOverview } from "../repositories/inventory.repository";
import { movementRepository } from "../repositories/movement.repository";
import { stationService } from "./station.service";
import { PaginatedResult } from "../types/pagination.types";
import { ApiError } from "../utils/apiError";
import { evaluateInventoryStatus } from "../utils/inventoryThresholds";

export interface InventoryQuery {
  page: number;
  limit: number;
  station?: string;
  category?: string;
  status?: InventoryStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateInventoryItemInput {
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

export interface UpdateInventoryItemInput {
  name?: string;
  category?: string;
  minimumQuantity?: number;
  criticalQuantity?: number;
  storageLocation?: string;
  description?: string;
}

export interface RecordMovementInput {
  type: StockMovementType;
  quantity: number;
  source?: string;
  destination?: string;
  reference?: string;
  reason: string;
}

export interface TransferStockInput {
  sourceStationId: string;
  targetStationId: string;
  itemId: string;
  quantity: number;
  reference?: string;
  reason: string;
}

export class InventoryService {
  /**
   * Retrieves paginated logistics inventory items with flexible station, category, and status filters
   */
  async getInventory(query: InventoryQuery): Promise<PaginatedResult<any>> {
    let resolvedStationId: string | undefined = undefined;

    if (query.station && query.station.toUpperCase() !== "ALL") {
      const station = await stationService.resolveStation(query.station);
      resolvedStationId = station.id;
    }

    const [rawItems, total] = await Promise.all([
      inventoryRepository.findAll({
        page: query.page,
        limit: query.limit,
        stationId: resolvedStationId,
        category: query.category,
        status: query.status,
        search: query.search,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder
      }),
      inventoryRepository.count({
        stationId: resolvedStationId,
        category: query.category,
        status: query.status,
        search: query.search
      })
    ]);

    // Augment with rich deterministic status evaluation tokens
    const items = rawItems.map((item) => {
      const evaluation = evaluateInventoryStatus({
        quantity: item.quantity,
        minimumQuantity: item.minimumQuantity,
        criticalQuantity: item.criticalQuantity,
        reservedQuantity: item.reservedQuantity,
        unit: item.unit
      });
      return {
        ...item,
        evaluation
      };
    });

    const totalPages = Math.ceil(total / query.limit) || 1;

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPrevPage: query.page > 1
      }
    };
  }

  /**
   * Retrieves paginated logistics supplies and equipment inventory for a station (Phase 2 backward compatibility)
   */
  async getInventoryByStation(
    stationIdentifier: string,
    query: { page: number; limit: number; category?: string; status?: InventoryStatus; search?: string }
  ): Promise<PaginatedResult<InventoryItem>> {
    return this.getInventory({
      ...query,
      station: stationIdentifier
    });
  }

  /**
   * Retrieves single inventory item by ID with evaluated status
   */
  async getInventoryItem(id: string): Promise<any> {
    const item = await inventoryRepository.findById(id);
    if (!item) {
      throw ApiError.notFound(`Inventory item with ID '${id}' was not found`, "ITEM_NOT_FOUND");
    }

    const evaluation = evaluateInventoryStatus({
      quantity: item.quantity,
      minimumQuantity: item.minimumQuantity,
      criticalQuantity: item.criticalQuantity,
      reservedQuantity: item.reservedQuantity,
      unit: item.unit
    });

    return {
      ...item,
      evaluation
    };
  }

  /**
   * Creates a new inventory item and logs intake movement
   */
  async createInventoryItem(data: CreateInventoryItemInput, userId?: string): Promise<any> {
    const station = await stationService.resolveStation(data.stationId);

    // Verify SKU uniqueness within station
    const existing = await inventoryRepository.findBySku(station.id, data.sku);
    if (existing) {
      throw ApiError.conflict(
        `Item with SKU '${data.sku}' already exists for station '${station.name}'`,
        "SKU_ALREADY_EXISTS"
      );
    }

    const evaluation = evaluateInventoryStatus({
      quantity: data.quantity,
      minimumQuantity: data.minimumQuantity,
      criticalQuantity: data.criticalQuantity,
      reservedQuantity: data.reservedQuantity
    });

    // Determine Prisma enum status
    let prismaStatus: InventoryStatus = InventoryStatus.IN_STOCK;
    if (evaluation.status === "OUT_OF_STOCK") prismaStatus = InventoryStatus.OUT_OF_STOCK;
    else if (evaluation.status === "CRITICAL") prismaStatus = InventoryStatus.CRITICAL;
    else if (evaluation.status === "LOW_STOCK") prismaStatus = InventoryStatus.LOW_STOCK;

    return await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.create({
        data: {
          stationId: station.id,
          sku: data.sku,
          name: data.name,
          category: data.category,
          quantity: data.quantity,
          unit: data.unit,
          minimumQuantity: data.minimumQuantity,
          criticalQuantity: data.criticalQuantity,
          reservedQuantity: data.reservedQuantity || 0,
          storageLocation: data.storageLocation || "Station Logistics Central Store",
          description: data.description,
          status: prismaStatus
        },
        include: {
          station: {
            select: { id: true, code: true, name: true }
          }
        }
      });

      // Record initial inventory intake movement if quantity > 0
      if (data.quantity > 0) {
        await tx.inventoryMovement.create({
          data: {
            itemId: item.id,
            stationId: station.id,
            type: StockMovementType.RECEIVED,
            quantity: data.quantity,
            previousStock: 0,
            newStock: data.quantity,
            source: "Initial Catalog Registration",
            destination: item.storageLocation,
            reason: "Initial station supply catalog intake",
            userId
          }
        });
      }

      // Log Operational Event
      await tx.operationalEvent.create({
        data: {
          stationId: station.id,
          type: "INVENTORY",
          title: `Inventory Item Registered: ${item.name}`,
          description: `Cataloged ${item.name} (${item.sku}) with ${item.quantity} ${item.unit} in ${item.storageLocation}.`,
          occurredAt: new Date(),
          metadata: JSON.stringify({ itemId: item.id, sku: item.sku, category: item.category })
        }
      });

      return {
        ...item,
        evaluation
      };
    });
  }

  /**
   * Updates inventory item metadata
   */
  async updateInventoryItem(id: string, data: UpdateInventoryItemInput): Promise<any> {
    const item = await inventoryRepository.findById(id);
    if (!item) {
      throw ApiError.notFound(`Inventory item with ID '${id}' was not found`, "ITEM_NOT_FOUND");
    }

    const newMin = data.minimumQuantity !== undefined ? data.minimumQuantity : item.minimumQuantity;
    const newCrit = data.criticalQuantity !== undefined ? data.criticalQuantity : item.criticalQuantity;

    const evaluation = evaluateInventoryStatus({
      quantity: item.quantity,
      minimumQuantity: newMin,
      criticalQuantity: newCrit,
      reservedQuantity: item.reservedQuantity,
      unit: item.unit
    });

    let prismaStatus: InventoryStatus = InventoryStatus.IN_STOCK;
    if (evaluation.status === "OUT_OF_STOCK") prismaStatus = InventoryStatus.OUT_OF_STOCK;
    else if (evaluation.status === "CRITICAL") prismaStatus = InventoryStatus.CRITICAL;
    else if (evaluation.status === "LOW_STOCK") prismaStatus = InventoryStatus.LOW_STOCK;

    const updated = await inventoryRepository.update(id, {
      ...data,
      status: prismaStatus,
      lastUpdatedAt: new Date()
    });

    return {
      ...updated,
      evaluation
    };
  }

  /**
   * Records an atomic stock movement (CONSUMED, RECEIVED, ADJUSTED, RESERVED, RELEASED)
   * Protected with conditional update and ACID transaction to prevent negative stock
   */
  async recordStockMovement(itemId: string, data: RecordMovementInput, userId?: string): Promise<any> {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch current item state within transaction
      const item = await tx.inventoryItem.findUnique({
        where: { id: itemId },
        include: {
          station: { select: { id: true, code: true, name: true } }
        }
      });

      if (!item) {
        throw ApiError.notFound(`Inventory item '${itemId}' not found`, "ITEM_NOT_FOUND");
      }

      const prevStock = item.quantity;
      let newStock = prevStock;
      let prevReserved = item.reservedQuantity;
      let newReserved = prevReserved;

      // 2. Validate and calculate stock deltas
      if (data.type === StockMovementType.CONSUMED) {
        const available = prevStock - prevReserved;
        if (available < data.quantity) {
          throw ApiError.badRequest(
            `Insufficient available stock for '${item.name}'. Available: ${available} ${item.unit}, Requested: ${data.quantity} ${item.unit}`,
            "INSUFFICIENT_STOCK"
          );
        }
        newStock = prevStock - data.quantity;
      } else if (data.type === StockMovementType.RECEIVED) {
        newStock = prevStock + data.quantity;
      } else if (data.type === StockMovementType.ADJUSTED) {
        // Absolute new stock balance
        newStock = data.quantity;
      } else if (data.type === StockMovementType.RESERVED) {
        const unreserved = prevStock - prevReserved;
        if (unreserved < data.quantity) {
          throw ApiError.badRequest(
            `Cannot reserve ${data.quantity} ${item.unit}. Only ${unreserved} ${item.unit} unreserved.`,
            "INSUFFICIENT_UNRESERVED_STOCK"
          );
        }
        newReserved = prevReserved + data.quantity;
      } else if (data.type === StockMovementType.RELEASED) {
        if (prevReserved < data.quantity) {
          throw ApiError.badRequest(
            `Cannot release ${data.quantity} ${item.unit}. Currently reserved: ${prevReserved} ${item.unit}.`,
            "EXCESSIVE_RELEASE_QUANTITY"
          );
        }
        newReserved = prevReserved - data.quantity;
      } else if (data.type === StockMovementType.TRANSFERRED) {
        const available = prevStock - prevReserved;
        if (available < data.quantity) {
          throw ApiError.badRequest(
            `Insufficient stock to transfer '${item.name}'. Available: ${available} ${item.unit}, Requested: ${data.quantity} ${item.unit}`,
            "INSUFFICIENT_STOCK"
          );
        }
        newStock = prevStock - data.quantity;
      }

      // Concurrency guard: Never allow stock to become negative
      if (newStock < 0) {
        throw ApiError.badRequest(
          `Operation rejected. Resulting stock cannot be negative (${newStock} ${item.unit}).`,
          "NEGATIVE_STOCK_PREVENTED"
        );
      }

      // 3. Evaluate new status
      const evaluation = evaluateInventoryStatus({
        quantity: newStock,
        minimumQuantity: item.minimumQuantity,
        criticalQuantity: item.criticalQuantity,
        reservedQuantity: newReserved,
        unit: item.unit
      });

      let prismaStatus: InventoryStatus = InventoryStatus.IN_STOCK;
      if (evaluation.status === "OUT_OF_STOCK") prismaStatus = InventoryStatus.OUT_OF_STOCK;
      else if (evaluation.status === "CRITICAL") prismaStatus = InventoryStatus.CRITICAL;
      else if (evaluation.status === "LOW_STOCK") prismaStatus = InventoryStatus.LOW_STOCK;

      // 4. Atomic conditional update
      const updatedItem = await tx.inventoryItem.update({
        where: {
          id: itemId,
          // Concurrency safety conditional: verify quantity has not changed beneath us if consuming
          ...(data.type === StockMovementType.CONSUMED || data.type === StockMovementType.TRANSFERRED ? {
            quantity: { gte: data.quantity }
          } : {})
        },
        data: {
          quantity: newStock,
          reservedQuantity: newReserved,
          status: prismaStatus,
          lastUpdatedAt: new Date()
        }
      });

      // 5. Create Movement record
      const movement = await tx.inventoryMovement.create({
        data: {
          itemId: item.id,
          stationId: item.stationId,
          type: data.type,
          quantity: data.quantity,
          previousStock: prevStock,
          newStock: newStock,
          source: data.source || item.storageLocation,
          destination: data.destination || (data.type === StockMovementType.CONSUMED ? "Station Operations" : item.storageLocation),
          reference: data.reference,
          reason: data.reason,
          userId
        },
        include: {
          user: { select: { id: true, name: true, role: true } }
        }
      });

      // 6. Log Operational Event
      await tx.operationalEvent.create({
        data: {
          stationId: item.stationId,
          type: "INVENTORY",
          title: `Stock ${data.type}: ${item.name}`,
          description: `${data.type} ${data.quantity} ${item.unit} of ${item.name}. New balance: ${newStock} ${item.unit}. Reason: ${data.reason}`,
          occurredAt: new Date(),
          metadata: JSON.stringify({ itemId: item.id, movementId: movement.id, type: data.type, quantity: data.quantity })
        }
      });

      return {
        item: {
          ...updatedItem,
          evaluation
        },
        movement
      };
    });
  }

  /**
   * Transfers stock between Antarctic research stations (e.g. Maitri -> Bharati)
   * Executes in a single ACID transaction to guarantee zero inventory leakage
   */
  async transferStock(data: TransferStockInput, userId?: string): Promise<any> {
    const [sourceStation, targetStation] = await Promise.all([
      stationService.resolveStation(data.sourceStationId),
      stationService.resolveStation(data.targetStationId)
    ]);

    if (sourceStation.id === targetStation.id) {
      throw ApiError.badRequest("Source and destination stations cannot be identical", "INVALID_TRANSFER_DESTINATION");
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Validate source item
      const sourceItem = await tx.inventoryItem.findUnique({
        where: { id: data.itemId }
      });

      if (!sourceItem || sourceItem.stationId !== sourceStation.id) {
        throw ApiError.notFound(
          `Item '${data.itemId}' not found at station '${sourceStation.name}'`,
          "SOURCE_ITEM_NOT_FOUND"
        );
      }

      const available = sourceItem.quantity - sourceItem.reservedQuantity;
      if (available < data.quantity) {
        throw ApiError.badRequest(
          `Insufficient stock at ${sourceStation.name} for transfer. Available: ${available} ${sourceItem.unit}, Requested: ${data.quantity} ${sourceItem.unit}`,
          "INSUFFICIENT_TRANSFER_STOCK"
        );
      }

      // 2. Decrement source stock atomically
      const newSourceStock = sourceItem.quantity - data.quantity;
      const sourceEval = evaluateInventoryStatus({
        quantity: newSourceStock,
        minimumQuantity: sourceItem.minimumQuantity,
        criticalQuantity: sourceItem.criticalQuantity,
        reservedQuantity: sourceItem.reservedQuantity
      });

      let sourcePrismaStatus: InventoryStatus = InventoryStatus.IN_STOCK;
      if (sourceEval.status === "OUT_OF_STOCK") sourcePrismaStatus = InventoryStatus.OUT_OF_STOCK;
      else if (sourceEval.status === "CRITICAL") sourcePrismaStatus = InventoryStatus.CRITICAL;
      else if (sourceEval.status === "LOW_STOCK") sourcePrismaStatus = InventoryStatus.LOW_STOCK;

      await tx.inventoryItem.update({
        where: { id: sourceItem.id, quantity: { gte: data.quantity } },
        data: {
          quantity: newSourceStock,
          status: sourcePrismaStatus,
          lastUpdatedAt: new Date()
        }
      });

      // 3. Find or create target item at destination station
      let targetItem = await tx.inventoryItem.findUnique({
        where: {
          stationId_sku: {
            stationId: targetStation.id,
            sku: sourceItem.sku
          }
        }
      });

      let prevTargetStock = 0;
      let newTargetStock = data.quantity;

      if (targetItem) {
        prevTargetStock = targetItem.quantity;
        newTargetStock = prevTargetStock + data.quantity;

        const targetEval = evaluateInventoryStatus({
          quantity: newTargetStock,
          minimumQuantity: targetItem.minimumQuantity,
          criticalQuantity: targetItem.criticalQuantity,
          reservedQuantity: targetItem.reservedQuantity
        });

        let targetPrismaStatus: InventoryStatus = InventoryStatus.IN_STOCK;
        if (targetEval.status === "OUT_OF_STOCK") targetPrismaStatus = InventoryStatus.OUT_OF_STOCK;
        else if (targetEval.status === "CRITICAL") targetPrismaStatus = InventoryStatus.CRITICAL;
        else if (targetEval.status === "LOW_STOCK") targetPrismaStatus = InventoryStatus.LOW_STOCK;

        targetItem = await tx.inventoryItem.update({
          where: { id: targetItem.id },
          data: {
            quantity: newTargetStock,
            status: targetPrismaStatus,
            lastUpdatedAt: new Date()
          }
        });
      } else {
        // Create catalog entry at destination
        targetItem = await tx.inventoryItem.create({
          data: {
            stationId: targetStation.id,
            sku: sourceItem.sku,
            name: sourceItem.name,
            category: sourceItem.category,
            quantity: data.quantity,
            unit: sourceItem.unit,
            minimumQuantity: sourceItem.minimumQuantity,
            criticalQuantity: sourceItem.criticalQuantity,
            storageLocation: `${targetStation.name} Receiving Bay`,
            description: sourceItem.description,
            status: InventoryStatus.IN_STOCK
          }
        });
      }

      // 4. Record outbound movement on source station
      const ref = data.reference || `TRF-${Date.now().toString(36).toUpperCase()}`;
      const sourceMovement = await tx.inventoryMovement.create({
        data: {
          itemId: sourceItem.id,
          stationId: sourceStation.id,
          type: StockMovementType.TRANSFERRED,
          quantity: data.quantity,
          previousStock: sourceItem.quantity,
          newStock: newSourceStock,
          source: `${sourceStation.name} (${sourceItem.storageLocation || "Store"})`,
          destination: `${targetStation.name} Receiving`,
          reference: ref,
          reason: `Transfer to ${targetStation.name}: ${data.reason}`,
          userId
        }
      });

      // 5. Record inbound movement on destination station
      const targetMovement = await tx.inventoryMovement.create({
        data: {
          itemId: targetItem.id,
          stationId: targetStation.id,
          type: StockMovementType.RECEIVED,
          quantity: data.quantity,
          previousStock: prevTargetStock,
          newStock: newTargetStock,
          source: `${sourceStation.name} Dispatch`,
          destination: targetItem.storageLocation,
          reference: ref,
          reason: `Transfer received from ${sourceStation.name}: ${data.reason}`,
          userId
        }
      });

      // 6. Log Operational Events for both stations
      await Promise.all([
        tx.operationalEvent.create({
          data: {
            stationId: sourceStation.id,
            type: "INVENTORY",
            title: `Stock Dispatched: ${sourceItem.name}`,
            description: `Transferred ${data.quantity} ${sourceItem.unit} of ${sourceItem.name} to ${targetStation.name}. Ref: ${ref}`,
            occurredAt: new Date(),
            metadata: JSON.stringify({ ref, transferQty: data.quantity, toStation: targetStation.code })
          }
        }),
        tx.operationalEvent.create({
          data: {
            stationId: targetStation.id,
            type: "INVENTORY",
            title: `Stock Received: ${targetItem.name}`,
            description: `Received ${data.quantity} ${targetItem.unit} of ${targetItem.name} from ${sourceStation.name}. Ref: ${ref}`,
            occurredAt: new Date(),
            metadata: JSON.stringify({ ref, transferQty: data.quantity, fromStation: sourceStation.code })
          }
        })
      ]);

      return {
        reference: ref,
        sourceStation: sourceStation.code,
        targetStation: targetStation.code,
        itemSku: sourceItem.sku,
        itemName: sourceItem.name,
        quantity: data.quantity,
        unit: sourceItem.unit,
        sourceBalance: newSourceStock,
        targetBalance: newTargetStock,
        sourceMovementId: sourceMovement.id,
        targetMovementId: targetMovement.id
      };
    });
  }

  /**
   * Retrieves operational inventory KPI summary
   */
  async getOverview(stationIdentifier?: string): Promise<InventoryOverview> {
    let resolvedStationId: string | undefined = undefined;
    if (stationIdentifier && stationIdentifier.toUpperCase() !== "ALL") {
      const station = await stationService.resolveStation(stationIdentifier);
      resolvedStationId = station.id;
    }

    return await inventoryRepository.getOverview(resolvedStationId);
  }

  /**
   * Retrieves chronological stock movement audit logs
   */
  async getMovements(query: {
    page: number;
    limit: number;
    station?: string;
    itemId?: string;
    type?: StockMovementType;
    from?: string;
    to?: string;
  }): Promise<PaginatedResult<any>> {
    let resolvedStationId: string | undefined = undefined;
    if (query.station && query.station.toUpperCase() !== "ALL") {
      const station = await stationService.resolveStation(query.station);
      resolvedStationId = station.id;
    }

    const fromDate = query.from ? new Date(query.from) : undefined;
    const toDate = query.to ? new Date(query.to) : undefined;

    const [items, total] = await Promise.all([
      movementRepository.findAll({
        page: query.page,
        limit: query.limit,
        stationId: resolvedStationId,
        itemId: query.itemId,
        type: query.type,
        from: fromDate,
        to: toDate
      }),
      movementRepository.count({
        stationId: resolvedStationId,
        itemId: query.itemId,
        type: query.type,
        from: fromDate,
        to: toDate
      })
    ]);

    const totalPages = Math.ceil(total / query.limit) || 1;

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPrevPage: query.page > 1
      }
    };
  }
}

export const inventoryService = new InventoryService();
