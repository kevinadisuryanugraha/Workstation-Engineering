import React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "destructive" | "warning" | "outline" | "cyan" | "purple";
  size?: "sm" | "md";
  dot?: boolean;
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  size = "md",
  dot = false,
  pulse = false,
  children,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center gap-1.5 font-mono font-bold rounded-md tracking-tight transition-all border-[1.5px] border-slate-900 shadow-[1.5px_1.5px_0px_#18181b] whitespace-nowrap shrink-0 leading-none";

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-0.5",
  };

  const variantClasses = {
    default: "bg-[#F3EDE0] text-slate-900",
    secondary: "bg-white text-slate-800",
    success: "bg-[#4ade80] text-slate-950",
    destructive: "bg-[#ff70a6] text-slate-950",
    warning: "bg-[#f6ae2d] text-slate-950",
    outline: "bg-white text-slate-900",
    cyan: "bg-[#2ec4b6] text-slate-950",
    purple: "bg-[#c084fc] text-slate-950",
  };

  const dotColors = {
    default: "bg-slate-900",
    secondary: "bg-slate-700",
    success: "bg-emerald-700",
    destructive: "bg-rose-700",
    warning: "bg-amber-800",
    outline: "bg-slate-900",
    cyan: "bg-teal-800",
    purple: "bg-purple-800",
  };

  return (
    <span
      className={cn(baseClasses, sizeClasses[size], variantClasses[variant], className)}
      {...props}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && (
            <span
              className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                dotColors[variant]
              )}
            />
          )}
          <span
            className={cn(
              "relative inline-flex rounded-full h-1.5 w-1.5 border border-slate-900",
              dotColors[variant]
            )}
          />
        </span>
      )}
      {children}
    </span>
  );
};
