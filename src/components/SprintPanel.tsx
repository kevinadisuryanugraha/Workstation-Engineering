import React from "react";
import { Zap, CircleCheck, Loader } from "lucide-react";
import { useProjectSprints } from "../hooks/api/useSprints";
import { KokonutCard } from "./ui/KokonutCard";
import { Badge } from "./ui/Badge";
import { cn } from "../lib/utils";

/**
 * Story 14.2 — Sprint board panel (Project 360).
 * Planned / completed / carry-over counts + explainable completion percent.
 */

interface SprintPanelProps {
  projectId: string;
  isAuthenticated: boolean;
}

const STATUS_TONE: Record<string, "success" | "default" | "warning"> = {
  ACTIVE: "success",
  PLANNED: "default",
  CLOSED: "warning",
};

export const SprintPanel: React.FC<SprintPanelProps> = ({ projectId, isAuthenticated }) => {
  const { data, isLoading, isError } = useProjectSprints(projectId, { enabled: isAuthenticated });

  if (!isAuthenticated || isError) return null;

  return (
    <KokonutCard variant="default" className="p-5" interactive={false}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-mono font-black text-slate-950 uppercase tracking-wider">
            Sprint Board
          </span>
        </div>
        <Badge size="sm" variant="default">
          Explainable Progress
        </Badge>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 py-4">
          <Loader className="w-3.5 h-3.5 animate-spin" /> Memuat sprint…
        </div>
      )}

      {data && data.count === 0 && (
        <p className="text-xs font-mono text-slate-500 py-4">
          Belum ada sprint pada project ini. Buat sprint melalui API untuk mulai melacak iterasi.
        </p>
      )}

      <div className="space-y-3">
        {data?.sprints?.map(({ sprint, completionPercent, itemCount }) => (
          <div key={sprint.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-bold text-slate-900">{sprint.name}</span>
                <Badge size="sm" variant={STATUS_TONE[sprint.status] ?? "default"} dot>
                  {sprint.status}
                </Badge>
              </div>
              <span className="text-xs font-mono text-slate-500 font-bold">{itemCount} item</span>
            </div>
            {sprint.goal && <p className="text-xs text-slate-600 mb-2">{sprint.goal}</p>}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={cn("h-full rounded-full", completionPercent >= 100 ? "bg-emerald-500" : "bg-cyan-500")}
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700">
                <CircleCheck className="w-3.5 h-3.5 text-emerald-500" />
                {completionPercent}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </KokonutCard>
  );
};
