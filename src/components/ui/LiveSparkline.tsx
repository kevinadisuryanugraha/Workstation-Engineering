import React from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

interface LiveSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: "emerald" | "blue" | "amber" | "rose" | "purple";
  className?: string;
  showDot?: boolean;
}

export const LiveSparkline: React.FC<LiveSparklineProps> = ({
  data,
  width = 80,
  height = 24,
  color = "emerald",
  className,
  showDot = true,
}) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    return `${acc} ${idx === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${height} L ${points[0].x.toFixed(1)} ${height} Z`;

  const colorMap = {
    emerald: {
      stroke: "#10b981",
      fill: "url(#emerald-grad)",
      dot: "bg-emerald-400",
    },
    blue: {
      stroke: "#3b82f6",
      fill: "url(#blue-grad)",
      dot: "bg-blue-400",
    },
    amber: {
      stroke: "#f59e0b",
      fill: "url(#amber-grad)",
      dot: "bg-amber-400",
    },
    rose: {
      stroke: "#f43f5e",
      fill: "url(#rose-grad)",
      dot: "bg-rose-400",
    },
    purple: {
      stroke: "#8b5cf6",
      fill: "url(#purple-grad)",
      dot: "bg-purple-400",
    },
  };

  const activeColor = colorMap[color];
  const lastPoint = points[points.length - 1];

  return (
    <div className={cn("relative inline-flex items-center", className)} style={{ width, height }}>
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id="emerald-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="blue-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="amber-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="rose-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="purple-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        <path d={areaD} fill={activeColor.fill} />
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          d={pathD}
          fill="none"
          stroke={activeColor.stroke}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showDot && (
        <span
          className={cn("absolute w-1.5 h-1.5 rounded-full pointer-events-none", activeColor.dot)}
          style={{
            left: `${lastPoint.x - 3}px`,
            top: `${lastPoint.y - 3}px`,
          }}
        />
      )}
    </div>
  );
};
