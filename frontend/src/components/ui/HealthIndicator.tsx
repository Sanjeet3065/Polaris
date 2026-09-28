import React from "react";
import { cn } from "../../lib/utils";

interface HealthIndicatorProps {
  score: number; // 0 - 100
  size?: number; // size in px
  strokeWidth?: number;
  className?: string;
  showText?: boolean;
}

export const HealthIndicator: React.FC<HealthIndicatorProps> = ({
  score,
  size = 56,
  strokeWidth = 5,
  className,
  showText = true
}) => {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(100, Math.max(0, score));
  const offset = circumference - (clampedScore / 100) * circumference;

  let colorClass = "text-emerald-400";
  if (clampedScore < 70) colorClass = "text-red-500";
  else if (clampedScore < 85) colorClass = "text-amber-400";
  else if (clampedScore < 95) colorClass = "text-sky-400";

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-800"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-700 ease-out", colorClass)}
          fill="transparent"
        />
      </svg>
      {showText && (
        <span className="absolute font-mono font-bold text-xs text-slate-100">
          {Math.round(clampedScore)}%
        </span>
      )}
    </div>
  );
};
