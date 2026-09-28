import React from "react";
import { cn } from "../../lib/utils";

interface ProgressBarProps {
  value: number; // 0 - 100
  max?: number;
  className?: string;
  barColor?: "emerald" | "sky" | "amber" | "red" | "dynamic";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  className,
  barColor = "dynamic",
  size = "md",
  showLabel = false
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  let colorClass = "bg-sky-400";
  if (barColor === "emerald") colorClass = "bg-emerald-400";
  else if (barColor === "amber") colorClass = "bg-amber-400";
  else if (barColor === "red") colorClass = "bg-red-500";
  else if (barColor === "sky") colorClass = "bg-sky-400";
  else if (barColor === "dynamic") {
    if (percentage >= 85) colorClass = "bg-emerald-400";
    else if (percentage >= 70) colorClass = "bg-sky-400";
    else if (percentage >= 50) colorClass = "bg-amber-400";
    else colorClass = "bg-red-500";
  }

  const heightClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3"
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
          <span>Progress</span>
          <span className="font-mono">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn("w-full bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50", heightClasses[size])}>
        <div
          className={cn("h-full transition-all duration-500 ease-out rounded-full", colorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
