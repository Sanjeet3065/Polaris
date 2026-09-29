import React from "react";
import { MessageSquare, Trash2, Plus, X, Calendar, Compass } from "lucide-react";
import { Conversation } from "../../types/assistant.types";
import { cn } from "../../lib/utils";

interface ConversationHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewConversation: () => void;
}

export const ConversationHistoryDrawer: React.FC<ConversationHistoryDrawerProps> = ({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 right-0 z-50 flex w-80 sm:w-96 flex-col border-l border-slate-800 bg-polar-950/95 backdrop-blur-xl shadow-2xl transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Drawer Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="h-5 w-5 text-sky-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-100">Session History</h2>
              <p className="text-[11px] text-slate-400">Past assistant conversations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            aria-label="Close conversation drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* New Session Action */}
        <div className="p-4 border-b border-slate-800/80">
          <button
            onClick={() => {
              onNewConversation();
              onClose();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500/20 border border-sky-500/40 px-3.5 py-2 text-xs font-semibold text-sky-300 hover:bg-sky-500/30 transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>New Operations Session</span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 px-4">
              <MessageSquare className="h-8 w-8 mb-2 stroke-1 opacity-50" />
              <p className="text-xs font-medium">No past conversations found</p>
              <p className="text-[11px] mt-1 text-slate-500">
                Start asking questions about polar operations to build history.
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              const dateStr = new Date(conv.updatedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              });

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    onClose();
                  }}
                  className={cn(
                    "group relative flex flex-col gap-1.5 rounded-lg border p-3 cursor-pointer transition-all",
                    isActive
                      ? "bg-sky-500/10 border-sky-500/50 text-slate-100 shadow-sm"
                      : "bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700 text-slate-300"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold line-clamp-1 group-hover:text-sky-300 transition-colors">
                      {conv.title || "Operations Query"}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 rounded p-1 text-slate-500 hover:bg-rose-500/20 hover:text-rose-300 transition-all"
                      title="Delete conversation"
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <Compass className="h-3 w-3 text-sky-400/80" />
                      <span className="font-mono uppercase">{conv.stationContext}</span>
                      <span className="text-slate-600">•</span>
                      <span>{conv.messages.length} msgs</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-[9px]">
                      <Calendar className="h-2.5 w-2.5 opacity-60" />
                      <span>{dateStr}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
};
