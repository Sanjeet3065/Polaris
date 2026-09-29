import React, { useEffect, useRef } from "react";
import { AlertTriangle, AlertOctagon, Info, X } from "lucide-react";
import { Button } from "./Button";
import { cn } from "../../lib/utils";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  resourceName?: string;
  resourceType?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isReversible?: boolean;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  resourceName,
  resourceType,
  confirmText = "Confirm Action",
  cancelText = "Cancel",
  isDestructive = true,
  isReversible = false,
  isLoading = false
}) => {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Keyboard accessibility: ESC closes, focus on open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const timer = setTimeout(() => confirmButtonRef.current?.focus(), 50);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        className="w-full max-w-md rounded-2xl border border-slate-700/80 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl border",
                isDestructive
                  ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                  : "bg-amber-500/15 border-amber-500/30 text-amber-400"
              )}
            >
              {isDestructive ? (
                <AlertOctagon className="h-5 w-5" aria-hidden="true" />
              ) : (
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              )}
            </div>
            <div>
              <h3 id="confirm-dialog-title" className="text-sm font-bold text-white tracking-wide">
                {title}
              </h3>
              <p className="text-[11px] font-mono text-slate-400">OPERATIONAL CONFIRMATION</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <p id="confirm-dialog-desc" className="text-xs text-slate-300 leading-relaxed">
            {description}
          </p>

          {(resourceName || resourceType) && (
            <div className="rounded-lg border border-slate-800 bg-polar-950/80 p-2.5 text-xs font-mono">
              {resourceType && (
                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  Target Resource:
                </div>
              )}
              <div className="text-sky-300 font-semibold truncate">
                {resourceName}
                {resourceType && (
                  <span className="text-slate-500 font-normal ml-1">({resourceType})</span>
                )}
              </div>
            </div>
          )}

          <div
            className={cn(
              "flex items-center gap-2 rounded-lg p-2.5 text-[11px] border",
              isReversible
                ? "bg-sky-500/10 border-sky-500/20 text-sky-300"
                : "bg-rose-500/10 border-rose-500/20 text-rose-300"
            )}
          >
            <Info className="h-3.5 w-3.5 shrink-0" />
            <span>
              {isReversible
                ? "This action can be adjusted or reversed later."
                : "Caution: This action is permanent and cannot be undone."}
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-300 hover:bg-slate-800"
          >
            {cancelText}
          </Button>

          <Button
            ref={confirmButtonRef}
            type="button"
            variant={isDestructive ? "danger" : "primary"}
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "font-bold",
              isDestructive
                ? "bg-rose-600 hover:bg-rose-500 text-white"
                : "bg-sky-500 hover:bg-sky-400 text-slate-950"
            )}
          >
            {isLoading ? "Executing..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
