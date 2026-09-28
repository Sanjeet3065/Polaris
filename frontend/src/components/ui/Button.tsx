import React from "react";
import { cn } from "../../lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  className,
  disabled,
  ...props
}) => {
  const variantStyles = {
    primary: "bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold shadow-ice-glow hover:shadow-sky-400/50",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700",
    outline: "border border-sky-500/40 text-sky-300 hover:bg-sky-500/10 hover:border-sky-400",
    ghost: "text-slate-300 hover:bg-slate-800/60 hover:text-white",
    danger: "bg-red-600 hover:bg-red-500 text-white shadow-alert-glow"
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs rounded-md",
    md: "px-4 py-2 text-sm rounded-lg",
    lg: "px-5 py-2.5 text-base rounded-lg"
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sky-400/50",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
};
