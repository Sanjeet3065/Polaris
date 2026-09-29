import React from "react";
import { Bot, PlusCircle, History } from "lucide-react";

interface Props {
  stationCode: string;
  onNewConversation: () => void;
  onToggleHistory: () => void;
  historyCount: number;
}

export const AssistantHeader: React.FC<Props> = ({
  stationCode,
  onNewConversation,
  onToggleHistory,
  historyCount
}) => {
  return (
    <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shadow-lg shadow-sky-500/10">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white tracking-wide">POLARIS Operations Assistant</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
              Phase 12
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Natural language operational intelligence grounded in real Antarctic station data
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Active Station Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400">Station:</span>
          <span className="font-bold text-white uppercase">{stationCode}</span>
        </div>

        {/* Conversation History Drawer Button */}
        <button
          type="button"
          onClick={onToggleHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-all"
        >
          <History className="w-3.5 h-3.5 text-sky-400" />
          <span>History</span>
          {historyCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 text-slate-300 font-mono">
              {historyCount}
            </span>
          )}
        </button>

        {/* New Briefing Button */}
        <button
          type="button"
          onClick={onNewConversation}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition-all shadow-md shadow-sky-600/20"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Briefing</span>
        </button>
      </div>
    </div>
  );
};
