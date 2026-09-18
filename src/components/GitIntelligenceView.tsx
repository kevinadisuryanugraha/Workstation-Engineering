import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  CheckCircle2,
  Clock,
  ExternalLink,
  Code2,
  Tag,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { Commit, PullRequest, Project } from "../types";
import { KokonutCard } from "./ui/KokonutCard";
import { Badge } from "./ui/Badge";
import { cn } from "../lib/utils";

interface GitIntelligenceViewProps {
  commits: Commit[];
  pullRequests: PullRequest[];
  project: Project;
  isManagementView: boolean;
}

export const GitIntelligenceView: React.FC<GitIntelligenceViewProps> = ({
  commits,
  pullRequests,
  project,
  isManagementView
}) => {
  const [activeTab, setActiveTab] = useState<"commits" | "prs" | "branches">("commits");

  const branches = [
    { name: "main", isProtected: true, author: "Rina Wijaya", lastCommit: "a81f32d", ahead: 0, behind: 0, env: "Production (Kontabo)" },
    { name: "develop", isProtected: true, author: "Kevin Santoso", lastCommit: "8f31a92", ahead: 2, behind: 0, env: "Staging / Dev (Office)" },
    { name: "feature/enrollment", isProtected: false, author: "Kevin Santoso", lastCommit: "8f31a92", ahead: 4, behind: 1, linked: "ENR-024" },
    { name: "fix/TK-182-receipt", isProtected: false, author: "Kevin Santoso", lastCommit: "a81f32d", ahead: 0, behind: 0, linked: "BUG-091" }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <KokonutCard variant="default" className="p-5" interactive={false}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="success" size="sm" dot>
                Git Intelligence & Evidence Trace
              </Badge>
              <span className="text-xs text-slate-600 font-mono font-bold">Repo: {project.repoName}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-mono font-black text-slate-950 tracking-tight">
              Cryptographic Code Evidence & Pull Request Governance
            </h1>
            <p className="text-xs text-slate-600 font-mono mt-0.5">
              Commits represent engineering evidence, not individual working hours. Synced via Webhook Ingestion.
            </p>
          </div>

          <div className="flex items-center flex-nowrap shrink-0 overflow-x-auto bg-white p-1 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#18181b]">
            {(["commits", "prs", "branches"] as const).map((tabKey) => {
              const label =
                tabKey === "commits"
                  ? `Commits (${commits.length})`
                  : tabKey === "prs"
                  ? `PRs (${pullRequests.length})`
                  : `Branches (${branches.length})`;
              const isActive = activeTab === tabKey;
              return (
                <button
                  key={tabKey}
                  onClick={() => setActiveTab(tabKey)}
                  className={cn(
                    "relative px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors outline-none cursor-pointer whitespace-nowrap",
                    isActive ? "text-slate-950" : "text-slate-600 hover:text-slate-950"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="git-subtab-pill"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      className="absolute inset-0 bg-[#dcfce7] border border-emerald-600 rounded-lg shadow-sm"
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </KokonutCard>

      {activeTab === "commits" && (
        <KokonutCard variant="default" className="p-0 overflow-hidden" interactive={false}>
          <div className="p-4 border-b border-slate-900/20 flex items-center justify-between">
            <span className="text-xs font-mono font-black text-slate-950 uppercase tracking-wider">
              Verified Inbound Commits
            </span>
            <Badge variant="success" size="sm">
              Webhook: 100% Signature Verified
            </Badge>
          </div>

          <div className="divide-y divide-slate-900/10">
            {commits.map((c) => (
              <motion.div
                key={c.sha}
                whileHover={{ x: 2 }}
                className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#FAF7EE] text-slate-950 font-mono text-xs font-bold shrink-0 border-2 border-slate-900 shadow-[1.5px_1.5px_0px_#18181b]">
                    {c.sha}
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold text-slate-950 leading-snug">{c.message}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 mt-1 font-mono font-semibold">
                      <span>Author: <strong className="text-slate-950">{c.author}</strong></span>
                      <span>•</span>
                      <span>Branch: <span className="text-teal-800 font-bold">{c.branch}</span></span>
                      <span>•</span>
                      <span>{c.timestamp}</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-bold">+{c.additions}</span>
                      <span className="text-rose-700 font-bold">-{c.deletions}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {c.linkedItemCodes.map((code) => (
                    <Badge key={code} variant="secondary" size="sm">
                      {code}
                    </Badge>
                  ))}
                  <Badge variant="success" size="sm">
                    Verified Evidence
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </KokonutCard>
      )}

      {activeTab === "prs" && (
        <KokonutCard variant="default" className="p-0 overflow-hidden" interactive={false}>
          <div className="p-4 border-b border-slate-900/20 flex items-center justify-between">
            <span className="text-xs font-mono font-black text-slate-950 uppercase tracking-wider">
              Pull Request Governance & Review Signoffs
            </span>
            <span className="text-xs text-slate-600 font-mono font-bold">Peer-review enforcement active</span>
          </div>
          <div className="divide-y divide-slate-900/10">
            {pullRequests.map((pr) => (
              <motion.div
                key={pr.id}
                whileHover={{ x: 2 }}
                className="p-4 hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-[#f3e8ff] text-purple-950 border border-slate-900">
                      PR #{pr.id}
                    </span>
                    <h3 className="text-xs font-mono font-bold text-slate-950">{pr.title}</h3>
                    <Badge variant={pr.status === "MERGED" ? "purple" : "success"} size="sm">
                      {pr.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-600 font-mono font-semibold">
                    <span>{pr.sourceBranch} ──► {pr.targetBranch}</span>
                    <span>•</span>
                    <span>Author: {pr.author}</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-bold">CI Tests: {pr.ciStatus}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right text-[11px] text-slate-600 font-mono font-semibold">
                    <span className="block font-bold text-slate-950">Reviews:</span>
                    {pr.reviewers.map((r) => (
                      <span key={r.name} className="mr-2 text-[10px] text-emerald-700 font-bold">
                        ✓ {r.name}
                      </span>
                    ))}
                  </div>
                  <Badge variant="secondary" size="sm">
                    {pr.linkedItemCode}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </KokonutCard>
      )}

      {activeTab === "branches" && (
        <KokonutCard variant="default" className="p-0 overflow-hidden" interactive={false}>
          <div className="p-4 border-b border-slate-900/20">
            <span className="text-xs font-mono font-black text-slate-950 uppercase tracking-wider">
              Tracked Repository Branches & Environment Mappings
            </span>
          </div>
          <div className="divide-y divide-slate-900/10">
            {branches.map((b) => (
              <div key={b.name} className="p-4 hover:bg-slate-50 flex items-center justify-between bg-white">
                <div>
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-3.5 h-3.5 text-teal-800 stroke-[2.5]" />
                    <span className="text-xs font-bold font-mono text-slate-950">{b.name}</span>
                    {b.isProtected && (
                      <Badge variant="warning" size="sm">
                        Protected
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 font-mono mt-0.5 font-semibold">
                    Last commit {b.lastCommit} by {b.author}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono text-slate-950 font-bold">{b.env || "Feature branch"}</span>
                  <div className="text-[10px] text-slate-600 font-mono font-semibold">
                    Ahead: {b.ahead} • Behind: {b.behind}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </KokonutCard>
      )}
    </div>
  );
};
