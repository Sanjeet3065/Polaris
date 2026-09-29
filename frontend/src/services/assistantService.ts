import { apiClient, getAccessToken } from "../lib/apiClient";
import { ApiResponseEnvelope } from "../types";
import {
  AssistantRequest,
  AssistantResponse,
  Conversation
} from "../types/assistant.types";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export class AssistantService {
  private static instance: AssistantService;

  public static getInstance(): AssistantService {
    if (!AssistantService.instance) {
      AssistantService.instance = new AssistantService();
    }
    return AssistantService.instance;
  }

  /**
   * Send a standard chat message (synchronous response)
   */
  public async sendMessage(request: AssistantRequest): Promise<AssistantResponse> {
    const res = await apiClient.post<any, ApiResponseEnvelope<AssistantResponse>>(
      "/assistant/chat",
      request
    );
    return res.data;
  }

  /**
   * Send a streaming chat message over Server-Sent Events (SSE)
   */
  public async streamMessage(
    request: AssistantRequest,
    callbacks: {
      onMeta?: (meta: Partial<AssistantResponse>) => void;
      onToken?: (text: string) => void;
      onDone?: (info: { suggestedQuestions?: string[]; generatedAt?: string }) => void;
      onError?: (err: Error) => void;
    },
    signal?: AbortSignal
  ): Promise<void> {
    try {
      const token = getAccessToken();
      const response = await fetch(`${baseURL}/assistant/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(request),
        signal
      });

      if (!response.ok) {
        throw new Error(`Streaming failed with status HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error("ReadableStream not supported by response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const block of lines) {
          const eventMatch = block.match(/event:\s*(.+)/);
          const dataMatch = block.match(/data:\s*(.+)/);

          if (eventMatch && dataMatch) {
            const event = eventMatch[1].trim();
            const data = JSON.parse(dataMatch[1]);

            if (event === "meta" && callbacks.onMeta) {
              callbacks.onMeta(data);
            } else if (event === "token" && callbacks.onToken) {
              callbacks.onToken(data.text);
            } else if (event === "done" && callbacks.onDone) {
              callbacks.onDone(data);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        return; // User canceled streaming intentionally
      }
      if (callbacks.onError) {
        callbacks.onError(err);
      } else {
        throw err;
      }
    }
  }

  /**
   * List all user conversations
   */
  public async getConversations(): Promise<Conversation[]> {
    const res = await apiClient.get<any, ApiResponseEnvelope<Conversation[]>>(
      "/assistant/conversations"
    );
    return res.data;
  }

  /**
   * Retrieve single conversation
   */
  public async getConversation(id: string): Promise<Conversation> {
    const res = await apiClient.get<any, ApiResponseEnvelope<Conversation>>(
      `/assistant/conversations/${id}`
    );
    return res.data;
  }

  /**
   * Delete a conversation
   */
  public async deleteConversation(id: string): Promise<void> {
    await apiClient.delete(`/assistant/conversations/${id}`);
  }

  /**
   * Get suggestions for active station
   */
  public async getSuggestions(station = "MAITRI"): Promise<string[]> {
    const res = await apiClient.get<any, ApiResponseEnvelope<{ station: string; suggestions: string[] }>>(
      `/assistant/suggestions?station=${encodeURIComponent(station)}`
    );
    return res.data.suggestions;
  }
}

export const assistantService = AssistantService.getInstance();
