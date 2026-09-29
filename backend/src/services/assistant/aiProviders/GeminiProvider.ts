import { AIProvider, AIProviderContext } from "./AIProvider";
import { DeterministicAiProvider } from "./DeterministicAiProvider";
import { logger } from "../../../utils/logger";

export class GeminiProvider implements AIProvider {
  public readonly name = "GeminiProvider";
  private apiKey: string | undefined;
  private model: string;
  private timeoutMs: number;
  private fallbackProvider: DeterministicAiProvider;

  constructor() {
    this.apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
    this.model = process.env.AI_MODEL || "gemini-1.5-flash";
    this.timeoutMs = parseInt(process.env.AI_TIMEOUT_MS || "10000", 10);
    this.fallbackProvider = new DeterministicAiProvider();
  }

  public async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public async generateResponse(
    systemPrompt: string,
    userMessage: string,
    history: { role: string; content: string }[],
    toolResults: Record<string, any>,
    context: AIProviderContext
  ): Promise<string> {
    if (!this.apiKey) {
      return this.fallbackProvider.generateResponse(systemPrompt, userMessage, history, toolResults, context);
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

      const contents = [
        ...history.slice(-6).map((h) => ({
          role: h.role === "assistant" ? "model" : "user",
          parts: [{ text: h.content }]
        })),
        {
          role: "user",
          parts: [
            {
              text:
                `${systemPrompt}\n\n` +
                `Operational Grounding Data (from POLARIS allowlisted tools):\n` +
                `${JSON.stringify(toolResults, null, 2)}\n\n` +
                `Station Context: ${context.station}, Time Range: ${context.timeRange}, Intent: ${context.intent}\n\n` +
                `User Query: ${userMessage}`
            }
          ]
        }
      ];

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.2, // Low temperature for high factual accuracy
            maxOutputTokens: parseInt(process.env.AI_MAX_OUTPUT_TOKENS || "800", 10)
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!response.ok) {
        logger.warn(`Gemini API error (HTTP ${response.status}). Falling back to deterministic provider.`);
        return this.fallbackProvider.generateResponse(systemPrompt, userMessage, history, toolResults, context);
      }

      const json = (await response.json()) as any;
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        return this.fallbackProvider.generateResponse(systemPrompt, userMessage, history, toolResults, context);
      }

      return text;
    } catch (err: any) {
      logger.warn(`Gemini call failed or timed out: ${err.message}. Using deterministic fallback.`);
      return this.fallbackProvider.generateResponse(systemPrompt, userMessage, history, toolResults, context);
    }
  }

  public async generateStream(
    systemPrompt: string,
    userMessage: string,
    history: { role: string; content: string }[],
    toolResults: Record<string, any>,
    context: AIProviderContext,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    // Generate grounded text and stream through chunks
    const fullText = await this.generateResponse(systemPrompt, userMessage, history, toolResults, context);
    const words = fullText.split(" ");
    for (let i = 0; i < words.length; i += 4) {
      const chunk = words.slice(i, i + 4).join(" ") + " ";
      onChunk(chunk);
      await new Promise((r) => setTimeout(r, 15));
    }
    return fullText;
  }
}
