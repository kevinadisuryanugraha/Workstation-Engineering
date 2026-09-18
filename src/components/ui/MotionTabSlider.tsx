import React from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  badgeVariant?: "default" | "success" | "warning" | "destructive";
}

interface MotionTabSliderProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  className?: string;
  layoutId?: string;
}

export function MotionTabSlider<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className,
  layoutId = "motion-tab-slider",
}: MotionTabSliderProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex items-center p-1 bg-slate-950/80 border border-slate-800/80 rounded-xl backdrop-blur-md gap-1",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 select-none outline-none focus-visible:ring-1 focus-visible:ring-emerald-500",
              isActive ? "text-white font-semibold" : "text-slate-600 hover:text-slate-200"
            )}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
                className="absolute inset-0 bg-slate-800/90 border border-slate-700/60 rounded-lg shadow-sm"
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon}
              <span>{tab.label}</span>
              {typeof tab.count === "number" && tab.count > 0 && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold",
                    isActive
                      ? "bg-slate-700 text-slate-100"
                      : "bg-slate-800 text-slate-600"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
