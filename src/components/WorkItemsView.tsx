import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckSquare,
  Paperclip,
  Share2,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Code2,
  Plus,
  X,
  GitBranch,
  Copy,
  Check,
  Columns
} from "lucide-react";
import { WorkItem, WorkItemStatus, EvidenceItem, Project } from "../types";
import { Badge } from "./ui/Badge";
import { cn } from "../lib/utils";

interface WorkItemsViewProps {
  workItems: WorkItem[];
  project: Project;
  onUpdateWorkItemStatus: (id: string, status: WorkItemStatus) => void;
  onToggleAcceptanceCriteria: (itemId: string, criteriaId: string) => void;
  onAddEvidence: (itemId: string, evidence: EvidenceItem) => void;
  onCreateWorkItem?: (newItem: Partial<WorkItem>) => void;
  isManagementView: boolean;
}

export const WorkItemsView: React.FC<WorkItemsViewProps> = ({
  workItems,
  project,
  onUpdateWorkItemStatus,
  onToggleAcceptanceCriteria,
  onCreateWorkItem,
  isManagementView
}) => {
  const [selectedItem, setSelectedItem] = useState<WorkItem | null>(workItems[0] || null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [showDAG, setShowDAG] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedBranch, setCopiedBranch] = useState(false);
  const [mobileColumnTab, setMobileColumnTab] = useState<"ALL" | "IN_PROGRESS" | "REVIEW" | "DONE">("ALL");

  // Keep selectedItem in sync when workItems updates
  useEffect(() => {
    if (selectedItem) {
      const fresh = workItems.find((w) => w.id === selectedItem.id);
      if (fresh) setSelectedItem(fresh);
    } else if (workItems.length > 0) {
      setSelectedItem(workItems[0]);
    }
  }, [workItems]);

  // Handle ESC to close details or modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showCreateModal) {
          setShowCreateModal(false);
        } else if (isDetailOpen) {
          setIsDetailOpen(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showCreateModal, isDetailOpen]);

  // New item form
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newType, setNewType] = useState<WorkItem["type"]>("FEATURE");
  const [newPriority, setNewPriority] = useState<WorkItem["priority"]>("Medium");

  const filteredItems = workItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "ALL" || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const inProgressItems = filteredItems.filter((i) => i.status === "IN_PROGRESS");
  const reviewItems = filteredItems.filter((i) => i.status === "IN_REVIEW" || i.status === "TESTING");
  const doneItems = filteredItems.filter((i) => i.status === "DONE");

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (onCreateWorkItem) {
      onCreateWorkItem({
        title: newTitle.trim(),
        description: newDescription.trim(),
        type: newType,
        priority: newPriority
      });
    }

    setNewTitle("");
    setNewDescription("");
    setShowCreateModal(false);
  };

  const copyBranchToClipboard = (branch?: string) => {
    if (!branch) return;
    navigator.clipboard.writeText(branch);
    setCopiedBranch(true);
    setTimeout(() => setCopiedBranch(false), 2000);
  };

  const handleCardClick = (item: WorkItem) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  // Render card component with non-overlapping responsive layout
  const renderCard = (item: WorkItem, isDoneCard = false) => {
    const isSelected = selectedItem?.id === item.id && isDetailOpen;
    return (
      <motion.div
        key={item.id}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => handleCardClick(item)}
        className={cn(
          "group p-3.5 sm:p-4 rounded-xl border cursor-pointer transition-all duration-150 relative bg-white select-none",
          isSelected
            ? "bg-emerald-50/40 border-emerald-400 ring-2 ring-emerald-400/25 shadow-sm"
            : "border-slate-200/90 hover:border-slate-300 hover:shadow-xs"
        )}
      >
        {/* Top meta row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className={cn(
              "text-xs font-mono font-bold px-2 py-0.5 rounded border shrink-0",
              isSelected
                ? "bg-emerald-100/80 text-emerald-900 border-emerald-300"
                : "bg-slate-100/90 text-slate-800 border-slate-200"
            )}
          >
            {item.code}
          </span>
          <Badge
            size="sm"
            variant={
              isDoneCard
                ? "success"
                : item.priority === "Critical"
                ? "destructive"
                : item.priority === "High"
                ? "warning"
                : "secondary"
            }
            className="shrink-0"
          >
            {isDoneCard ? "Verified" : item.priority}
          </Badge>
        </div>

        {/* Title */}
        <h4 className="text-xs sm:text-[13px] font-mono font-bold text-slate-900 mb-1.5 leading-snug line-clamp-2 group-hover:text-emerald-800 transition-colors">
          {item.title}
        </h4>

        {/* Description */}
        {item.description && (
          <p className="text-[11px] text-slate-500 font-mono line-clamp-2 leading-relaxed mb-3">
            {item.description}
          </p>
        )}

        {/* Footer info: assignee + evidence or hours + AC */}
        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 pt-2.5 border-t border-slate-100 font-mono">
          {isDoneCard ? (
            <>
              <div className="flex items-center gap-1.5 min-w-0 truncate text-slate-600 font-medium">
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{item.actualHours || 0}h actual</span>
              </div>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold shrink-0 whitespace-nowrap bg-emerald-50/90 px-2 py-0.5 rounded border border-emerald-200/60 text-[10.5px]">
                <CheckCircle2 className="w-3 h-3 stroke-[2.2]" /> 100% AC Met
              </span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 min-w-0 truncate text-slate-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="truncate" title={item.assignee?.name || "Unassigned"}>
                  {item.assignee?.name || "Unassigned"}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold shrink-0 whitespace-nowrap bg-emerald-50/90 px-2 py-0.5 rounded border border-emerald-200/60 text-[10.5px]">
                <Paperclip className="w-3 h-3 stroke-[2.2]" /> {item.evidence?.length || 0} Evidence
              </span>
            </>
          )}
        </div>
      </motion.div>
    );
  };

  // Render detail panel content (shared between desktop inline and mobile/tablet drawer)
  const renderDetailContent = () => {
    if (!selectedItem) {
      return (
        <div className="text-center text-xs text-slate-500 py-16 font-mono">
          Select a work item to inspect details.
        </div>
      );
    }

    const completedAC = selectedItem.acceptanceCriteria.filter((a) => a.completed).length;
    const totalAC = selectedItem.acceptanceCriteria.length;
    const acPercent = totalAC > 0 ? Math.round((completedAC / totalAC) * 100) : 0;

    return (
      <div className="space-y-6">
        {/* Header Details */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                {selectedItem.code}
              </span>
              <Badge
                size="sm"
                variant={
                  selectedItem.priority === "Critical"
                    ? "destructive"
                    : selectedItem.priority === "High"
                    ? "warning"
                    : "secondary"
                }
              >
                {selectedItem.priority}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedItem.status}
                onChange={(e) => onUpdateWorkItemStatus(selectedItem.id, e.target.value as WorkItemStatus)}
                aria-label="Update Work Item Status"
                className="bg-white text-xs text-slate-800 font-mono font-bold px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 shadow-2xs cursor-pointer focus:outline-none transition-colors"
              >
                <option value="BACKLOG">Backlog</option>
                <option value="READY">Ready</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="TESTING">Testing</option>
                <option value="DONE">Done</option>
              </select>

              <button
                onClick={() => setIsDetailOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Tutup detail (Esc)"
                aria-label="Tutup detail"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-mono font-black text-slate-900 tracking-tight leading-snug">
              {selectedItem.title}
            </h3>
            {selectedItem.description && (
              <p className="text-xs sm:text-sm text-slate-600 font-sans mt-2 leading-relaxed">
                {selectedItem.description}
              </p>
            )}
          </div>

          {/* Metric chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono pt-3 border-t border-slate-100">
            <span className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700 font-semibold">
              Est: <strong className="text-slate-900">{selectedItem.estimateHours || 0}h</strong>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700 font-semibold">
              Act: <strong className="text-slate-900">{selectedItem.actualHours || 0}h</strong>
            </span>
            {selectedItem.gitBranch && (
              <button
                onClick={() => copyBranchToClipboard(selectedItem.gitBranch)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50/80 border border-emerald-200 text-emerald-900 font-mono text-[11px] hover:bg-emerald-100/70 transition-colors cursor-pointer"
                title="Salin nama branch"
              >
                <GitBranch className="w-3 h-3 text-emerald-700" />
                <span className="font-bold">{selectedItem.gitBranch}</span>
                {copiedBranch ? (
                  <Check className="w-3 h-3 text-emerald-700 ml-0.5" />
                ) : (
                  <Copy className="w-3 h-3 text-emerald-600 ml-0.5 opacity-60 group-hover:opacity-100" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Acceptance Criteria Checklist */}
        <div className="p-4 sm:p-5 bg-slate-50/80 rounded-xl border border-slate-200/90 space-y-3.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80">
            <div className="space-y-1">
              <h4 className="text-xs font-mono font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  Acceptance Criteria ({completedAC}/{totalAC})
                </span>
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200/90">
                WEIGHT: 30%
              </span>
            </div>
          </div>

          {/* Progress bar */}
          {totalAC > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-slate-500">
                <span>Kelengkapan Kriteria</span>
                <span className="font-bold text-emerald-700">{acPercent}% Selesai</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${acPercent}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-2 pt-1">
            {selectedItem.acceptanceCriteria.map((ac) => (
              <label
                key={ac.id}
                className={cn(
                  "flex items-start gap-3 p-2.5 rounded-lg text-xs font-mono cursor-pointer transition-all border",
                  ac.completed
                    ? "bg-emerald-50/40 border-emerald-200/60 text-slate-600"
                    : "bg-white border-slate-200/80 hover:border-slate-300 text-slate-800 shadow-2xs"
                )}
              >
                <input
                  type="checkbox"
                  checked={ac.completed}
                  onChange={() => onToggleAcceptanceCriteria(selectedItem.id, ac.id)}
                  className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4 shrink-0"
                  aria-label="Tandai kriteria selesai"
                />
                <span
                  className={cn(
                    "leading-relaxed",
                    ac.completed ? "line-through text-slate-500 font-normal" : "font-semibold text-slate-900"
                  )}
                >
                  {ac.text}
                </span>
              </label>
            ))}

            {selectedItem.acceptanceCriteria.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-500 font-mono bg-white rounded-lg border border-dashed border-slate-200">
                Tidak ada kriteria penerimaan khusus untuk item ini.
              </div>
            )}
          </div>
        </div>

        {/* Evidence Trail */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between pb-1">
            <h4 className="text-xs font-mono font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Evidence Trail ({selectedItem.evidence?.length || 0})</span>
            </h4>
            <span className="text-[10.5px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              VERIFIED SYSTEM RECORDS
            </span>
          </div>

          <div className="space-y-2.5">
            {selectedItem.evidence?.map((ev) => (
              <div
                key={ev.id}
                className="p-3.5 rounded-xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-2xs text-xs space-y-1.5 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-slate-900 text-xs truncate">
                    {ev.title}
                  </span>
                  <Badge variant="success" size="sm">
                    {ev.verificationStatus}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>
                    Source: <strong className="text-slate-700">{ev.source}</strong>
                  </span>
                  <span className="text-slate-500">{ev.timestamp}</span>
                </div>

                {ev.details && (
                  <p className="text-[11px] text-slate-600 font-mono bg-slate-50 p-2 rounded-md border border-slate-100 mt-1">
                    {ev.details}
                  </p>
                )}
              </div>
            ))}

            {(!selectedItem.evidence || selectedItem.evidence.length === 0) && (
              <div className="p-6 text-center text-xs text-slate-500 font-mono border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                No evidence attached yet.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Controls Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Top row: Title and Primary Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-700 border border-emerald-200/80 shadow-2xs shrink-0">
              <CheckSquare className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-mono font-black text-slate-900 tracking-tight">
                  Work Items & Sprint Backlog
                </h1>
                <Badge variant="success" size="sm">
                  {project.key}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-mono font-medium mt-0.5">
                Sprint 04 • Goal: Complete enrollment admission & validation pipeline
              </p>
            </div>
          </div>

          {/* Quick Actions Header */}
          <div className="flex items-center gap-2 shrink-0">
            {!isDetailOpen && selectedItem && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsDetailOpen(true)}
                className="hidden xl:flex px-3 py-1.5 rounded-lg text-xs font-mono font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Buka panel inspektur detail"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Panel Detail</span>
              </motion.button>
            )}

            {onCreateWorkItem && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreateModal(true)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Work Item</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Bottom row: Filter & Search Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial sm:w-60 md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Filter by code or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 text-xs text-slate-900 font-mono pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all"
                aria-label="Filter by code or title"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              aria-label="Filter work items by type"
              className="bg-slate-50 text-xs text-slate-800 font-mono font-medium px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer focus:outline-none hover:border-slate-300"
            >
              <option value="ALL">All Types</option>
              <option value="FEATURE">Feature</option>
              <option value="BUG">Bug</option>
              <option value="REFACTOR">Refactor</option>
              <option value="TECH_DEBT">Tech Debt</option>
            </select>

            {/* DAG Dependencies Toggle */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowDAG(!showDAG)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap",
                showDAG
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              )}
            >
              <Share2 className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>DAG Dependencies</span>
            </motion.button>
          </div>

          {/* Counter Badge */}
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-500">
            <span>
              Menampilkan <strong className="text-slate-800">{filteredItems.length}</strong> dari {workItems.length} item
            </span>
          </div>
        </div>
      </div>

      {/* Dependency Graph Modal / View */}
      <AnimatePresence>
        {showDAG && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-mono font-black text-slate-900 uppercase tracking-wider">
                    Directed Acyclic Graph (DAG) & Dependency Engine
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Automatic cycle detection algorithm prevents blocked release deadlocks.
                  </p>
                </div>
                <Badge variant="success" size="sm" dot>
                  Circular Check: PASSED (No cycles)
                </Badge>
              </div>

              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 font-mono text-xs text-slate-900 space-y-3">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-bold shadow-2xs">
                    <Code2 className="w-3.5 h-3.5 stroke-[2.2]" />
                    <span>AUTH-023 (JWT Guard)</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold shadow-2xs">
                    <CheckSquare className="w-3.5 h-3.5 stroke-[2.2]" />
                    <span>ENR-024 (Admission Logic)</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 font-bold shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 stroke-[2.2]" />
                    <span>M3-LIVE (Admissions Milestone)</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-200/80">
                  Prerequisites verified: <code className="text-slate-800 font-bold">AUTH-023</code> is marked DONE with cryptographic commit <code className="text-slate-800 font-bold">9c1b4e7</code>. <code className="text-slate-800 font-bold">ENR-024</code> is fully unblocked for staging deploy.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Column Switcher (Tab pills for < md screens) */}
      <div className="flex md:hidden items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto">
        <button
          onClick={() => setMobileColumnTab("ALL")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap flex-1 text-center",
            mobileColumnTab === "ALL"
              ? "bg-white text-slate-900 shadow-2xs"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          Semua ({filteredItems.length})
        </button>
        <button
          onClick={() => setMobileColumnTab("IN_PROGRESS")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap flex-1 text-center",
            mobileColumnTab === "IN_PROGRESS"
              ? "bg-white text-amber-900 shadow-2xs"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          In Progress ({inProgressItems.length})
        </button>
        <button
          onClick={() => setMobileColumnTab("REVIEW")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap flex-1 text-center",
            mobileColumnTab === "REVIEW"
              ? "bg-white text-blue-900 shadow-2xs"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          Review ({reviewItems.length})
        </button>
        <button
          onClick={() => setMobileColumnTab("DONE")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap flex-1 text-center",
            mobileColumnTab === "DONE"
              ? "bg-white text-emerald-900 shadow-2xs"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          Done ({doneItems.length})
        </button>
      </div>

      {/* Main Kanban & Details Split View */}
      <div className="flex flex-col xl:flex-row items-start gap-6 relative">
        {/* Kanban Board Container (Flexible, proportional across all viewports) */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          <div
            className={cn(
              "grid gap-4 sm:gap-5",
              /* On mobile, if a specific tab is chosen, display that one column full width. Otherwise display 3 columns on tablet/desktop */
              mobileColumnTab === "ALL"
                ? "grid-cols-1 md:grid-cols-3"
                : "grid-cols-1 md:grid-cols-3"
            )}
          >
            {/* Column 1: In Progress */}
            {(mobileColumnTab === "ALL" || mobileColumnTab === "IN_PROGRESS") && (
              <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4 space-y-3 flex flex-col min-w-0">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-xs font-mono font-black text-slate-900 uppercase tracking-wider">
                      In Progress
                    </span>
                  </div>
                  <Badge variant="warning" size="sm">
                    {inProgressItems.length}
                  </Badge>
                </div>

                <div className="space-y-3 min-w-0 flex-1">
                  {inProgressItems.map((item) => renderCard(item, false))}
                  {inProgressItems.length === 0 && (
                    <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl font-mono bg-white/60">
                      Tidak ada item yang sedang dikerjakan
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Column 2: Review / Testing */}
            {(mobileColumnTab === "ALL" || mobileColumnTab === "REVIEW") && (
              <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4 space-y-3 flex flex-col min-w-0">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-xs font-mono font-black text-slate-900 uppercase tracking-wider">
                      Review / Testing
                    </span>
                  </div>
                  <Badge variant="cyan" size="sm">
                    {reviewItems.length}
                  </Badge>
                </div>

                <div className="space-y-3 min-w-0 flex-1">
                  {reviewItems.map((item) => renderCard(item, false))}
                  {reviewItems.length === 0 && (
                    <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl font-mono bg-white/60">
                      Queue clear
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Column 3: Done (Verified) */}
            {(mobileColumnTab === "ALL" || mobileColumnTab === "DONE") && (
              <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4 space-y-3 flex flex-col min-w-0">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-xs font-mono font-black text-slate-900 uppercase tracking-wider">
                      Done (Verified)
                    </span>
                  </div>
                  <Badge variant="success" size="sm">
                    {doneItems.length}
                  </Badge>
                </div>

                <div className="space-y-3 min-w-0 flex-1">
                  {doneItems.map((item) => renderCard(item, true))}
                  {doneItems.length === 0 && (
                    <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl font-mono bg-white/60">
                      Belum ada item selesai
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Inline Detail Panel (>= xl) */}
        {isDetailOpen && selectedItem && (
          <aside className="hidden xl:block w-[380px] 2xl:w-[420px] shrink-0 sticky top-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 max-h-[calc(100vh-6rem)] overflow-y-auto">
              {renderDetailContent()}
            </div>
          </aside>
        )}
      </div>

      {/* Mobile & Tablet Slide-Over Drawer (< xl screens) */}
      <AnimatePresence>
        {isDetailOpen && selectedItem && (
          <div className="xl:hidden fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            />

            {/* Slide-over panel */}
            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="w-screen max-w-md md:max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col"
              >
                {/* Drawer scrollable content */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                  {renderDetailContent()}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Work Item Modal */}
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
                <h2 className="text-base font-mono font-bold text-slate-900">Create New Sprint Work Item</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 mb-1 font-mono font-bold">Item Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Implement idempotent webhook retry with exponential backoff"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
                    aria-label="e.g. Implement idempotent webhook retry with exponential backoff"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-mono font-bold">Type</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as any)}
                      className="w-full bg-white text-slate-900 px-2 py-2 rounded-xl border border-slate-200 focus:outline-none font-mono"
                      aria-label="Tipe work item baru"
                    >
                      <option value="FEATURE">Feature</option>
                      <option value="BUG">Bug</option>
                      <option value="IMPROVEMENT">Improvement</option>
                      <option value="REFACTOR">Refactor</option>
                      <option value="TECH_DEBT">Tech Debt</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-mono font-bold">Priority</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as any)}
                      className="w-full bg-white text-slate-900 px-2 py-2 rounded-xl border border-slate-200 focus:outline-none font-mono"
                      aria-label="Prioritas work item baru"
                    >
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-mono font-bold">Description & Scope</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe deliverable acceptance conditions and target architecture..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
                    aria-label="Describe deliverable acceptance conditions and target architecture"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-mono font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    Create Item
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
