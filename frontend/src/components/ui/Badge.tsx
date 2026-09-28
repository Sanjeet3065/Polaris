import React from "react";
import { cn } from "../../lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "ice" | "neutral";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  className,
  ...props
}) => {
  const variantStyles = {
    default: "bg-slate-800 text-slate-300 border-slate-700",
    success: "bg-emerald-950/80 text-emerald-400 border-emerald-800/60 shadow-aurora-glow",
    warning: "bg-amber-950/80 text-amber-300 border-amber-800/60",
    danger: "bg-red-950/80 text-red-400 border-red-800/60 shadow-alert-glow",
    ice: "bg-sky-950/80 text-sky-300 border-sky-700/60 shadow-ice-glow",
    neutral: "bg-slate-900 text-slate-400 border-slate-800"
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs font-medium",
    md: "px-2.5 py-1 text-xs font-semibold"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border transition-all duration-200",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
