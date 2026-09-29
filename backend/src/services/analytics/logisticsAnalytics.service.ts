import { prisma } from "../../config/prisma";
import { stationService } from "../station.service";
import {
  AnalyticsFilterParams,
  LogisticsAnalyticsResponse,
  ResolvedTimeWindow
} from "./analytics.types";
import {
  evaluateDataQuality,
  resolveTimeWindow,
  roundTo
} from "./analyticsUtils";

export class LogisticsAnalyticsService {
  public async getLogisticsAnalytics(
    params: AnalyticsFilterParams
  ): Promise<LogisticsAnalyticsResponse> {
    const window: ResolvedTimeWindow = resolveTimeWindow(params);

    let stationFilter = {
      id: "ALL",
      code: "ALL",
      name: "All Antarctic Stations (Maitri & Bharati)"
    };

    const whereStationClause: any = {};
    if (params.stationId && params.stationId !== "ALL") {
      const station = await stationService.resolveStation(params.stationId);
      whereStationClause.stationId = station.id;
      stationFilter = {
        id: station.id,
        code: station.code,
        name: station.name
      };
    }

    // Query inventory items
    const items = await prisma.inventoryItem.findMany({
      where: whereStationClause,
      include: {
        station: { select: { code: true } }
      }
    });

    // Query immutable inventory movements in the time window
    const movements = await prisma.inventoryMovement.findMany({
      where: {
        ...whereStationClause,
        createdAt: {
          gte: window.currentStart,
          lte: window.currentEnd
        }
      },
      include: {
        item: { select: { name: true, sku: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    // Query shipments
    const shipments = await prisma.shipment.findMany({
      where: {
        ...(whereStationClause.stationId ? { destinationStationId: whereStationClause.stationId } : {}),
        createdAt: {
          gte: window.currentStart,
          lte: window.currentEnd
        }
      }
    });

    const totalItems = items.length;
    let criticalStockItems = 0;
    let lowStockItems = 0;
    let healthyStockItems = 0;

    const categoryMap: Record<string, { itemCount: number; totalQuantity: number; criticalCount: number }> = {};

    for (const it of items) {
      if (it.status === "CRITICAL" || it.status === "OUT_OF_STOCK") {
        criticalStockItems++;
      } else if (it.status === "LOW_STOCK") {
        lowStockItems++;
      } else {
        healthyStockItems++;
      }

      const cat = it.category || "General";
      if (!categoryMap[cat]) {
        categoryMap[cat] = { itemCount: 0, totalQuantity: 0, criticalCount: 0 };
      }
      categoryMap[cat].itemCount++;
      categoryMap[cat].totalQuantity += it.quantity;
      if (it.status === "CRITICAL" || it.status === "OUT_OF_STOCK") {
        categoryMap[cat].criticalCount++;
      }
    }

    let consumptionMovements = 0;
    let receiptMovements = 0;
    let transferMovements = 0;

    for (const m of movements) {
      if (m.type === "CONSUMED") consumptionMovements++;
      else if (m.type === "RECEIVED") receiptMovements++;
      else if (m.type === "TRANSFERRED") transferMovements++;
    }

    const shipmentStatusDistribution: Record<string, number> = {
      PLANNED: 0,
      READY: 0,
      IN_TRANSIT: 0,
      ARRIVED: 0,
      RECEIVED: 0,
      CANCELLED: 0
    };

    for (const s of shipments) {
      shipmentStatusDistribution[s.status] = (shipmentStatusDistribution[s.status] || 0) + 1;
    }

    const categoryDistribution = Object.entries(categoryMap).map(([category, stats]) => ({
      category,
      itemCount: stats.itemCount,
      totalQuantity: roundTo(stats.totalQuantity, 1) || 0,
      criticalCount: stats.criticalCount
    }));

    const durationHours = Math.max(1, window.durationMs / (1000 * 60 * 60));
    const dataQuality = evaluateDataQuality(movements.length + items.length, 60, durationHours);

    const recentMovements = movements.slice(0, 10).map((m) => ({
      id: m.id,
      itemName: m.item.name,
      sku: m.item.sku,
      type: m.type,
      quantity: roundTo(m.quantity, 1) || 0,
      previousStock: roundTo(m.previousStock, 1) || 0,
      newStock: roundTo(m.newStock, 1) || 0,
      createdAt: m.createdAt.toISOString()
    }));

    return {
      station: stationFilter,
      timeWindow: {
        start: window.currentStart.toISOString(),
        end: window.currentEnd.toISOString()
      },
      summary: {
        totalItems,
        criticalStockItems,
        lowStockItems,
        healthyStockItems,
        totalMovements: movements.length,
        consumptionMovements,
        receiptMovements,
        transferMovements,
        totalShipments: shipments.length
      },
      categoryDistribution,
      shipmentStatusDistribution,
      recentMovements,
      dataQuality
    };
  }
}

export const logisticsAnalyticsService = new LogisticsAnalyticsService();
