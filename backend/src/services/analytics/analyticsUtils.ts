import { ApiError } from "../../utils/apiError";
import {
  AnalyticsFilterParams,
  DataQualityReport,
  ResolvedTimeWindow,
  TimeRangeOption,
  TrendDirection
} from "./analytics.types";

const MAX_CUSTOM_DAYS = 90;

/**
 * Resolves standard or custom time ranges into UTC start and end boundaries
 * with an identical preceding time window for delta and percentage calculations.
 */
export function resolveTimeWindow(params: AnalyticsFilterParams): ResolvedTimeWindow {
  const timeRange: TimeRangeOption = params.timeRange || "24h";
  const now = new Date();

  let currentStart: Date;
  let currentEnd: Date = now;

  if (timeRange === "custom") {
    if (!params.startDate || !params.endDate) {
      throw ApiError.badRequest(
        "Both 'startDate' and 'endDate' are required when timeRange is 'custom'",
        "INVALID_TIME_RANGE"
      );
    }

    currentStart = new Date(params.startDate);
    currentEnd = new Date(params.endDate);

    if (isNaN(currentStart.getTime()) || isNaN(currentEnd.getTime())) {
      throw ApiError.badRequest(
        "Malformed ISO date string provided for startDate or endDate",
        "MALFORMED_DATE"
      );
    }

    if (currentStart >= currentEnd) {
      throw ApiError.badRequest(
        "startDate must be chronologically earlier than endDate",
        "INVALID_DATE_ORDER"
      );
    }

    const diffDays = (currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > MAX_CUSTOM_DAYS) {
      throw ApiError.badRequest(
        `Custom date range cannot exceed ${MAX_CUSTOM_DAYS} days to preserve server performance`,
        "RANGE_TOO_LARGE"
      );
    }
  } else {
    switch (timeRange) {
      case "1h":
        currentStart = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case "6h":
        currentStart = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case "24h":
        currentStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        currentStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  const durationMs = currentEnd.getTime() - currentStart.getTime();
  const previousStart = new Date(currentStart.getTime() - durationMs);
  const previousEnd = new Date(currentStart.getTime());

  return {
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
    durationMs,
    timeRange
  };
}

/**
 * Calculates mathematical percentage change: ((current - previous) / previous) * 100
 * Handles zero and null safely.
 */
export function calculateChangePercent(
  current: number | null | undefined,
  previous: number | null | undefined
): number | null {
  if (current === null || current === undefined || previous === null || previous === undefined) {
    return null;
  }
  if (previous === 0) {
    return current === 0 ? 0 : 100.0;
  }
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  return Math.round(pct * 10) / 10;
}

/**
 * Determines directional trend using percentage delta
 */
export function calculateTrend(
  current: number | null | undefined,
  previous: number | null | undefined,
  thresholdPercent = 1.0
): TrendDirection {
  if (current === null || current === undefined || previous === null || previous === undefined) {
    return "INSUFFICIENT_DATA";
  }
  const pct = calculateChangePercent(current, previous);
  if (pct === null) return "INSUFFICIENT_DATA";
  if (pct > thresholdPercent) return "RISING";
  if (pct < -thresholdPercent) return "FALLING";
  return "STABLE";
}

/**
 * Evaluates operational data quality against expected sample rate
 */
export function evaluateDataQuality(
  actualSampleCount: number,
  expectedFrequencyMinutes: number,
  durationHours: number
): DataQualityReport {
  const expectedSampleCount = Math.max(1, Math.round((durationHours * 60) / expectedFrequencyMinutes));
  const coveragePercent = Math.min(100, Math.round((actualSampleCount / expectedSampleCount) * 1000) / 10);

  let rating: "GOOD" | "LIMITED" | "POOR" = "GOOD";
  let dataGapsDetected = false;

  if (coveragePercent < 50) {
    rating = "POOR";
    dataGapsDetected = true;
  } else if (coveragePercent < 85) {
    rating = "LIMITED";
    dataGapsDetected = true;
  }

  return {
    rating,
    coveragePercent,
    expectedSampleCount,
    actualSampleCount,
    dataGapsDetected,
    notes:
      rating === "GOOD"
        ? "Robust telemetry density. Analytics fully representative."
        : rating === "LIMITED"
        ? "Intermittent packet loss or polling lag detected across sensors."
        : "Severe telemetry starvation. Metrics should be interpreted with caution."
  };
}

export function roundTo(val: number | null | undefined, decimals = 1): number | null {
  if (val === null || val === undefined || isNaN(val)) return null;
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

export function calculateAverage(values: number[]): number | null {
  const valid = values.filter((v) => typeof v === "number" && !isNaN(v));
  if (valid.length === 0) return null;
  const sum = valid.reduce((acc, curr) => acc + curr, 0);
  return roundTo(sum / valid.length, 1);
}

export function calculateSum(values: number[]): number {
  return values
    .filter((v) => typeof v === "number" && !isNaN(v))
    .reduce((acc, curr) => acc + curr, 0);
}
