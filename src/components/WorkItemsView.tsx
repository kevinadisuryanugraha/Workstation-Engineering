import React, { useState } from "react";
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
  X
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
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [showDAG, setShowDAG] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  return (
    <div className="space-y-6 pb-12">
      {/* Top Controls Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-700 border border-emerald-200/80 shadow-xs">
              <CheckSquare className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
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

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-600" />
              <input
                type="text"
                placeholder="Filter by code or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 text-xs text-slate-900 font-mono pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-52 sm:w-64 transition-all"
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

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowDAG(!showDAG)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs",
                showDAG
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              )}
            >
              <Share2 className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>DAG Dependencies</span>
            </motion.button>

            {onCreateWorkItem && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreateModal(true)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Work Item</span>
              </motion.button>
            )}
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
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm space-y-3">
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

              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 font-mono text-xs text-slate-900 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-bold">
                    <Code2 className="w-3 h-3 stroke-[2.2]" />
                    <span>AUTH-023 (JWT Guard)</span>
                  </div>
                  <span className="text-slate-600 font-bold">──────►</span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold">
                    <CheckSquare className="w-3 h-3 stroke-[2.2]" />
                    <span>ENR-024 (Admission Logic)</span>
                  </div>
                  <span className="text-slate-600 font-bold">──────►</span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 font-bold">
                    <ShieldCheck className="w-3 h-3 stroke-[2.2]" />
                    <span>M3-LIVE (Admissions Milestone)</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-200">
                  Prerequisites verified: <code className="text-slate-800 font-bold">AUTH-023</code> is marked DONE with cryptographic commit <code className="text-slate-800 font-bold">9c1b4e7</code>. <code className="text-slate-800 font-bold">ENR-024</code> is fully unblocked for staging deploy.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Kanban & Details Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kanban Board (2 columns wide) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column: In Progress */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <span className="text-xs font-mono font-black text-slate-900 uppercase tracking-wider">
                  In Progress
                </span>
                <Badge variant="warning" size="sm">
                  {filteredItems.filter((i) => i.status === "IN_PROGRESS").length}
                </Badge>
              </div>
              <div className="space-y-2.5">
                {filteredItems
                  .filter((i) => i.status === "IN_PROGRESS")
                  .map((item) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setSelectedItem(item)}
                      className={cn(
                        "p-3.5 rounded-xl border cursor-pointer transition-all",
                        selectedItem?.id === item.id
                          ? "bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-300 shadow-xs"
                          : "bg-white border-slate-200/80 hover:border-slate-300 shadow-xs"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-mono font-bold text-emerald-800">{item.code}</span>
                        <Badge
                          size="sm"
                          variant={item.priority === "Critical" ? "destructive" : item.priority === "High" ? "warning" : "secondary"}
                        >
                          {item.priority}
                        </Badge>
                      </div>
                      <h4 className="text-xs font-mono font-bold text-slate-900 mb-1.5 leading-snug">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 font-mono line-clamp-2 mb-2.5">{item.description}</p>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 font-mono">
                        <span>{item.assignee.name}</span>
                        <span className="text-emerald-700 flex items-center gap-1 font-bold">
                          <Paperclip className="w-3 h-3 stroke-[2.2]" /> {item.evidence.length} Evidence
                        </span>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>

            {/* Column: In Review / Testing */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <span className="text-xs font-mono font-black text-slate-900 uppercase tracking-wider">
                  Review / Testing
                </span>
                <Badge variant="cyan" size="sm">
                  {filteredItems.filter((i) => i.status === "IN_REVIEW" || i.status === "TESTING").length}
                </Badge>
              </div>
              <div className="space-y-2.5">
                {filteredItems
                  .filter((i) => i.status === "IN_REVIEW" || i.status === "TESTING")
                  .map((item) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setSelectedItem(item)}
                      className={cn(
                        "p-3.5 rounded-xl border cursor-pointer transition-all",
                        selectedItem?.id === item.id
                          ? "bg-blue-50/40 border-blue-300 ring-1 ring-blue-300 shadow-xs"
                          : "bg-white border-slate-200/80 hover:border-slate-300 shadow-xs"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-mono font-bold text-blue-800">{item.code}</span>
                        <Badge variant="cyan" size="sm">
                          {item.status}
                        </Badge>
                      </div>
                      <h4 className="text-xs font-mono font-bold text-slate-900 mb-1.5 leading-snug">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 font-mono line-clamp-2">{item.description}</p>
                    </motion.div>
                  ))}
                {filteredItems.filter((i) => i.status === "IN_REVIEW" || i.status === "TESTING").length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-600 border border-dashed border-slate-200 rounded-xl font-mono">
                    Queue clear
                  </div>
                )}
              </div>
            </div>

            {/* Column: Done (Verified) */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <span className="text-xs font-mono font-black text-slate-900 uppercase tracking-wider">
                  Done (Verified)
                </span>
                <Badge variant="success" size="sm">
                  {filteredItems.filter((i) => i.status === "DONE").length}
                </Badge>
              </div>
              <div className="space-y-2.5">
                {filteredItems
                  .filter((i) => i.status === "DONE")
                  .map((item) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setSelectedItem(item)}
                      className={cn(
                        "p-3.5 rounded-xl border cursor-pointer transition-all",
                        selectedItem?.id === item.id
                          ? "bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-300 shadow-xs"
                          : "bg-white border-slate-200/80 hover:border-slate-300 shadow-xs"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-mono font-bold text-emerald-800">{item.code}</span>
                        <Badge variant="success" size="sm">
                          Verified
                        </Badge>
                      </div>
                      <h4 className="text-xs font-mono font-bold text-slate-900 mb-1.5 leading-snug">{item.title}</h4>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 font-mono">
                        <span>{item.actualHours}h actual</span>
                        <span className="text-emerald-700 font-bold">100% AC Met</span>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Work Item Details & Acceptance Criteria Checklist & Evidence */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-6">
          {selectedItem ? (
            <>
              {/* Header Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {selectedItem.code}
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedItem.status}
                      onChange={(e) => onUpdateWorkItemStatus(selectedItem.id, e.target.value as WorkItemStatus)}
                      aria-label="Update Work Item Status"
                      className="bg-white text-xs text-slate-800 font-mono font-bold px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 shadow-xs cursor-pointer focus:outline-none transition-colors"
                    >
                      <option value="BACKLOG">Backlog</option>
                      <option value="READY">Ready</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="IN_REVIEW">In Review</option>
                      <option value="TESTING">Testing</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-mono font-black text-slate-900 tracking-tight leading-snug">
                    {selectedItem.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-sans mt-1.5 leading-relaxed">
                    {selectedItem.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono pt-3 border-t border-slate-100">
                  <span className="font-semibold text-slate-700">Est: {selectedItem.estimateHours}h</span>
                  <span>•</span>
                  <span className="font-semibold text-slate-700">Act: {selectedItem.actualHours}h</span>
                  <span>•</span>
                  <span className="break-all flex items-center gap-1.5">
                    <span>Branch:</span>
                    <code className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80 font-mono font-bold text-[11px]">
                      {selectedItem.gitBranch}
                    </code>
                  </span>
                </div>
              </div>

              {/* Acceptance Criteria Checklist */}
              <div className="p-4 sm:p-5 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-3.5">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70">
                  <h4 className="text-xs font-mono font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Acceptance Criteria ({selectedItem.acceptanceCriteria.filter(a => a.completed).length}/{selectedItem.acceptanceCriteria.length})</span>
                  </h4>
                  <span className="text-[11px] font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200/80">
                    WEIGHT: 30%
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedItem.acceptanceCriteria.map((ac) => (
                    <label
                      key={ac.id}
                      className={cn(
                        "flex items-start gap-3 p-2.5 rounded-lg text-xs font-mono cursor-pointer transition-all border",
                        ac.completed
                          ? "bg-slate-100/50 border-transparent text-slate-600"
                          : "bg-white border-slate-200/70 hover:border-slate-300 text-slate-800 shadow-xs"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={ac.completed}
                        onChange={() => onToggleAcceptanceCriteria(selectedItem.id, ac.id)}
                        className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4 shrink-0"
                        aria-label="Tandai kriteria selesai"
                      />
                      <span className={cn("leading-relaxed", ac.completed ? "line-through text-slate-600 font-normal" : "font-semibold text-slate-900")}>
                        {ac.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Evidence Trail */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-1">
                  <h4 className="text-xs font-mono font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Evidence Trail ({selectedItem.evidence.length})</span>
                  </h4>
                  <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    VERIFIED SYSTEM RECORDS
                  </span>
                </div>

                <div className="space-y-2.5">
                  {selectedItem.evidence.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3.5 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 shadow-xs text-xs space-y-1.5 transition-colors"
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
                        <span>Source: <strong className="text-slate-700">{ev.source}</strong></span>
                        <span className="text-slate-600">{ev.timestamp}</span>
                      </div>

                      {ev.details && (
                        <p className="text-[11px] text-slate-600 font-mono bg-slate-50/80 p-2 rounded-md border border-slate-100 mt-1">
                          {ev.details}
                        </p>
                      )}
                    </div>
                  ))}

                  {selectedItem.evidence.length === 0 && (
                    <div className="p-6 text-center text-xs text-slate-600 font-mono border border-dashed border-slate-200 rounded-xl">
                      No evidence attached yet.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-xs text-slate-500 py-16 font-mono">
              Select a work item to inspect details.
            </div>
          )}
        </div>
      </div>

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
                  className="p-1 rounded-lg text-slate-600 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
