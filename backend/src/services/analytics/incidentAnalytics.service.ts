import { prisma } from "../../config/prisma";
import { stationService } from "../station.service";
import {
  AnalyticsFilterParams,
  IncidentAnalyticsResponse,
  ResolvedTimeWindow
} from "./analytics.types";
import {
  calculateAverage,
  evaluateDataQuality,
  resolveTimeWindow,
  roundTo
} from "./analyticsUtils";

export class IncidentAnalyticsService {
  public async getIncidentAnalytics(
    params: AnalyticsFilterParams
  ): Promise<IncidentAnalyticsResponse> {
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

    const incidents = await prisma.incident.findMany({
      where: {
        ...whereStationClause,
        startedAt: {
          gte: window.currentStart,
          lte: window.currentEnd
        }
      },
      include: {
        station: { select: { code: true } },
        alerts: { select: { alertId: true } }
      },
      orderBy: { startedAt: "desc" }
    });

    const totalIncidents = incidents.length;
    const durationHours = Math.max(1, window.durationMs / (1000 * 60 * 60));
    const dataQuality = evaluateDataQuality(totalIncidents, 180, durationHours);

    let openIncidents = 0;
    let investigatingIncidents = 0;
    let mitigatingIncidents = 0;
    let resolvedIncidents = 0;
    let closedIncidents = 0;

    const bySeverity: Record<string, number> = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0
    };

    const byCategory: Record<string, number> = {};
    const byStation: Record<string, number> = {
      MAITRI: 0,
      BHARATI: 0
    };

    const resolutionHoursList: number[] = [];
    let linkedAlertCount = 0;

    for (const inc of incidents) {
      if (inc.status === "OPEN") openIncidents++;
      else if (inc.status === "INVESTIGATING") investigatingIncidents++;
      else if (inc.status === "MITIGATING") mitigatingIncidents++;
      else if (inc.status === "RESOLVED") resolvedIncidents++;
      else if (inc.status === "CLOSED") closedIncidents++;

      bySeverity[inc.severity] = (bySeverity[inc.severity] || 0) + 1;
      byCategory[inc.category] = (byCategory[inc.category] || 0) + 1;

      const stCode = inc.station.code;
      byStation[stCode] = (byStation[stCode] || 0) + 1;

      linkedAlertCount += inc.alerts.length;

      if (inc.resolvedAt) {
        const diffH = (inc.resolvedAt.getTime() - inc.startedAt.getTime()) / (1000 * 60 * 60);
        if (diffH >= 0) resolutionHoursList.push(diffH);
      }
    }

    const avgResolutionHours = calculateAverage(resolutionHoursList);

    // Group into 6 timeline buckets
    const bucketCount = 6;
    const bucketMs = Math.max(1, window.durationMs / bucketCount);
    const buckets: { timestamp: string; count: number }[] = [];

    for (let i = 0; i < bucketCount; i++) {
      const bStart = new Date(window.currentStart.getTime() + i * bucketMs);
      const bEnd = new Date(bStart.getTime() + bucketMs);
      const inBucket = incidents.filter((inc) => inc.startedAt >= bStart && inc.startedAt < bEnd);
      buckets.push({
        timestamp: bStart.toISOString(),
        count: inBucket.length
      });
    }

    const recentIncidents = incidents.slice(0, 10).map((inc) => ({
      id: inc.id,
      incidentNumber: inc.incidentNumber,
      title: inc.title,
      stationCode: inc.station.code,
      severity: inc.severity,
      status: inc.status,
      category: inc.category,
      startedAt: inc.startedAt.toISOString(),
      resolvedAt: inc.resolvedAt ? inc.resolvedAt.toISOString() : null,
      alertCount: inc.alerts.length
    }));

    return {
      station: stationFilter,
      timeWindow: {
        start: window.currentStart.toISOString(),
        end: window.currentEnd.toISOString()
      },
      summary: {
        totalIncidents,
        openIncidents,
        investigatingIncidents,
        mitigatingIncidents,
        resolvedIncidents,
        closedIncidents,
        avgResolutionHours,
        linkedAlertCount
      },
      bySeverity,
      byCategory,
      byStation,
      timeSeries: buckets,
      recentIncidents,
      dataQuality
    };
  }
}

export const incidentAnalyticsService = new IncidentAnalyticsService();
