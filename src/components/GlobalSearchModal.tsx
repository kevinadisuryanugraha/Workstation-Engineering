import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, ArrowRight, CheckCircle2, FileText, Ticket, GitBranch, Rocket, ShieldAlert, X } from "lucide-react";
import { WorkItem, Ticket as TicketType, Deployment, Incident, Commit } from "../types";
import { Badge } from "./ui/Badge";
import { cn } from "../lib/utils";
import { DEMO_MODE } from "../mockData";
import { useGlobalSearch, searchTabFor, isQueryReady } from "../hooks/api/useGlobalSearch";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  workItems: WorkItem[];
  tickets: TicketType[];
  deployments: Deployment[];
  incidents: Incident[];
  commits: Commit[];
  onNavigate: (tab: string, entityId?: string) => void;
  /** Story 18.6 (CC-5): boot real memakai API search; demo memakai props. */
  isAuthenticated?: boolean;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  workItems,
  tickets,
  deployments,
  incidents,
  commits,
  onNavigate,
  isAuthenticated
}) => {
  const [query, setQuery] = useState("");

  // Story 18.6 (CC-5): jalur pencarian nyata via API /api/v1/search — hanya
  // boot real & modal terbuka; mode demo memakai filter props lokal.
  const realMode = !DEMO_MODE && Boolean(isAuthenticated);
  const {
    data: searchPayload,
    isFetching: searchFetching,
    isError: searchError
  } = useGlobalSearch(query, { enabled: realMode && isOpen });
  const apiResults = searchPayload?.results ?? [];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchedWorkItems = workItems.filter(
    (w) => !q || w.code.toLowerCase().includes(q) || w.title.toLowerCase().includes(q)
  );
  const matchedTickets = tickets.filter(
    (t) => !q || t.code.toLowerCase().includes(q) || t.title.toLowerCase().includes(q)
  );
  const matchedDeployments = deployments.filter(
    (d) => !q || d.code.toLowerCase().includes(q) || d.version.toLowerCase().includes(q)
  );
  const matchedIncidents = incidents.filter(
    (i) => !q || i.code.toLowerCase().includes(q) || i.title.toLowerCase().includes(q)
  );
  const matchedCommits = commits.filter(
    (c) => !q || c.sha.toLowerCase().includes(q) || c.message.toLowerCase().includes(q)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white border-2 border-slate-900 rounded-2xl max-w-2xl w-full shadow-[4px_4px_0px_#18181b] overflow-hidden flex flex-col max-h-[80vh] relative"
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-900/20 flex items-center gap-3 bg-[#FAF7EE]">
          <Search className="w-5 h-5 text-slate-950 stroke-[2.5] shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search by ID (ENR-024, TK-182, DEP-502, INC-00042) or keywords..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-slate-950 text-sm focus:outline-none placeholder:text-slate-500 font-mono font-bold"
                aria-label="Search by ID (ENR-024, TK-182, DEP-502, INC-00042) or keywords"
              />
          <button
            onClick={onClose}
            className="px-2 py-0.5 text-xs bg-white hover:bg-slate-100 border-2 border-slate-900 rounded-lg text-slate-950 font-mono font-bold shadow-[1px_1px_0px_#18181b] transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-4 space-y-4 divide-y divide-slate-900/10">
          {/* Story 18.6 (CC-5): hasil pencarian nyata dari API */}
          {realMode && (
            <>
              {searchFetching && (
                <p className="text-xs text-slate-500 font-mono text-center py-4" data-testid="search-loading">
                  Mencari “{query.trim()}”…
                </p>
              )}
              {!searchFetching && searchError && (
                <p className="text-xs text-red-700 font-mono text-center py-4" data-testid="search-error">
                  Pencarian gagal — periksa koneksi lalu coba lagi.
                </p>
              )}
              {!searchFetching && !searchError && isQueryReady(query) && apiResults.length === 0 && (
                <p className="text-xs text-slate-500 font-mono text-center py-4" data-testid="search-empty">
                  Tidak ada hasil untuk “{query.trim()}”.
                </p>
              )}
              {!searchFetching && apiResults.length > 0 && (
                <div>
                  <p className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-950 mb-2">
                    Hasil ({apiResults.length})
                  </p>
                  <div className="space-y-1">
                    {apiResults.map((r) => (
                      <motion.div
                        key={`${r.entityType}-${r.ref}`}
                        whileHover={{ x: 2 }}
                        onClick={() => {
                          onNavigate(searchTabFor(r.entityType), r.ref);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl hover:bg-[#FAF7EE] cursor-pointer flex items-center justify-between transition-colors border border-transparent hover:border-slate-900"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs font-bold text-slate-950 bg-[#FAF7EE] px-2 py-0.5 rounded-md border border-slate-900 shadow-[1px_1px_0px_#18181b]">
                            {r.ref}
                          </span>
                          <span className="text-xs text-slate-950 font-mono font-bold truncate max-w-sm">{r.title}</span>
                        </div>
                        <Badge variant="secondary" size="sm">
                          {r.entityType.replaceAll("_", " ")}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Work Items */}
          {!realMode && matchedWorkItems.length > 0 && (
            <div>
              <p className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-950 mb-2">
                Work Items ({matchedWorkItems.length})
              </p>
              <div className="space-y-1">
                {matchedWorkItems.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ x: 2 }}
                    onClick={() => {
                      onNavigate("workitems", item.id);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl hover:bg-[#FAF7EE] cursor-pointer flex items-center justify-between transition-colors border border-transparent hover:border-slate-900"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-slate-950 bg-[#FAF7EE] px-2 py-0.5 rounded-md border border-slate-900 shadow-[1px_1px_0px_#18181b]">
                        {item.code}
                      </span>
                      <span className="text-xs text-slate-950 font-mono font-bold">{item.title}</span>
                    </div>
                    <Badge variant="secondary" size="sm">
                      {item.status}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Tickets */}
          {!realMode && matchedTickets.length > 0 && (
            <div className="pt-3">
              <p className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-950 mb-2">
                Tickets ({matchedTickets.length})
              </p>
              <div className="space-y-1">
                {matchedTickets.map((t) => (
                  <motion.div
                    key={t.id}
                    whileHover={{ x: 2 }}
                    onClick={() => {
                      onNavigate("tickets", t.id);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl hover:bg-[#FAF7EE] cursor-pointer flex items-center justify-between transition-colors border border-transparent hover:border-slate-900"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-slate-950 bg-[#eff6ff] px-2 py-0.5 rounded-md border border-slate-900 shadow-[1px_1px_0px_#18181b]">
                        {t.code}
                      </span>
                      <span className="text-xs text-slate-950 font-mono font-bold">{t.title}</span>
                    </div>
                    <Badge variant="cyan" size="sm">
                      {t.status}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Deployments */}
          {!realMode && matchedDeployments.length > 0 && (
            <div className="pt-3">
              <p className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-950 mb-2">
                Deployments ({matchedDeployments.length})
              </p>
              <div className="space-y-1">
                {matchedDeployments.map((d) => (
                  <motion.div
                    key={d.id}
                    whileHover={{ x: 2 }}
                    onClick={() => {
                      onNavigate("deployments", d.id);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl hover:bg-[#FAF7EE] cursor-pointer flex items-center justify-between transition-colors border border-transparent hover:border-slate-900"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-slate-950 bg-[#f3e8ff] px-2 py-0.5 rounded-md border border-slate-900 shadow-[1px_1px_0px_#18181b]">
                        {d.code}
                      </span>
                      <span className="text-xs text-slate-950 font-mono font-bold">{d.version} ({d.environment})</span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold text-slate-600">{d.server}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Incidents */}
          {!realMode && matchedIncidents.length > 0 && (
            <div className="pt-3">
              <p className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-950 mb-2">
                Incidents ({matchedIncidents.length})
              </p>
              <div className="space-y-1">
                {matchedIncidents.map((inc) => (
                  <motion.div
                    key={inc.id}
                    whileHover={{ x: 2 }}
                    onClick={() => {
                      onNavigate("incidents", inc.id);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl hover:bg-[#FAF7EE] cursor-pointer flex items-center justify-between transition-colors border border-transparent hover:border-slate-900"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-slate-950 bg-[#fee2e2] px-2 py-0.5 rounded-md border border-slate-900 shadow-[1px_1px_0px_#18181b]">
                        {inc.code}
                      </span>
                      <span className="text-xs text-slate-950 font-mono font-bold">{inc.title}</span>
                    </div>
                    <Badge variant="destructive" size="sm">
                      {inc.severity}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Commits */}
          {!realMode && matchedCommits.length > 0 && (
            <div className="pt-3">
              <p className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-950 mb-2">
                Commits ({matchedCommits.length})
              </p>
              <div className="space-y-1">
                {matchedCommits.map((c) => (
                  <motion.div
                    key={c.sha}
                    whileHover={{ x: 2 }}
                    onClick={() => {
                      onNavigate("git", c.sha);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl hover:bg-[#FAF7EE] cursor-pointer flex items-center justify-between transition-colors border border-transparent hover:border-slate-900"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-slate-950 bg-[#FAF7EE] px-2 py-0.5 rounded-md border border-slate-900 shadow-[1px_1px_0px_#18181b]">
                        {c.sha}
                      </span>
                      <span className="text-xs text-slate-950 font-mono font-medium truncate max-w-sm">{c.message}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-600 font-semibold">{c.author}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#FAF7EE] border-t border-slate-900/20 text-[11px] text-slate-600 flex items-center justify-between font-mono font-semibold">
          <span>Navigate with click • Press ESC to exit</span>
          <span className="text-emerald-800 font-bold">Single Source of Truth</span>
        </div>
      </motion.div>
    </div>
  );
};
