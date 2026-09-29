import React, { useState, useRef, useEffect } from "react";
import { Send, Square } from "lucide-react";

interface Props {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onStopStreaming?: () => void;
  placeholder?: string;
}

export const AssistantInput: React.FC<Props> = ({
  onSendMessage,
  isLoading,
  onStopStreaming,
  placeholder = "Ask about station operations, power balance, equipment risk, weather, or alerts..."
}) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const maxLength = 2000;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-slate-900 border-t border-slate-800 p-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 shadow-inner focus-within:border-sky-500/50 transition-colors">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, maxLength))}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full bg-transparent resize-none outline-none text-xs text-slate-100 placeholder-slate-500 pr-12 leading-relaxed"
          />

          <div className="flex items-center justify-between pt-1 border-t border-slate-900 mt-1">
            <span className="text-[10px] text-slate-500 font-mono">
              {input.length} / {maxLength}
            </span>

            <div className="flex items-center gap-2">
              {isLoading && onStopStreaming ? (
                <button
                  type="button"
                  onClick={onStopStreaming}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <Square className="w-3 h-3 fill-white" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <Send className="w-3 h-3" />
                  <span>Send</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
