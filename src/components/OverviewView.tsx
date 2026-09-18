import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Rocket,
  ShieldAlert,
  ArrowRight,
  Activity,
  Layers,
  Sparkles,
  Server,
  Terminal,
  FileCheck2,
  TrendingUp,
  Cpu,
  HardDrive
} from "lucide-react";
import { Project, EngineeringEvent, ServerTelemetry } from "../types";
import { AnimatedCounter } from "./ui/AnimatedCounter";
import { KokonutCard } from "./ui/KokonutCard";
import { Badge } from "./ui/Badge";
import { LiveSparkline } from "./ui/LiveSparkline";

interface OverviewViewProps {
  projects: Project[];
  events: EngineeringEvent[];
  servers: ServerTelemetry[];
  isManagementView: boolean;
  onSelectProject: (p: Project) => void;
  onNavigateTab: (tab: any) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  projects,
  events,
  servers,
  isManagementView,
  onSelectProject,
  onNavigateTab
}) => {
  return (
    <div className="space-y-6 pb-12">
      {/* North Star & Context Banner */}
      <KokonutCard
        variant="default"
        className="p-5 sm:p-6"
        interactive={false}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <Badge variant="success" size="sm" dot pulse>
                Single Source of Truth
              </Badge>
              <span className="text-xs font-mono font-bold text-slate-600">17 September 2026</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-950">
              {isManagementView
                ? "Executive Delivery & Engineering Operations"
                : "WORKSTATION: Engineering Intelligence Platform"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-700 font-mono max-w-3xl leading-relaxed">
              {isManagementView
                ? "Progress dihitung secara transparan dari bukti nyata (commit, pull request, automated testing, dan deployment release) — bukan sekadar estimasi persentase manual."
                : "Continuous telemetry correlation between Git commits, CI assertions, Kontabo/Office Linux server daemons, and AI codebase audits."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigateTab("blueprint")}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-xs font-mono font-bold text-slate-950 border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] flex items-center gap-1.5 transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
            >
              <span>Architecture Specs</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigateTab("reports")}
              className="px-4 py-2 rounded-xl bg-[#2ec4b6] hover:bg-[#25ad9f] text-xs font-mono font-bold text-slate-950 border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] flex items-center gap-1.5 transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
              <span>Today's Report</span>
            </motion.button>
          </div>
        </div>
      </KokonutCard>

      {/* Top 4 KPI Metrics Block with AnimatedCounter & Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1 */}
        <KokonutCard variant="default" glowColor="emerald" className="p-4">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-600">
              Active Projects
            </span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-white font-mono">
                <AnimatedCounter value={projects.length} />
              </span>
              <Badge variant="success" size="sm">
                Monitored
              </Badge>
            </div>
            <LiveSparkline data={[2, 2, 3, 3, 3]} color="emerald" width={60} height={20} />
          </div>
          <p className="text-[11px] text-slate-600 mt-2 font-mono">LMS • POS Retail • ERP Ledger</p>
        </KokonutCard>

        {/* Metric 2 */}
        <KokonutCard variant="default" glowColor="amber" className="p-4">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-600">
              Open Tickets
            </span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-white font-mono">
                <AnimatedCounter value={32} />
              </span>
              <Badge variant="warning" size="sm">
                12 in LMS
              </Badge>
            </div>
            <LiveSparkline data={[45, 38, 40, 35, 32]} color="amber" width={60} height={20} />
          </div>
          <p className="text-[11px] text-slate-600 mt-2 font-mono">94.2% within SLA target</p>
        </KokonutCard>

        {/* Metric 3 */}
        <KokonutCard variant="default" glowColor="blue" className="p-4">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-600">
              Deployments
            </span>
            <Rocket className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-white font-mono">
                <AnimatedCounter value={21} />
              </span>
              <Badge variant="cyan" size="sm">
                100% OK
              </Badge>
            </div>
            <LiveSparkline data={[12, 15, 17, 19, 21]} color="blue" width={60} height={20} />
          </div>
          <p className="text-[11px] text-slate-600 mt-2 font-mono">Latest: v1.4.2 on Kontabo</p>
        </KokonutCard>

        {/* Metric 4 */}
        <KokonutCard variant="default" glowColor="rose" className="p-4">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-600">
              Critical Incidents
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-white font-mono">
                <AnimatedCounter value={1} />
              </span>
              <Badge variant="success" size="sm">
                RESOLVED
              </Badge>
            </div>
            <LiveSparkline data={[3, 2, 2, 1, 1]} color="rose" width={60} height={20} />
          </div>
          <p className="text-[11px] text-slate-600 mt-2 font-mono">INC-00042 PIR complete</p>
        </KokonutCard>
      </div>

      {/* Main Grid: Project Delivery Portfolio + Infrastructure Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Project Delivery Health */}
        <KokonutCard variant="default" className="lg:col-span-2 p-5" interactive={false}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                Project Delivery & Evidence Progress
              </h2>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Calculated mathematically from deliverables, verified test passes, and deployments
              </p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 self-start sm:self-auto">
              Formula: 40% Tasks + 30% AC + 20% Milestones + 10% Deploy
            </span>
          </div>

          <div className="space-y-3.5">
            {projects.map((proj) => (
              <motion.div
                key={proj.id}
                whileHover={{ x: 3, transition: { duration: 0.2 } }}
                onClick={() => {
                  onSelectProject(proj);
                  onNavigateTab("project360");
                }}
                className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700/80 cursor-pointer transition-all shadow-sm group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700">
                      {proj.key}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                        {proj.name}
                      </h3>
                      <p className="text-[11px] text-slate-600 font-mono">{proj.currentSprint}</p>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-base font-bold font-mono text-emerald-400">
                        <AnimatedCounter value={proj.progress} suffix="%" />
                      </span>
                      <Badge variant="secondary" size="sm">
                        Health: {proj.health}/100
                      </Badge>
                    </div>
                    <span className="text-[10px] text-slate-600 font-mono">{proj.latestRelease}</span>
                  </div>
                </div>

                {/* Animated Progress bar */}
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden mb-2.5 border border-slate-800/60">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${proj.progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      proj.progress > 75 ? "bg-emerald-500" : proj.progress > 50 ? "bg-amber-500" : "bg-rose-500"
                    }`}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 font-mono">
                  <span>Open: {proj.openTickets}</span>
                  <span>Blockers: {proj.blockersCount}</span>
                  <span className="text-emerald-400">● {proj.productionStatus}</span>
                  <span className="text-emerald-400 flex items-center gap-1 group-hover:underline">
                    Project 360° <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </KokonutCard>

        {/* Right 1 Col: Server Infrastructure Telemetry */}
        <KokonutCard variant="default" className="p-5 flex flex-col justify-between" interactive={false}>
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <div>
                <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-blue-400" />
                  Telemetry Nodes
                </h2>
                <p className="text-[11px] text-slate-600">Workstation Linux Agents</p>
              </div>
              <button
                onClick={() => onNavigateTab("infrastructure")}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
              >
                Inspect →
              </button>
            </div>

            <div className="space-y-3">
              {servers.map((srv) => (
                <div key={srv.id} className="p-3.5 rounded-xl bg-white border-2 border-slate-900 shadow-[1.5px_1.5px_0px_#18181b]">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-950">{srv.name}</span>
                        <Badge variant="success" size="sm">
                          {srv.environment}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-slate-600 font-mono mt-0.5 font-semibold">
                        {srv.ip} • {srv.provider}
                      </p>
                    </div>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600 border border-slate-900" />
                    </span>
                  </div>

                  {/* Resource meters */}
                  <div className="space-y-2 mt-3 text-xs">
                    <div>
                      <div className="flex justify-between text-[10px] font-mono text-slate-600 font-bold mb-1">
                        <span className="flex items-center gap-1">
                          <Cpu className="w-3 h-3 text-emerald-800 stroke-[2.5]" /> CPU Load
                        </span>
                        <span className="text-slate-950">{srv.cpuUsage}%</span>
                      </div>
                      <div className="w-full bg-[#FAF7EE] rounded-full h-2 border border-slate-900 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${srv.cpuUsage}%` }}
                          transition={{ duration: 0.8 }}
                          className="bg-[#2ec4b6] h-full"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-mono text-slate-600 font-bold mb-1">
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3 text-blue-800 stroke-[2.5]" /> RAM Memory
                        </span>
                        <span className="text-slate-950">{srv.ramUsage}%</span>
                      </div>
                      <div className="w-full bg-[#FAF7EE] rounded-full h-2 border border-slate-900 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${srv.ramUsage}%` }}
                          transition={{ duration: 0.8 }}
                          className="bg-[#818cf8] h-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-900/10 flex items-center justify-between text-[10px] text-slate-600 font-mono font-semibold">
                    <span>Services: {srv.services.length} active</span>
                    <span>Uptime: {srv.uptime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="mt-4 p-3.5 rounded-xl bg-[#e0e7ff] border-2 border-slate-900 shadow-[2px_2px_0px_#18181b]">
            <div className="flex items-center gap-2 text-indigo-950 font-mono font-black text-xs mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-700 stroke-[2.5]" />
              <span>AI Codebase Intelligence</span>
            </div>
            <p className="text-[11px] text-slate-900 leading-relaxed font-mono">
              8 findings detected (1 High HMAC nonce, 1 Medium N+1 query in enrollment listing). 12 recommendations ready.
            </p>
            <button
              onClick={() => onNavigateTab("ai")}
              className="mt-2 text-xs text-indigo-950 hover:underline font-mono font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Review Findings & Debts</span>
              <ArrowRight className="w-3 h-3 stroke-[2.5]" />
            </button>
          </div>
        </KokonutCard>
      </div>

      {/* Section: Chronological Domain Events Feed */}
      <KokonutCard variant="default" className="p-5" interactive={false}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-900/20">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-mono font-black text-slate-950 uppercase tracking-wider">
                What Happened Today?
              </h2>
              <Badge variant="secondary" size="sm">
                17 Sep 2026
              </Badge>
            </div>
            <p className="text-[11px] text-slate-600 font-mono mt-0.5 font-semibold">
              {isManagementView
                ? "Daftar pencapaian dan perbaikan sistem disajikan secara ringkas dan berorientasi hasil operasional."
                : "Real-time domain event stream correlated from Git webhooks, Server daemons, and CI gates."}
            </p>
          </div>

          <span className="text-xs text-slate-600 font-mono font-bold">
            Perspective:{" "}
            <strong className="text-emerald-800">
              {isManagementView ? "Management Summary" : "Engineering Detail"}
            </strong>
          </span>
        </div>

        <div className="divide-y divide-slate-900/10">
          {events.map((evt, idx) => (
            <motion.div
              key={evt.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 group hover:bg-[#FAF7EE] px-2 rounded-lg transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="text-[11px] font-mono font-bold px-2 py-1 rounded bg-[#FAF7EE] text-slate-950 border-2 border-slate-900 shadow-[1px_1px_0px_#18181b] shrink-0">
                  {evt.timestamp}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-mono font-bold text-slate-950 group-hover:text-indigo-900 transition-colors">
                      {evt.title}
                    </h3>
                    <Badge variant="secondary" size="sm">
                      {evt.evidenceRef}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-800 mt-1 leading-relaxed font-sans">
                    {isManagementView ? evt.descriptionManagement : evt.descriptionTechnical}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 text-xs text-slate-600 font-mono font-bold">
                <span className="text-slate-600 text-[11px]">Actor: {evt.actor}</span>
                <button
                  onClick={() => onNavigateTab("audit")}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-950 text-[11px] font-mono font-bold border-2 border-slate-900 shadow-[1.5px_1.5px_0px_#18181b] transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
                >
                  Evidence
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </KokonutCard>
    </div>
  );
};
