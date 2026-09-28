import React from "react";
import { cn } from "../../lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-800/60 border border-slate-700/20", className)}
      {...props}
    />
  );
};

export const MetricCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl border border-slate-800 bg-polar-900/60 p-5 space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
};

export const ChartSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl border border-slate-800 bg-polar-900/60 p-5 space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-56 w-full" />
    </div>
  );
};
