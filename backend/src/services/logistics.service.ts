import { Prisma, Shipment, ShipmentPriority, ShipmentStatus, StockMovementType, InventoryStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { shipmentRepository, LogisticsOverview } from "../repositories/shipment.repository";
import { inventoryRepository } from "../repositories/inventory.repository";
import { stationService } from "./station.service";
import { PaginatedResult } from "../types/pagination.types";
import { ApiError } from "../utils/apiError";
import { evaluateInventoryStatus } from "../utils/inventoryThresholds";

export interface ShipmentQuery {
  page: number;
  limit: number;
  station?: string;
  status?: ShipmentStatus;
  priority?: ShipmentPriority;
  search?: string;
}

export interface CreateShipmentInput {
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

export interface UpdateShipmentStatusInput {
  status: ShipmentStatus;
  actualDeparture?: string;
  actualArrival?: string;
  notes?: string;
}

export interface ReceiveCargoInput {
  items: {
    shipmentItemId: string;
    receivedQty: number;
  }[];
  notes?: string;
}

// Deterministic lifecycle stages for progress timeline
export const SHIPMENT_LIFECYCLE_STEPS: ShipmentStatus[] = [
  ShipmentStatus.PLANNED,
  ShipmentStatus.READY,
  ShipmentStatus.IN_TRANSIT,
  ShipmentStatus.ARRIVED,
  ShipmentStatus.RECEIVED
];

export class LogisticsService {
  /**
   * Retrieves paginated polar supply shipments
   */
  async getShipments(query: ShipmentQuery): Promise<PaginatedResult<any>> {
    let resolvedStationId: string | undefined = undefined;
    if (query.station && query.station.toUpperCase() !== "ALL") {
      const station = await stationService.resolveStation(query.station);
      resolvedStationId = station.id;
    }

    const [items, total] = await Promise.all([
      shipmentRepository.findAll({
        page: query.page,
        limit: query.limit,
        stationId: resolvedStationId,
        status: query.status,
        priority: query.priority,
        search: query.search
      }),
      shipmentRepository.count({
        stationId: resolvedStationId,
        status: query.status,
        priority: query.priority,
        search: query.search
      })
    ]);

    const enrichedItems = items.map((shp) => {
      const currentStepIdx = SHIPMENT_LIFECYCLE_STEPS.indexOf(shp.status);
      const totalSteps = SHIPMENT_LIFECYCLE_STEPS.length;
      const progressPercent = shp.status === ShipmentStatus.CANCELLED 
        ? 0 
        : currentStepIdx >= 0 
          ? Math.round(((currentStepIdx + 1) / totalSteps) * 100) 
          : 0;

      return {
        ...shp,
        lifecycle: {
          currentStep: shp.status,
          currentStepIndex: currentStepIdx,
          isCancelled: shp.status === ShipmentStatus.CANCELLED,
          isCompleted: shp.status === ShipmentStatus.RECEIVED,
          progressPercent
        }
      };
    });

    const totalPages = Math.ceil(total / query.limit) || 1;

    return {
      items: enrichedItems,
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
   * Retrieves single shipment details with items, carrier, and timeline
   */
  async getShipmentById(id: string): Promise<any> {
    const shipment = await shipmentRepository.findById(id);
    if (!shipment) {
      throw ApiError.notFound(`Shipment with ID '${id}' was not found`, "SHIPMENT_NOT_FOUND");
    }

    const currentStepIdx = SHIPMENT_LIFECYCLE_STEPS.indexOf(shipment.status);
    const progressPercent = shipment.status === ShipmentStatus.CANCELLED 
      ? 0 
      : currentStepIdx >= 0 
        ? Math.round(((currentStepIdx + 1) / SHIPMENT_LIFECYCLE_STEPS.length) * 100) 
        : 0;

    return {
      ...shipment,
      lifecycle: {
        currentStep: shipment.status,
        currentStepIndex: currentStepIdx,
        isCancelled: shipment.status === ShipmentStatus.CANCELLED,
        isCompleted: shipment.status === ShipmentStatus.RECEIVED,
        progressPercent,
        steps: SHIPMENT_LIFECYCLE_STEPS.map((s, idx) => ({
          status: s,
          completed: currentStepIdx >= idx && shipment.status !== ShipmentStatus.CANCELLED,
          current: shipment.status === s
        }))
      }
    };
  }

  /**
   * Creates a new polar supply shipment with manifest cargo items
   */
  async createShipment(data: CreateShipmentInput, userId?: string): Promise<any> {
    let resolvedStationId: string | undefined = undefined;

    if (data.destinationStationId) {
      const station = await stationService.resolveStation(data.destinationStationId);
      resolvedStationId = station.id;
    }

    const shipmentNumber = data.shipmentNumber?.trim() || `POL-SHP-${Date.now().toString(36).toUpperCase()}`;

    // Verify unique shipment number
    const existing = await shipmentRepository.findByShipmentNumber(shipmentNumber);
    if (existing) {
      throw ApiError.conflict(`Shipment number '${shipmentNumber}' already exists`, "SHIPMENT_NUMBER_EXISTS");
    }

    const plannedDep = data.plannedDeparture ? new Date(data.plannedDeparture) : null;
    const estArr = data.estimatedArrival ? new Date(data.estimatedArrival) : null;

    const shipment = await prisma.$transaction(async (tx) => {
      const created = await tx.shipment.create({
        data: {
          shipmentNumber,
          title: data.title,
          origin: data.origin,
          destinationStationId: resolvedStationId,
          destination: data.destination,
          priority: data.priority || ShipmentPriority.NORMAL,
          plannedDeparture: plannedDep,
          estimatedArrival: estArr,
          carrier: data.carrier,
          notes: data.notes,
          createdById: userId,
          items: {
            create: data.items.map((i) => ({
              itemId: i.itemId,
              name: i.name,
              category: i.category,
              quantity: i.quantity,
              unit: i.unit,
              receivedQty: 0
            }))
          }
        },
        include: {
          destinationStation: { select: { id: true, code: true, name: true } },
          items: true
        }
      });

      // Log Operational Event if destination station is known
      if (resolvedStationId) {
        await tx.operationalEvent.create({
          data: {
            stationId: resolvedStationId,
            type: "LOGISTICS",
            title: `Supply Shipment Scheduled: ${created.title}`,
            description: `Manifest ${created.shipmentNumber} planned from ${created.origin} with ${data.items.length} cargo items. Carrier: ${data.carrier || "N/A"}.`,
            occurredAt: new Date(),
            metadata: JSON.stringify({ shipmentId: created.id, shipmentNumber: created.shipmentNumber })
          }
        });
      }

      return created;
    });

    return shipment;
  }

  /**
   * Updates shipment lifecycle status (PLANNED -> READY -> IN_TRANSIT -> ARRIVED -> RECEIVED)
   */
  async updateShipmentStatus(id: string, data: UpdateShipmentStatusInput, userId?: string): Promise<any> {
    const shipment = await shipmentRepository.findById(id);
    if (!shipment) {
      throw ApiError.notFound(`Shipment '${id}' not found`, "SHIPMENT_NOT_FOUND");
    }

    if (shipment.status === ShipmentStatus.RECEIVED && data.status !== ShipmentStatus.RECEIVED) {
      throw ApiError.badRequest("Completed shipment cannot be moved out of RECEIVED state", "INVALID_LIFECYCLE_TRANSITION");
    }

    const actualDep = data.actualDeparture ? new Date(data.actualDeparture) : shipment.actualDeparture;
    const actualArr = data.actualArrival ? new Date(data.actualArrival) : shipment.actualArrival;

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.shipment.update({
        where: { id },
        data: {
          status: data.status,
          actualDeparture: actualDep,
          actualArrival: actualArr,
          notes: data.notes !== undefined ? data.notes : shipment.notes
        },
        include: {
          destinationStation: { select: { id: true, code: true, name: true } },
          items: true
        }
      });

      if (shipment.destinationStationId) {
        await tx.operationalEvent.create({
          data: {
            stationId: shipment.destinationStationId,
            type: "LOGISTICS",
            title: `Shipment ${shipment.shipmentNumber} Status: ${data.status}`,
            description: `Shipment '${shipment.title}' transitioned from ${shipment.status} to ${data.status}.`,
            occurredAt: new Date(),
            metadata: JSON.stringify({ shipmentId: id, oldStatus: shipment.status, newStatus: data.status })
          }
        });
      }

      return res;
    });

    return updated;
  }

  /**
   * Receives verified cargo items into station inventory atomically
   */
  async receiveShipmentCargo(shipmentId: string, data: ReceiveCargoInput, userId?: string): Promise<any> {
    const shipment = await shipmentRepository.findById(shipmentId);
    if (!shipment) {
      throw ApiError.notFound(`Shipment '${shipmentId}' not found`, "SHIPMENT_NOT_FOUND");
    }

    if (!shipment.destinationStationId) {
      throw ApiError.badRequest(
        `Shipment '${shipment.shipmentNumber}' does not have an attached Antarctic destination station`,
        "NO_DESTINATION_STATION"
      );
    }

    const stationId = shipment.destinationStationId;

    return await prisma.$transaction(async (tx) => {
      const results: any[] = [];

      for (const receiveItem of data.items) {
        const itemManifest = shipment.items.find((i: any) => i.id === receiveItem.shipmentItemId);
        if (!itemManifest) {
          throw ApiError.notFound(`Shipment item '${receiveItem.shipmentItemId}' not found in manifest`, "ITEM_NOT_IN_MANIFEST");
        }

        const remainingToReceive = itemManifest.quantity - itemManifest.receivedQty;
        if (receiveItem.receivedQty > remainingToReceive) {
          throw ApiError.badRequest(
            `Cannot receive ${receiveItem.receivedQty} ${itemManifest.unit} for '${itemManifest.name}'. Max unreceived is ${remainingToReceive} ${itemManifest.unit}.`,
            "EXCESS_RECEIVING_QUANTITY"
          );
        }

        // 1. Update ShipmentItem receivedQty
        const newReceivedQty = itemManifest.receivedQty + receiveItem.receivedQty;
        await tx.shipmentItem.update({
          where: { id: itemManifest.id },
          data: { receivedQty: newReceivedQty }
        });

        // 2. Increment or create target station inventory item
        let inventoryItem: any = null;
        if (itemManifest.itemId) {
          inventoryItem = await tx.inventoryItem.findUnique({ where: { id: itemManifest.itemId } });
        }

        if (!inventoryItem) {
          // Look up by station and name/category
          const possible = await tx.inventoryItem.findFirst({
            where: {
              stationId,
              name: { equals: itemManifest.name, mode: "insensitive" }
            }
          });
          if (possible) {
            inventoryItem = possible;
          }
        }

        let prevStock = 0;
        let newStock = receiveItem.receivedQty;

        if (inventoryItem) {
          prevStock = inventoryItem.quantity;
          newStock = prevStock + receiveItem.receivedQty;

          const evaluation = evaluateInventoryStatus({
            quantity: newStock,
            minimumQuantity: inventoryItem.minimumQuantity,
            criticalQuantity: inventoryItem.criticalQuantity,
            reservedQuantity: inventoryItem.reservedQuantity,
            unit: inventoryItem.unit
          });

          let prismaStatus: InventoryStatus = InventoryStatus.IN_STOCK;
          if (evaluation.status === "OUT_OF_STOCK") prismaStatus = InventoryStatus.OUT_OF_STOCK;
          else if (evaluation.status === "CRITICAL") prismaStatus = InventoryStatus.CRITICAL;
          else if (evaluation.status === "LOW_STOCK") prismaStatus = InventoryStatus.LOW_STOCK;

          inventoryItem = await tx.inventoryItem.update({
            where: { id: inventoryItem.id },
            data: {
              quantity: newStock,
              status: prismaStatus,
              lastUpdatedAt: new Date()
            }
          });
        } else {
          // Auto-register newly arrived item in station inventory
          const generatedSku = `${shipment.destinationStation?.code || "ANT"}-${itemManifest.category.slice(0, 3).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
          inventoryItem = await tx.inventoryItem.create({
            data: {
              stationId,
              sku: generatedSku,
              name: itemManifest.name,
              category: itemManifest.category,
              quantity: newStock,
              unit: itemManifest.unit,
              minimumQuantity: Math.max(1, Math.round(newStock * 0.3)),
              storageLocation: "Central Receiving Bay",
              status: InventoryStatus.IN_STOCK
            }
          });
        }

        // 3. Record InventoryMovement
        const movement = await tx.inventoryMovement.create({
          data: {
            itemId: inventoryItem.id,
            stationId,
            type: StockMovementType.RECEIVED,
            quantity: receiveItem.receivedQty,
            previousStock: prevStock,
            newStock: newStock,
            source: `${shipment.shipmentNumber} (${shipment.origin})`,
            destination: inventoryItem.storageLocation,
            reference: shipment.shipmentNumber,
            reason: `Shipment intake: ${shipment.title}`,
            userId
          }
        });

        results.push({
          shipmentItemId: itemManifest.id,
          inventoryItemId: inventoryItem.id,
          itemName: itemManifest.name,
          receivedQty: receiveItem.receivedQty,
          newStock,
          movementId: movement.id
        });
      }

      // Check if all items in shipment are fully received
      const updatedShipmentItems = await tx.shipmentItem.findMany({
        where: { shipmentId }
      });

      const allFullyReceived = updatedShipmentItems.every((i) => i.receivedQty >= i.quantity);

      if (allFullyReceived) {
        await tx.shipment.update({
          where: { id: shipmentId },
          data: {
            status: ShipmentStatus.RECEIVED,
            actualArrival: shipment.actualArrival || new Date()
          }
        });
      }

      // Log Operational Event
      await tx.operationalEvent.create({
        data: {
          stationId,
          type: "LOGISTICS",
          title: `Shipment Cargo Received: ${shipment.shipmentNumber}`,
          description: `Processed intake of ${data.items.length} cargo items from manifest ${shipment.shipmentNumber}. Status: ${allFullyReceived ? "FULLY RECEIVED" : "PARTIALLY RECEIVED"}.`,
          occurredAt: new Date(),
          metadata: JSON.stringify({ shipmentId, itemsCount: data.items.length, allFullyReceived })
        }
      });

      return {
        shipmentNumber: shipment.shipmentNumber,
        allFullyReceived,
        receivedItems: results
      };
    });
  }

  /**
   * Retrieves logistics overview KPI metrics
   */
  async getOverview(stationIdentifier?: string): Promise<LogisticsOverview> {
    let resolvedStationId: string | undefined = undefined;
    if (stationIdentifier && stationIdentifier.toUpperCase() !== "ALL") {
      const station = await stationService.resolveStation(stationIdentifier);
      resolvedStationId = station.id;
    }

    return await shipmentRepository.getOverview(resolvedStationId);
  }
}

export const logisticsService = new LogisticsService();
