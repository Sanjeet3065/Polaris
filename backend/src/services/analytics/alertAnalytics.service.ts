import { prisma } from "../../config/prisma";
import { stationService } from "../station.service";
import {
  AlertAnalyticsResponse,
  AnalyticsFilterParams,
  ResolvedTimeWindow
} from "./analytics.types";
import {
  calculateAverage,
  evaluateDataQuality,
  resolveTimeWindow,
  roundTo
} from "./analyticsUtils";

export class AlertAnalyticsService {
  public async getAlertAnalytics(
    params: AnalyticsFilterParams
  ): Promise<AlertAnalyticsResponse> {
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

    const alerts = await prisma.alert.findMany({
      where: {
        ...whereStationClause,
        occurredAt: {
          gte: window.currentStart,
          lte: window.currentEnd
        }
      },
      include: {
        station: { select: { code: true } }
      },
      orderBy: { occurredAt: "asc" }
    });

    const totalAlerts = alerts.length;
    const durationHours = Math.max(1, window.durationMs / (1000 * 60 * 60));
    const dataQuality = evaluateDataQuality(totalAlerts, 60, durationHours);

    const bySeverity: Record<string, number> = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
      INFO: 0
    };

    const byStation: Record<string, number> = {
      MAITRI: 0,
      BHARATI: 0
    };

    const bySource: Record<string, number> = {};
    const ruleOccurrences: Record<string, { title: string; count: number; severity: string }> = {};

    let openAlerts = 0;
    let acknowledgedAlerts = 0;
    let resolvedAlerts = 0;
    let suppressedAlerts = 0;

    const mttaMinutesList: number[] = [];
    const mttrMinutesList: number[] = [];

    for (const a of alerts) {
      // Status breakdown
      if (a.status === "OPEN" || a.status === "ACTIVE" || a.status === "ESCALATED") {
        openAlerts++;
      } else if (a.status === "ACKNOWLEDGED") {
        acknowledgedAlerts++;
      } else if (a.status === "RESOLVED") {
        resolvedAlerts++;
      } else if (a.status === "SUPPRESSED") {
        suppressedAlerts++;
      }

      // Severity
      bySeverity[a.severity] = (bySeverity[a.severity] || 0) + 1;

      // Station
      const stCode = a.station.code;
      byStation[stCode] = (byStation[stCode] || 0) + 1;

      // Source
      const src = a.source || "UNKNOWN";
      bySource[src] = (bySource[src] || 0) + 1;

      // Recurring rules
      const rule = a.ruleCode || a.title;
      if (!ruleOccurrences[rule]) {
        ruleOccurrences[rule] = { title: a.title, count: 0, severity: a.severity };
      }
      ruleOccurrences[rule].count++;

      // MTTA: AcknowledgedAt - OccurredAt (minutes)
      if (a.acknowledgedAt) {
        const diffMin = (a.acknowledgedAt.getTime() - a.occurredAt.getTime()) / (1000 * 60);
        if (diffMin >= 0) mttaMinutesList.push(diffMin);
      }

      // MTTR: ResolvedAt - OccurredAt (minutes)
      if (a.resolvedAt) {
        const diffMin = (a.resolvedAt.getTime() - a.occurredAt.getTime()) / (1000 * 60);
        if (diffMin >= 0) mttrMinutesList.push(diffMin);
      }
    }

    const mttaMinutes = calculateAverage(mttaMinutesList);
    const mttrMinutes = calculateAverage(mttrMinutesList);

    const topRules = Object.entries(ruleOccurrences)
      .map(([ruleCode, info]) => ({
        ruleCode,
        title: info.title,
        count: info.count,
        severity: info.severity
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Group into 12 timeline buckets
    const bucketCount = 12;
    const bucketMs = Math.max(1, window.durationMs / bucketCount);
    const buckets: { timestamp: string; total: number; critical: number }[] = [];

    for (let i = 0; i < bucketCount; i++) {
      const bStart = new Date(window.currentStart.getTime() + i * bucketMs);
      const bEnd = new Date(bStart.getTime() + bucketMs);
      const inBucket = alerts.filter((a) => a.occurredAt >= bStart && a.occurredAt < bEnd);
      buckets.push({
        timestamp: bStart.toISOString(),
        total: inBucket.length,
        critical: inBucket.filter((a) => a.severity === "CRITICAL").length
      });
    }

    return {
      station: stationFilter,
      timeWindow: {
        start: window.currentStart.toISOString(),
        end: window.currentEnd.toISOString()
      },
      summary: {
        totalAlerts,
        openAlerts,
        acknowledgedAlerts,
        resolvedAlerts,
        suppressedAlerts,
        mttaMinutes,
        mttrMinutes
      },
      bySeverity,
      byStation,
      bySource,
      topRules,
      timeSeries: buckets,
      dataQuality
    };
  }
}

export const alertAnalyticsService = new AlertAnalyticsService();
