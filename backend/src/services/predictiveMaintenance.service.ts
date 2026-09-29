import { prisma } from "../config/prisma";
import { maintenancePredictionRepository, HealthOverviewStats } from "../repositories/maintenancePrediction.repository";
import { maintenanceRepository } from "../repositories/maintenance.repository";
import { featureExtractorService } from "./featureExtractor.service";
import { aiClientService, PredictionResultDto } from "./aiClient.service";
import { realtimeEventBus } from "../realtime/events/realtime.eventbus";
import { REALTIME_EVENT_TYPES } from "../realtime/events/realtime.types";
import { MaintenancePrediction, MaintenanceRecord, MaintenanceStatus, MaintenanceType, RiskBand } from "@prisma/client";
import { logger } from "../utils/logger";
import { ApiError } from "../utils/apiError";
import crypto from "crypto";

export interface PredictionListParams {
  stationId?: string;
  riskBand?: RiskBand;
  search?: string;
  page?: number;
  limit?: number;
}

export interface DetailedPredictionView {
  prediction: MaintenancePrediction;
  equipment: {
    id: string;
    code: string;
    name: string;
    category: string;
    status: string;
    stationId: string;
    stationCode: string;
    stationName: string;
  };
  relatedAlerts: Array<{
    id: string;
    ruleCode: string;
    severity: string;
    status: string;
    message: string;
    createdAt: Date;
  }>;
  relatedIncidents: Array<{
    id: string;
    incidentNumber: string;
    title: string;
    severity: string;
    status: string;
    createdAt: Date;
  }>;
  maintenanceHistory: MaintenanceRecord[];
  healthHistory: Array<{
    recordedAt: Date;
    healthScore: number;
    temperature: number | null;
    vibration: number | null;
    operatingHours: number | null;
  }>;
  riskTrend: Array<{
    timestamp: Date;
    riskScore: number;
    healthScore: number;
    riskBand: RiskBand;
  }>;
}

export class PredictiveMaintenanceService {
  private static instance: PredictiveMaintenanceService;

  private constructor() {}

  public static getInstance(): PredictiveMaintenanceService {
    if (!PredictiveMaintenanceService.instance) {
      PredictiveMaintenanceService.instance = new PredictiveMaintenanceService();
    }
    return PredictiveMaintenanceService.instance;
  }

  /**
   * Retrieves paginated latest predictions across monitored equipment
   */
  public async getPredictions(params: PredictionListParams): Promise<{
    items: MaintenancePrediction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = params.page || 1;
    const limit = params.limit || 50;

    const { items, total } = await maintenancePredictionRepository.findLatestPredictions({
      stationId: params.stationId,
      riskBand: params.riskBand,
      search: params.search,
      page,
      limit
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  /**
   * Retrieves detailed single prediction with historical trends, active alerts, and incidents
   */
  public async getPredictionByEquipmentId(equipmentId: string): Promise<DetailedPredictionView> {
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      include: {
        station: true
      }
    });

    if (!equipment) {
      throw ApiError.notFound(`Equipment '${equipmentId}' not found`, "EQUIPMENT_NOT_FOUND");
    }

    // 1. Fetch latest prediction or generate one if none exists
    let latest = await maintenancePredictionRepository.findLatestByEquipmentId(equipmentId);
    if (!latest) {
      latest = await this.refreshPrediction(equipmentId);
    }

    // 2. Fetch related Phase 9 alerts for this equipment
    const alerts = await prisma.alert.findMany({
      where: {
        stationId: equipment.stationId,
        OR: [
          { equipmentId: equipment.id },
          { message: { contains: equipment.code } },
          { sourceId: equipment.id }
        ]
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        ruleCode: true,
        severity: true,
        status: true,
        message: true,
        createdAt: true
      }
    });

    // 3. Fetch related Phase 9 incidents
    const incidents = await prisma.incident.findMany({
      where: {
        stationId: equipment.stationId,
        OR: [
          { title: { contains: equipment.code } },
          { description: { contains: equipment.code } }
        ]
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        incidentNumber: true,
        title: true,
        severity: true,
        status: true,
        createdAt: true
      }
    });

    // 4. Fetch recent maintenance records
    const maintenanceHistory = await maintenanceRepository.findByEquipmentId(equipmentId, 5);

    // 5. Fetch telemetry/health history for charts (past 30 records)
    const healthRecords = await prisma.equipmentHealth.findMany({
      where: { equipmentId },
      orderBy: { recordedAt: "desc" },
      take: 30,
      select: {
        recordedAt: true,
        healthPercent: true,
        temperature: true,
        vibration: true,
        runtimeHours: true
      }
    });

    // 6. Fetch historical prediction snapshots for risk trend chart
    const predictionHistory = await maintenancePredictionRepository.findHistoryByEquipmentId(equipmentId, 15);
    const riskTrend = predictionHistory.map(p => ({
      timestamp: p.generatedAt,
      riskScore: p.riskScore,
      healthScore: p.healthScore,
      riskBand: p.riskBand
    })).reverse();

    return {
      prediction: latest,
      equipment: {
        id: equipment.id,
        code: equipment.code,
        name: equipment.name,
        category: equipment.category,
        status: equipment.status,
        stationId: equipment.stationId,
        stationCode: equipment.station.code,
        stationName: equipment.station.name
      },
      relatedAlerts: alerts.map(a => ({
        id: a.id,
        ruleCode: a.ruleCode || "ALERT",
        severity: a.severity,
        status: a.status,
        message: a.message || "",
        createdAt: a.createdAt
      })),
      relatedIncidents: incidents,
      maintenanceHistory,
      healthHistory: healthRecords.map(h => ({
        recordedAt: h.recordedAt,
        healthScore: h.healthPercent,
        temperature: h.temperature,
        vibration: h.vibration,
        operatingHours: h.runtimeHours
      })).reverse(),
      riskTrend
    };
  }

  /**
   * Retrieves prediction history snapshots for trend line charts
   */
  public async getPredictionHistory(equipmentId: string, limit = 30): Promise<MaintenancePrediction[]> {
    return await maintenancePredictionRepository.findHistoryByEquipmentId(equipmentId, limit);
  }

  /**
   * Retrieves station health summary KPIs
   */
  public async getHealthOverview(stationFilter?: string): Promise<HealthOverviewStats> {
    return await maintenancePredictionRepository.getHealthOverview(stationFilter);
  }

  /**
   * Triggers on-demand feature extraction, AI inference, and persistence
   */
  public async refreshPrediction(equipmentId: string, userId?: string): Promise<MaintenancePrediction> {
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      include: { station: true }
    });

    if (!equipment) {
      throw ApiError.notFound(`Equipment '${equipmentId}' not found`, "EQUIPMENT_NOT_FOUND");
    }

    // 1. Extract feature vector up to right now
    const request = await featureExtractorService.extractFeatures(equipmentId);

    // 2. Query AI service (with automatic local fallback)
    const result: PredictionResultDto = await aiClientService.getPrediction(request);

    // 3. Persist new prediction in database
    const created = await maintenancePredictionRepository.create({
      equipmentId: equipment.id,
      stationId: equipment.stationId,
      healthScore: result.healthScore,
      riskScore: result.riskScore,
      riskBand: result.riskBand,
      estimatedRulHours: result.estimatedRulHours,
      estimatedRulDays: result.estimatedRulDays,
      confidence: result.confidence,
      dataQuality: result.dataQuality,
      predictionHorizon: result.predictionHorizon,
      modelName: result.modelName,
      modelVersion: result.modelVersion,
      featureVersion: result.featureVersion,
      topFactors: JSON.stringify(result.topFactors),
      recommendation: result.recommendation,
      generatedAt: new Date(result.generatedAt),
      expiresAt: new Date(result.expiresAt)
    });

    // 4. Log Operational Audit Event
    await prisma.operationalEvent.create({
      data: {
        stationId: equipment.stationId,
        type: "PREDICTION_REFRESHED",
        title: `AI Prediction Refreshed: ${equipment.code}`,
        description: `Updated predictive health: ${result.healthScore}%, Risk: ${result.riskScore}% (${result.riskBand}). Recommendation: ${result.recommendation.substring(0, 100)}...`,
        occurredAt: new Date(),
        metadata: JSON.stringify({
          equipmentId: equipment.id,
          equipmentCode: equipment.code,
          riskBand: result.riskBand,
          healthScore: result.healthScore,
          userId: userId || "SYSTEM",
          modelName: result.modelName,
          modelVersion: result.modelVersion,
          isFallback: result.isFallback
        })
      }
    });

    // 5. Emit real-time WebSocket event
    realtimeEventBus.publish({
      type: REALTIME_EVENT_TYPES.MAINTENANCE_PREDICTION_UPDATED,
      eventId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      stationId: equipment.stationId,
      stationCode: equipment.station.code as any,
      sequence: Date.now(),
      data: {
        equipmentId: equipment.id,
        equipmentCode: equipment.code,
        stationCode: equipment.station.code,
        healthScore: result.healthScore,
        riskScore: result.riskScore,
        riskBand: result.riskBand,
        estimatedRulDays: result.estimatedRulDays,
        confidence: result.confidence,
        recommendation: result.recommendation,
        generatedAt: created.generatedAt
      }
    });

    logger.info(`PREDICTION_REFRESHED: Asset ${equipment.code} evaluated (Health: ${result.healthScore}, Risk: ${result.riskScore})`);

    return created;
  }

  /**
   * Creates a formal MaintenanceRecord work order based on predictive recommendation
   * Integrates seamlessly with existing MaintenanceRecord workflow.
   */
  public async createWorkOrder(
    equipmentId: string,
    data: {
      title: string;
      description: string;
      type?: MaintenanceType;
      priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      scheduledAt: string;
      assignedTo?: string;
    },
    userId?: string
  ): Promise<MaintenanceRecord> {
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      include: { station: true }
    });

    if (!equipment) {
      throw ApiError.notFound(`Equipment '${equipmentId}' not found`, "EQUIPMENT_NOT_FOUND");
    }

    const scheduledDate = new Date(data.scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      throw ApiError.badRequest("Invalid scheduledAt timestamp", "INVALID_DATE");
    }

    const record = await maintenanceRepository.create({
      equipmentId: equipment.id,
      title: data.title,
      description: data.description,
      type: data.type || MaintenanceType.PREVENTIVE,
      status: MaintenanceStatus.SCHEDULED,
      scheduledAt: scheduledDate,
      notes: data.assignedTo ? `Assigned to: ${data.assignedTo}` : null
    });

    // Operational event audit
    await prisma.operationalEvent.create({
      data: {
        stationId: equipment.stationId,
        type: "MAINTENANCE_ACTION_CREATED",
        title: `Work Order Created: ${data.title}`,
        description: `Scheduled maintenance for ${equipment.code} on ${scheduledDate.toISOString().split("T")[0]}.`,
        occurredAt: new Date(),
        metadata: JSON.stringify({
          equipmentId: equipment.id,
          equipmentCode: equipment.code,
          workOrderId: record.id,
          userId: userId || "OPERATOR"
        })
      }
    });

    // Emit WebSocket broadcast
    realtimeEventBus.publish({
      type: REALTIME_EVENT_TYPES.MAINTENANCE_WORK_ORDER_CREATED,
      eventId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      stationId: equipment.stationId,
      stationCode: equipment.station.code as any,
      sequence: Date.now(),
      data: {
        workOrderId: record.id,
        equipmentId: equipment.id,
        equipmentCode: equipment.code,
        title: record.title,
        scheduledAt: record.scheduledAt,
        status: record.status
      }
    });

    return record;
  }
}

export const predictiveMaintenanceService = PredictiveMaintenanceService.getInstance();
