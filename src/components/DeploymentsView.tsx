import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Rocket,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Clock,
  Server,
  AlertTriangle,
  Play,
  Terminal,
  Layers,
  ArrowRight
} from "lucide-react";
import { Deployment, Project } from "../types";
import { KokonutCard } from "./ui/KokonutCard";
import { Badge } from "./ui/Badge";
import { cn } from "../lib/utils";

interface DeploymentsViewProps {
  deployments: Deployment[];
  project: Project;
  onTriggerRollback?: (depId: string) => void;
  isManagementView: boolean;
}

export const DeploymentsView: React.FC<DeploymentsViewProps> = ({
  deployments,
  project,
  onTriggerRollback,
  isManagementView
}) => {
  const [selectedDep, setSelectedDep] = useState<Deployment | null>(deployments[0] || null);
  const [rollbackSuccess, setRollbackSuccess] = useState<string | null>(null);

  const handleRollback = (dep: Deployment) => {
    if (confirm(`Are you sure you want to trigger a rollback of ${dep.version} on ${dep.server}?`)) {
      setRollbackSuccess(`Rollback initiated for ${dep.code}. Target restored to previous stable SHA.`);
      setTimeout(() => setRollbackSuccess(null), 5000);
      if (onTriggerRollback) onTriggerRollback(dep.id);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <KokonutCard variant="default" className="p-5" interactive={false}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="purple" size="sm" dot>
                Release & Deployment Operations
              </Badge>
              <span className="text-xs text-slate-600 font-mono font-bold">Project: {project.name}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-mono font-black text-slate-950 tracking-tight">
              Environment Releases, Verification Gates & Rollback Audit
            </h1>
            <p className="text-xs text-slate-600 font-mono mt-0.5">
              Track exactly what code is running on Kontabo VPS (Production) and Office Server (Development).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="success" size="md" pulse>
              Production: v2.8.1 Healthy
            </Badge>
          </div>
        </div>
      </KokonutCard>

      {rollbackSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 bg-[#fef3c7] border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] rounded-xl text-amber-950 font-mono text-xs flex items-center gap-2.5 font-bold"
        >
          <AlertTriangle className="w-4 h-4 text-amber-700 stroke-[2.5] shrink-0" />
          <span>{rollbackSuccess}</span>
        </motion.div>
      )}

      {/* Deployments List and Detailed Log Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Deployment Records */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <span className="text-xs font-mono font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Rocket className="w-4 h-4 text-indigo-600" />
              Deployment Timeline
            </span>
            <Badge variant="success" size="sm">
              Zero-Downtime Pipeline Active
            </Badge>
          </div>

          <div className="divide-y divide-slate-100">
            {deployments.map((dep) => (
              <motion.div
                key={dep.id}
                whileHover={{ x: 2 }}
                onClick={() => setSelectedDep(dep)}
                className={cn(
                  "p-4 sm:p-5 cursor-pointer transition-colors relative",
                  selectedDep?.id === dep.id
                    ? "bg-indigo-50/40 border-l-4 border-l-indigo-600"
                    : "hover:bg-slate-50/70"
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                      {dep.code}
                    </span>
                    <span className="text-sm font-mono font-bold text-slate-900">{dep.version}</span>
                    <Badge variant={dep.environment === "Production" ? "destructive" : "cyan"} size="sm">
                      {dep.environment}
                    </Badge>
                  </div>

                  <Badge variant="success" size="sm">
                    ✓ {dep.status}
                  </Badge>
                </div>

                <p className="text-xs text-slate-600 font-mono mt-1 break-all">
                  Server: <strong className="text-slate-900 font-bold">{dep.server}</strong> • Commit:{" "}
                  <code className="text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[11px]">{dep.commitSha}</code>
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-100 font-mono">
                  <span>Triggered by: <strong className="text-slate-700">{dep.actor}</strong></span>
                  <span>{dep.completedAt}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Deployment Gate Checks & Rollback Action */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-6 space-y-6">
          {selectedDep ? (
            <>
              {/* Header Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                    {selectedDep.code}
                  </span>
                  <Badge variant="success" size="sm">
                    {selectedDep.status}
                  </Badge>
                </div>
                <h3 className="text-base sm:text-lg font-mono font-black text-slate-900 tracking-tight leading-snug pt-1">
                  Release {selectedDep.version}
                </h3>
                <p className="text-xs text-slate-600 font-mono">
                  Target: <strong className="text-slate-800 font-semibold">{selectedDep.server}</strong>
                </p>
              </div>

              {/* Policy Gates */}
              <div className="p-4 sm:p-5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <h4 className="text-xs font-mono font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mandatory Verification Gates</span>
                  </h4>
                </div>
                <div className="space-y-2">
                  {selectedDep.gates.map((g, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200/60 text-xs font-mono shadow-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-slate-900 font-semibold">{g.name}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
                        ({g.verifiedBy})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logs Summary */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-900 font-mono font-black uppercase tracking-wider">
                  <Terminal className="w-3.5 h-3.5 text-blue-600" />
                  <span>Agent Execution Log</span>
                </div>
                <div className="p-3.5 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl border border-slate-800 leading-relaxed shadow-inner">
                  <span className="text-slate-500 select-none mr-2">&gt;</span>
                  <span className="text-slate-100">{selectedDep.logsSummary}</span>
                </div>
              </div>

              {/* Rollback Trigger Button */}
              {selectedDep.environment === "Production" && (
                <div className="pt-2 space-y-2">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRollback(selectedDep)}
                    className="w-full py-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-rose-600 stroke-[2.5]" />
                    <span>Trigger Rollback to Stable Release</span>
                  </motion.button>
                  <p className="text-[11px] text-slate-500 text-center font-mono leading-normal">
                    Requires Tech Lead authority. Rollback event is logged to immutable audit trail.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-xs text-slate-500 py-16 font-mono">
              Select a deployment to inspect gates.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
