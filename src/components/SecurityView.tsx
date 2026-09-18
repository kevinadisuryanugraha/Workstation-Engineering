import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  ShieldAlert,
  Key,
  Lock,
  User as UserIcon,
  LogOut,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Info,
  Server,
  Terminal,
  FileCode2,
  Check,
  AlertTriangle,
  Zap,
  Users
} from "lucide-react";
import { User, UserRole, Permission, AuthSession } from "../types";
import { ROLE_PERMISSIONS, PERMISSION_DESCRIPTIONS } from "../lib/rbac";
import { DIRECTORY_USERS } from "../lib/auth";
import { Badge } from "./ui/Badge";
import { cn } from "../lib/utils";

interface SecurityViewProps {
  currentSession: AuthSession | null;
  onLogin: (email: string, password?: string) => Promise<boolean>;
  onLogout: () => Promise<void>;
  onSwitchUser: (user: User) => Promise<void>;
  isManagementView?: boolean;
}

export const SecurityView: React.FC<SecurityViewProps> = ({
  currentSession,
  onLogin,
  onLogout,
  onSwitchUser,
  isManagementView = false
}) => {
  const [activeTab, setActiveTab] = useState<"clearance" | "switch" | "login" | "endpoints">("clearance");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  const currentUser = currentSession?.user || DIRECTORY_USERS[0];
  const userRole = currentUser.role || "Viewer";
  const userPermissions = currentSession?.permissions || ROLE_PERMISSIONS[userRole] || [];

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginSuccess(null);
    setIsSubmitting(true);
    try {
      const success = await onLogin(emailInput, passwordInput);
      if (success) {
        setLoginSuccess("Autentikasi berhasil! Sesi JWT baru telah diterbitkan.");
        setEmailInput("");
        setPasswordInput("");
        setTimeout(() => setActiveTab("clearance"), 1000);
      } else {
        setLoginError("Kredensial tidak valid. Silakan periksa kembali email atau password.");
      }
    } catch (err: any) {
      setLoginError(err.message || "Gagal melakukan autentikasi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSwitch = async (user: User) => {
    setIsSubmitting(true);
    try {
      await onSwitchUser(user);
      setActiveTab("clearance");
    } finally {
      setIsSubmitting(false);
    }
  };

  const allPermissionsList = Object.keys(PERMISSION_DESCRIPTIONS) as Permission[];

  const categories = [
    { id: "ALL", label: "Semua Izin" },
    { id: "Navigation", label: "Navigation & Views" },
    { id: "Sprint Backlog", label: "Sprint Backlog" },
    { id: "Quality & Governance", label: "Evidence & Quality" },
    { id: "ITSM Ticketing", label: "Ticketing & ITSM" },
    { id: "Incident Management", label: "War Room & Incidents" },
    { id: "Deployment & Infra", label: "Deploy & VPS Node" },
    { id: "AI Engine", label: "AI & Intelligence" },
    { id: "Admin & Audit", label: "Admin & Telemetry" }
  ];

  const filteredPermissions = allPermissionsList.filter((perm) => {
    if (filterCategory === "ALL") return true;
    return PERMISSION_DESCRIPTIONS[perm].category === filterCategory;
  });

  const endpointsList = [
    {
      method: "POST",
      path: "/api/ai/scan",
      desc: "Menjalankan AST codebase scan dan deteksi utang teknis berbasis Gemini",
      requiredRole: "Developer, Tech Lead, Super Admin",
      requiredPerm: "PERM_AI_SCAN_TRIGGER",
      granted: userPermissions.includes("PERM_AI_SCAN_TRIGGER")
    },
    {
      method: "POST",
      path: "/api/ai/translate",
      desc: "Menerjemahkan laporan teknis ke ringkasan eksekutif dwi-bahasa",
      requiredRole: "Tech Lead, PM, Super Admin",
      requiredPerm: "PERM_AI_TRANSLATE",
      granted: userPermissions.includes("PERM_AI_TRANSLATE")
    },
    {
      method: "POST",
      path: "/api/actions/rollback",
      desc: "Eksekusi emergency rollback versi rilis pada Kontabo VPS Node",
      requiredRole: "Tech Lead, Super Admin",
      requiredPerm: "PERM_DEPLOYMENT_ROLLBACK",
      granted: userPermissions.includes("PERM_DEPLOYMENT_ROLLBACK")
    },
    {
      method: "POST",
      path: "/api/actions/declare-incident",
      desc: "Membuka War Room insiden kritis level produksi & notifikasi tim",
      requiredRole: "Tech Lead, PM, Super Admin",
      requiredPerm: "PERM_INCIDENT_DECLARE",
      granted: userPermissions.includes("PERM_INCIDENT_DECLARE")
    },
    {
      method: "POST",
      path: "/api/agent/heartbeat",
      desc: "Ingestion telemetri daemon systemd Kontabo VPS (CPU, RAM, Disk)",
      requiredRole: "System Daemon, Super Admin",
      requiredPerm: "PERM_USER_MANAGEMENT",
      granted: userPermissions.includes("PERM_USER_MANAGEMENT")
    },
    {
      method: "POST",
      path: "/api/auth/login",
      desc: "Verifikasi identitas enterprise dan penerbitan HMAC-SHA256 JWT",
      requiredRole: "Publik / Terdaftar",
      requiredPerm: "PERM_VIEW_DASHBOARD",
      granted: true
    }
  ];

  return (
    <div className="space-y-6 select-none pb-12">
      {/* Page Header */}
      <div className="bg-[#2ec4b6] border-2 border-slate-900 rounded-2xl p-4 sm:p-6 shadow-[4px_4px_0px_#18181b] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-900 flex items-center justify-center font-bold shadow-[2px_2px_0px_#18181b] shrink-0">
            <ShieldCheck className="w-6 h-6 text-emerald-700 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-mono font-black uppercase text-slate-950 tracking-tight">
                Autentikasi &amp; RBAC Security Engine
              </h1>
              <Badge variant="success" size="sm" className="font-mono text-[10px]">
                VALIDASI KETAT
              </Badge>
              <Badge variant="secondary" size="sm" className="font-mono text-[10px] hidden sm:inline-flex">
                HMAC-SHA256 JWT
              </Badge>
            </div>
            <p className="text-xs font-mono font-bold text-slate-900 mt-0.5">
              {isManagementView
                ? "Portal Pengelolaan Hak Akses & Kepatuhan Keamanan Enterprise (Role-Based Access Control)"
                : "Cryptographic token verification, granular permission matrix, and server middleware clearance"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-white border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] flex items-center gap-2 font-bold text-slate-950">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border border-slate-900" />
            <span>Middleware Active</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white border-2 border-slate-900 rounded-2xl p-1.5 shadow-[3px_3px_0px_#18181b] flex items-center gap-1.5 overflow-x-auto text-xs font-mono font-bold">
        <button
          onClick={() => setActiveTab("clearance")}
          className={cn(
            "px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap",
            activeTab === "clearance"
              ? "bg-[#FAF7EE] border-slate-900 shadow-[2px_2px_0px_#18181b] text-slate-950 font-black"
              : "bg-white border-transparent text-slate-600 hover:text-slate-950 hover:bg-slate-50"
          )}
        >
          <Key className="w-4 h-4 stroke-[2.2]" />
          <span>Izin &amp; Sesi Aktif</span>
          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded border border-emerald-300 text-[10px]">
            {userPermissions.length}/20
          </span>
        </button>

        <button
          onClick={() => setActiveTab("switch")}
          className={cn(
            "px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap",
            activeTab === "switch"
              ? "bg-[#FAF7EE] border-slate-900 shadow-[2px_2px_0px_#18181b] text-slate-950 font-black"
              : "bg-white border-transparent text-slate-600 hover:text-slate-950 hover:bg-slate-50"
          )}
        >
          <RefreshCw className="w-4 h-4 stroke-[2.2]" />
          <span>Ganti Akun Direktori</span>
          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded border border-slate-300 text-[10px]">
            {DIRECTORY_USERS.length} Roles
          </span>
        </button>

        <button
          onClick={() => setActiveTab("login")}
          className={cn(
            "px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap",
            activeTab === "login"
              ? "bg-[#FAF7EE] border-slate-900 shadow-[2px_2px_0px_#18181b] text-slate-950 font-black"
              : "bg-white border-transparent text-slate-600 hover:text-slate-950 hover:bg-slate-50"
          )}
        >
          <Lock className="w-4 h-4 stroke-[2.2]" />
          <span>Login Kredensial</span>
        </button>

        <button
          onClick={() => setActiveTab("endpoints")}
          className={cn(
            "px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap",
            activeTab === "endpoints"
              ? "bg-[#FAF7EE] border-slate-900 shadow-[2px_2px_0px_#18181b] text-slate-950 font-black"
              : "bg-white border-transparent text-slate-600 hover:text-slate-950 hover:bg-slate-50"
          )}
        >
          <Server className="w-4 h-4 stroke-[2.2]" />
          <span>API Routes &amp; Middleware</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <AnimatePresence mode="wait">
        {/* TAB 1: CLEARANCE & ACTIVE PERMISSIONS */}
        {activeTab === "clearance" && (
          <motion.div
            key="clearance"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {/* Identity Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#18181b] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-[#f6ae2d] border-2 border-slate-900 flex items-center justify-center font-mono font-black text-lg text-slate-950 shadow-[3px_3px_0px_#18181b]">
                    {currentUser.avatar || "US"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-base sm:text-lg font-mono font-black text-slate-950">
                        {currentUser.name}
                      </h2>
                      <Badge
                        variant={
                          userRole === "Super Admin" || userRole === "Tech Lead"
                            ? "success"
                            : userRole === "Manager" || userRole === "Project Manager"
                            ? "purple"
                            : "secondary"
                        }
                        size="sm"
                        className="font-mono text-[11px]"
                      >
                        {userRole}
                      </Badge>
                    </div>
                    <p className="text-xs font-mono text-slate-600 mt-0.5">
                      {currentUser.email} • {currentUser.team || "Platform Operations"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      await onLogout();
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border-2 border-rose-300 font-mono font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-[2px_2px_0px_#fda4af] active:translate-x-0.5 active:translate-y-0.5"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              {/* Security Telemetry Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
                <div className="p-3 bg-[#FAF7EE] rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#18181b]">
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Token Protocol</span>
                  <span className="font-black text-slate-950">HMAC-SHA256 (JWT)</span>
                </div>
                <div className="p-3 bg-[#FAF7EE] rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#18181b]">
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Status Middleware</span>
                  <span className="font-black text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>VERIFIED AUTHENTIC</span>
                  </span>
                </div>
                <div className="p-3 bg-[#FAF7EE] rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#18181b]">
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Sesi Berakhir</span>
                  <span className="font-black text-slate-950">24 Jam (Auto-Renew)</span>
                </div>
                <div className="p-3 bg-[#FAF7EE] rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#18181b]">
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Akses Granular</span>
                  <span className="font-black text-emerald-700">
                    {userPermissions.length} / {allPermissionsList.length} Izin Aktif
                  </span>
                </div>
              </div>
            </div>

            {/* Granular Permission Matrix */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
                  <h3 className="text-sm sm:text-base font-mono font-black uppercase text-slate-950">
                    Matriks Hak Akses Granular ({userPermissions.length}/{allPermissionsList.length})
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-600 font-bold">
                  Enforced by Server Middleware: <code className="text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">requirePermission()</code>
                </span>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setFilterCategory(cat.id)}
                    className={cn(
                      "px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer",
                      filterCategory === cat.id
                        ? "bg-slate-900 text-white border-slate-900 shadow-[2px_2px_0px_#18181b]"
                        : "bg-white text-slate-700 border-slate-300 hover:border-slate-900 hover:bg-slate-50"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Permissions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredPermissions.map((perm) => {
                  const isGranted = userPermissions.includes(perm);
                  const details = PERMISSION_DESCRIPTIONS[perm];

                  return (
                    <div
                      key={perm}
                      className={cn(
                        "p-3.5 rounded-xl border-2 transition-all flex items-start justify-between gap-3",
                        isGranted
                          ? "bg-white border-slate-900 shadow-[3px_3px_0px_#18181b]"
                          : "bg-slate-50/70 border-dashed border-slate-300 opacity-60"
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={cn(
                            "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border",
                            isGranted
                              ? "bg-emerald-100 border-emerald-500 text-emerald-800"
                              : "bg-slate-200 border-slate-300 text-slate-400"
                          )}
                        >
                          {isGranted ? (
                            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                          ) : (
                            <XCircle className="w-4 h-4 stroke-[2]" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "text-xs font-mono font-black",
                                isGranted ? "text-slate-950" : "text-slate-500"
                              )}
                            >
                              {details.label}
                            </span>
                            <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {details.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                            {details.description}
                          </p>
                          <code className="text-[9px] font-mono text-slate-400 block mt-1">
                            {perm}
                          </code>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isGranted ? (
                          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-md">
                            GRANTED
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                            LOCKED
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: SWITCH DIRECTORY ROLE */}
        {activeTab === "switch" && (
          <motion.div
            key="switch"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            <div className="bg-white border-2 border-slate-900 rounded-2xl p-5 shadow-[4px_4px_0px_#18181b] space-y-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-indigo-600 stroke-[2.5]" />
                <h3 className="text-base font-mono font-black uppercase text-slate-950">
                  Direktori Pengguna &amp; Simulasi Peran (One-Click Switch)
                </h3>
              </div>
              <p className="text-xs text-slate-600 font-mono">
                Pilih profil peran di bawah untuk langsung beralih identitas dan menguji validasi RBAC pada antarmuka serta API endpoint. Sesi JWT akan diperbarui dan ditandatangani secara kriptografis seketika.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DIRECTORY_USERS.map((user) => {
                const isCurrent = currentUser.email === user.email;
                const userPerms = ROLE_PERMISSIONS[user.role] || [];

                return (
                  <div
                    key={user.id}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all flex flex-col justify-between gap-4",
                      isCurrent
                        ? "bg-[#FAF7EE] border-slate-900 shadow-[4px_4px_0px_#18181b] ring-2 ring-[#2ec4b6]"
                        : "bg-white border-slate-900 shadow-[2px_2px_0px_#18181b] hover:shadow-[4px_4px_0px_#18181b]"
                    )}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-11 h-11 rounded-xl border-2 border-slate-900 flex items-center justify-center font-mono font-black text-sm text-slate-950 shadow-[2px_2px_0px_#18181b]",
                              isCurrent ? "bg-[#2ec4b6]" : "bg-[#f6ae2d]"
                            )}
                          >
                            {user.avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-mono font-black text-slate-950">{user.name}</h4>
                            </div>
                            <span className="text-[11px] font-mono text-slate-600">{user.email}</span>
                          </div>
                        </div>

                        <Badge
                          variant={
                            user.role === "Super Admin" || user.role === "Tech Lead"
                              ? "success"
                              : user.role === "Manager" || user.role === "Project Manager"
                              ? "purple"
                              : "secondary"
                          }
                          size="sm"
                          className="font-mono text-[10px]"
                        >
                          {user.role}
                        </Badge>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-700 font-mono space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                          <span>TOTAL HAK AKSES:</span>
                          <span className="text-emerald-700 font-black">{userPerms.length} / 20 Izin</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${(userPerms.length / 20) * 100}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 pt-1">
                          {user.role === "Super Admin"
                            ? "Full system control, war room commander, emergency rollback, user management."
                            : user.role === "Tech Lead"
                            ? "Codebase AI scans, architecture approvals, deployments, incident handling."
                            : user.role === "Project Manager" || user.role === "Manager"
                            ? "Sprint planning, work item authoring, SLA governance, executive reports."
                            : user.role === "Developer"
                            ? "Code commits, branch management, acceptance criteria checking, task updates."
                            : user.role === "QA"
                            ? "Quality verification, ticket triage, bug filing, evidence verification."
                            : user.role === "Support"
                            ? "ITSM ticket creation, customer communications, SLA tracking, telemetry."
                            : "Read-only access to overview metrics and high-level health indicators."}
                        </p>
                      </div>
                    </div>

                    <div>
                      {isCurrent ? (
                        <div className="w-full py-2 bg-emerald-50 text-emerald-800 border-2 border-emerald-300 rounded-xl text-xs font-mono font-black text-center flex items-center justify-center gap-2">
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>SEDANG AKTIF SEBAGAI PERAN INI</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleQuickSwitch(user)}
                          disabled={isSubmitting}
                          className="w-full py-2 bg-white hover:bg-slate-900 hover:text-white text-slate-950 border-2 border-slate-900 rounded-xl text-xs font-mono font-black transition-all shadow-[2px_2px_0px_#18181b] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
                        >
                          <span>Beralih ke Akun Ini</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* TAB 3: LOGIN KREDENSIAL */}
        {activeTab === "login" && (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="max-w-xl mx-auto space-y-6"
          >
            <div className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-[4px_4px_0px_#18181b] space-y-5">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-[#ff70a6] border-2 border-slate-900 flex items-center justify-center mx-auto shadow-[2px_2px_0px_#18181b]">
                  <Lock className="w-6 h-6 text-slate-950 stroke-[2.5]" />
                </div>
                <h3 className="text-base font-mono font-black uppercase text-slate-950 pt-2">
                  Enterprise Credential Authentication
                </h3>
                <p className="text-xs font-mono text-slate-600">
                  Masukkan email dan kata sandi korporat untuk menerbitkan sesi token JWT baru.
                </p>
              </div>

              {loginError && (
                <div className="p-3 bg-rose-50 border-2 border-rose-400 rounded-xl text-rose-800 text-xs font-mono flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {loginSuccess && (
                <div className="p-3 bg-emerald-50 border-2 border-emerald-400 rounded-xl text-emerald-800 text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{loginSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCustomLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold text-slate-900">
                    Corporate Email:
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="nama@company.com"
                    required
                    className="w-full bg-[#FAF7EE] border-2 border-slate-900 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-950 focus:outline-none focus:ring-2 focus:ring-[#2ec4b6] shadow-[2px_2px_0px_#18181b]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold text-slate-900">
                    Password / Master Key:
                  </label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full bg-[#FAF7EE] border-2 border-slate-900 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-950 focus:outline-none focus:ring-2 focus:ring-[#2ec4b6] shadow-[2px_2px_0px_#18181b]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-[#2ec4b6] hover:bg-[#28af9e] text-slate-950 border-2 border-slate-900 rounded-xl font-mono font-black text-xs transition-all shadow-[3px_3px_0px_#18181b] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  <span>{isSubmitting ? "Memverifikasi..." : "Autentikasi & Dapatkan Sesi"}</span>
                </button>
              </form>

              {/* Quick Preset Accounts */}
              <div className="pt-3 border-t border-slate-200">
                <p className="text-[11px] font-mono font-bold text-slate-500 mb-2">Preset Cepat Akun Uji:</p>
                <div className="flex flex-wrap gap-1.5">
                  {DIRECTORY_USERS.slice(0, 4).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setEmailInput(u.email);
                        setPasswordInput("password123");
                      }}
                      className="text-[10px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-800 px-2 py-1 rounded-lg border border-slate-300 transition-colors cursor-pointer"
                    >
                      {u.name.split(" ")[0]} ({u.role})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: API ROUTES & MIDDLEWARE */}
        {activeTab === "endpoints" && (
          <motion.div
            key="endpoints"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            <div className="bg-white border-2 border-slate-900 rounded-2xl p-5 shadow-[4px_4px_0px_#18181b] space-y-2">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-purple-600 stroke-[2.5]" />
                <h3 className="text-base font-mono font-black uppercase text-slate-950">
                  Proteksi Rute Backend Express &amp; Server Middleware
                </h3>
              </div>
              <p className="text-xs text-slate-600 font-mono">
                Seluruh endpoint di bawah ini diproteksi oleh middleware autentikasi server-side HMAC-SHA256 (`authenticateToken`) dan validasi izin granular (`requirePermission`). Permintaan tanpa token sah akan ditolak dengan status HTTP 401 Unauthorized atau 403 Forbidden.
              </p>
            </div>

            <div className="space-y-3">
              {endpointsList.map((ep, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#18181b] flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono font-black text-[10px]">
                        {ep.method}
                      </span>
                      <code className="text-xs font-mono font-black text-slate-950 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                        {ep.path}
                      </code>
                      <span className="text-[10px] text-slate-500 font-bold">
                        Syarat Izin: <code className="text-indigo-700">{ep.requiredPerm}</code>
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-sans font-medium">
                      {ep.desc}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Peran Minimum: <span className="font-bold text-slate-800">{ep.requiredRole}</span>
                    </p>
                  </div>

                  <div className="shrink-0">
                    {ep.granted ? (
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border-2 border-emerald-400 font-mono font-black text-xs flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_#86efac]">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>AUTHORIZED FOR CURRENT USER</span>
                      </div>
                    ) : (
                      <div className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border-2 border-rose-300 font-mono font-bold text-xs flex items-center gap-1.5">
                        <Lock className="w-4 h-4" />
                        <span>403 FORBIDDEN</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
