import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Radio,
  Plus,
  Send,
  FileText,
  Terminal,
  Activity,
  UserCheck,
  Server,
  ArrowRight,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Zap,
  BookOpen,
  X,
  MessageSquare,
  Flame
} from "lucide-react";
import { Incident, Project, User } from "../types";
import { KokonutCard } from "./ui/KokonutCard";
import { Badge } from "./ui/Badge";
import { cn } from "../lib/utils";

interface IncidentRoomViewProps {
  incidents: Incident[];
  project: Project;
  currentUser: User;
  onDeclareIncident: (incident: Partial<Incident>) => void;
  onUpdateIncidentStatus?: (incidentId: string, status: Incident["status"]) => void;
  onAddTimelineEvent?: (incidentId: string, event: { time: string; event: string; actor: string; type?: "alert" | "action" | "mitigation" | "resolution" }) => void;
  onNavigateTab?: (tab: string, entityId?: string) => void;
  isManagementView: boolean;
}

export const IncidentRoomView: React.FC<IncidentRoomViewProps> = ({
  incidents,
  project,
  currentUser,
  onDeclareIncident,
  onUpdateIncidentStatus,
  onAddTimelineEvent,
  onNavigateTab,
  isManagementView
}) => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(incidents[0]?.id || "");
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "RESOLVED">("ALL");
  const [showDeclareModal, setShowDeclareModal] = useState(false);

  // New incident form states
  const [newTitle, setNewTitle] = useState("");
  const [newSeverity, setNewSeverity] = useState<Incident["severity"]>("CRITICAL");
  const [newEnvironment, setNewEnvironment] = useState<Incident["environment"]>("Production");
  const [newServer, setNewServer] = useState("Production Kontabo VPS (194.163.158.42)");
  const [newImpact, setNewImpact] = useState("");
  const [newCommander, setNewCommander] = useState(currentUser.name);

  // Timeline update state
  const [timelineMessage, setTimelineMessage] = useState("");
  const [timelineType, setTimelineType] = useState<"action" | "mitigation" | "alert">("action");
  const [isCopiedPostmortem, setIsCopiedPostmortem] = useState(false);
  const [isSimulatingMitigation, setIsSimulatingMitigation] = useState(false);

  // Filtered incidents
  const filteredIncidents = incidents.filter((inc) => {
    if (filterSeverity !== "ALL" && inc.severity !== filterSeverity) return false;
    if (filterStatus === "ACTIVE" && inc.status === "RESOLVED") return false;
    if (filterStatus === "RESOLVED" && inc.status !== "RESOLVED") return false;
    return true;
  });

  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId) || filteredIncidents[0] || incidents[0];

  const activeCount = incidents.filter((i) => i.status !== "RESOLVED").length;
  const criticalCount = incidents.filter((i) => i.severity === "CRITICAL" && i.status !== "RESOLVED").length;

  const handleCreateIncidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newCode = `INC-${Math.floor(10000 + Math.random() * 90000).toString().slice(0, 5)}`;
    const nowStr = new Date().toISOString().slice(0, 16).replace("T", " ");

    const created: Partial<Incident> = {
      code: newCode,
      projectId: project.id,
      title: newTitle,
      severity: newSeverity,
      environment: newEnvironment,
      server: newServer,
      detectedAt: nowStr,
      status: "INVESTIGATING",
      commander: newCommander,
      impact: newImpact || "Layanan mengalami degradasi performa atau downtime.",
      timeline: [
        {
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          event: `Incident declared via War Room by ${currentUser.name}: ${newTitle}`,
          actor: currentUser.name,
          type: "alert"
        }
      ]
    };

    onDeclareIncident(created);
    setShowDeclareModal(false);
    setNewTitle("");
    setNewImpact("");
  };

  const handleSendTimelineUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!timelineMessage.trim() || !selectedIncident) return;

    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (onAddTimelineEvent) {
      onAddTimelineEvent(selectedIncident.id, {
        time: nowTime,
        event: timelineMessage.trim(),
        actor: currentUser.name,
        type: timelineType
      });
    }
    setTimelineMessage("");
  };

  const handleSimulateMitigation = () => {
    if (!selectedIncident) return;
    setIsSimulatingMitigation(true);
    setTimeout(() => {
      setIsSimulatingMitigation(false);
      if (onAddTimelineEvent) {
        onAddTimelineEvent(selectedIncident.id, {
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          event: `Automated mitigation script executed: Memory buffer flushed & restart sequence verified.`,
          actor: "SRE Automation Agent",
          type: "mitigation"
        });
      }
      if (onUpdateIncidentStatus) {
        onUpdateIncidentStatus(selectedIncident.id, "MITIGATED");
      }
    }, 1200);
  };

  const handleCopyPostmortem = () => {
    if (!selectedIncident) return;
    const postmortemText = `# Post-Mortem Report: ${selectedIncident.code} - ${selectedIncident.title}
Severity: ${selectedIncident.severity}
Environment: ${selectedIncident.environment} | Server: ${selectedIncident.server}
Incident Commander: ${selectedIncident.commander}
Detected: ${selectedIncident.detectedAt} | Resolved: ${selectedIncident.resolvedAt || "In Progress"}

## Business & Operational Impact
${selectedIncident.impact}

## Root Cause Analysis
${selectedIncident.postmortem?.rootCause || "Under root cause investigation."}

## Corrective Actions
Work Item: ${selectedIncident.postmortem?.correctiveActionWorkItemCode || "N/A"}
Mitigation: ${selectedIncident.postmortem?.mitigation || "N/A"}`;

    navigator.clipboard.writeText(postmortemText);
    setIsCopiedPostmortem(true);
    setTimeout(() => setIsCopiedPostmortem(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Incident Command Banner */}
      <KokonutCard variant="default" className="p-5" interactive={false}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant={criticalCount > 0 ? "destructive" : "success"} size="sm" dot>
                {criticalCount > 0 ? `${criticalCount} SEV-1 ACTIVE INCIDENT` : "WAR ROOM STANDBY"}
              </Badge>
              <span className="text-xs text-slate-600 font-mono font-bold">
                Project: [{project.key}] {project.name}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-mono font-black text-slate-950 tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-rose-600 stroke-[2.5]" />
              Incident Room &amp; War Room Command
            </h1>
            <p className="text-xs text-slate-600 font-mono mt-1 font-semibold max-w-3xl">
              Real-time site reliability engineering triage, live chronology logs, mitigation runbook triggers, and automated root cause post-mortems.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => setShowDeclareModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#ff70a6] hover:bg-[#ff5d99] text-white border-2 border-slate-900 font-mono font-bold text-xs shadow-[2px_2px_0px_#18181b] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Flame className="w-4 h-4 stroke-[2.5]" />
              Declare New Incident
            </button>
          </div>
        </div>

        {/* Telemetry Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t-2 border-slate-900/10">
          <div className="bg-[#FAF7EE] p-3 rounded-xl border border-slate-900/30">
            <span className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Active Incidents</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-mono font-black text-slate-950">{activeCount}</span>
              <span className="text-[10px] font-mono text-rose-600 font-bold">({criticalCount} Critical)</span>
            </div>
          </div>
          <div className="bg-[#FAF7EE] p-3 rounded-xl border border-slate-900/30">
            <span className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Mean Time To Resolve</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-mono font-black text-slate-950">45m</span>
              <span className="text-[10px] font-mono text-emerald-700 font-bold">-18% vs avg</span>
            </div>
          </div>
          <div className="bg-[#FAF7EE] p-3 rounded-xl border border-slate-900/30">
            <span className="text-[10px] font-mono text-slate-600 font-bold uppercase block">SLA Compliance</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-mono font-black text-slate-950">99.4%</span>
              <span className="text-[10px] font-mono text-emerald-700 font-bold">Target &gt;99%</span>
            </div>
          </div>
          <div className="bg-[#FAF7EE] p-3 rounded-xl border border-slate-900/30">
            <span className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Incident Commander</span>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-4 h-4 rounded-full bg-[#f6ae2d] border border-slate-900 text-[9px] font-mono font-black flex items-center justify-center text-slate-950">
                {currentUser.name[0]}
              </div>
              <span className="text-xs font-mono font-bold text-slate-950 truncate">{currentUser.name}</span>
            </div>
          </div>
        </div>
      </KokonutCard>

      {/* Main Split Layout: Incidents Stream vs Active War Room */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Incidents List (4 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <KokonutCard variant="default" className="p-4" interactive={false}>
            {/* Filter Bar */}
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-black text-slate-950 uppercase">
                  Incident Feed ({filteredIncidents.length})
                </span>
                <div className="flex items-center gap-1">
                  {(["ALL", "ACTIVE", "RESOLVED"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setFilterStatus(st)}
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-mono font-bold border cursor-pointer transition-all",
                        filterStatus === st
                          ? "bg-slate-950 text-white border-slate-900 shadow-[1px_1px_0px_#18181b]"
                          : "bg-white text-slate-700 border-slate-900/40 hover:bg-[#FAF7EE]"
                      )}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {["ALL", "CRITICAL", "MAJOR", "MINOR"].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setFilterSeverity(sev)}
                    className={cn(
                      "px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border cursor-pointer transition-all whitespace-nowrap",
                      filterSeverity === sev
                        ? "bg-[#2ec4b6] text-slate-950 border-slate-900 shadow-[1px_1px_0px_#18181b]"
                        : "bg-white text-slate-700 border-slate-900/30 hover:bg-[#FAF7EE]"
                    )}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* Incidents Cards Feed */}
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {filteredIncidents.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-900/20 rounded-xl bg-[#FAF7EE]">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-xs font-mono font-bold text-slate-950">No Incidents Found</p>
                  <p className="text-[10px] font-mono text-slate-600 mt-0.5">All production systems are operating normally.</p>
                </div>
              ) : (
                filteredIncidents.map((inc) => {
                  const isSelected = selectedIncident?.id === inc.id;
                  const isResolved = inc.status === "RESOLVED";

                  return (
                    <motion.div
                      key={inc.id}
                      whileHover={{ x: 2 }}
                      onClick={() => setSelectedIncidentId(inc.id)}
                      className={cn(
                        "p-3.5 rounded-xl border-2 transition-all cursor-pointer relative",
                        isSelected
                          ? "bg-[#FAF7EE] border-slate-900 shadow-[3px_3px_0px_#18181b]"
                          : "bg-white border-slate-900/50 hover:border-slate-900 shadow-[1.5px_1.5px_0px_#18181b]"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-black text-slate-950 bg-white px-1.5 py-0.5 rounded border border-slate-900 shadow-[1px_1px_0px_#18181b]">
                            {inc.code}
                          </span>
                          <Badge
                            variant={inc.severity === "CRITICAL" ? "destructive" : inc.severity === "MAJOR" ? "warning" : "secondary"}
                            size="sm"
                          >
                            {inc.severity}
                          </Badge>
                          {/* Story 13.2/13.3 — SLA badge: hijau MET, merah BREACHED, abu PENDING */}
                          {inc.sla && (
                            <span
                              title={`SLA tanggap ${inc.sla.response.status} · SLA penyelesaian ${inc.sla.resolution.status}`}
                              className={cn(
                                "text-[10px] font-mono font-black px-1.5 py-0.5 rounded border",
                                inc.sla.response.status === "BREACHED" || inc.sla.resolution.status === "BREACHED"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : inc.sla.response.status === "MET" && inc.sla.resolution.status !== "PENDING"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-slate-50 text-slate-500 border-slate-200"
                              )}
                            >
                              SLA {inc.sla.response.status}/{inc.sla.resolution.status}
                              {inc.sla.resolution.status === "PENDING" && inc.sla.response.overdueMinutes > 0 ? ` +${inc.sla.response.overdueMinutes}m` : ""}
                            </span>
                          )}
                        </div>
                        <Badge
                          variant={isResolved ? "success" : "cyan"}
                          size="sm"
                          dot={!isResolved}
                        >
                          {inc.status || (isResolved ? "RESOLVED" : "INVESTIGATING")}
                        </Badge>
                      </div>

                      <h4 className="text-xs font-mono font-black text-slate-950 leading-snug line-clamp-2">
                        {inc.title}
                      </h4>

                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-600 font-semibold mt-2 pt-2 border-t border-slate-900/10">
                        <span className="flex items-center gap-1 truncate max-w-[150px]">
                          <Server className="w-3 h-3 text-slate-500 shrink-0" />
                          {inc.server}
                        </span>
                        <span className="flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {inc.detectedAt.split(" ")[1] || inc.detectedAt}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </KokonutCard>
        </div>

        {/* Right Column: Active War Room & RCA Details (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedIncident ? (
            <>
              {/* War Room Header Card */}
              <KokonutCard variant="default" className="p-5" interactive={false}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b-2 border-slate-900/10">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs font-black text-slate-950 bg-[#f6ae2d] px-2 py-0.5 rounded-md border-2 border-slate-900 shadow-[1.5px_1.5px_0px_#18181b]">
                        WAR ROOM: {selectedIncident.code}
                      </span>
                      <Badge variant="secondary" size="sm">
                        {selectedIncident.environment}
                      </Badge>
                      {selectedIncident.relatedTicketCode && (
                        <button
                          onClick={() => onNavigateTab && onNavigateTab("tickets", selectedIncident.relatedTicketCode)}
                          className="text-[10px] font-mono font-bold bg-[#FAF7EE] text-blue-800 px-2 py-0.5 rounded border border-slate-900 flex items-center gap-1 hover:bg-blue-50 cursor-pointer shadow-[1px_1px_0px_#18181b]"
                        >
                          Ticket: {selectedIncident.relatedTicketCode}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                    <h2 className="text-base sm:text-lg font-mono font-black text-slate-950 mt-1">
                      {selectedIncident.title}
                    </h2>
                  </div>

                  {/* Status Dropdown / State Machine */}
                  <div className="shrink-0 flex items-center gap-2">
                    <select
                      value={selectedIncident.status || (selectedIncident.resolvedAt ? "RESOLVED" : "INVESTIGATING")}
                      onChange={(e) => {
                        if (onUpdateIncidentStatus) {
                          onUpdateIncidentStatus(selectedIncident.id, e.target.value as Incident["status"]);
                        }
                      }}
                      className="bg-[#FAF7EE] text-xs font-mono font-black text-slate-950 px-3 py-1.5 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] focus:outline-none cursor-pointer"
                  aria-label="Ubah status insiden"
                >
                      <option value="INVESTIGATING">INVESTIGATING</option>
                      <option value="IDENTIFIED">IDENTIFIED</option>
                      <option value="MONITORING">MONITORING</option>
                      <option value="MITIGATED">MITIGATED</option>
                      <option value="RESOLVED">RESOLVED</option>
                    </select>
                  </div>
                </div>

                {/* Impact & Scope Box */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
                  <div className="bg-[#FAF7EE] p-3 rounded-xl border border-slate-900/30">
                    <span className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Commander on Duty</span>
                    <span className="text-xs font-mono font-black text-slate-950 mt-0.5 block truncate">
                      {selectedIncident.commander}
                    </span>
                  </div>
                  <div className="bg-[#FAF7EE] p-3 rounded-xl border border-slate-900/30">
                    <span className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Host / Server Node</span>
                    <span className="text-xs font-mono font-black text-slate-950 mt-0.5 block truncate">
                      {selectedIncident.server}
                    </span>
                  </div>
                  <div className="bg-[#FAF7EE] p-3 rounded-xl border border-slate-900/30">
                    <span className="text-[10px] font-mono text-slate-600 font-bold uppercase block">Detection Timestamp</span>
                    <span className="text-xs font-mono font-black text-slate-950 mt-0.5 block">
                      {selectedIncident.detectedAt}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border-2 border-amber-400 text-xs font-mono text-slate-900 font-semibold mb-2">
                  <strong className="text-amber-950">Blast Radius &amp; Business Impact: </strong>
                  {selectedIncident.impact}
                </div>

                {/* Quick Mitigation Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t-2 border-slate-900/10">
                  <button
                    onClick={handleSimulateMitigation}
                    disabled={isSimulatingMitigation}
                    className="px-3 py-1.5 rounded-xl bg-[#2ec4b6] hover:bg-[#28ad9f] text-slate-950 border-2 border-slate-900 font-mono font-bold text-xs shadow-[2px_2px_0px_#18181b] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Zap className={cn("w-3.5 h-3.5", isSimulatingMitigation && "animate-spin")} />
                    {isSimulatingMitigation ? "Executing Mitigation..." : "Trigger Auto-Mitigation"}
                  </button>

                  {selectedIncident.runbookUrl && (
                    <button
                      onClick={() => onNavigateTab && onNavigateTab("knowledge")}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-950 border-2 border-slate-900 font-mono font-bold text-xs shadow-[2px_2px_0px_#18181b] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                      View Runbook: {selectedIncident.runbookUrl.split(":")[0]}
                    </button>
                  )}

                  <button
                    onClick={handleCopyPostmortem}
                    className="px-3 py-1.5 rounded-xl bg-[#FAF7EE] hover:bg-slate-200 text-slate-950 border-2 border-slate-900 font-mono font-bold text-xs shadow-[2px_2px_0px_#18181b] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {isCopiedPostmortem ? "Postmortem Copied!" : "Export Post-Mortem"}
                  </button>
                </div>
              </KokonutCard>

              {/* Timeline & War Room Feed */}
              <KokonutCard variant="default" className="p-5" interactive={false}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-mono font-black text-slate-950 uppercase flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                    Live Incident Chronology &amp; Triage Stream
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">
                    {selectedIncident.timeline?.length || 0} events recorded
                  </span>
                </div>

                <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-900/20 py-2">
                  {selectedIncident.timeline?.map((item, idx) => (
                    <div key={idx} className="relative flex items-start gap-3 pl-8">
                      <div
                        className={cn(
                          "absolute left-2 top-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 shadow-[1px_1px_0px_#18181b]",
                          item.type === "alert"
                            ? "bg-rose-500"
                            : item.type === "mitigation"
                            ? "bg-emerald-400"
                            : item.type === "resolution"
                            ? "bg-blue-400"
                            : "bg-[#f6ae2d]"
                        )}
                      />
                      <div className="flex-1 bg-[#FAF7EE] p-3 rounded-xl border border-slate-900/30">
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-600 mb-1">
                          <span className="text-slate-950 font-black">{item.actor}</span>
                          <span>{item.time}</span>
                        </div>
                        <p className="text-xs font-mono font-bold text-slate-900 leading-relaxed">
                          {item.event}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Timeline Update Input */}
                <form onSubmit={handleSendTimelineUpdate} className="mt-4 pt-3 border-t-2 border-slate-900/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-600">Event Type:</span>
                    {(["action", "mitigation", "alert"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTimelineType(t)}
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-mono font-bold border cursor-pointer",
                          timelineType === t
                            ? "bg-slate-950 text-white border-slate-900"
                            : "bg-white text-slate-700 border-slate-900/30"
                        )}
                      >
                        {t.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Post live war room update or mitigation action..."
                      value={timelineMessage}
                      onChange={(e) => setTimelineMessage(e.target.value)}
                      className="flex-1 bg-[#FAF7EE] text-xs font-mono font-bold text-slate-950 px-3 py-2 rounded-xl border-2 border-slate-900 focus:outline-none shadow-[2px_2px_0px_#18181b]"
                aria-label="Post live war room update or mitigation action"
              />
                    <button
                      type="submit"
                      disabled={!timelineMessage.trim()}
                      className="px-4 py-2 bg-[#f6ae2d] hover:bg-[#e59d1c] text-slate-950 rounded-xl border-2 border-slate-900 font-mono font-black text-xs shadow-[2px_2px_0px_#18181b] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Post
                    </button>
                  </div>
                </form>
              </KokonutCard>

              {/* Postmortem & Root Cause Card */}
              {selectedIncident.postmortem && (
                <KokonutCard variant="default" className="p-5" interactive={false}>
                  <div className="flex items-center justify-between mb-3 border-b-2 border-slate-900/10 pb-2">
                    <h3 className="text-xs font-mono font-black text-slate-950 uppercase flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      AI Synthesized Root Cause &amp; Post-Mortem Analysis
                    </h3>
                    <Badge variant="purple" size="sm">
                      VERIFIED POSTMORTEM
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-[#FAF7EE] p-3.5 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#18181b]">
                      <span className="text-[10px] font-mono text-purple-900 font-bold uppercase block mb-1">
                        Root Cause Breakdown
                      </span>
                      <p className="text-xs font-mono font-bold text-slate-950 leading-relaxed">
                        {selectedIncident.postmortem.rootCause}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-[#FAF7EE] p-3 rounded-xl border border-slate-900/30">
                        <span className="text-[10px] font-mono text-slate-600 font-bold uppercase block">
                          Preventative Mitigation
                        </span>
                        <p className="text-xs font-mono font-bold text-slate-950 mt-1">
                          {selectedIncident.postmortem.mitigation}
                        </p>
                      </div>

                      <div className="bg-[#FAF7EE] p-3 rounded-xl border border-slate-900/30">
                        <span className="text-[10px] font-mono text-slate-600 font-bold uppercase block">
                          Corrective Action Ticket
                        </span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-mono font-black text-slate-950">
                            {selectedIncident.postmortem.correctiveActionWorkItemCode}
                          </span>
                          <button
                            onClick={() =>
                              onNavigateTab &&
                              onNavigateTab("workitems", selectedIncident.postmortem?.correctiveActionWorkItemCode)
                            }
                            className="text-[10px] font-mono font-bold text-indigo-700 hover:underline flex items-center gap-1"
                          >
                            Open Task
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </KokonutCard>
              )}
            </>
          ) : (
            <KokonutCard variant="default" className="p-8 text-center" interactive={false}>
              <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-mono font-black text-slate-950">Select an Incident</h3>
              <p className="text-xs font-mono text-slate-600 mt-1">
                Choose an active or historical incident from the left stream to inspect live chronology, blast radius, and war room telemetry.
              </p>
            </KokonutCard>
          )}
        </div>
      </div>

      {/* Declare Incident Modal */}
      <AnimatePresence>
        {showDeclareModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border-2 border-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-[4px_4px_0px_#18181b] relative"
            >
              <div className="flex items-center justify-between mb-4 border-b-2 border-slate-900/10 pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-rose-600" />
                  <h3 className="text-base font-mono font-black text-slate-950">Declare New Incident</h3>
                </div>
                <button
                  onClick={() => setShowDeclareModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateIncidentSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-950 mb-1">
                    Incident Title / Summary *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. POS printer socket connection deadlock"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-[#FAF7EE] text-xs font-mono font-bold text-slate-950 px-3 py-2 rounded-xl border-2 border-slate-900 focus:outline-none shadow-[2px_2px_0px_#18181b]"
                aria-label="e.g. POS printer socket connection deadlock"
              />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-950 mb-1">
                      Severity Level
                    </label>
                    <select
                      value={newSeverity}
                      onChange={(e) => setNewSeverity(e.target.value as Incident["severity"])}
                      className="w-full bg-[#FAF7EE] text-xs font-mono font-bold text-slate-950 px-3 py-2 rounded-xl border-2 border-slate-900 focus:outline-none shadow-[2px_2px_0px_#18181b]"
                  aria-label="Severity insiden baru"
                >
                      <option value="CRITICAL">CRITICAL (SEV-1)</option>
                      <option value="MAJOR">MAJOR (SEV-2)</option>
                      <option value="MINOR">MINOR (SEV-3)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-950 mb-1">
                      Environment
                    </label>
                    <select
                      value={newEnvironment}
                      onChange={(e) => setNewEnvironment(e.target.value as Incident["environment"])}
                      className="w-full bg-[#FAF7EE] text-xs font-mono font-bold text-slate-950 px-3 py-2 rounded-xl border-2 border-slate-900 focus:outline-none shadow-[2px_2px_0px_#18181b]"
                  aria-label="Environment insiden baru"
                >
                      <option value="Production">Production</option>
                      <option value="Staging">Staging</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-950 mb-1">
                    Affected Server / Node
                  </label>
                  <input
                    type="text"
                    value={newServer}
                    onChange={(e) => setNewServer(e.target.value)}
                    className="w-full bg-[#FAF7EE] text-xs font-mono font-bold text-slate-950 px-3 py-2 rounded-xl border-2 border-slate-900 focus:outline-none shadow-[2px_2px_0px_#18181b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-950 mb-1">
                    Initial Blast Radius / Impact Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe user-facing symptoms and system impact..."
                    value={newImpact}
                    onChange={(e) => setNewImpact(e.target.value)}
                    className="w-full bg-[#FAF7EE] text-xs font-mono font-semibold text-slate-950 px-3 py-2 rounded-xl border-2 border-slate-900 focus:outline-none shadow-[2px_2px_0px_#18181b]"
                aria-label="Describe user-facing symptoms and system impact"
              />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t-2 border-slate-900/10">
                  <button
                    type="button"
                    onClick={() => setShowDeclareModal(false)}
                    className="px-4 py-2 rounded-xl bg-white border-2 border-slate-900 text-xs font-mono font-bold text-slate-950 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#ff70a6] hover:bg-[#ff5d99] text-white border-2 border-slate-900 text-xs font-mono font-black shadow-[2px_2px_0px_#18181b] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                  >
                    Initialize War Room
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
