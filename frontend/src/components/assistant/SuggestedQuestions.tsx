import React from "react";
import { Sparkles } from "lucide-react";

interface Props {
  suggestions: string[];
  onSelectSuggestion: (question: string) => void;
  isLoading: boolean;
}

export const SuggestedQuestions: React.FC<Props> = ({
  suggestions,
  onSelectSuggestion,
  isLoading
}) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
      <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-500 mb-2">
        <Sparkles className="w-3 h-3 text-sky-400" />
        <span>Suggested Operational Queries</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((q, i) => (
          <button
            key={i}
            type="button"
            disabled={isLoading}
            onClick={() => onSelectSuggestion(q)}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-300 hover:text-sky-300 border border-slate-800 hover:border-sky-500/40 text-xs transition-all text-left shadow-sm"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};
