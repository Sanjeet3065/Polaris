import React from "react";
import { Inbox, LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No active records",
  description = "No telemetry or event data is currently logged for this criteria.",
  icon: Icon = Inbox,
  actionText,
  onAction,
  className
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center rounded-xl border border-slate-800/80 bg-polar-900/40", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800/80 text-slate-400 mb-3 border border-slate-700/50">
        <Icon className="h-6 w-6" />
      </div>
      <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
      <p className="mt-1 max-w-sm text-xs text-slate-400 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 rounded-lg bg-sky-500/10 border border-sky-500/30 px-3 py-1.5 text-xs font-medium text-sky-400 hover:bg-sky-500/20 transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
