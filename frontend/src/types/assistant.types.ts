/**
 * POLARIS — AI Operations Assistant Frontend Types (Phase 12)
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
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  stationContext: string;
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
