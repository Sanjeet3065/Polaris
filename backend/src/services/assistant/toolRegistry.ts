import { z } from "zod";
import { stationService } from "../station.service";
import { energyService } from "../energy.service";
import { environmentService } from "../environment.service";
import { equipmentService } from "../equipment.service";
import { alertService } from "../alert.service";
import { incidentService } from "../incident.service";
import { eventService } from "../event.service";
import { analyticsService } from "../analytics/analytics.service";
import { energyAnalyticsService } from "../analytics/energyAnalytics.service";
import { environmentAnalyticsService } from "../analytics/environmentAnalytics.service";
import { equipmentAnalyticsService } from "../analytics/equipmentAnalytics.service";
import { maintenanceAnalyticsService } from "../analytics/maintenanceAnalytics.service";
import { alertAnalyticsService } from "../analytics/alertAnalytics.service";
import { incidentAnalyticsService } from "../analytics/incidentAnalytics.service";
import { logisticsAnalyticsService } from "../analytics/logisticsAnalytics.service";
import { stationComparisonService } from "../analytics/stationComparison.service";
import { reportService } from "../analytics/report.service";
import { ApiError } from "../../utils/apiError";

export interface ToolContext {
  userId: string;
  role: string;
  userStationId?: string;
}

export interface RegisteredTool {
  name: string;
  description: string;
  schema: z.ZodType<any>;
  execute: (args: any, context: ToolContext) => Promise<any>;
}

export class ToolRegistry {
  private static tools: Map<string, RegisteredTool> = new Map();

  public static registerTool(tool: RegisteredTool): void {
    this.tools.set(tool.name, tool);
  }

  public static getTool(name: string): RegisteredTool | undefined {
    return this.tools.get(name);
  }

  public static getAllTools(): RegisteredTool[] {
    return Array.from(this.tools.values());
  }

  public static async executeTool(name: string, args: any, context: ToolContext): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw ApiError.badRequest(`Tool '${name}' is not in the allowlisted tool registry`, "TOOL_NOT_FOUND");
    }

    // Validate inputs with Zod
    const validatedArgs = tool.schema.parse(args);

    // Enforce Station Access Control if stationId is passed
    if (validatedArgs.stationId && validatedArgs.stationId !== "ALL") {
      this.verifyStationAccess(validatedArgs.stationId, context);
    }

    return await tool.execute(validatedArgs, context);
  }

  public static verifyStationAccess(stationIdOrCode: string, context: ToolContext): void {
    if (context.role === "ADMIN") {
      return; // Admins have global multi-station access
    }

    if (context.userStationId) {
      const normalizedTarget = stationIdOrCode.toUpperCase();
      const normalizedUserStation = context.userStationId.toUpperCase();

      if (
        normalizedTarget !== normalizedUserStation &&
        !normalizedTarget.includes(normalizedUserStation) &&
        !normalizedUserStation.includes(normalizedTarget)
      ) {
        throw ApiError.forbidden(
          `Unauthorized station access: User role '${context.role}' cannot access data for station '${stationIdOrCode}'`,
          "FORBIDDEN_STATION_ACCESS"
        );
      }
    }
  }
}

// -------------------------------------------------------------
// Register All 21 Allowlisted Operational Tools
// -------------------------------------------------------------

// 1. get_station_status
ToolRegistry.registerTool({
  name: "get_station_status",
  description: "Get station status, operational health score, and basic metadata",
  schema: z.object({
    stationId: z.string().optional().default("MAITRI")
  }),
  execute: async (args) => {
    return await stationService.resolveStation(args.stationId);
  }
});

// 2. get_station_telemetry
ToolRegistry.registerTool({
  name: "get_station_telemetry",
  description: "Get latest raw sensor and telemetry reading snapshot for a station",
  schema: z.object({
    stationId: z.string().optional().default("MAITRI")
  }),
  execute: async (args) => {
    const [energy, env] = await Promise.allSettled([
      energyService.getLatestEnergy(args.stationId),
      environmentService.getLatestEnvironment(args.stationId)
    ]);
    return {
      energy: energy.status === "fulfilled" ? energy.value : null,
      environment: env.status === "fulfilled" ? env.value : null
    };
  }
});

// 3. get_energy_summary
ToolRegistry.registerTool({
  name: "get_energy_summary",
  description: "Get current power balance, solar generation, diesel load, battery SoC, and fuel reserves",
  schema: z.object({
    stationId: z.string().optional().default("MAITRI"),
    timeRange: z.enum(["1h", "6h", "24h", "7d", "30d", "custom"]).optional().default("24h")
  }),
  execute: async (args) => {
    return await energyAnalyticsService.getEnergyAnalytics({
      stationId: args.stationId,
      timeRange: args.timeRange
    });
  }
});

// 4. get_environment_summary
ToolRegistry.registerTool({
  name: "get_environment_summary",
  description: "Get meteorological snapshot, temperature, Katabatic wind velocity, pressure, and Blizzard warnings",
  schema: z.object({
    stationId: z.string().optional().default("MAITRI"),
    timeRange: z.enum(["1h", "6h", "24h", "7d", "30d", "custom"]).optional().default("24h")
  }),
  execute: async (args) => {
    return await environmentAnalyticsService.getEnvironmentAnalytics({
      stationId: args.stationId,
      timeRange: args.timeRange
    });
  }
});

// 5. get_equipment_status
ToolRegistry.registerTool({
  name: "get_equipment_status",
  description: "Get equipment catalog and health summary for a station",
  schema: z.object({
    stationId: z.string().optional().default("MAITRI"),
    page: z.number().optional().default(1),
    limit: z.number().optional().default(20)
  }),
  execute: async (args) => {
    return await equipmentService.getEquipmentByStation(args.stationId, {
      page: args.page,
      limit: args.limit
    });
  }
});

// 6. get_equipment_health
ToolRegistry.registerTool({
  name: "get_equipment_health",
  description: "Get detailed health score, vibration, temperature and telemetry for a specific equipment item",
  schema: z.object({
    equipmentId: z.string()
  }),
  execute: async (args) => {
    return await equipmentService.getEquipmentDetails(args.equipmentId);
  }
});

// 7. get_maintenance_predictions
ToolRegistry.registerTool({
  name: "get_maintenance_predictions",
  description: "Get Phase 10 AI predictive maintenance degradation predictions, estimated RUL, and risk bands",
  schema: z.object({
    stationId: z.string().optional().default("MAITRI"),
    timeRange: z.enum(["1h", "6h", "24h", "7d", "30d", "custom"]).optional().default("30d")
  }),
  execute: async (args) => {
    return await maintenanceAnalyticsService.getMaintenanceAnalytics({
      stationId: args.stationId,
      timeRange: args.timeRange
    });
  }
});

// 8. get_alert_summary
ToolRegistry.registerTool({
  name: "get_alert_summary",
  description: "Get alert lifecycle summary, severity breakdown, recurring alarm rules, and MTTA/MTTR latencies",
  schema: z.object({
    stationId: z.string().optional().default("MAITRI"),
    timeRange: z.enum(["1h", "6h", "24h", "7d", "30d", "custom"]).optional().default("7d")
  }),
  execute: async (args) => {
    return await alertAnalyticsService.getAlertAnalytics({
      stationId: args.stationId,
      timeRange: args.timeRange
    });
  }
});

// 9. get_alert_details
ToolRegistry.registerTool({
  name: "get_alert_details",
  description: "Get recent list of alerts filtered by station and severity",
  schema: z.object({
    stationId: z.string().optional().default("MAITRI"),
    page: z.number().optional().default(1),
    limit: z.number().optional().default(20)
  }),
  execute: async (args) => {
    return await alertService.getAlerts({
      stationId: args.stationId,
      page: args.page,
      limit: Math.min(args.limit, 20)
    });
  }
});

// 10. get_incident_summary
ToolRegistry.registerTool({
  name: "get_incident_summary",
  description: "Get incident operational analytics, severity distribution, status lifecycle, and resolution durations",
  schema: z.object({
    stationId: z.string().optional().default("MAITRI"),
    timeRange: z.enum(["1h", "6h", "24h", "7d", "30d", "custom"]).optional().default("30d")
  }),
  execute: async (args) => {
    return await incidentAnalyticsService.getIncidentAnalytics({
      stationId: args.stationId,
      timeRange: args.timeRange
    });
  }
});

// 11. get_incident_details
ToolRegistry.registerTool({
  name: "get_incident_details",
  description: "Get active operational incidents with notes and linked alert dossiers",
  schema: z.object({
    stationId: z.string().optional().default("MAITRI"),
    page: z.number().optional().default(1),
    limit: z.number().optional().default(20)
  }),
  execute: async (args) => {
    return await incidentService.getIncidents({
      stationId: args.stationId,
      page: args.page,
      limit: Math.min(args.limit, 20)
    });
  }
});

// 12. get_inventory_summary
ToolRegistry.registerTool({
  name: "get_inventory_summary",
  description: "Get life-support inventory status, critical stock items below threshold, and consumption trends",
  schema: z.object({
    stationId: z.string().optional().default("MAITRI"),
    timeRange: z.enum(["1h", "6h", "24h", "7d", "30d", "custom"]).optional().default("30d")
  }),
  execute: async (args) => {
    return await logisticsAnalyticsService.getLogisticsAnalytics({
      stationId: args.stationId,
      timeRange: args.timeRange
    });
  }
});

// 13. get_logistics_summary
ToolRegistry.registerTool({
  name: "get_logistics_summary",
  description: "Get polar supply chain status, active expedition cargo shipments, and inter-station transfers",
  schema: z.object({
    stationId: z.string().optional().default("MAITRI"),
    timeRange: z.enum(["1h", "6h", "24h", "7d", "30d", "custom"]).optional().default("30d")
  }),
  execute: async (args) => {
    return await logisticsAnalyticsService.getLogisticsAnalytics({
      stationId: args.stationId,
      timeRange: args.timeRange
    });
  }
});

// 14. get_analytics_overview
ToolRegistry.registerTool({
  name: "get_analytics_overview",
  description: "Get top 10 operational KPI cards, period comparison deltas, trends, and deterministic summary",
  schema: z.object({
    stationId: z.string().optional().default("MAITRI"),
    timeRange: z.enum(["1h", "6h", "24h", "7d", "30d", "custom"]).optional().default("24h")
  }),
  execute: async (args) => {
    return await analyticsService.getOverview({
      stationId: args.stationId,
      timeRange: args.timeRange
    });
  }
});

// 15. get_energy_analytics
ToolRegistry.registerTool({
  name: "get_energy_analytics",
  description: "Get in-depth energy analytics including generation, consumption, solar fraction, and battery SoC",
  schema: z.object({
    stationId: z.string().optional().default("MAITRI"),
    timeRange: z.enum(["1h", "6h", "24h", "7d", "30d", "custom"]).optional().default("24h")
  }),
  execute: async (args) => {
    return await energyAnalyticsService.getEnergyAnalytics({
      stationId: args.stationId,
      timeRange: args.timeRange
    });
  }
});

// 16. get_environment_analytics
ToolRegistry.registerTool({
  name: "get_environment_analytics",
  description: "Get in-depth climate analytics, extreme weather hours, and Blizzard frequency",
  schema: z.object({
    stationId: z.string().optional().default("MAITRI"),
    timeRange: z.enum(["1h", "6h", "24h", "7d", "30d", "custom"]).optional().default("24h")
  }),
  execute: async (args) => {
    return await environmentAnalyticsService.getEnvironmentAnalytics({
      stationId: args.stationId,
      timeRange: args.timeRange
    });
  }
});

// 17. get_equipment_analytics
ToolRegistry.registerTool({
  name: "get_equipment_analytics",
  description: "Get equipment fleet health distributions, risk bands, and status counts",
  schema: z.object({
    stationId: z.string().optional().default("MAITRI"),
    timeRange: z.enum(["1h", "6h", "24h", "7d", "30d", "custom"]).optional().default("7d")
  }),
  execute: async (args) => {
    return await equipmentAnalyticsService.getEquipmentAnalytics({
      stationId: args.stationId,
      timeRange: args.timeRange
    });
  }
});

// 18. get_maintenance_analytics
ToolRegistry.registerTool({
  name: "get_maintenance_analytics",
  description: "Get Phase 10 maintenance risk distributions, health tiers, and work orders",
  schema: z.object({
    stationId: z.string().optional().default("MAITRI"),
    timeRange: z.enum(["1h", "6h", "24h", "7d", "30d", "custom"]).optional().default("30d")
  }),
  execute: async (args) => {
    return await maintenanceAnalyticsService.getMaintenanceAnalytics({
      stationId: args.stationId,
      timeRange: args.timeRange
    });
  }
});

// 19. get_report_summary
ToolRegistry.registerTool({
  name: "get_report_summary",
  description: "Get recently generated operational compliance reports",
  schema: z.object({
    stationId: z.string().optional()
  }),
  execute: async () => {
    return await reportService.listGeneratedReports();
  }
});

// 20. get_station_comparison
ToolRegistry.registerTool({
  name: "get_station_comparison",
  description: "Get objective side-by-side comparative matrix between Maitri and Bharati (strictly neutral benchmark)",
  schema: z.object({
    timeRange: z.enum(["1h", "6h", "24h", "7d", "30d", "custom"]).optional().default("24h")
  }),
  execute: async (args) => {
    return await stationComparisonService.getStationComparison({
      timeRange: args.timeRange
    });
  }
});

// 21. get_recent_operational_events
ToolRegistry.registerTool({
  name: "get_recent_operational_events",
  description: "Get recent chronological operational events timeline for a station",
  schema: z.object({
    stationId: z.string().optional().default("MAITRI"),
    limit: z.number().optional().default(10)
  }),
  execute: async (args) => {
    return await eventService.getEventsByStation(args.stationId, {
      page: 1,
      limit: Math.min(args.limit, 20)
    });
  }
});
