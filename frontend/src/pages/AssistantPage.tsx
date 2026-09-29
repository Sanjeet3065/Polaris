import React, { useState, useEffect, useRef } from "react";
import { useStation } from "../context/StationContext";
import { assistantService } from "../services/assistantService";
import {
  ChatMessage,
  Conversation
} from "../types/assistant.types";
import { AssistantHeader } from "../components/assistant/AssistantHeader";
import { ChatMessageItem } from "../components/assistant/ChatMessageItem";
import { AssistantInput } from "../components/assistant/AssistantInput";
import { SuggestedQuestions } from "../components/assistant/SuggestedQuestions";
import { OperationalContextPanel } from "../components/assistant/OperationalContextPanel";
import { ConversationHistoryDrawer } from "../components/assistant/ConversationHistoryDrawer";
import { Bot, Sparkles, AlertCircle, Compass } from "lucide-react";

export const AssistantPage: React.FC = () => {
  const { selectedStation } = useStation();
  const stationCode = selectedStation === "ALL" ? "MAITRI" : selectedStation;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    "How is Maitri doing right now?",
    "What is the current energy balance?",
    "Which equipment has the highest maintenance risk?",
    "What alerts are currently open?",
    "Compare Maitri and Bharati power consumption.",
    "What happened in the last 24 hours?"
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load conversations on mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const list = await assistantService.getConversations();
        setConversations(list);
      } catch (err) {
        console.warn("Could not load past conversations:", err);
      }
    };
    fetchConversations();
  }, []);

  // Update suggestions when station changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const questions = await assistantService.getSuggestions(stationCode);
        if (questions && questions.length > 0) {
          setSuggestedQuestions(questions);
        }
      } catch (err) {
        console.warn("Could not load dynamic suggestions:", err);
      }
    };
    fetchSuggestions();
  }, [stationCode]);

  // Handle New Conversation
  const handleNewConversation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setActiveConversationId(null);
    setMessages([]);
    setError(null);
  };

  // Handle Select Past Conversation
  const handleSelectConversation = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const conv = await assistantService.getConversation(id);
      setActiveConversationId(conv.id);
      setMessages(conv.messages || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load conversation");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Delete Conversation
  const handleDeleteConversation = async (id: string) => {
    try {
      await assistantService.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        handleNewConversation();
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete conversation");
    }
  };

  // Handle Stop Streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      if (last.role === "assistant" && last.isStreaming) {
        return [
          ...prev.slice(0, -1),
          { ...last, isStreaming: false, content: last.content || "Response generation stopped by user." }
        ];
      }
      return prev;
    });
  };

  // Handle Send Message
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setError(null);
    const userMsgId = `usr-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: text,
      timestamp: new Date().toISOString()
    };

    const assistantMsgId = `asst-${Date.now()}`;
    const initialAssistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      isStreaming: true
    };

    setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
    setIsLoading(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Try streaming with SSE
      let accumulatedContent = "";

      await assistantService.streamMessage(
        {
          conversationId: activeConversationId || undefined,
          message: text,
          stationId: stationCode
        },
        {
          onMeta: (meta) => {
            if (meta.conversationId && !activeConversationId) {
              setActiveConversationId(meta.conversationId);
            }
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      intent: meta.intent,
                      station: meta.station,
                      timeRange: meta.timeRange,
                      sources: meta.sources,
                      dataQuality: meta.dataQuality,
                      dataFreshness: meta.dataFreshness,
                      suggestedNavigations: meta.suggestedNavigations,
                      proposedAction: meta.proposedAction,
                      toolCalls: meta.toolCalls
                    }
                  : m
              )
            );
          },
          onToken: (token) => {
            accumulatedContent += token;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: accumulatedContent
                    }
                  : m
              )
            );
          },
          onDone: (doneInfo) => {
            if (doneInfo.suggestedQuestions && doneInfo.suggestedQuestions.length > 0) {
              setSuggestedQuestions(doneInfo.suggestedQuestions);
            }
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      isStreaming: false
                    }
                  : m
              )
            );
            // Refresh conversation history in background
            assistantService.getConversations().then(setConversations).catch(() => {});
          },
          onError: async () => {
            // Fallback to standard synchronous request if SSE fails
            try {
              const res = await assistantService.sendMessage({
                conversationId: activeConversationId || undefined,
                message: text,
                stationId: stationCode
              });

              if (res.conversationId && !activeConversationId) {
                setActiveConversationId(res.conversationId);
              }

              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: res.message,
                        intent: res.intent,
                        station: res.station,
                        timeRange: res.timeRange,
                        sources: res.sources,
                        dataQuality: res.dataQuality,
                        dataFreshness: res.dataFreshness,
                        suggestedNavigations: res.suggestedNavigations,
                        proposedAction: res.proposedAction,
                        toolCalls: res.toolCalls,
                        isStreaming: false
                      }
                    : m
                )
              );

              if (res.suggestedQuestions && res.suggestedQuestions.length > 0) {
                setSuggestedQuestions(res.suggestedQuestions);
              }

              assistantService.getConversations().then(setConversations).catch(() => {});
            } catch (fallbackErr: any) {
              const errMsg = fallbackErr?.response?.data?.message || fallbackErr?.message || "Failed to generate operational response";
              setError(errMsg);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: `Error: ${errMsg}. Please verify station telemetry or use standard POLARIS dashboards.`,
                        isStreaming: false
                      }
                    : m
                )
              );
            }
          }
        },
        abortController.signal
      );
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "An unexpected error occurred while communicating with the assistant.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 overflow-hidden">
      {/* Assistant Mission Control Header */}
      <AssistantHeader
        stationCode={stationCode}
        onNewConversation={handleNewConversation}
        onToggleHistory={() => setIsHistoryOpen(true)}
        historyCount={conversations.length}
      />

      {/* Main Container: Chat + Operational Context Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Feed Column */}
        <div className="flex flex-col flex-1 min-w-0 bg-slate-950">
          {/* Scrollable Messages Viewport */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Error Notification Banner */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-xs text-rose-400 hover:text-white underline font-semibold"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Empty State / Welcome Screen */}
            {messages.length === 0 && (
              <div className="max-w-2xl mx-auto my-auto py-8 text-center space-y-5 animate-in fade-in">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400/20 to-indigo-600/20 border border-sky-500/40 text-sky-400 flex items-center justify-center mx-auto shadow-xl shadow-sky-500/10">
                  <Bot className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>POLARIS Mission Operational Assistant</span>
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Natural Language Polar Station Intelligence
                  </h2>
                  <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
                    Directly query energy telemetry, life-support microgrids, machinery health, Phase 10 predictive maintenance risks, and active alarms for <span className="font-semibold text-slate-200 uppercase">{stationCode}</span>.
                  </p>
                </div>

                {/* Scope & Grounding Notice */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 max-w-lg mx-auto text-left space-y-1 shadow-inner">
                  <div className="flex items-center gap-1.5 font-bold text-slate-300">
                    <Compass className="w-3.5 h-3.5 text-sky-400" />
                    <span>Operational Scope & Boundary</span>
                  </div>
                  <p>
                    All answers are grounded in allowlisted operational tools and actual PostgreSQL data. The assistant is advisory and cannot autonomously modify station hardware.
                  </p>
                </div>
              </div>
            )}

            {/* Message List */}
            {messages.map((message) => (
              <ChatMessageItem key={message.id} message={message} />
            ))}

            {/* Typing / Processing Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 pl-12 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span>POLARIS Assistant querying operational tools & synthesizing data...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Carousel */}
          <SuggestedQuestions
            suggestions={suggestedQuestions}
            onSelectSuggestion={handleSendMessage}
            isLoading={isLoading}
          />

          {/* Input Bar */}
          <AssistantInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onStopStreaming={handleStopStreaming}
          />
        </div>

        {/* Right Side Operational Context Panel */}
        <OperationalContextPanel stationCode={stationCode} />
      </div>

      {/* Slide-over Conversation Drawer */}
      <ConversationHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onNewConversation={handleNewConversation}
      />
    </div>
  );
};
export default AssistantPage;
