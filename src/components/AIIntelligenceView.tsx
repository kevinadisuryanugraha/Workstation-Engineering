import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Play,
  FileCode,
  Clock,
  ArrowRight,
  TrendingDown,
  Cpu,
  X
} from "lucide-react";
import { AIFinding, AIRecommendation, TechnicalDebt, Project } from "../types";
import { AiScanSummary } from "../hooks/api/useAiIntel";
import { aiModeBadge, isDemoScanMode, SCAN_MODE_FILTERS, AiModeFilterKey } from "../lib/aiMode";
import { KokonutCard } from "./ui/KokonutCard";
import { Badge } from "./ui/Badge";
import { cn } from "../lib/utils";

interface AIIntelligenceViewProps {
  findings: AIFinding[];
  scanMode?: string | null;
  scanModel?: string | null;
  scanHistory?: AiScanSummary[];
  scanHistoryLoading?: boolean;
  scanModeFilter?: AiModeFilterKey;
  onScanModeFilterChange?: (key: AiModeFilterKey) => void;
  recommendations: AIRecommendation[];
  technicalDebts: TechnicalDebt[];
  project: Project;
  onUpdateFindingStatus: (id: string, status: AIFinding["status"]) => void;
  onConvertRecommendationToWorkItem: (rec: AIRecommendation) => void;
  onRunScan: (codeContext: string) => Promise<void>;
  isManagementView: boolean;
}

export const AIIntelligenceView: React.FC<AIIntelligenceViewProps> = ({
  findings,
  scanMode,
  scanModel,
  scanHistory = [],
  scanHistoryLoading = false,
  scanModeFilter = "ALL",
  onScanModeFilterChange,
  recommendations,
  technicalDebts,
  project,
  onUpdateFindingStatus,
  onConvertRecommendationToWorkItem,
  onRunScan,
  isManagementView
}) => {
  const [activeTab, setActiveTab] = useState<"findings" | "recommendations" | "techdebt">("findings");
  const isStaticDemoPreview = isDemoScanMode(scanMode); // Story 21.2: guard via util (mode legacy/unknown tak membuat crash)
  const [isScanning, setIsScanning] = useState(false);
  const [scanSnippet, setScanSnippet] = useState(
    `// OrderController.php
public function exportDailyReceipts(Request $request) {
    $orders = Order::whereDate('created_at', today())->get();
    foreach ($orders as $order) {
        $items = $order->items; // Potential N+1 query loop!
        $this->receiptPrinter->spool($order, $items);
    }
}`
  );
  const [showScanModal, setShowScanModal] = useState(false);

  const handleTriggerScan = async () => {
    setIsScanning(true);
    try {
      await onRunScan(scanSnippet);
      setShowScanModal(false);
    } finally {
      setIsScanning(false);
    }
  };

  // Story 21.2: tanggal riwayat — guard nilai invalid/empty tanpa crash (HOTFIX #4).
  const formatScanDate = (iso: string): string => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="purple" size="sm" dot>
                AI Codebase Intelligence & AST Scanner
              </Badge>
              {/* Story 21.2 (AC #1): badge mode hasil scan terakhir — jujur per mode, guard unknown */}
              {scanMode && (() => {
                const b = aiModeBadge(scanMode);
                return (
                  <Badge variant={b.variant} size="sm" dot data-testid={b.testId}>
                    {b.label}
                  </Badge>
                );
              })()}
              {/* Story 21.2 (AC #3): model aktual hasil scan terakhir */}
              {scanModel && (
                <span className="text-xs text-slate-500 font-mono font-semibold" data-testid="scan-model">
                  Model: {scanModel}
                </span>
              )}
              <span className="text-xs text-slate-500 font-mono font-semibold">Project: {project.name}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-mono font-black text-slate-900 tracking-tight">
              Automated Architecture, Security & Performance Advisory
            </h1>
            <p className="text-xs text-slate-600 font-sans mt-1 leading-relaxed">
              Principle: AI serves as a continuous risk detector and advisory engine. Humans retain authority and final sign-off.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowScanModal(true)}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-xs font-mono font-bold text-white shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-teal-200" />
              <span>Run New AI Code Scan</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Tabs selector */}
      <div className="flex items-center flex-nowrap shrink-0 overflow-x-auto bg-slate-100/80 p-1 rounded-xl border border-slate-200/80 w-full sm:w-fit gap-1">
        {[
          { key: "findings", label: `AI Findings (${findings.length})` },
          { key: "recommendations", label: `AI Recommendations (${recommendations.length})` },
          { key: "techdebt", label: `Technical Debt (${technicalDebts.length})` }
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                "relative px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all outline-none cursor-pointer whitespace-nowrap",
                isActive
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              )}
            >
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: AI Findings */}
      {activeTab === "findings" && (
        <div className="space-y-4">
          {isStaticDemoPreview && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4" data-testid="demo-mode-banner">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-bold text-amber-900">
                  Data Demo — Bukan Hasil Pemindaian Nyata
                </p>
                <p className="text-xs font-semibold text-amber-800 mt-0.5 font-mono">
                  mode: STATIC_DEMO_PREVIEW — Temuan berikut dihasilkan dari heuristic fallback karena GEMINI_API_KEY tidak tersedia. Jangan dijadikan dasar keputusan teknis.
                </p>
              </div>
            </div>
          )}

          {/* Story 21.2 (AC #1/#2/#5): riwayat scan — badge mode per baris, filter
              Semua/Real/Demo (query param ke server), loading & empty state jujur. */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-3" data-testid="scan-history">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-mono font-black text-slate-900 uppercase tracking-wider">
                Riwayat Scan
              </span>
              <div
                className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg border border-slate-200/80 w-fit"
                role="group"
                aria-label="Filter riwayat scan berdasarkan mode"
              >
                {SCAN_MODE_FILTERS.map((f) => {
                  const active = scanModeFilter === f.key;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => onScanModeFilterChange?.(f.key)}
                      aria-pressed={active}
                      data-testid={`scan-filter-${f.key.toLowerCase()}`}
                      className={cn(
                        "px-3 py-1 rounded-md text-xs font-mono font-bold transition-all outline-none cursor-pointer",
                        active
                          ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                      )}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {scanHistoryLoading ? (
              <p className="text-xs text-slate-500 font-mono animate-pulse" data-testid="scan-history-loading">
                Memuat riwayat scan…
              </p>
            ) : scanHistory.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono" data-testid="scan-history-empty">
                Belum ada riwayat scan{scanModeFilter === "ALL" ? "" : " untuk mode ini"} — jalankan scan untuk mengisi arsip.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {scanHistory.map((s) => {
                  const b = aiModeBadge(s.mode);
                  return (
                    <li key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2.5">
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <Badge variant={b.variant} size="sm" data-testid={b.testId}>
                          {b.label}
                        </Badge>
                        <span className="text-xs font-mono font-bold text-slate-800">{s.scanRef}</span>
                        <span className="text-xs font-mono text-slate-500 truncate">Model: {s.model}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 shrink-0 text-xs font-mono text-slate-500">
                        <span>{s.findingsCount} findings</span>
                        <span>{s.scannedBy}</span>
                        <span>{formatScanDate(s.createdAt)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {findings.map((fnd) => (
            <div key={fnd.id} className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                    {fnd.id}
                  </span>
                  <Badge
                    size="sm"
                    variant={fnd.severity === "Critical" || fnd.severity === "High" ? "destructive" : "warning"}
                  >
                    {fnd.severity}
                  </Badge>
                  <h3 className="text-sm sm:text-base font-mono font-bold text-slate-900">{fnd.title}</h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    Confidence: {fnd.confidence}%
                  </span>
                  <Badge variant="secondary" size="sm">
                    Status: {fnd.status}
                  </Badge>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 font-mono text-xs text-slate-900 space-y-1.5">
                <div className="text-slate-600">
                  File: <code className="text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200/80">{fnd.affectedFile}</code>
                </div>
                <div className="text-slate-700 leading-relaxed">
                  <strong className="text-slate-900">Evidence:</strong> {fnd.evidence}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-rose-50/60 rounded-xl border border-rose-200/80 space-y-1">
                  <span className="font-mono font-bold text-rose-900 block text-[11px] uppercase tracking-wider">
                    Impact Analysis:
                  </span>
                  <p className="text-slate-800 font-sans leading-relaxed">{fnd.impact}</p>
                </div>
                <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-1">
                  <span className="font-mono font-bold text-emerald-900 block text-[11px] uppercase tracking-wider">
                    Suggested Remediation:
                  </span>
                  <p className="text-slate-800 font-sans leading-relaxed">{fnd.suggestedRemediation}</p>
                </div>
              </div>

              {/* Triage action buttons */}
              {fnd.status === "PENDING" && (
                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-100 text-xs font-mono">
                  <span className="text-slate-500 font-bold mr-2">Human Triage Action:</span>
                  <button
                    onClick={() => onUpdateFindingStatus(fnd.id, "CONFIRMED")}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer transition-colors"
                  >
                    Confirm Finding
                  </button>
                  <button
                    onClick={() => onUpdateFindingStatus(fnd.id, "FALSE_POSITIVE")}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold cursor-pointer transition-colors"
                  >
                    Mark False Positive
                  </button>
                  <button
                    onClick={() => onUpdateFindingStatus(fnd.id, "REJECTED")}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold cursor-pointer transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: AI Recommendations with Convert to Work Item */}
      {activeTab === "recommendations" && (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div key={rec.id} className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                    {rec.id}
                  </span>
                  <h3 className="text-base font-mono font-bold text-slate-900">{rec.title}</h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    Confidence: {rec.confidence}%
                  </span>
                  <Badge variant="secondary" size="sm">
                    Effort: {rec.effortEstimate}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-slate-500 font-mono font-bold block text-[11px] uppercase tracking-wider">Reason:</span>
                  <p className="text-slate-800 font-sans leading-relaxed">{rec.reason}</p>
                </div>
                <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-200/60 space-y-1">
                  <span className="text-emerald-900 font-mono font-bold block text-[11px] uppercase tracking-wider">Expected Business / Tech Impact:</span>
                  <p className="text-emerald-900 font-sans font-semibold leading-relaxed">{rec.expectedImpact}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-600 font-mono">
                  Affected Module: <strong className="text-slate-900 font-semibold">{rec.affectedModule}</strong>
                </span>
                {rec.convertedToWorkItem ? (
                  <Badge variant="success" size="sm">
                    ✓ Converted to Work Item {rec.convertedToWorkItem}
                  </Badge>
                ) : (
                  <button
                    onClick={() => onConvertRecommendationToWorkItem(rec)}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-mono font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Convert to Work Item</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Technical Debt Register */}
      {activeTab === "techdebt" && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <span className="text-xs font-mono font-black text-slate-900 uppercase tracking-wider">
              Technical Debt Lifecycle (PRD Section 28)
            </span>
            <span className="text-xs font-mono text-slate-500">
              Origin strictly anchored to evidence
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {technicalDebts.map((td) => (
              <motion.div
                key={td.id}
                whileHover={{ x: 2 }}
                className="p-4 sm:p-5 hover:bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                      {td.code}
                    </span>
                    <h3 className="text-sm font-mono font-bold text-slate-900">{td.title}</h3>
                    <Badge variant={td.impact === "High" ? "destructive" : "warning"} size="sm">
                      Impact: {td.impact}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono">
                    <span>Source: <strong className="text-slate-700">{td.source}</strong></span>
                    <span>•</span>
                    <span>Module: <strong className="text-slate-700">{td.affectedModule}</strong></span>
                    <span>•</span>
                    <span>Aging: <strong className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">{td.agingDays} days</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
                  <span className="text-slate-700 font-semibold bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/80">
                    Est: {td.estimatedEffortHours}h
                  </span>
                  <Badge variant="secondary" size="sm">
                    {td.status}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Code Scan Modal */}
      <AnimatePresence>
        {showScanModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4 relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-mono font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>Trigger AI Codebase Scan (Gemini Flash)</span>
                </h2>
                <button
                  onClick={() => setShowScanModal(false)}
                  className="p-1 rounded-lg text-slate-600 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Submit code or architectural context to scan for N+1 queries, HMAC security leaks, missing test assertions, and technical debt.
              </p>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 mb-1.5">Code / Controller Snippet</label>
                <textarea
                  rows={8}
                  value={scanSnippet}
                  onChange={(e) => setScanSnippet(e.target.value)}
                  className="w-full bg-slate-50 font-mono text-xs text-slate-900 p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono leading-relaxed"
                  aria-label="Snippet kode untuk dipindai AI"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowScanModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleTriggerScan}
                  disabled={isScanning}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-mono font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
                  <span>{isScanning ? "Scanning with Gemini..." : "Execute Scan"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
