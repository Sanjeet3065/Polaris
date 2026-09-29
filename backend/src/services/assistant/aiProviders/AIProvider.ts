/**
 * POLARIS — AI Provider Interface
 * Supports swappable LLM engines (Gemini, Deterministic, Mock)
 */

export interface AIProviderContext {
  userId: string;
  role: string;
  station: string;
  timeRange: string;
  intent: string;
}

export interface AIProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  generateResponse(
    systemPrompt: string,
    userMessage: string,
    history: { role: string; content: string }[],
    toolResults: Record<string, any>,
    context: AIProviderContext
  ): Promise<string>;
  generateStream?(
    systemPrompt: string,
    userMessage: string,
    history: { role: string; content: string }[],
    toolResults: Record<string, any>,
    context: AIProviderContext,
    onChunk: (chunk: string) => void
  ): Promise<string>;
}
