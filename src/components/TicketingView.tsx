import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Ticket as TicketIcon,
  ShieldAlert,
  Clock,
  AlertCircle,
  CheckCircle2,
  Filter,
  Plus,
  ArrowRight,
  Send,
  X,
  Radio
} from "lucide-react";
import { Ticket, TicketStatus, Incident, Project, User } from "../types";
import { KokonutCard } from "./ui/KokonutCard";
import { Badge } from "./ui/Badge";
import { cn } from "../lib/utils";

interface TicketingViewProps {
  tickets: Ticket[];
  incidents: Incident[];
  project: Project;
  currentUser: User;
  onUpdateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  onCreateTicket: (newTicket: Partial<Ticket>) => void;
  isManagementView: boolean;
}

export const TicketingView: React.FC<TicketingViewProps> = ({
  tickets,
  incidents,
  project,
  currentUser,
  onUpdateTicketStatus,
  onCreateTicket,
  isManagementView
}) => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(tickets[0] || null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"tickets" | "incident-room">("tickets");

  // New ticket form states
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newType, setNewType] = useState<Ticket["type"]>("BUG");
  const [newSeverity, setNewSeverity] = useState<Ticket["severity"]>("Major");
  const [newPriority, setNewPriority] = useState<Ticket["priority"]>("P2");

  const workflowStages: TicketStatus[] = [
    "NEW",
    "TRIAGED",
    "ASSIGNED",
    "IN_PROGRESS",
    "IN_REVIEW",
    "READY_FOR_TEST",
    "TESTING",
    "READY_FOR_DEPLOY",
    "DEPLOYED",
    "RESOLVED",
    "CLOSED"
  ];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onCreateTicket({
      code: `TK-2026-${Math.floor(190 + Math.random() * 800)}`,
      title: newTitle,
      description: newDescription,
      type: newType,
      severity: newSeverity,
      priority: newPriority,
      status: "NEW",
      projectId: project.id,
      reporter: currentUser.name,
      slaStatus: "ON_TRACK",
      slaTargetResolution: "Within 8 hours",
      slaRemainingMinutes: 480,
      evidence: [],
      createdAt: "Just now"
    });

    setNewTitle("");
    setNewDescription("");
    setShowCreateModal(false);
  };

  const currentStageIndex = selectedTicket ? workflowStages.indexOf(selectedTicket.status) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Tab switcher */}
      <KokonutCard variant="default" className="p-5" interactive={false}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="cyan" size="sm">
                ITSM & Operations
              </Badge>
              <span className="text-xs text-slate-600 font-mono font-bold">Project: {project.name}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-mono font-black text-slate-950 tracking-tight">
              Ticketing, SLA Monitoring & Incident Command
            </h1>
            <p className="text-xs text-slate-600 font-mono mt-0.5">
              11-Stage Workflow • Severity & Priority decoupled • Automated SLA breach prevention
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Motion Pill SubTab Switcher */}
            <div className="flex items-center bg-white p-1 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#18181b]">
              <button
                onClick={() => setActiveSubTab("tickets")}
                className={cn(
                  "relative px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors outline-none cursor-pointer",
                  activeSubTab === "tickets" ? "text-blue-950" : "text-slate-600 hover:text-slate-950"
                )}
              >
                {activeSubTab === "tickets" && (
                  <motion.div
                    layoutId="ticketing-subtab-pill"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    className="absolute inset-0 bg-[#e0f2fe] border border-blue-600 rounded-lg shadow-sm"
                  />
                )}
                <span className="relative z-10">Tickets ({tickets.length})</span>
              </button>
              <button
                onClick={() => setActiveSubTab("incident-room")}
                className={cn(
                  "relative px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors outline-none cursor-pointer",
                  activeSubTab === "incident-room" ? "text-rose-950" : "text-slate-600 hover:text-slate-950"
                )}
              >
                {activeSubTab === "incident-room" && (
                  <motion.div
                    layoutId="ticketing-subtab-pill"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    className="absolute inset-0 bg-[#ffe4e6] border border-rose-600 rounded-lg shadow-sm"
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-700 stroke-[2.5]" />
                  <span>Incident Room ({incidents.length})</span>
                </span>
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#2ec4b6] hover:bg-[#25ad9f] text-slate-950 font-mono font-bold border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] flex items-center gap-1.5 transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Ticket</span>
            </motion.button>
          </div>
        </div>
      </KokonutCard>

      {activeSubTab === "tickets" ? (
        /* Tickets List & Detail Split */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Tickets Table */}
          <KokonutCard variant="default" className="lg:col-span-2 p-0 overflow-hidden" interactive={false}>
            <div className="p-4 border-b border-slate-900/20 flex items-center justify-between">
              <span className="text-xs font-mono font-black uppercase tracking-wider text-slate-950">
                Active Ticket Queue
              </span>
              <span className="text-xs font-mono text-slate-600 font-bold">
                SLA Compliance: <strong className="text-emerald-700">96.8%</strong>
              </span>
            </div>

            <div className="divide-y divide-slate-900/10">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={cn(
                    "p-3.5 sm:p-4 cursor-pointer transition-colors relative",
                    selectedTicket?.id === t.id
                      ? "bg-[#FAF7EE] border-l-4 border-l-[#2ec4b6]"
                      : "hover:bg-slate-50 bg-white"
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#e0f2fe] text-blue-950 border border-slate-900">
                        {t.code}
                      </span>
                      <Badge
                        size="sm"
                        variant={t.priority === "P1" ? "destructive" : t.priority === "P2" ? "warning" : "secondary"}
                      >
                        {t.priority} • {t.severity}
                      </Badge>
                    </div>

                    {/* SLA status badge */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        size="sm"
                        variant={t.slaStatus === "ON_TRACK" ? "success" : t.slaStatus === "AT_RISK" ? "warning" : "destructive"}
                      >
                        SLA: {t.slaStatus}
                      </Badge>
                      <Badge variant="secondary" size="sm">
                        {t.status}
                      </Badge>
                    </div>
                  </div>

                  <h3 className="text-xs font-mono font-bold text-slate-950 mb-1">{t.title}</h3>
                  <p className="text-xs text-slate-600 font-mono line-clamp-1">{t.description}</p>

                  <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-slate-600 mt-2 pt-2 border-t border-slate-900/10 font-mono font-bold">
                    <span className="truncate max-w-[150px]">Rep: {t.reporter}</span>
                    <span className="truncate max-w-[150px]">Asg: {t.assignee?.name || "Unassigned"}</span>
                    {t.linkedWorkItemId && (
                      <span className="text-teal-800 font-bold truncate">Linked: {t.linkedWorkItemId}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </KokonutCard>

          {/* Right 1 Col: Ticket Inspector & 11-Stage Workflow */}
          <KokonutCard variant="default" className="p-5 space-y-5" interactive={false}>
            {selectedTicket ? (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black font-mono px-2 py-0.5 rounded bg-[#e0f2fe] text-blue-950 border border-slate-900 shadow-[1.5px_1.5px_0px_#18181b]">
                      {selectedTicket.code}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-600">{selectedTicket.createdAt}</span>
                  </div>
                  <h2 className="text-sm font-mono font-bold text-slate-950">{selectedTicket.title}</h2>
                  <p className="text-xs text-slate-600 font-mono mt-1.5 leading-relaxed">{selectedTicket.description}</p>
                </div>

                {/* Visual Workflow Stepper Bar */}
                <div className="p-3.5 bg-white rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#18181b]">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-mono font-black text-slate-950 uppercase tracking-wider">
                      Workflow Pipeline (11-Stage)
                    </span>
                    <Badge variant="success" size="sm">
                      {selectedTicket.status}
                    </Badge>
                  </div>

                  {/* Micro Stage Steps Progress */}
                  <div className="grid grid-cols-11 gap-1 mb-3">
                    {workflowStages.map((stg, sIdx) => (
                      <div
                        key={stg}
                        title={stg}
                        className={cn(
                          "h-2 rounded-full border border-slate-900 transition-all",
                          sIdx <= currentStageIndex ? "bg-[#4ade80]" : "bg-[#FAF7EE]"
                        )}
                      />
                    ))}
                  </div>

                  {/* Stage Dropdown to trigger transition */}
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => onUpdateTicketStatus(selectedTicket.id, e.target.value as TicketStatus)}
                    aria-label="Advance Workflow Stage"
                    className="w-full bg-white text-xs font-mono font-bold text-slate-950 px-3 py-2 rounded-lg border-2 border-slate-900 cursor-pointer focus:outline-none shadow-[2px_2px_0px_#18181b]"
                  >
                    {workflowStages.map((stage) => (
                      <option key={stage} value={stage}>
                        Transition to: {stage}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SLA Details */}
                <div className="p-3.5 bg-white rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-bold">SLA Policy:</span>
                    <span className="text-slate-950 font-bold">{selectedTicket.priority} Target Resolution</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-bold">Target Time:</span>
                    <span className="text-slate-950 font-bold">{selectedTicket.slaTargetResolution}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-bold">Status:</span>
                    <span className="text-emerald-700 font-black">{selectedTicket.slaStatus}</span>
                  </div>
                </div>

                {/* Resolution summary if resolved */}
                {selectedTicket.resolution && (
                  <div className="p-3.5 bg-[#f0fdf4] border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] rounded-xl text-xs font-mono">
                    <span className="font-bold text-emerald-950 block mb-1">Official Resolution:</span>
                    <p className="text-slate-900 leading-relaxed">{selectedTicket.resolution}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-xs text-slate-500 py-12 font-mono">Select a ticket to inspect details.</div>
            )}
          </KokonutCard>
        </div>
      ) : (
        /* Incident Command Room View (PRD Section 15 & 63) */
        <div className="space-y-6">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6 relative overflow-hidden"
            >
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-black px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
                      {inc.code}
                    </span>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-rose-600 text-white shadow-xs">
                      SEVERITY: {inc.severity}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-mono font-black text-slate-900 tracking-tight leading-snug">
                    {inc.title}
                  </h2>
                  <p className="text-xs text-slate-600 font-mono">
                    Server: <span className="text-slate-900 font-semibold">{inc.server}</span> • Commander:{" "}
                    <strong className="text-slate-900">{inc.commander}</strong>
                  </p>
                </div>

                <div className="md:text-right shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>RESOLVED IN 45 MIN</span>
                  </span>
                  <div className="text-[11px] text-slate-500 font-mono mt-1.5">
                    Detected: <span className="text-slate-700 font-medium">{inc.detectedAt}</span> • Resolved: <span className="text-slate-700 font-medium">{inc.resolvedAt}</span>
                  </div>
                </div>
              </div>

              {/* Business Impact Box */}
              <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 text-xs text-rose-950 font-sans leading-relaxed flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-mono font-black text-rose-900 mr-2 uppercase text-[11px] tracking-wider">
                    Business Impact:
                  </strong>
                  <span className="text-slate-800 font-medium">{inc.impact}</span>
                </div>
              </div>

              {/* Immutable Timeline */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Immutable Incident Response Timeline</span>
                </h3>
                <div className="border-l-2 border-slate-200 pl-5 ml-2.5 space-y-3.5 py-1">
                  {inc.timeline.map((tl, idx) => (
                    <div key={idx} className="relative text-xs">
                      <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-xs ring-2 ring-blue-100" />
                      <div className="flex flex-wrap items-baseline gap-2 font-mono">
                        <span className="text-slate-900 font-bold">{tl.time}</span>
                        <span className="text-slate-800 font-sans font-medium">{tl.event}</span>
                        <span className="text-slate-600 text-[11px] font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                          {tl.actor}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Postmortem Section */}
              {inc.postmortem && (
                <div className="p-5 bg-amber-50/40 rounded-xl border border-amber-200/80 text-xs space-y-3">
                  <h4 className="text-xs font-mono font-black text-amber-950 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-amber-200/60">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    <span>Post Incident Review (PIR) & Root Cause</span>
                  </h4>
                  <div className="flex items-start gap-2">
                    <strong className="text-amber-900 font-mono font-bold shrink-0 text-xs bg-amber-100/70 px-1.5 py-0.5 rounded border border-amber-200/60">
                      Root Cause:
                    </strong>
                    <span className="text-slate-800 font-sans leading-relaxed pt-0.5">{inc.postmortem.rootCause}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <strong className="text-emerald-900 font-mono font-bold shrink-0 text-xs bg-emerald-100/70 px-1.5 py-0.5 rounded border border-emerald-200/60">
                      Mitigation:
                    </strong>
                    <span className="text-slate-800 font-sans leading-relaxed pt-0.5">{inc.postmortem.mitigation}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-amber-200/40 font-mono">
                    <span className="text-slate-600 text-xs">Corrective Work Item:</span>
                    <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold text-xs">
                      {inc.postmortem.correctiveActionWorkItemCode}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ticket Intake Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-mono font-bold text-slate-900">Create New Engineering / Support Ticket</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 mb-1 font-mono font-bold">Ticket Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. POS printer timeout during cashier checkout"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-mono font-bold">Type</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as any)}
                      className="w-full bg-white text-slate-900 px-2 py-2 rounded-xl border border-slate-200 focus:outline-none font-mono"
                    >
                      <option value="BUG">Bug</option>
                      <option value="INCIDENT">Incident</option>
                      <option value="FEATURE_REQUEST">Feature Request</option>
                      <option value="TECHNICAL_ISSUE">Technical Issue</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-mono font-bold">Severity</label>
                    <select
                      value={newSeverity}
                      onChange={(e) => setNewSeverity(e.target.value as any)}
                      className="w-full bg-white text-slate-900 px-2 py-2 rounded-xl border border-slate-200 focus:outline-none font-mono"
                    >
                      <option value="Critical">Critical</option>
                      <option value="Major">Major</option>
                      <option value="Minor">Minor</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-mono font-bold">Priority</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as any)}
                      className="w-full bg-white text-slate-900 px-2 py-2 rounded-xl border border-slate-200 focus:outline-none font-mono"
                    >
                      <option value="P1">P1 (Immediate)</option>
                      <option value="P2">P2 (High)</option>
                      <option value="P3">P3 (Normal)</option>
                      <option value="P4">P4 (Low)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-mono font-bold">Description & Steps to Reproduce</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Detail the exact issue, error logs, and environment..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-mono font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold shadow-xs transition-colors"
                  >
                    Create Ticket
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
