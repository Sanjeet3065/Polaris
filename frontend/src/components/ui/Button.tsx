import React from "react";
import { cn } from "../../lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      primary: "bg-orange-600 hover:bg-orange-500 text-white font-semibold shadow-titanium hover:scale-[1.01] active:scale-[0.99]",
      secondary: "bg-polar-800 hover:bg-polar-750 text-slate-100 border border-polar-700 shadow-titanium",
      outline: "border border-orange-500/40 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500",
      ghost: "text-slate-300 hover:bg-polar-800/60 hover:text-white",
      danger: "bg-rose-600 hover:bg-rose-500 text-white shadow-titanium"
    };

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs rounded-md",
      md: "px-4 py-2 text-sm rounded-lg",
      lg: "px-5 py-2.5 text-base rounded-lg"
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500/50",
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
  }
);

Button.displayName = "Button";

