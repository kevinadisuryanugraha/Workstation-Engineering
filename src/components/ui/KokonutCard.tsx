import React from "react";
import { motion, HTMLMotionProps } from "motion/react";
import { cn } from "../../lib/utils";

interface KokonutCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  variant?: "default" | "subtle" | "glow" | "elevated";
  glowColor?: "emerald" | "blue" | "amber" | "rose" | "indigo";
  className?: string;
  badge?: React.ReactNode;
  interactive?: boolean;
  title?: string;
  windowColor?: "teal" | "yellow" | "pink" | "blue" | "default";
  showControls?: boolean;
}

export const KokonutCard: React.FC<KokonutCardProps> = ({
  children,
  variant = "default",
  glowColor,
  className,
  badge,
  interactive = true,
  title,
  windowColor = "default",
  showControls = false,
  ...motionProps
}) => {
  const windowColorBars = {
    default: "bg-[#F3EDE0] text-slate-900 border-b-2 border-slate-900",
    teal: "bg-[#2ec4b6] text-slate-950 border-b-2 border-slate-900",
    yellow: "bg-[#f6ae2d] text-slate-950 border-b-2 border-slate-900",
    pink: "bg-[#ff70a6] text-slate-950 border-b-2 border-slate-900",
    blue: "bg-[#60a5fa] text-slate-950 border-b-2 border-slate-900",
  };

  return (
    <motion.div
      whileHover={interactive ? { y: -2, x: -1, transition: { duration: 0.15, ease: "easeOut" } } : undefined}
      className={cn(
        "relative rounded-xl border-2 border-slate-900 bg-white text-slate-900 shadow-[3.5px_3.5px_0px_#18181b] overflow-hidden transition-all",
        className
      )}
      {...motionProps}
    >
      {(title || showControls) && (
        <div className={cn("px-3.5 py-1.5 flex items-center justify-between font-mono text-xs font-bold select-none", windowColorBars[windowColor])}>
          <div className="flex items-center gap-2 truncate">
            <span className="truncate">{title || "WINDOW"}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="retro-window-btn">_</span>
            <span className="retro-window-btn">□</span>
            <span className="retro-window-btn">✕</span>
          </div>
        </div>
      )}

      {badge && (
        <div className="absolute top-3.5 right-3.5 z-10">
          {badge}
        </div>
      )}

      <div className={cn(title || showControls ? "p-4" : "")}>
        {children}
      </div>
    </motion.div>
  );
};
