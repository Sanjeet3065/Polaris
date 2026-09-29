import { prisma } from "../config/prisma";
import { MaintenancePrediction, Prisma, RiskBand } from "@prisma/client";
import { handleDbError } from "../utils/dbErrorHandler";

export interface PredictionFilterOptions {
  stationId?: string;
  riskBand?: RiskBand;
  search?: string;
  page?: number;
  limit?: number;
}

export interface HealthOverviewStats {
  monitoredCount: number;
  healthyCount: number;
  goodCount: number;
  watchCount: number;
  degradedCount: number;
  criticalCount: number;
  atRiskCount: number; // HIGH or CRITICAL risk
  highRiskCount: number;
  criticalRiskCount: number;
  averageHealthScore: number;
  averageRiskScore: number;
  stationBreakdown?: Record<string, {
    monitored: number;
    atRisk: number;
    averageHealth: number;
    averageRisk: number;
  }>;
}

export class MaintenancePredictionRepository {
  private static instance: MaintenancePredictionRepository;

  private constructor() {}

  public static getInstance(): MaintenancePredictionRepository {
    if (!MaintenancePredictionRepository.instance) {
      MaintenancePredictionRepository.instance = new MaintenancePredictionRepository();
    }
    return MaintenancePredictionRepository.instance;
  }

  /**
   * Persists a new prediction snapshot
   */
  public async create(data: Prisma.MaintenancePredictionUncheckedCreateInput): Promise<MaintenancePrediction> {
    try {
      return await prisma.maintenancePrediction.create({
        data,
        include: {
          equipment: {
            select: {
              id: true,
              code: true,
              name: true,
              category: true,
              status: true
            }
          },
          station: {
            select: {
              id: true,
              code: true,
              name: true
            }
          }
        }
      });
    } catch (error) {
      handleDbError(error, "MaintenancePredictionCreate");
    }
  }

  /**
   * Retrieves the latest prediction for a specific equipment asset
   */
  public async findLatestByEquipmentId(equipmentId: string): Promise<MaintenancePrediction | null> {
    try {
      return await prisma.maintenancePrediction.findFirst({
        where: { equipmentId },
        orderBy: { generatedAt: "desc" },
        include: {
          equipment: {
            select: {
              id: true,
              code: true,
              name: true,
              category: true,
              status: true
            }
          },
          station: {
            select: {
              id: true,
              code: true,
              name: true
            }
          }
        }
      });
    } catch (error) {
      handleDbError(error, "MaintenancePredictionLatest");
    }
  }

  /**
   * Retrieves chronological prediction history for an equipment asset
   */
  public async findHistoryByEquipmentId(
    equipmentId: string,
    limit: number = 30
  ): Promise<MaintenancePrediction[]> {
    try {
      return await prisma.maintenancePrediction.findMany({
        where: { equipmentId },
        orderBy: { generatedAt: "desc" },
        take: limit
      });
    } catch (error) {
      handleDbError(error, "MaintenancePredictionHistory");
    }
  }

  /**
   * Retrieves latest predictions across equipment, optionally filtered by station and risk band
   */
  public async findLatestPredictions(options: PredictionFilterOptions): Promise<{
    items: MaintenancePrediction[];
    total: number;
  }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 50;
      const skip = (page - 1) * limit;

      // Filter equipment where station matches
      const equipmentWhere: Prisma.EquipmentWhereInput = {};
      if (options.stationId && options.stationId !== "ALL") {
        if (["MAITRI", "BHARATI"].includes(options.stationId.toUpperCase())) {
          equipmentWhere.station = { code: options.stationId.toUpperCase() };
        } else {
          equipmentWhere.OR = [
            { stationId: options.stationId },
            { station: { code: options.stationId.toUpperCase() } }
          ];
        }
      }

      if (options.search) {
        equipmentWhere.OR = [
          { name: { contains: options.search, mode: "insensitive" } },
          { code: { contains: options.search, mode: "insensitive" } }
        ];
      }

      // Fetch all matching equipment
      const equipments = await prisma.equipment.findMany({
        where: equipmentWhere,
        include: {
          station: true,
          predictions: {
            orderBy: { generatedAt: "desc" },
            take: 1
          }
        }
      });

      // Extract latest prediction per equipment
      let latestList = equipments
        .map(eq => eq.predictions[0])
        .filter((pred): pred is MaintenancePrediction => pred !== undefined && pred !== null);

      if (options.riskBand) {
        latestList = latestList.filter(p => p.riskBand === options.riskBand);
      }

      // Sort by riskScore descending
      latestList.sort((a, b) => b.riskScore - a.riskScore);

      const total = latestList.length;
      const paginated = latestList.slice(skip, skip + limit);

      return {
        items: paginated,
        total
      };
    } catch (error) {
      handleDbError(error, "MaintenancePredictionList");
    }
  }

  /**
   * Aggregates station-wide health overview KPIs
   */
  public async getHealthOverview(stationFilter?: string): Promise<HealthOverviewStats> {
    try {
      const stationWhere: Prisma.EquipmentWhereInput = {};
      if (stationFilter && stationFilter !== "ALL") {
        if (["MAITRI", "BHARATI"].includes(stationFilter.toUpperCase())) {
          stationWhere.station = { code: stationFilter.toUpperCase() };
        } else {
          stationWhere.OR = [
            { stationId: stationFilter },
            { station: { code: stationFilter.toUpperCase() } }
          ];
        }
      }

      const allEquipment = await prisma.equipment.findMany({
        where: stationWhere,
        include: {
          station: true,
          predictions: {
            orderBy: { generatedAt: "desc" },
            take: 1
          }
        }
      });

      const predictions = allEquipment
        .map(eq => ({ equipment: eq, prediction: eq.predictions[0] }))
        .filter(item => item.prediction != null);

      let healthyCount = 0;
      let goodCount = 0;
      let watchCount = 0;
      let degradedCount = 0;
      let criticalCount = 0;
      let highRiskCount = 0;
      let criticalRiskCount = 0;
      let totalHealth = 0;
      let totalRisk = 0;

      const stationMap: Record<string, {
        monitored: number;
        atRisk: number;
        healthSum: number;
        riskSum: number;
      }> = {};

      for (const { equipment, prediction } of predictions) {
        const code = equipment.station.code;
        if (!stationMap[code]) {
          stationMap[code] = { monitored: 0, atRisk: 0, healthSum: 0, riskSum: 0 };
        }
        stationMap[code].monitored += 1;
        stationMap[code].healthSum += prediction.healthScore;
        stationMap[code].riskSum += prediction.riskScore;

        totalHealth += prediction.healthScore;
        totalRisk += prediction.riskScore;

        // Health band categorization
        if (prediction.healthScore >= 90) healthyCount++;
        else if (prediction.healthScore >= 75) goodCount++;
        else if (prediction.healthScore >= 60) watchCount++;
        else if (prediction.healthScore >= 40) degradedCount++;
        else criticalCount++;

        // Risk band categorization
        if (prediction.riskBand === RiskBand.CRITICAL) {
          criticalRiskCount++;
          stationMap[code].atRisk += 1;
        } else if (prediction.riskBand === RiskBand.HIGH) {
          highRiskCount++;
          stationMap[code].atRisk += 1;
        }
      }

      const count = predictions.length || 1;
      const breakdown: Record<string, { monitored: number; atRisk: number; averageHealth: number; averageRisk: number }> = {};
      for (const [code, stat] of Object.entries(stationMap)) {
        breakdown[code] = {
          monitored: stat.monitored,
          atRisk: stat.atRisk,
          averageHealth: stat.monitored ? Math.round((stat.healthSum / stat.monitored) * 10) / 10 : 0,
          averageRisk: stat.monitored ? Math.round((stat.riskSum / stat.monitored) * 10) / 10 : 0
        };
      }

      return {
        monitoredCount: predictions.length,
        healthyCount,
        goodCount,
        watchCount,
        degradedCount,
        criticalCount,
        atRiskCount: highRiskCount + criticalRiskCount,
        highRiskCount,
        criticalRiskCount,
        averageHealthScore: Math.round((totalHealth / count) * 10) / 10,
        averageRiskScore: Math.round((totalRisk / count) * 10) / 10,
        stationBreakdown: breakdown
      };
    } catch (error) {
      handleDbError(error, "HealthOverviewStats");
    }
  }
}

export const maintenancePredictionRepository = MaintenancePredictionRepository.getInstance();
