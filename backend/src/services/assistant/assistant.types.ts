/**
 * POLARIS — AI Operations Assistant Types (Phase 12)
 * Polar Operations & Logistics Automated Remote Intelligence System
 */

export type IntentCategory =
  | "STATION_STATUS"
  | "ENERGY_STATUS"
  | "ENVIRONMENT_STATUS"
  | "EQUIPMENT_STATUS"
  | "MAINTENANCE_STATUS"
  | "ALERT_STATUS"
  | "INCIDENT_STATUS"
  | "INVENTORY_STATUS"
  | "LOGISTICS_STATUS"
  | "ANALYTICS_QUERY"
  | "REPORT_QUERY"
  | "TREND_QUERY"
  | "COMPARISON_QUERY"
  | "EXPLANATION_QUERY"
  | "HELP_QUERY"
  | "ACTION_REQUEST"
  | "UNSUPPORTED_REQUEST";

export interface SourceReference {
  type:
    | "energy"
    | "environment"
    | "equipment"
    | "maintenance"
    | "alert"
    | "incident"
    | "inventory"
    | "logistics"
    | "analytics"
    | "report"
    | "station";
  title: string;
  station?: string;
  timestamp?: string;
  metric?: string;
  value?: string | number;
}

export interface SuggestedNavigation {
  label: string;
  route: string;
  description?: string;
}

export interface ProposedAction {
  actionType: string;
  targetEntity: string;
  station: string;
  reason: string;
  status: "PROPOSED_REQUIRES_CONFIRMATION" | "REJECTED_UNAUTHORIZED";
  confirmationPrompt: string;
  moduleRoute: string;
}

export interface ToolCallRecord {
  toolName: string;
  args: Record<string, any>;
  resultSummary: string;
  durationMs: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  intent?: IntentCategory;
  station?: string;
  timeRange?: string;
  sources?: SourceReference[];
  dataQuality?: "GOOD" | "LIMITED" | "POOR" | "N/A";
  dataFreshness?: string;
  suggestedNavigations?: SuggestedNavigation[];
  proposedAction?: ProposedAction;
  toolCalls?: ToolCallRecord[];
  timestamp: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  stationContext: string; // "MAITRI" | "BHARATI" | "ALL"
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AssistantRequest {
  conversationId?: string;
  message: string;
  stationId?: string;
  timeRange?: string;
}

export interface AssistantResponse {
  conversationId: string;
  message: string;
  intent: IntentCategory;
  station: string;
  timeRange: string;
  sources: SourceReference[];
  dataQuality: "GOOD" | "LIMITED" | "POOR" | "N/A";
  dataFreshness: string;
  suggestedNavigations: SuggestedNavigation[];
  proposedAction?: ProposedAction;
  suggestedQuestions: string[];
  toolCalls?: ToolCallRecord[];
  generatedAt: string;
}

export interface ExtractedEntities {
  station?: "MAITRI" | "BHARATI" | "ALL";
  equipmentName?: string;
  equipmentCode?: string;
  timeRange?: "1h" | "6h" | "24h" | "7d" | "30d" | "custom";
  severity?: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category?: string;
  actionRequested?: boolean;
}

export interface ToolDefinition<TArgs = any, TResult = any> {
  name: string;
  description: string;
  category: string;
  requiresStation: boolean;
  execute: (args: TArgs, context: { userId: string; role: string; userStationId?: string }) => Promise<TResult>;
}
