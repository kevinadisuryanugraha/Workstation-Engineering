import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  ArrowRight,
  X
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
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  const handleRollback = (dep: Deployment) => {
    if (confirm(`Are you sure you want to trigger a rollback of ${dep.version} on ${dep.server}?`)) {
      setRollbackSuccess(`Rollback initiated for ${dep.code}. Target restored to previous stable SHA.`);
      setTimeout(() => setRollbackSuccess(null), 5000);
      if (onTriggerRollback) onTriggerRollback(dep.id);
    }
  };

  const renderInspectorContent = () => {
    if (!selectedDep) {
      return (
        <div className="text-center text-xs text-slate-500 py-16 font-mono">
          Select a deployment from the timeline to inspect verification gates and logs.
        </div>
      );
    }

    return (
      <div className="space-y-5">
        {/* Header Info */}
        <div className="space-y-2 pb-4 border-b-2 border-slate-900/10">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-mono font-black px-2.5 py-1 rounded-md bg-white text-slate-950 border-2 border-slate-900 shadow-[1px_1px_0px_#18181b]">
              {selectedDep.code}
            </span>
            <Badge variant="success" size="sm" dot>
              {selectedDep.status}
            </Badge>
          </div>
          <h3 className="text-base sm:text-lg font-mono font-black text-slate-950 tracking-tight leading-snug pt-1">
            Release {selectedDep.version}
          </h3>
          <p className="text-xs text-slate-700 font-mono">
            Target Host: <strong className="text-slate-950 font-bold">{selectedDep.server}</strong>
          </p>
        </div>

        {/* Policy Gates */}
        <div className="p-4 sm:p-5 bg-[#FAF7EE] rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b-2 border-slate-900/10">
            <h4 className="text-xs font-mono font-black text-slate-950 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
              <span>Mandatory Verification Gates</span>
            </h4>
          </div>
          <div className="space-y-2">
            {selectedDep.gates.map((g, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-white border-2 border-slate-900/50 text-xs font-mono shadow-[1px_1px_0px_#18181b] flex-wrap gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />
                  <span className="text-slate-950 font-bold truncate">{g.name}</span>
                </div>
                <span className="text-[10px] text-slate-600 font-mono font-bold bg-[#FAF7EE] px-2 py-0.5 rounded border border-slate-900/40 shrink-0">
                  {g.verifiedBy}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Logs Summary */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-950 font-mono font-black uppercase tracking-wider">
            <Terminal className="w-3.5 h-3.5 text-blue-600" />
            <span>Agent Execution Log</span>
          </div>
          <div className="p-3.5 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl border-2 border-slate-900 leading-relaxed shadow-[2px_2px_0px_#18181b]">
            <span className="text-emerald-500 select-none mr-2 font-bold">&gt;</span>
            <span className="text-slate-100">{selectedDep.logsSummary}</span>
          </div>
        </div>

        {/* Rollback Trigger Button */}
        {selectedDep.environment === "Production" && (
          <div className="pt-2 space-y-2">
            <button
              onClick={() => handleRollback(selectedDep)}
              className="w-full py-3 rounded-xl bg-[#ff70a6] hover:bg-[#ff5d99] text-white border-2 border-slate-900 text-xs font-mono font-black flex items-center justify-center gap-2 transition-all shadow-[2px_2px_0px_#18181b] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-white stroke-[2.5]" />
              <span>Trigger Rollback to Stable Release</span>
            </button>
            <p className="text-[10px] text-slate-600 text-center font-mono leading-normal font-semibold">
              Requires Tech Lead authority. Rollback event is recorded to audit trail.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <KokonutCard variant="default" className="p-4 sm:p-5" interactive={false}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant="purple" size="sm" dot>
                Release &amp; Deployment Operations
              </Badge>
              <span className="text-xs text-slate-600 font-mono font-bold">Project: [{project.key}] {project.name}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-mono font-black text-slate-950 tracking-tight flex items-center gap-2">
              <Rocket className="w-5 h-5 text-indigo-600 stroke-[2.5]" />
              Environment Releases, Verification Gates &amp; Rollback Audit
            </h1>
            <p className="text-xs text-slate-600 font-mono mt-1 font-semibold max-w-2xl">
              Real-time synchronization across Kontabo VPS (Production) and Office Server (Development).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="success" size="md" pulse>
              Production: v1.4.2 Healthy
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Deployment Records (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_#18181b] overflow-hidden">
          <div className="p-4 sm:p-5 border-b-2 border-slate-900 flex items-center justify-between bg-[#FAF7EE] flex-wrap gap-2">
            <span className="text-xs font-mono font-black text-slate-950 uppercase tracking-wider flex items-center gap-2">
              <Rocket className="w-4 h-4 text-indigo-600 stroke-[2.5]" />
              Deployment Timeline ({deployments.length})
            </span>
            <Badge variant="success" size="sm">
              Zero-Downtime Pipeline Active
            </Badge>
          </div>

          <div className="divide-y-2 divide-slate-900/10">
            {deployments.map((dep) => {
              const isSelected = selectedDep?.id === dep.id;
              return (
                <motion.div
                  key={dep.id}
                  whileHover={{ x: 2 }}
                  onClick={() => {
                    setSelectedDep(dep);
                    setShowMobileDrawer(true);
                  }}
                  className={cn(
                    "p-4 sm:p-5 cursor-pointer transition-colors relative",
                    isSelected
                      ? "bg-[#FAF7EE] border-l-4 border-l-slate-950"
                      : "hover:bg-slate-50"
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-black px-2 py-0.5 rounded-md bg-white text-slate-950 border border-slate-900 shadow-[1px_1px_0px_#18181b]">
                        {dep.code}
                      </span>
                      <span className="text-sm font-mono font-black text-slate-950">{dep.version}</span>
                      <Badge variant={dep.environment === "Production" ? "destructive" : "cyan"} size="sm">
                        {dep.environment}
                      </Badge>
                    </div>

                    <Badge variant="success" size="sm">
                      ✓ {dep.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 font-mono mt-1.5">
                    <span>Host: <strong className="text-slate-950 font-bold">{dep.server}</strong></span>
                    <span className="text-slate-400">•</span>
                    <span className="inline-flex items-center gap-1">
                      SHA:{" "}
                      <code className="text-emerald-900 font-bold bg-emerald-100 px-1.5 py-0.2 rounded border border-slate-900 shadow-[1px_1px_0px_#18181b] text-[11px]">
                        {dep.commitSha}
                      </code>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 mt-3 pt-2.5 border-t border-slate-900/10 font-mono font-semibold">
                    <span>Triggered by: <strong className="text-slate-950">{dep.actor}</strong></span>
                    <span>{dep.completedAt}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Mobile active inspector bar */}
          {selectedDep && (
            <div className="lg:hidden p-3 bg-[#FFFDF8] border-t-2 border-slate-900 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">Inspecting Release</span>
                <span className="text-xs font-mono font-black text-slate-950 truncate block">
                  {selectedDep.code} - {selectedDep.version} ({selectedDep.environment})
                </span>
              </div>
              <button
                onClick={() => setShowMobileDrawer(true)}
                className="px-3 py-1.5 rounded-lg bg-[#2ec4b6] hover:bg-[#28ad9f] text-slate-950 border-2 border-slate-900 font-mono font-bold text-xs shadow-[1.5px_1.5px_0px_#18181b] shrink-0 active:translate-x-0.5 active:translate-y-0.5"
              >
                Inspect Gates
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Deployment Gate Checks & Rollback Action (5 cols on lg, Desktop only) */}
        <div className="hidden lg:block lg:col-span-5 bg-white rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_#18181b] p-5 sm:p-6 space-y-6">
          {renderInspectorContent()}
        </div>
      </div>

      {/* Mobile/Tablet Slide-Over Sheet Drawer */}
      <AnimatePresence>
        {showMobileDrawer && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end lg:hidden">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-xl h-full bg-[#FAF7EE] border-l-2 border-slate-900 p-4 sm:p-6 overflow-y-auto shadow-[-4px_0px_0px_#18181b] space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900/10">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
                  <h3 className="text-sm font-mono font-black text-slate-950">Release Verification Inspector</h3>
                </div>
                <button
                  onClick={() => setShowMobileDrawer(false)}
                  className="p-1.5 rounded-lg border-2 border-slate-900 bg-white hover:bg-slate-100 text-slate-900 shadow-[1.5px_1.5px_0px_#18181b] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-white rounded-2xl border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] p-4 sm:p-5">
                {renderInspectorContent()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
