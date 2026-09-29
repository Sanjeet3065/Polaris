import React, { useState } from "react";
import { ChatMessage } from "../../types/assistant.types";
import { Link } from "react-router-dom";
import {
  Bot,
  User,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldAlert,
  Clock,
  Cpu
} from "lucide-react";

interface Props {
  message: ChatMessage;
}

export const ChatMessageItem: React.FC<Props> = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getQualityColor = (rating?: string) => {
    switch (rating) {
      case "GOOD":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/40";
      case "LIMITED":
        return "bg-amber-500/15 text-amber-400 border-amber-500/40";
      case "POOR":
        return "bg-rose-500/15 text-rose-400 border-rose-500/40";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  return (
    <div className={`flex gap-3.5 ${isUser ? "flex-row-reverse" : "flex-row"} animate-in fade-in`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
          isUser
            ? "bg-sky-600/20 border-sky-500/40 text-sky-400"
            : "bg-slate-800 border-slate-700 text-sky-400 shadow-md"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message Content Container */}
      <div className={`max-w-2xl space-y-2.5 ${isUser ? "items-end" : "items-start"}`}>
        {/* Main Bubble */}
        <div
          className={`rounded-2xl p-4 text-xs leading-relaxed border shadow-md ${
            isUser
              ? "bg-sky-600/15 text-sky-100 border-sky-500/30 rounded-tr-none"
              : "bg-slate-900/90 text-slate-200 border-slate-800 rounded-tl-none"
          }`}
        >
          {/* Header Info for Assistant */}
          {!isUser && (
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-[11px] tracking-wide">POLARIS Assistant</span>
                {message.intent && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-950 text-sky-400 border border-slate-800">
                    {message.intent}
                  </span>
                )}
                {message.dataQuality && message.dataQuality !== "N/A" && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getQualityColor(
                      message.dataQuality
                    )}`}
                  >
                    Quality: {message.dataQuality}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                  title="Copy response"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* Formatted Text Body */}
          <div className="whitespace-pre-wrap space-y-1.5 text-slate-200">{message.content}</div>

          {/* Proposed Action Warning Box (Phase 12 Safety Guard) */}
          {message.proposedAction && (
            <div className="mt-3.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
                <ShieldAlert className="w-4 h-4" />
                <span>Operator Confirmation Required</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-normal">
                {message.proposedAction.confirmationPrompt}
              </p>
              <div className="pt-1">
                <Link
                  to={message.proposedAction.moduleRoute}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition-all"
                >
                  <span>Open Target Module to Confirm</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Sources & Freshness Footer */}
        {!isUser && (
          <div className="px-1 space-y-2 text-[10px]">
            {/* Source Citations */}
            {message.sources && message.sources.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-500 font-medium">Sources:</span>
                {message.sources.map((src, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-medium"
                  >
                    <span>{src.title}</span>
                    {src.station && <span className="text-slate-500">({src.station})</span>}
                  </span>
                ))}
              </div>
            )}

            {/* Tool Calls Inspector Dropdown */}
            {message.toolCalls && message.toolCalls.length > 0 && (
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2">
                <button
                  type="button"
                  onClick={() => setToolsOpen(!toolsOpen)}
                  className="w-full flex items-center justify-between text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3 h-3 text-sky-400" />
                    <span>Executed {message.toolCalls.length} allowlisted operational tools</span>
                  </div>
                  {toolsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {toolsOpen && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1.5 text-[10px] font-mono">
                    {message.toolCalls.map((t, idx) => (
                      <div key={idx} className="flex items-center justify-between text-slate-400">
                        <span className="text-sky-300">{t.toolName}()</span>
                        <span className="text-slate-500">{t.durationMs}ms</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Navigation Action Shortcuts */}
            {message.suggestedNavigations && message.suggestedNavigations.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-slate-500 font-medium">Quick Navigation:</span>
                {message.suggestedNavigations.map((nav, i) => (
                  <Link
                    key={i}
                    to={nav.route}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-950/60 hover:bg-sky-900/60 text-sky-300 border border-sky-800/60 transition-all font-medium"
                  >
                    <span>{nav.label}</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                  </Link>
                ))}
              </div>
            )}

            {/* Timestamp & Freshness */}
            <div className="flex items-center gap-2 text-slate-500 pt-0.5">
              <Clock className="w-3 h-3" />
              <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
              {message.dataFreshness && <span>• {message.dataFreshness}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
