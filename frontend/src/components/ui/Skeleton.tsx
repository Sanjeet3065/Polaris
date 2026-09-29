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

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4
}) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-polar-900/60 overflow-hidden p-4 space-y-3">
      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-7 w-24 rounded-lg" />
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex items-center gap-3">
            {Array.from({ length: columns }).map((_, cIdx) => (
              <Skeleton
                key={cIdx}
                className={cIdx === 0 ? "h-4 w-1/3" : "h-4 flex-1"}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

