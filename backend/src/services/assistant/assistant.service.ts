import {
  AssistantRequest,
  AssistantResponse,
  ChatMessage,
  SourceReference,
  SuggestedNavigation,
  ProposedAction,
  ToolCallRecord
} from "./assistant.types";
import { IntentService } from "./intent.service";
import { ToolRegistry } from "./toolRegistry";
import { AIProviderFactory } from "./aiProviders/providerFactory";
import { conversationService } from "./conversation.service";
import { logger } from "../../utils/logger";

export interface UserContext {
  id: string;
  role: string;
  name: string;
  email: string;
  stationId?: string; // Optional assigned station for operators
}

export class AssistantService {
  private static instance: AssistantService;

  public static getInstance(): AssistantService {
    if (!AssistantService.instance) {
      AssistantService.instance = new AssistantService();
    }
    return AssistantService.instance;
  }

  /**
   * Primary Chat Orchestrator (Synchronous response)
   */
  public async chat(request: AssistantRequest, user: UserContext): Promise<AssistantResponse> {
    const startTime = Date.now();
    const query = request.message.trim();

    // 1. Resolve or create conversation
    let conversationId = request.conversationId;
    if (!conversationId) {
      const newConv = conversationService.createConversation(user.id, request.stationId || "MAITRI");
      conversationId = newConv.id;
    } else {
      // Validate conversation ownership
      conversationService.getConversation(conversationId, user.id);
    }

    // 2. Prompt Injection & Security Defense Check
    if (IntentService.detectPromptInjection(query)) {
      logger.warn(`SECURITY_ALERT: Blocked prompt injection attempt from user ${user.id}: "${query.slice(0, 100)}"`);
      const safeResponse = this.buildSecurityRefusalResponse(conversationId, query, user.id);
      return safeResponse;
    }

    // 3. Extract Entities & Classify Intent
    const entities = IntentService.extractEntities(query, request.stationId || "MAITRI");
    const intent = IntentService.classifyIntent(query);
    const station = entities.station || (request.stationId?.toUpperCase() as any) || "MAITRI";
    const timeRange = entities.timeRange || request.timeRange || "24h";

    // 4. Station Authorization Check
    const isStationAuthorized = this.checkStationAuthorization(station, user);
    if (!isStationAuthorized) {
      return this.buildUnauthorizedStationResponse(conversationId, station, user.id);
    }

    // 5. Safe Action Model (Write Guard)
    const actionCheck = IntentService.detectActionRequest(query);
    let proposedAction: ProposedAction | undefined;

    if (actionCheck.isAction) {
      proposedAction = {
        actionType: actionCheck.actionType || "PROPOSED_ACTION",
        targetEntity: actionCheck.targetEntity || "Station Machinery",
        station: station === "ALL" ? "MAITRI" : station,
        reason: "Advisory request received via Operations Assistant",
        status: "PROPOSED_REQUIRES_CONFIRMATION",
        confirmationPrompt:
          `Proposed: ${actionCheck.actionType?.replace(/_/g, " ")} for ${actionCheck.targetEntity || "Equipment"} at ${station}. ` +
          `No changes have been made to the database or station infrastructure. ` +
          `Please confirm this action through the authorized operational workflow.`,
        moduleRoute: this.getRouteForAction(actionCheck.actionType)
      };
    }

    // 6. Select & Execute Allowlisted Tools
    const toolNames = IntentService.selectToolsForIntent(intent);
    const toolResults: Record<string, any> = {};
    const toolCallRecords: ToolCallRecord[] = [];

    for (const toolName of toolNames) {
      const toolStart = Date.now();
      try {
        const toolArgs = this.buildToolArgs(toolName, station, timeRange, entities);
        const result = await ToolRegistry.executeTool(toolName, toolArgs, {
          userId: user.id,
          role: user.role,
          userStationId: user.stationId
        });
        toolResults[this.normalizeToolResultKey(toolName)] = result;
        toolCallRecords.push({
          toolName,
          args: toolArgs,
          resultSummary: `Fetched ${Array.isArray(result) ? result.length : typeof result === "object" ? "metrics" : result}`,
          durationMs: Date.now() - toolStart
        });
      } catch (err: any) {
        logger.warn(`Tool execution warning for ${toolName}: ${err.message}`);
        toolResults[this.normalizeToolResultKey(toolName)] = null;
      }
    }

    // 7. Grounded AI Generation
    const systemPrompt = this.buildSystemPrompt();
    const provider = AIProviderFactory.getProvider();
    const conv = conversationService.getConversation(conversationId, user.id);
    const history = conv.messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));

    let assistantMessageText = await provider.generateResponse(
      systemPrompt,
      query,
      history,
      toolResults,
      {
        userId: user.id,
        role: user.role,
        station: station === "ALL" ? "Maitri & Bharati" : station,
        timeRange,
        intent
      }
    );

    // If an action was requested, prepend the critical safety notice
    if (proposedAction) {
      assistantMessageText =
        `⚠️ **Advisory Action Notice**:\n` +
        `POLARIS Assistant operates under a strict advisory safety boundary. I cannot autonomously modify equipment states or create work orders. ` +
        `No changes have been made to the station database or operational equipment.\n\n` +
        `**Proposed Action**: ${proposedAction.actionType.replace(/_/g, " ")}\n` +
        `**Status**: Pending explicit confirmation in the target module.\n\n` +
        assistantMessageText;
    }

    // 8. Build Citations, Quality, and Suggestions
    const sources = this.buildSourceReferences(toolResults, station);
    const dataQuality = this.evaluateDataQuality(toolResults);
    const dataFreshness = "Telemetry updated: Latest available stream";
    const suggestedNavigations = this.buildSuggestedNavigations(intent, station);
    const suggestedQuestions = this.buildFollowupSuggestions(intent, station);

    // 9. Append Messages to Conversation Memory
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      role: "user",
      content: query,
      station,
      timeRange,
      timestamp: new Date().toISOString()
    };
    conversationService.appendMessage(conversationId, user.id, userMsg);

    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now()}-a`,
      role: "assistant",
      content: assistantMessageText,
      intent,
      station,
      timeRange,
      sources,
      dataQuality,
      dataFreshness,
      suggestedNavigations,
      proposedAction,
      toolCalls: toolCallRecords,
      timestamp: new Date().toISOString()
    };
    conversationService.appendMessage(conversationId, user.id, assistantMsg);

    const totalDuration = Date.now() - startTime;
    logger.info(`Assistant handled intent '${intent}' for user ${user.id} in ${totalDuration}ms`);

    return {
      conversationId,
      message: assistantMessageText,
      intent,
      station: station === "ALL" ? "Maitri & Bharati" : station,
      timeRange,
      sources,
      dataQuality,
      dataFreshness,
      suggestedNavigations,
      proposedAction,
      suggestedQuestions,
      toolCalls: toolCallRecords,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Server-Sent Events (SSE) Streaming Generator
   */
  public async *chatStream(
    request: AssistantRequest,
    user: UserContext
  ): AsyncGenerator<{ event: string; data: any }> {
    const fullResponse = await this.chat(request, user);

    yield {
      event: "meta",
      data: {
        conversationId: fullResponse.conversationId,
        intent: fullResponse.intent,
        station: fullResponse.station,
        sources: fullResponse.sources,
        dataQuality: fullResponse.dataQuality,
        suggestedNavigations: fullResponse.suggestedNavigations,
        proposedAction: fullResponse.proposedAction
      }
    };

    // Emit content in word chunks for fluid typing
    const words = fullResponse.message.split(" ");
    for (let i = 0; i < words.length; i += 3) {
      const chunk = words.slice(i, i + 3).join(" ") + " ";
      yield {
        event: "token",
        data: { text: chunk }
      };
      await new Promise((r) => setTimeout(r, 20));
    }

    yield {
      event: "done",
      data: {
        suggestedQuestions: fullResponse.suggestedQuestions,
        generatedAt: fullResponse.generatedAt
      }
    };
  }

  /**
   * Context-Aware Suggested Prompts
   */
  public getSuggestions(station = "MAITRI", _role = "OPERATOR"): string[] {
    const s = station.toUpperCase();
    return [
      `How is ${s} doing right now?`,
      `What is the current power balance at ${s}?`,
      `Which equipment currently has high maintenance risk?`,
      `Are there any active Blizzard or Katabatic wind warnings?`,
      `How many alarms are currently open at ${s}?`,
      `Compare power consumption between Maitri and Bharati.`,
      `Which inventory items are critically low?`,
      `What changed over the last 24 hours at ${s}?`
    ];
  }

  // -----------------------------------------------------------------
  // Private Helper Methods
  // -----------------------------------------------------------------

  private checkStationAuthorization(station: string, user: UserContext): boolean {
    if (user.role === "ADMIN") return true;
    if (station === "ALL") return user.role === "ADMIN";

    if (!user.stationId) return true; // Global viewer / unassigned
    const normalizedTarget = station.toUpperCase();
    const normalizedUserStation = user.stationId.toUpperCase();

    return (
      normalizedTarget === normalizedUserStation ||
      normalizedTarget.includes(normalizedUserStation) ||
      normalizedUserStation.includes(normalizedTarget)
    );
  }

  private buildSystemPrompt(): string {
    return (
      `You are the POLARIS Operations Assistant, purpose-built for India's Antarctic Research Stations (Maitri & Bharati) ` +
      `under the Ministry of Earth Sciences (MoES) and NCPOR.\n\n` +
      `CRITICAL OPERATIONAL RULES:\n` +
      `1. Ground all facts strictly in the provided tool data. Never invent or hallucinate metrics.\n` +
      `2. You are an advisory intelligence interface, NOT an autonomous station controller.\n` +
      `3. Never claim an action (such as dispatching maintenance, shutting down generators, or modifying inventory) has been performed.\n` +
      `4. Clearly distinguish measured telemetry from Phase 10 predictive maintenance wear indices.\n` +
      `5. Clearly distinguish predictions from confirmed equipment failures.\n` +
      `6. When comparing Maitri and Bharati, present metrics side-by-side neutrally without declaring an overall winner.\n` +
      `7. Report trends neutrally (e.g., "+6.4% change", "RISING") rather than assigning subjective labels like "worsening".\n` +
      `8. If telemetry is missing or incomplete, explicitly state that rather than assuming zero.\n` +
      `9. Keep answers direct, operational, concise, and structured for station engineering officers.`
    );
  }

  private buildToolArgs(toolName: string, station: string, timeRange: string, entities: any): any {
    const baseStation = station === "ALL" ? "MAITRI" : station;

    switch (toolName) {
      case "get_station_comparison":
        return { timeRange };
      case "get_equipment_health":
        return { equipmentId: entities.equipmentCode || "GEN-01" };
      case "get_alert_details":
      case "get_incident_details":
      case "get_equipment_status":
        return { stationId: baseStation, limit: 15 };
      default:
        return { stationId: baseStation, timeRange };
    }
  }

  private normalizeToolResultKey(toolName: string): string {
    if (toolName.includes("energy")) return "energy";
    if (toolName.includes("environment")) return "environment";
    if (toolName.includes("maintenance")) return "maintenance";
    if (toolName.includes("alert")) return "alerts";
    if (toolName.includes("incident")) return "incidents";
    if (toolName.includes("inventory") || toolName.includes("logistics")) return "logistics";
    if (toolName.includes("comparison")) return "comparison";
    if (toolName.includes("overview")) return "overview";
    if (toolName.includes("equipment")) return "equipment";
    return toolName;
  }

  private buildSourceReferences(toolResults: Record<string, any>, station: string): SourceReference[] {
    const sources: SourceReference[] = [];

    if (toolResults.energy) {
      sources.push({
        type: "energy",
        title: "Energy & Microgrid Telemetry",
        station,
        metric: "Net Power Balance"
      });
    }
    if (toolResults.environment) {
      sources.push({
        type: "environment",
        title: "Meteorological Records",
        station,
        metric: "Katabatic Winds & Temperature"
      });
    }
    if (toolResults.maintenance) {
      sources.push({
        type: "maintenance",
        title: "Phase 10 AI Predictive Intelligence",
        station,
        metric: "Equipment Wear Index & RUL"
      });
    }
    if (toolResults.alerts) {
      sources.push({
        type: "alert",
        title: "Alarm Lifecycle Management",
        station,
        metric: "Active Alarms & MTTA"
      });
    }
    if (toolResults.incidents) {
      sources.push({
        type: "incident",
        title: "Incident Command Dossiers",
        station,
        metric: "Active Incidents"
      });
    }
    if (toolResults.logistics) {
      sources.push({
        type: "logistics",
        title: "Polar Supply Chain & Inventory",
        station,
        metric: "Critical Life-Support Stock"
      });
    }
    if (toolResults.comparison) {
      sources.push({
        type: "analytics",
        title: "Phase 11 Station Comparison Matrix",
        station: "Maitri vs Bharati",
        metric: "Cross-Station Benchmarks"
      });
    }
    if (toolResults.overview) {
      sources.push({
        type: "analytics",
        title: "Phase 11 Operational KPI Intelligence",
        station,
        metric: "Top 10 Station KPIs"
      });
    }

    return sources;
  }

  private evaluateDataQuality(toolResults: Record<string, any>): "GOOD" | "LIMITED" | "POOR" | "N/A" {
    if (Object.keys(toolResults).length === 0) return "N/A";
    const available = Object.values(toolResults).filter((v) => v !== null && v !== undefined).length;
    const ratio = available / Object.keys(toolResults).length;

    if (ratio >= 0.8) return "GOOD";
    if (ratio >= 0.5) return "LIMITED";
    return "POOR";
  }

  private buildSuggestedNavigations(intent: string, _station: string): SuggestedNavigation[] {
    const navs: SuggestedNavigation[] = [];

    switch (intent) {
      case "ENERGY_STATUS":
        navs.push({ label: "Open Energy Dashboard", route: "/energy" });
        navs.push({ label: "View Energy Analytics", route: "/analytics" });
        break;
      case "ENVIRONMENT_STATUS":
        navs.push({ label: "Open Environment Telemetry", route: "/environment" });
        navs.push({ label: "View 3D Digital Twin", route: "/digital-twin" });
        break;
      case "MAINTENANCE_STATUS":
      case "EXPLANATION_QUERY":
        navs.push({ label: "Open Maintenance Dashboard", route: "/maintenance" });
        navs.push({ label: "View Equipment Fleet", route: "/equipment" });
        break;
      case "ALERT_STATUS":
        navs.push({ label: "Open Alerts Command", route: "/alerts" });
        break;
      case "INCIDENT_STATUS":
        navs.push({ label: "Open Incident Command", route: "/alerts" });
        break;
      case "INVENTORY_STATUS":
      case "LOGISTICS_STATUS":
        navs.push({ label: "Open Logistics & Inventory", route: "/logistics" });
        break;
      case "REPORT_QUERY":
        navs.push({ label: "Open Operational Reports", route: "/reports" });
        break;
      case "COMPARISON_QUERY":
      case "TREND_QUERY":
      case "ANALYTICS_QUERY":
      default:
        navs.push({ label: "Open Analytics Hub", route: "/analytics" });
        navs.push({ label: "View Overview KPIs", route: "/overview" });
        break;
    }

    return navs;
  }

  private buildFollowupSuggestions(intent: string, station: string): string[] {
    const s = station === "ALL" ? "Maitri" : station;

    switch (intent) {
      case "ENERGY_STATUS":
        return [
          `How has battery SoC changed over the last 24 hours at ${s}?`,
          `What is the current diesel fuel autonomy at ${s}?`,
          `Compare power generation with Bharati.`
        ];
      case "ENVIRONMENT_STATUS":
        return [
          `Are any blizzard warnings active for ${s}?`,
          `What is the wind velocity trend over the last 7 days?`,
          `Compare temperatures between Maitri and Bharati.`
        ];
      case "MAINTENANCE_STATUS":
        return [
          `Why is Generator 01 flagged as high risk?`,
          `What is the estimated RUL of the HVAC air handler?`,
          `Which equipment needs attention this week?`
        ];
      case "ALERT_STATUS":
        return [
          `How many critical alerts occurred in the last 7 days?`,
          `What are the most frequent recurring alarm rules?`,
          `Show open incidents at ${s}.`
        ];
      default:
        return [
          `What is the power balance at ${s}?`,
          `Which equipment has the highest maintenance risk?`,
          `Summarize operations for the last 24 hours.`
        ];
    }
  }

  private getRouteForAction(actionType?: string): string {
    switch (actionType) {
      case "CREATE_WORK_ORDER":
        return "/maintenance";
      case "EMERGENCY_SHUTDOWN":
        return "/energy";
      case "ADJUST_INVENTORY":
        return "/logistics";
      case "MUTATE_ALERT_LIFECYCLE":
      case "MUTATE_INCIDENT":
        return "/alerts";
      default:
        return "/overview";
    }
  }

  private buildSecurityRefusalResponse(conversationId: string, query: string, userId: string): AssistantResponse {
    const refusalText =
      "⚠️ **Security Policy Notice**:\n\n" +
      "The POLARIS Operations Assistant operates under strict Antarctic mission security guidelines. " +
      "System prompts, credentials, authentication tokens, and direct database queries cannot be executed or revealed.\n\n" +
      "I am available to assist you with authorized station telemetry, energy balance, environmental monitoring, machinery health, and operational reports.";

    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now()}-sec`,
      role: "assistant",
      content: refusalText,
      intent: "UNSUPPORTED_REQUEST",
      station: "MAITRI",
      timeRange: "24h",
      timestamp: new Date().toISOString()
    };
    conversationService.appendMessage(conversationId, userId, assistantMsg);

    return {
      conversationId,
      message: refusalText,
      intent: "UNSUPPORTED_REQUEST",
      station: "MAITRI",
      timeRange: "24h",
      sources: [],
      dataQuality: "N/A",
      dataFreshness: "Security filter triggered",
      suggestedNavigations: [{ label: "Return to Overview", route: "/overview" }],
      suggestedQuestions: ["How is Maitri doing right now?", "What is the current power balance?"],
      generatedAt: new Date().toISOString()
    };
  }

  private buildUnauthorizedStationResponse(conversationId: string, station: string, userId: string): AssistantResponse {
    const denialText =
      `🔒 **Access Restricted**:\n\n` +
      `Your user role does not possess authorization to view operational telemetry or sensitive records for station **${station}**.\n\n` +
      `Please contact the NCPOR Expedition Station Commander if you require cross-station operational clearance.`;

    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now()}-auth`,
      role: "assistant",
      content: denialText,
      intent: "UNSUPPORTED_REQUEST",
      station,
      timeRange: "24h",
      timestamp: new Date().toISOString()
    };
    conversationService.appendMessage(conversationId, userId, assistantMsg);

    return {
      conversationId,
      message: denialText,
      intent: "UNSUPPORTED_REQUEST",
      station,
      timeRange: "24h",
      sources: [],
      dataQuality: "N/A",
      dataFreshness: "Access Denied",
      suggestedNavigations: [{ label: "Return to Overview", route: "/overview" }],
      suggestedQuestions: ["Show status for my authorized station."],
      generatedAt: new Date().toISOString()
    };
  }
}

export const assistantService = AssistantService.getInstance();
