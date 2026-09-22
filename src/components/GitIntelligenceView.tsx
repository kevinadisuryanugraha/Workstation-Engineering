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
  AlertCircle,
  Plus,
  FolderGit2,
  Copy,
  Check,
  HelpCircle,
  RefreshCw,
  DownloadCloud
} from "lucide-react";
import { Commit, PullRequest, Project, GitProvider, GitRepositoryDto } from "../types";
import { KokonutCard } from "./ui/KokonutCard";
import { Badge } from "./ui/Badge";
import { cn } from "../lib/utils";

interface GitIntelligenceViewProps {
  commits: Commit[];
  pullRequests: PullRequest[];
  project: Project;
  isManagementView: boolean;
  canRegisterRepo?: boolean;
  repositories?: GitRepositoryDto[];
  onRegisterRepo?: (input: { fullName: string; provider: GitProvider; defaultBranch?: string }) => Promise<any>;
  onSyncRepoUrl?: (input: { repoUrl: string; provider?: GitProvider; token?: string }) => Promise<any>;
  onSyncRepoById?: (id: string, token?: string) => Promise<any>;
  isRegistering?: boolean;
  isSyncing?: boolean;
}

export const GitIntelligenceView: React.FC<GitIntelligenceViewProps> = ({
  commits,
  pullRequests,
  project,
  isManagementView,
  canRegisterRepo = false,
  repositories = [],
  onRegisterRepo,
  onSyncRepoUrl,
  onSyncRepoById,
  isRegistering = false,
  isSyncing = false,
}) => {
  const [activeTab, setActiveTab] = useState<"commits" | "prs" | "branches" | "repos">("commits");
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showSyncForm, setShowSyncForm] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<GitProvider>("GITHUB");
  const [repoFullName, setRepoFullName] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [syncUrlInput, setSyncUrlInput] = useState("");
  const [syncTokenInput, setSyncTokenInput] = useState("");
  const [syncingRepoId, setSyncingRepoId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [syncSuccessInfo, setSyncSuccessInfo] = useState<{
    message: string;
    commitsCount: number;
    prsCount: number;
    linkedKeys: string[];
  } | null>(null);

  const [registeredSuccessInfo, setRegisteredSuccessInfo] = useState<{
    fullName: string;
    provider: GitProvider;
    webhookUrl: string;
    secretHint: string;
  } | null>(null);

  const branches = [
    { name: "main", isProtected: true, author: "Rina Wijaya", lastCommit: "a81f32d", ahead: 0, behind: 0, env: "Production (Kontabo)" },
    { name: "develop", isProtected: true, author: "Kevin Santoso", lastCommit: "8f31a92", ahead: 2, behind: 0, env: "Staging / Dev (Office)" },
    { name: "feature/enrollment", isProtected: false, author: "Kevin Santoso", lastCommit: "8f31a92", ahead: 4, behind: 1, linked: "ENR-024" },
    { name: "fix/TK-182-receipt", isProtected: false, author: "Kevin Santoso", lastCommit: "a81f32d", ahead: 0, behind: 0, linked: "BUG-091" }
  ];

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmed = repoFullName.trim();
    if (!trimmed.includes("/") || trimmed.split("/").length !== 2) {
      setFormError("Format repositori wajib 'owner/repo' (contoh: acme/workstation).");
      return;
    }

    if (!onRegisterRepo) return;

    try {
      await onRegisterRepo({
        fullName: trimmed,
        provider: selectedProvider,
        defaultBranch: defaultBranch.trim() || "main",
      });

      const providerPath = selectedProvider.toLowerCase();
      const webhookUrl = `${window.location.origin}/api/v1/webhooks/${providerPath}`;
      const secretHint =
        selectedProvider === "GITLAB"
          ? "GitLab: Masukkan Secret Token pada Settings → Webhooks (header X-Gitlab-Token)."
          : selectedProvider === "BITBUCKET"
          ? "Bitbucket: Masukkan Secret HMAC pada Repository Settings → Webhooks."
          : "GitHub: Masukkan Secret HMAC pada Settings → Webhooks (X-Hub-Signature-256).";

      setRegisteredSuccessInfo({
        fullName: trimmed,
        provider: selectedProvider,
        webhookUrl,
        secretHint,
      });

      setRepoFullName("");
      setShowRegisterForm(false);
    } catch (err: any) {
      setFormError(err?.message || "Gagal mendaftarkan repositori.");
    }
  };

  const handleSyncUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSyncSuccessInfo(null);

    if (!syncUrlInput.trim()) {
      setFormError("Masukkan Link Repositori (misal: https://github.com/owner/repo atau owner/repo).");
      return;
    }

    if (!onSyncRepoUrl) return;

    try {
      const res = await onSyncRepoUrl({
        repoUrl: syncUrlInput.trim(),
        token: syncTokenInput.trim() || undefined,
      });

      const syncData = res?.data?.sync || res?.data || {};
      setSyncSuccessInfo({
        message: `Berhasil menyinkronkan data riil dari ${syncUrlInput.trim()}!`,
        commitsCount: syncData.syncedCommits || 0,
        prsCount: syncData.syncedPullRequests || 0,
        linkedKeys: syncData.linkedKeys || [],
      });

      setSyncUrlInput("");
      setSyncTokenInput("");
      setShowSyncForm(false);
    } catch (err: any) {
      setFormError(err?.message || "Gagal menyinkronkan repositori.");
    }
  };

  const handleSyncById = async (repoId: string) => {
    if (!onSyncRepoById) return;
    setSyncingRepoId(repoId);
    setFormError(null);
    setSyncSuccessInfo(null);

    try {
      const res = await onSyncRepoById(repoId);
      const syncData = res?.data || {};
      setSyncSuccessInfo({
        message: `Sinkronisasi repositori selesai!`,
        commitsCount: syncData.syncedCommits || 0,
        prsCount: syncData.syncedPullRequests || 0,
        linkedKeys: syncData.linkedKeys || [],
      });
    } catch (err: any) {
      setFormError(err?.message || "Gagal menyinkronkan repositori.");
    } finally {
      setSyncingRepoId(null);
    }
  };

  const renderProviderBadge = (provider?: GitProvider) => {
    if (!provider) return null;
    const variant = provider === "GITLAB" ? "purple" : provider === "BITBUCKET" ? "warning" : "secondary";
    const label = provider === "GITLAB" ? "GitLab" : provider === "BITBUCKET" ? "Bitbucket" : "GitHub";
    return (
      <Badge variant={variant as any} size="sm" className="font-mono text-[10px]">
        {label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <KokonutCard variant="default" className="p-4 sm:p-5" interactive={false}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant="success" size="sm" dot>
                Git Intelligence &amp; Evidence Trace
              </Badge>
              <span className="text-xs text-slate-600 font-mono font-bold">Repo: {project.repoName}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-mono font-black text-slate-950 tracking-tight">
              Cryptographic Code Evidence &amp; Multi-Provider Git
            </h1>
            <p className="text-xs text-slate-600 font-mono mt-0.5">
              Commits represent engineering evidence. Sinkronisasi on-demand &amp; Webhook multi-provider: GitHub, GitLab, Bitbucket.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-start md:justify-end">
            {canRegisterRepo && (
              <>
                <button
                  onClick={() => {
                    setShowSyncForm(!showSyncForm);
                    setShowRegisterForm(false);
                    setFormError(null);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold border-2 border-slate-900 bg-[#FAF7EE] hover:bg-amber-100 text-slate-950 shadow-[2px_2px_0px_#18181b] flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 active:translate-x-0.5 active:translate-y-0.5"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
                  <span>{showSyncForm ? "Tutup Sync" : "Sync URL Repo"}</span>
                </button>

                <button
                  onClick={() => {
                    setShowRegisterForm(!showRegisterForm);
                    setShowSyncForm(false);
                    setRegisteredSuccessInfo(null);
                    setFormError(null);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold border-2 border-slate-900 bg-[#dcfce7] hover:bg-emerald-200 text-slate-950 shadow-[2px_2px_0px_#18181b] flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 active:translate-x-0.5 active:translate-y-0.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showRegisterForm ? "Tutup Form" : "Daftar Webhook"}</span>
                </button>
              </>
            )}

            <div className="flex items-center flex-nowrap overflow-x-auto max-w-full bg-white p-1 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#18181b]">
              {(["commits", "prs", "branches", "repos"] as const).map((tabKey) => {
                const label =
                  tabKey === "commits"
                    ? `Commits (${commits.length})`
                    : tabKey === "prs"
                    ? `PRs (${pullRequests.length})`
                    : tabKey === "branches"
                    ? `Branches (${branches.length})`
                    : `Repos (${repositories.length})`;
                const isActive = activeTab === tabKey;
                return (
                  <button
                    key={tabKey}
                    onClick={() => setActiveTab(tabKey)}
                    className={cn(
                      "relative px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors outline-none cursor-pointer whitespace-nowrap",
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
        </div>
      </KokonutCard>

      {/* Form Sinkronisasi On-Demand (Story 24.3) */}
      <AnimatePresence>
        {showSyncForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <KokonutCard variant="default" className="p-5 border-2 border-slate-900 bg-[#FAF7EE] shadow-[3px_3px_0px_#18181b]" interactive={false}>
              <div className="flex items-center gap-2 mb-2">
                <DownloadCloud className="w-5 h-5 text-teal-800" />
                <h3 className="text-sm font-mono font-black text-slate-950 uppercase tracking-wider">
                  Sinkronisasi Repositori Langsung (On-Demand Fetch)
                </h3>
              </div>
              <p className="text-xs text-slate-700 font-mono mb-4">
                Tarik daftar commit dan pull request nyata langsung dari REST API GitHub atau GitLab ke database WORKSTATION.
              </p>

              <form onSubmit={handleSyncUrlSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-900 mb-1">
                      Link / URL Repositori Git
                    </label>
                    <input
                      type="text"
                      placeholder="https://github.com/kevinadisuryanugraha/Workstation-Engineering"
                      value={syncUrlInput}
                      onChange={(e) => setSyncUrlInput(e.target.value)}
                      className="w-full text-xs font-mono p-2.5 rounded-lg border-2 border-slate-900 bg-white shadow-[2px_2px_0px_#18181b] outline-none"
                      required
                    />
                    <p className="text-[10px] text-slate-600 font-mono mt-1">
                      Menerima URL lengkap GitHub/GitLab atau format shorthand <code>owner/repo</code>.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-900 mb-1">
                      Personal Access Token (Opsional untuk Repo Privat)
                    </label>
                    <input
                      type="password"
                      placeholder="ghp_xxxx atau glpat-xxxx"
                      value={syncTokenInput}
                      onChange={(e) => setSyncTokenInput(e.target.value)}
                      className="w-full text-xs font-mono p-2.5 rounded-lg border-2 border-slate-900 bg-white shadow-[2px_2px_0px_#18181b] outline-none"
                    />
                    <p className="text-[10px] text-slate-600 font-mono mt-1">
                      Kosongkan untuk repositori publik.
                    </p>
                  </div>
                </div>

                {formError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-xs font-mono font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSyncForm(false)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold border border-slate-400 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSyncing}
                    className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold border-2 border-slate-900 bg-[#f6ae2d] hover:bg-[#fab005] text-slate-950 shadow-[2px_2px_0px_#18181b] cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
                    <span>{isSyncing ? "Menyinkronkan..." : "Sinkronkan Sekarang"}</span>
                  </button>
                </div>
              </form>
            </KokonutCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banner Hasil Sinkronisasi (Story 24.3) */}
      {syncSuccessInfo && (
        <KokonutCard variant="default" className="p-4 border-2 border-emerald-600 bg-emerald-50 shadow-[2px_2px_0px_#059669]" interactive={false}>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs font-mono">
              <div className="font-bold text-emerald-950">
                {syncSuccessInfo.message}
              </div>
              <div className="text-slate-700 flex items-center gap-3 flex-wrap">
                <span>⚡ Commits: <strong className="text-emerald-900 font-bold">{syncSuccessInfo.commitsCount}</strong></span>
                <span>•</span>
                <span> PRs / MRs: <strong className="text-emerald-900 font-bold">{syncSuccessInfo.prsCount}</strong></span>
                <span>•</span>
                <span> Evidence Terhubung: <strong className="text-emerald-900 font-bold">{syncSuccessInfo.linkedKeys.length} items</strong> {syncSuccessInfo.linkedKeys.length > 0 ? `(${syncSuccessInfo.linkedKeys.join(", ")})` : ""}</span>
              </div>
            </div>
          </div>
        </KokonutCard>
      )}

      {/* Form Registrasi Repositori (AC 23.4.3) */}
      <AnimatePresence>
        {showRegisterForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <KokonutCard variant="default" className="p-5 border-2 border-slate-900 bg-[#FAF7EE]" interactive={false}>
              <div className="flex items-center gap-2 mb-3">
                <FolderGit2 className="w-4 h-4 text-emerald-800" />
                <h3 className="text-sm font-mono font-black text-slate-950 uppercase tracking-wider">
                  Daftarkan Repositori Multi-Provider Baru (Webhook Listener)
                </h3>
              </div>
              <p className="text-xs text-slate-700 font-mono mb-4">
                Daftarkan repositori agar webhook dan evidence commit/MR otomatis tertaut ke project ini.
              </p>

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-900 mb-1">
                      Git Provider
                    </label>
                    <select
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value as GitProvider)}
                      className="w-full text-xs font-mono font-semibold p-2 rounded-lg border-2 border-slate-900 bg-white shadow-[2px_2px_0px_#18181b] outline-none"
                    >
                      <option value="GITHUB">GitHub</option>
                      <option value="GITLAB">GitLab</option>
                      <option value="BITBUCKET">Bitbucket</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-900 mb-1">
                      Nama Lengkap (owner/repo)
                    </label>
                    <input
                      type="text"
                      placeholder="acme/workstation"
                      value={repoFullName}
                      onChange={(e) => setRepoFullName(e.target.value)}
                      className="w-full text-xs font-mono p-2 rounded-lg border-2 border-slate-900 bg-white shadow-[2px_2px_0px_#18181b] outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-900 mb-1">
                      Default Branch
                    </label>
                    <input
                      type="text"
                      placeholder="main"
                      value={defaultBranch}
                      onChange={(e) => setDefaultBranch(e.target.value)}
                      className="w-full text-xs font-mono p-2 rounded-lg border-2 border-slate-900 bg-white shadow-[2px_2px_0px_#18181b] outline-none"
                    />
                  </div>
                </div>

                {formError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-xs font-mono font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRegisterForm(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold border border-slate-400 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold border-2 border-slate-900 bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[2px_2px_0px_#18181b] cursor-pointer disabled:opacity-50"
                  >
                    {isRegistering ? "Mendaftarkan..." : "Simpan Repositori"}
                  </button>
                </div>
              </form>
            </KokonutCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Petunjuk Pasang Webhook Pasca-Registrasi (AC 23.4.3) */}
      {registeredSuccessInfo && (
        <KokonutCard variant="default" className="p-4 border-2 border-emerald-600 bg-emerald-50" interactive={false}>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1.5 text-xs font-mono">
              <div className="font-bold text-emerald-950">
                Repositori <strong>{registeredSuccessInfo.fullName}</strong> ({registeredSuccessInfo.provider}) berhasil didaftarkan!
              </div>
              <div className="text-slate-700">
                Pasang Webhook URL berikut pada pengaturan repositori Anda:
              </div>
              <div className="p-2 rounded bg-white border border-emerald-300 font-bold text-slate-900 select-all break-all">
                {registeredSuccessInfo.webhookUrl}
              </div>
              <p className="text-[11px] text-slate-600 font-semibold">
                {registeredSuccessInfo.secretHint}
              </p>
            </div>
          </div>
        </KokonutCard>
      )}

      {/* Tab Repositori (AC 23.4.3 + AC 24.3.4) */}
      {activeTab === "repos" && (
        <KokonutCard variant="default" className="p-0 overflow-hidden" interactive={false}>
          <div className="p-4 border-b border-slate-900/20 flex items-center justify-between">
            <span className="text-xs font-mono font-black text-slate-950 uppercase tracking-wider">
              Daftar Repositori Terdaftar ({repositories.length})
            </span>
            <span className="text-xs text-slate-600 font-mono font-bold">Multi-Provider Registry &amp; Sync Engine</span>
          </div>

          {repositories.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-slate-600">
              Belum ada repositori terdaftar untuk project ini. Gunakan tombol "Sync URL Repo" atau "Daftar Webhook" di atas.
            </div>
          ) : (
            <div className="divide-y divide-slate-900/10">
              {repositories.map((repo) => (
                <div key={repo.id} className="p-4 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <FolderGit2 className="w-4 h-4 text-emerald-700" />
                      <span className="text-xs font-bold font-mono text-slate-950">{repo.fullName}</span>
                      {renderProviderBadge(repo.provider)}
                      {repo.hasSecret ? (
                        <Badge variant="success" size="sm">
                          Secret Active
                        </Badge>
                      ) : (
                        <Badge variant="warning" size="sm">
                          No Secret
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-600 font-mono">
                      Default branch: <strong className="text-slate-900">{repo.defaultBranch}</strong> • Terdaftar: {new Date(repo.createdAt).toLocaleDateString("id-ID")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canRegisterRepo && onSyncRepoById && (
                      <button
                        onClick={() => handleSyncById(repo.id)}
                        disabled={syncingRepoId === repo.id || isSyncing}
                        className="px-3 py-1 rounded-lg text-xs font-mono font-bold border-2 border-slate-900 bg-[#f6ae2d] hover:bg-[#fab005] text-slate-950 shadow-[1.5px_1.5px_0px_#18181b] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Tarik data commit &amp; PR terbaru sekarang"
                      >
                        <RefreshCw className={cn("w-3 h-3", syncingRepoId === repo.id && "animate-spin")} />
                        <span>{syncingRepoId === repo.id ? "Syncing..." : "Sync Sekarang"}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </KokonutCard>
      )}

      {activeTab === "commits" && (
        <KokonutCard variant="default" className="p-0 overflow-hidden rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_#18181b]" interactive={false}>
          <div className="p-4 border-b-2 border-slate-900 flex items-center justify-between bg-[#FAF7EE] flex-wrap gap-2">
            <span className="text-xs font-mono font-black text-slate-950 uppercase tracking-wider">
              Verified Inbound Commits ({commits.length})
            </span>
            <Badge variant="success" size="sm" dot>
              Real Engine Synced
            </Badge>
          </div>

          <div className="divide-y-2 divide-slate-900/10">
            {commits.map((c) => (
              <motion.div
                key={c.sha}
                whileHover={{ x: 2 }}
                className="p-3.5 sm:p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="p-2 rounded-xl bg-[#FAF7EE] text-slate-950 font-mono text-xs font-black shrink-0 border-2 border-slate-900 shadow-[1.5px_1.5px_0px_#18181b]">
                    {c.sha.slice(0, 7)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xs font-mono font-bold text-slate-950 leading-snug break-words">{c.message}</h3>
                      {renderProviderBadge(c.provider)}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 mt-1.5 font-mono font-semibold">
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

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
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
        <KokonutCard variant="default" className="p-0 overflow-hidden rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_#18181b]" interactive={false}>
          <div className="p-4 border-b-2 border-slate-900 flex items-center justify-between bg-[#FAF7EE] flex-wrap gap-2">
            <span className="text-xs font-mono font-black text-slate-950 uppercase tracking-wider">
              Pull Request Governance &amp; Review Signoffs ({pullRequests.length})
            </span>
            <span className="text-xs text-slate-600 font-mono font-bold">Peer-review enforcement active</span>
          </div>
          <div className="divide-y-2 divide-slate-900/10">
            {pullRequests.map((pr) => (
              <motion.div
                key={pr.id}
                whileHover={{ x: 2 }}
                className="p-3.5 sm:p-4 hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-[#f3e8ff] text-purple-950 border border-slate-900 shadow-[1px_1px_0px_#18181b]">
                      PR #{pr.id}
                    </span>
                    <h3 className="text-xs font-mono font-bold text-slate-950 break-words">{pr.title}</h3>
                    {renderProviderBadge(pr.provider)}
                    <Badge variant={pr.status === "MERGED" ? "purple" : "success"} size="sm">
                      {pr.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 font-mono font-semibold mt-1">
                    <span className="break-all sm:break-normal">{pr.sourceBranch} ──► {pr.targetBranch}</span>
                    <span>•</span>
                    <span>Author: {pr.author}</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-bold">CI Tests: {pr.ciStatus}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                  <div className="text-left sm:text-right text-[11px] text-slate-600 font-mono font-semibold">
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
        <KokonutCard variant="default" className="p-0 overflow-hidden rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_#18181b]" interactive={false}>
          <div className="p-4 border-b-2 border-slate-900 bg-[#FAF7EE]">
            <span className="text-xs font-mono font-black text-slate-950 uppercase tracking-wider">
              Tracked Repository Branches &amp; Environment Mappings ({branches.length})
            </span>
          </div>
          <div className="divide-y-2 divide-slate-900/10">
            {branches.map((b) => (
              <div key={b.name} className="p-3.5 sm:p-4 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <GitBranch className="w-3.5 h-3.5 text-teal-800 stroke-[2.5]" />
                    <span className="text-xs font-bold font-mono text-slate-950">{b.name}</span>
                    {b.isProtected && (
                      <Badge variant="warning" size="sm">
                        Protected
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 font-mono mt-1 font-semibold">
                    Last commit {b.lastCommit} by {b.author}
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0">
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
