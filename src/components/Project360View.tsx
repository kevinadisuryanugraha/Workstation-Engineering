import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Rocket,
  Shield,
  Activity,
  GitBranch,
  Server,
  Sparkles,
  ArrowRight,
  FileCheck,
  ChevronDown,
  Info,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { Project, WorkItem, Ticket, Deployment } from "../types";
import { KokonutCard } from "./ui/KokonutCard";
import { Badge } from "./ui/Badge";
import { AnimatedCounter } from "./ui/AnimatedCounter";

interface Project360ViewProps {
  project: Project;
  workItems: WorkItem[];
  tickets: Ticket[];
  deployments: Deployment[];
  isManagementView: boolean;
  onNavigateTab: (tab: any) => void;
}

export const Project360View: React.FC<Project360ViewProps> = ({
  project,
  workItems,
  tickets,
  deployments,
  isManagementView,
  onNavigateTab
}) => {
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);

  // Health dimensions matching PRD Section 15 & 33
  const healthDimensions = [
    { name: "Delivery Velocity", score: 82, status: "On Track", desc: "Sprint burnup on schedule, 2 active blockers", angle: 0 },
    { name: "Code Quality", score: 87, status: "Healthy", desc: "Low defect escape rate, zero regressions", angle: 51.4 },
    { name: "Security Posture", score: 92, status: "Verified", desc: "No critical CVEs, HMAC authentication active", angle: 102.8 },
    { name: "Performance", score: 78, status: "Review", desc: "N+1 query detected in enrollment listing iteration", angle: 154.2 },
    { name: "Test Coverage", score: 69, status: "Attention", desc: "84% pass rate, seat reservation needs race test", angle: 205.7 },
    { name: "Documentation", score: 74, status: "Fair", desc: "API specs current, runbook updated for POS", angle: 257.1 },
    { name: "Infrastructure", score: 96, status: "Optimal", desc: "Kontabo VPS 99.98% uptime, memory 64%", angle: 308.5 }
  ];

  const projectWorkItems = workItems.filter((w) => w.projectId === project.id);
  const projectDeployments = deployments.filter((d) => d.projectId === project.id);

  // Calculate SVG Polygon points for Radar Graph
  const center = 100;
  const radius = 75;
  const radarPoints = healthDimensions.map((dim, i) => {
    const angleRad = ((i * (360 / healthDimensions.length) - 90) * Math.PI) / 180;
    const r = (dim.score / 100) * radius;
    const x = center + r * Math.cos(angleRad);
    const y = center + r * Math.sin(angleRad);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return (
    <div className="space-y-6 pb-12">
      {/* Project Header Card */}
      <KokonutCard variant="glow" className="p-6 relative overflow-hidden" interactive={false}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {project.key}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{project.name}</h1>
              <Badge variant="secondary" size="sm">
                {project.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">{project.tagline}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1 font-mono">
              <span>Owner: <strong className="text-slate-200">{project.owner}</strong></span>
              <span className="text-slate-600">•</span>
              <span>Tech Lead: <strong className="text-slate-200">{project.techLead}</strong></span>
              <span className="text-slate-600">•</span>
              <span>Repo: <span className="text-emerald-400 font-semibold">{project.repoName}</span></span>
            </div>
          </div>

          {/* Quick Stats Block (21st.dev style metrics) */}
          <div className="flex flex-wrap items-center justify-around gap-3 sm:gap-4 shrink-0 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 shadow-inner w-full lg:w-auto">
            <div className="text-center px-3">
              <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
                <AnimatedCounter value={project.progress} suffix="%" />
              </div>
              <div className="text-[10px] uppercase font-mono font-semibold text-slate-600 mt-0.5">Progress</div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-center px-3">
              <div className="text-2xl sm:text-3xl font-bold font-mono text-blue-400">
                <AnimatedCounter value={project.health} />
              </div>
              <div className="text-[10px] uppercase font-mono font-semibold text-slate-600 mt-0.5">Health Index</div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-center px-3">
              <div className="text-xl sm:text-2xl font-bold font-mono text-purple-400">{project.latestRelease}</div>
              <div className="text-[10px] uppercase font-mono font-semibold text-slate-600 mt-0.5">Release</div>
            </div>
          </div>
        </div>
      </KokonutCard>

      {/* Mathematical Progress Derivation Engine (PRD Section 14 & 32) */}
      <KokonutCard variant="default" className="p-5" interactive={false}>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              Explainable Progress Calculation Engine
            </h2>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Prinsip mutlak: Progress bukan angka subjektif yang diinput manual. Dihitung langsung dari evidence deliverable.
            </p>
          </div>
          <button
            onClick={() => setShowFormulaDetails(!showFormulaDetails)}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-mono font-medium flex items-center gap-1 transition-colors"
          >
            <span>{showFormulaDetails ? "Hide Formula" : "Inspect Formula"}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFormulaDetails ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* 4 Derivation Components */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-2">
          {/* 1. Tasks */}
          <div className="bg-white p-3.5 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1 text-xs mb-1.5 font-mono">
                <span className="text-slate-950 font-bold">1. Tasks</span>
                <span className="text-emerald-700 font-bold text-xs shrink-0">
                  82% <span className="text-slate-500 font-normal text-[10px]">(wt: 40%)</span>
                </span>
              </div>
              <div className="w-full bg-[#FAF7EE] h-2.5 rounded-full overflow-hidden mb-2 border border-slate-900/30 p-[1px]">
                <div className="bg-[#4ade80] h-full rounded-full border border-emerald-700" style={{ width: "82%" }} />
              </div>
            </div>
            <p className="text-[11px] text-slate-600 font-mono font-bold leading-tight">Verified by commits & reviews</p>
          </div>

          {/* 2. Acceptance Criteria */}
          <div className="bg-white p-3.5 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-1 text-xs mb-1.5 font-mono">
                <span className="text-slate-950 font-bold leading-tight">2. Acceptance Criteria</span>
                <span className="text-blue-700 font-bold text-xs shrink-0 text-right">
                  75% <span className="text-slate-500 font-normal text-[10px] block sm:inline">(wt: 30%)</span>
                </span>
              </div>
              <div className="w-full bg-[#FAF7EE] h-2.5 rounded-full overflow-hidden mb-2 border border-slate-900/30 p-[1px]">
                <div className="bg-[#38bdf8] h-full rounded-full border border-blue-700" style={{ width: "75%" }} />
              </div>
            </div>
            <p className="text-[11px] text-slate-600 font-mono font-bold leading-tight">Automated AC validation pass rate</p>
          </div>

          {/* 3. Milestones */}
          <div className="bg-white p-3.5 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1 text-xs mb-1.5 font-mono">
                <span className="text-slate-950 font-bold">3. Milestones</span>
                <span className="text-purple-700 font-bold text-xs shrink-0">
                  80% <span className="text-slate-500 font-normal text-[10px]">(wt: 20%)</span>
                </span>
              </div>
              <div className="w-full bg-[#FAF7EE] h-2.5 rounded-full overflow-hidden mb-2 border border-slate-900/30 p-[1px]">
                <div className="bg-[#c084fc] h-full rounded-full border border-purple-700" style={{ width: "80%" }} />
              </div>
            </div>
            <p className="text-[11px] text-slate-600 font-mono font-bold leading-tight">Roadmap deliverables completed</p>
          </div>

          {/* 4. Deployed State */}
          <div className="bg-white p-3.5 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-1 text-xs mb-1.5 font-mono">
                <span className="text-slate-950 font-bold leading-tight">4. Deployed State</span>
                <span className="text-amber-700 font-bold text-xs shrink-0 text-right">
                  100% <span className="text-slate-500 font-normal text-[10px] block sm:inline">(wt: 10%)</span>
                </span>
              </div>
              <div className="w-full bg-[#FAF7EE] h-2.5 rounded-full overflow-hidden mb-2 border border-slate-900/30 p-[1px]">
                <div className="bg-[#f6ae2d] h-full rounded-full border border-amber-700" style={{ width: "100%" }} />
              </div>
            </div>
            <p className="text-[11px] text-slate-600 font-mono font-bold leading-tight">Active in target environment</p>
          </div>
        </div>

        <AnimatePresence>
          {showFormulaDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden"
            >
              <div className="p-3.5 bg-white rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] text-xs font-mono text-slate-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-emerald-700 font-bold mb-1">Mathematical Derivation Formula:</p>
                  <p className="text-slate-700">
                    Progress = (0.40 × 82%) + (0.30 × 75%) + (0.20 × 80%) + (0.10 × 100%)
                    = 32.8% + 22.5% + 16.0% + 10.0% = <strong className="text-slate-950">81.3% → Rounded to 82%</strong>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </KokonutCard>

      {/* 2 Columns: 7-Dimension Project Health Radar + Active Items & Deployments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Project Health Index & Visual Radar Graphic */}
        <KokonutCard variant="default" className="p-5" interactive={false}>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <div>
              <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-blue-400" />
                7-Dimensional Health Radar
              </h2>
              <p className="text-[11px] text-slate-600">Health ≠ Progress. High progress can still bear operational risk.</p>
            </div>
            <Badge variant="cyan" size="sm">
              Index: {project.health}/100
            </Badge>
          </div>

          {/* SVG Radar Polygon visualization */}
          <div className="flex justify-center mb-5 py-2">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
                {/* Concentric guide polygons */}
                {[0.25, 0.5, 0.75, 1].map((scale, sIdx) => {
                  const pts = healthDimensions.map((_, i) => {
                    const angleRad = ((i * (360 / healthDimensions.length) - 90) * Math.PI) / 180;
                    const r = scale * radius;
                    return `${(center + r * Math.cos(angleRad)).toFixed(1)},${(center + r * Math.sin(angleRad)).toFixed(1)}`;
                  }).join(" ");
                  return (
                    <polygon
                      key={sIdx}
                      points={pts}
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Dimension axis spokes */}
                {healthDimensions.map((_, i) => {
                  const angleRad = ((i * (360 / healthDimensions.length) - 90) * Math.PI) / 180;
                  const x = center + radius * Math.cos(angleRad);
                  const y = center + radius * Math.sin(angleRad);
                  return (
                    <line
                      key={i}
                      x1={center}
                      y1={center}
                      x2={x}
                      y2={y}
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Actual Health Shape with Motion */}
                <motion.polygon
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8 }}
                  points={radarPoints}
                  fill="rgba(59, 130, 246, 0.2)"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  className="filter drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                />
              </svg>
            </div>
          </div>

          {/* Dimension Details List */}
          <div className="space-y-2.5">
            {healthDimensions.map((dim) => (
              <div key={dim.name} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-white">{dim.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-600 font-mono">{dim.score}/100</span>
                    <Badge
                      size="sm"
                      variant={
                        dim.score >= 85
                          ? "success"
                          : dim.score >= 75
                          ? "warning"
                          : "destructive"
                      }
                    >
                      {dim.status}
                    </Badge>
                  </div>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mb-1 border border-slate-800/60">
                  <div
                    className={`h-full rounded-full ${
                      dim.score >= 85 ? "bg-emerald-400" : dim.score >= 75 ? "bg-amber-400" : "bg-rose-400"
                    }`}
                    style={{ width: `${dim.score}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-600 font-mono">{dim.desc}</p>
              </div>
            ))}
          </div>
        </KokonutCard>

        {/* Right: Active Sprints, Work Items & Deployments */}
        <div className="space-y-4">
          <KokonutCard variant="default" className="p-5" interactive={false}>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-900/20">
              <div>
                <h2 className="text-xs font-mono font-black text-slate-950 uppercase tracking-wider">
                  Active Sprint Items
                </h2>
                <p className="text-[11px] text-slate-600 font-mono font-bold">{project.currentSprint}</p>
              </div>
              <button
                onClick={() => onNavigateTab("workitems")}
                className="text-xs text-teal-700 hover:text-teal-900 font-mono font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Sprint Board</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            <div className="space-y-2.5">
              {projectWorkItems.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ x: 2 }}
                  className="p-3 bg-white rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] transition-all"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FAF7EE] text-slate-950 border border-slate-900 shrink-0">
                        {item.code}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-950 truncate">{item.title}</span>
                    </div>
                    <Badge variant="secondary" size="sm" className="shrink-0">
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 font-mono line-clamp-1">{item.description}</p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-600 font-bold mt-2 pt-2 border-t border-slate-900/10">
                    <span>Evidence: <strong className="text-teal-700 font-black">{item.evidence.length} verified</strong></span>
                    <span>Assignee: {item.assignee.name}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </KokonutCard>

          {/* Connected Deployments & Releases */}
          <KokonutCard variant="default" className="p-5" interactive={false}>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-900/20">
              <div>
                <h2 className="text-xs font-mono font-black text-slate-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Rocket className="w-3.5 h-3.5 text-purple-700 stroke-[2.5]" />
                  Recent Releases & Deployments
                </h2>
                <p className="text-[11px] text-slate-600 font-mono">Target server & verification</p>
              </div>
              <button
                onClick={() => onNavigateTab("deployments")}
                className="text-xs text-purple-700 hover:text-purple-900 font-mono font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Deployment Log</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            <div className="space-y-2">
              {projectDeployments.map((dep) => (
                <div key={dep.id} className="p-3 bg-white rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-slate-950 font-mono">{dep.version}</span>
                      <Badge variant="purple" size="sm">
                        {dep.environment}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-slate-600 font-mono">
                      {dep.server} • Commit {dep.commitSha}
                    </p>
                  </div>
                  <Badge variant="success" size="sm" className="shrink-0">
                    {dep.status}
                  </Badge>
                </div>
              ))}
            </div>
          </KokonutCard>
        </div>
      </div>
    </div>
  );
};
