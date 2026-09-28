import React from "react";
import { cn } from "../../lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  glow = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        "rounded-xl p-5 transition-all duration-300",
        glow ? "polar-card-glow" : "polar-card",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
