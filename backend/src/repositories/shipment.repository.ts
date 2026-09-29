import { Prisma, Shipment, ShipmentPriority, ShipmentStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { handleDbError } from "../utils/dbErrorHandler";
import { PaginationParams } from "../types/pagination.types";

export interface ShipmentFilterOptions {
  stationId?: string;
  status?: ShipmentStatus;
  priority?: ShipmentPriority;
  search?: string;
}

export interface LogisticsOverview {
  totalShipments: number;
  planned: number;
  ready: number;
  inTransit: number;
  arrived: number;
  received: number;
  cancelled: number;
}

export class ShipmentRepository {
  /**
   * Retrieves paginated polar supply shipments
   */
  async findAll(
    options: PaginationParams & ShipmentFilterOptions
  ): Promise<any[]> {
    try {
      const stationCondition = options.stationId
        ? {
            OR: [
              { destinationStationId: options.stationId },
              { destinationStation: { code: options.stationId.toUpperCase() } }
            ]
          }
        : {};

      const where: Prisma.ShipmentWhereInput = {
        ...stationCondition,
        ...(options.status && { status: options.status }),
        ...(options.priority && { priority: options.priority }),
        ...(options.search && {
          OR: [
            { shipmentNumber: { contains: options.search, mode: "insensitive" } },
            { title: { contains: options.search, mode: "insensitive" } },
            { carrier: { contains: options.search, mode: "insensitive" } },
            { origin: { contains: options.search, mode: "insensitive" } },
            { destination: { contains: options.search, mode: "insensitive" } }
          ]
        })
      };

      const skip = (options.page - 1) * options.limit;

      return await prisma.shipment.findMany({
        where,
        include: {
          destinationStation: {
            select: {
              id: true,
              code: true,
              name: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              role: true
            }
          },
          items: true
        },
        orderBy: [{ status: "asc" }, { estimatedArrival: "asc" }],
        skip,
        take: options.limit
      });
    } catch (error) {
      handleDbError(error, "ShipmentFindAll");
    }
  }

  /**
   * Counts shipments matching filter
   */
  async count(filter?: ShipmentFilterOptions): Promise<number> {
    try {
      const stationCondition = filter?.stationId
        ? {
            OR: [
              { destinationStationId: filter.stationId },
              { destinationStation: { code: filter.stationId.toUpperCase() } }
            ]
          }
        : {};

      const where: Prisma.ShipmentWhereInput = {
        ...stationCondition,
        ...(filter?.status && { status: filter.status }),
        ...(filter?.priority && { priority: filter.priority }),
        ...(filter?.search && {
          OR: [
            { shipmentNumber: { contains: filter.search, mode: "insensitive" } },
            { title: { contains: filter.search, mode: "insensitive" } },
            { carrier: { contains: filter.search, mode: "insensitive" } },
            { origin: { contains: filter.search, mode: "insensitive" } },
            { destination: { contains: filter.search, mode: "insensitive" } }
          ]
        })
      };

      return await prisma.shipment.count({ where });
    } catch (error) {
      handleDbError(error, "ShipmentCount");
    }
  }

  /**
   * Finds a shipment by ID with items and destination details
   */
  async findById(id: string): Promise<any | null> {
    try {
      return await prisma.shipment.findUnique({
        where: { id },
        include: {
          destinationStation: {
            select: {
              id: true,
              code: true,
              name: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              role: true
            }
          },
          items: {
            include: {
              item: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  quantity: true,
                  unit: true
                }
              }
            }
          }
        }
      });
    } catch (error) {
      handleDbError(error, "ShipmentFindById");
    }
  }

  /**
   * Finds a shipment by unique reference number
   */
  async findByShipmentNumber(shipmentNumber: string): Promise<Shipment | null> {
    try {
      return await prisma.shipment.findUnique({
        where: { shipmentNumber }
      });
    } catch (error) {
      handleDbError(error, "ShipmentFindByNumber");
    }
  }

  /**
   * Creates a shipment and nested manifest items
   */
  async create(data: Prisma.ShipmentCreateInput): Promise<any> {
    try {
      return await prisma.shipment.create({
        data,
        include: {
          destinationStation: {
            select: {
              id: true,
              code: true,
              name: true
            }
          },
          items: true
        }
      });
    } catch (error) {
      handleDbError(error, "ShipmentCreate");
    }
  }

  /**
   * Updates shipment details or lifecycle status
   */
  async update(id: string, data: Prisma.ShipmentUpdateInput): Promise<any> {
    try {
      return await prisma.shipment.update({
        where: { id },
        data,
        include: {
          destinationStation: {
            select: {
              id: true,
              code: true,
              name: true
            }
          },
          items: true
        }
      });
    } catch (error) {
      handleDbError(error, "ShipmentUpdate");
    }
  }

  /**
   * Retrieves logistics overview KPI metrics
   */
  async getOverview(stationId?: string): Promise<LogisticsOverview> {
    try {
      const stationCondition = stationId
        ? {
            OR: [
              { destinationStationId: stationId },
              { destinationStation: { code: stationId.toUpperCase() } }
            ]
          }
        : {};

      const where: Prisma.ShipmentWhereInput = {
        ...stationCondition
      };

      const [totalShipments, planned, ready, inTransit, arrived, received, cancelled] = await Promise.all([
        prisma.shipment.count({ where }),
        prisma.shipment.count({ where: { ...where, status: ShipmentStatus.PLANNED } }),
        prisma.shipment.count({ where: { ...where, status: ShipmentStatus.READY } }),
        prisma.shipment.count({ where: { ...where, status: ShipmentStatus.IN_TRANSIT } }),
        prisma.shipment.count({ where: { ...where, status: ShipmentStatus.ARRIVED } }),
        prisma.shipment.count({ where: { ...where, status: ShipmentStatus.RECEIVED } }),
        prisma.shipment.count({ where: { ...where, status: ShipmentStatus.CANCELLED } })
      ]);

      return {
        totalShipments,
        planned,
        ready,
        inTransit,
        arrived,
        received,
        cancelled
      };
    } catch (error) {
      handleDbError(error, "LogisticsOverview");
    }
  }
}

export const shipmentRepository = new ShipmentRepository();
