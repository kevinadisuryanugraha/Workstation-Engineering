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
  Info,
  Server,
  Terminal,
  FileCode2,
  Check,
  AlertTriangle,
  Zap,
  Users
} from "lucide-react";
import { UserRole, Permission, AuthSession } from "../types.ts";
import { ROLE_PERMISSIONS, PERMISSION_DESCRIPTIONS } from "../lib/rbac.ts";
import { DIRECTORY_USERS } from "../lib/auth.ts";
import { Badge } from "./ui/Badge.tsx";
import { cn } from "../lib/utils.ts";

interface SecurityViewProps {
  currentSession: AuthSession | null;
  onLogout: () => Promise<void>;
  isManagementView?: boolean;
}

export const SecurityView: React.FC<SecurityViewProps> = ({
  currentSession,
  onLogout,
  isManagementView = false
}) => {
  const [activeTab, setActiveTab] = useState<"clearance" | "endpoints" | "directory">("clearance");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  const currentUser = currentSession?.user || DIRECTORY_USERS[0];
  const userRole = currentUser.role || "Viewer";
  const userPermissions = currentSession?.permissions || ROLE_PERMISSIONS[userRole] || [];

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
      path: "/api/v1/work-items",
      desc: "Membuat work item / task deliverable baru dalam sprint",
      requiredRole: "Developer, Tech Lead, Project Manager, Admin",
      requiredPerm: "PERM_WORK_ITEM_CREATE",
      granted: userPermissions.includes("PERM_WORK_ITEM_CREATE")
    },
    {
      method: "PUT",
      path: "/api/v1/work-items/:id",
      desc: "Mengubah status atau metadata work item (DoD Gate validation)",
      requiredRole: "Developer, Tech Lead, Project Manager, Admin",
      requiredPerm: "PERM_WORK_ITEM_UPDATE",
      granted: userPermissions.includes("PERM_WORK_ITEM_UPDATE")
    },
    {
      method: "POST",
      path: "/api/v1/tickets",
      desc: "Membuat tiket ITSM baru (Bug, Incident, Technical Issue)",
      requiredRole: "Developer, QA, Support, PM, Admin",
      requiredPerm: "PERM_TICKET_CREATE",
      granted: userPermissions.includes("PERM_TICKET_CREATE")
    },
    {
      method: "PATCH",
      path: "/api/v1/tickets/:id/triage",
      desc: "Menugaskan tiket dan mengubah tingkat prioritas penanganan",
      requiredRole: "Tech Lead, Project Manager, Admin",
      requiredPerm: "PERM_TICKET_UPDATE",
      granted: userPermissions.includes("PERM_TICKET_UPDATE")
    },
    {
      method: "POST",
      path: "/api/v1/deployments",
      desc: "Mencatat eksekusi deployment ke environment target",
      requiredRole: "Tech Lead, Developer, Admin",
      requiredPerm: "PERM_DEPLOYMENT_EXECUTE",
      granted: userPermissions.includes("PERM_DEPLOYMENT_EXECUTE")
    },
    {
      method: "POST",
      path: "/api/v1/deployments/rollback",
      desc: "Otorisasi rollback darurat dengan tanda tangan kriptografis HMAC-SHA256",
      requiredRole: "Tech Lead, Org Admin, Super Admin (HANYA LEAD/ADMIN)",
      requiredPerm: "PERM_DEPLOYMENT_ROLLBACK",
      granted: userPermissions.includes("PERM_DEPLOYMENT_ROLLBACK")
    },
    {
      method: "GET",
      path: "/api/v1/audit-logs",
      desc: "Inspeksi jejak audit forensik append-only dengan correlation IDs",
      requiredRole: "Manager, PM, Tech Lead, Admin",
      requiredPerm: "PERM_AUDIT_LOGS_VIEW",
      granted: userPermissions.includes("PERM_AUDIT_LOGS_VIEW")
    },
    {
      method: "POST",
      path: "/api/v1/webhooks/github",
      desc: "Receiver webhook resmi GitHub (verifikasi X-Hub-Signature-256)",
      requiredRole: "GitHub Ingestion System",
      requiredPerm: "Public Webhook (Signed)",
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

        <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-white border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] flex items-center gap-2 font-bold text-slate-950 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border border-slate-900" />
            <span>Middleware Active</span>
          </div>
          <button
            onClick={onLogout}
            className="px-3 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 border-2 border-slate-900 text-red-950 font-bold shadow-[2px_2px_0px_#18181b] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1.5 cursor-pointer shrink-0"
            title="Sign Out / Lock Workspace"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
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
          onClick={() => setActiveTab("endpoints")}
          className={cn(
            "px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap",
            activeTab === "endpoints"
              ? "bg-[#FAF7EE] border-slate-900 shadow-[2px_2px_0px_#18181b] text-slate-950 font-black"
              : "bg-white border-transparent text-slate-600 hover:text-slate-950 hover:bg-slate-50"
          )}
        >
          <Terminal className="w-4 h-4 stroke-[2.2]" />
          <span>Kebijakan Endpoint Server</span>
          <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded border border-purple-300 text-[10px]">
            {endpointsList.filter((e) => e.granted).length}/{endpointsList.length} Allowed
          </span>
        </button>

        <button
          onClick={() => setActiveTab("directory")}
          className={cn(
            "px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap",
            activeTab === "directory"
              ? "bg-[#FAF7EE] border-slate-900 shadow-[2px_2px_0px_#18181b] text-slate-950 font-black"
              : "bg-white border-transparent text-slate-600 hover:text-slate-950 hover:bg-slate-50"
          )}
        >
          <Users className="w-4 h-4 stroke-[2.2]" />
          <span>Direktori Peran Organisasi</span>
          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded border border-slate-300 text-[10px]">
            {DIRECTORY_USERS.length} Roles
          </span>
        </button>
      </div>

      {/* Main Tab Content Canvas */}
      <AnimatePresence mode="wait">
        {/* TAB 1: CLEARANCE & PERMISSIONS CHECKLIST */}
        {activeTab === "clearance" && (
          <motion.div
            key="clearance"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {/* Active Session Identity Card */}
            <div className="bg-white border-2 border-slate-900 rounded-2xl p-5 shadow-[4px_4px_0px_#18181b]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#2ec4b6] border-2 border-slate-900 flex items-center justify-center font-mono font-black text-xl text-slate-950 shadow-[2px_2px_0px_#18181b]">
                    {currentUser.avatar}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-mono font-black text-slate-950">
                        {currentUser.name}
                      </h2>
                      <Badge variant="success" size="sm" className="font-mono text-[10px]">
                        {currentUser.role}
                      </Badge>
                      <span className="text-[11px] font-mono text-slate-500 font-bold">
                        Tim: {currentUser.team}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono text-slate-600">
                      <span>{currentUser.email}</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Sesi Kriptografis Aktif
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#FAF7EE] border-2 border-slate-900 rounded-xl font-mono text-xs space-y-1 shrink-0">
                  <div className="flex items-center justify-between gap-4 text-[11px] text-slate-600">
                    <span>Token Signature:</span>
                    <span className="font-bold text-slate-900">HMAC-SHA256</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-[11px] text-slate-600">
                    <span>Masa Berlaku:</span>
                    <span className="font-bold text-emerald-700">24 Jam (Stateless)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pb-1 text-xs font-mono">
              <span className="text-slate-500 font-bold text-[11px] mr-1">Filter:</span>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl border-2 transition-all font-bold cursor-pointer whitespace-nowrap",
                    filterCategory === cat.id
                      ? "bg-slate-900 text-white border-slate-900 shadow-[2px_2px_0px_#18181b]"
                      : "bg-white text-slate-700 border-slate-900 hover:bg-slate-50 shadow-[1px_1px_0px_#18181b]"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Permissions Matrix Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredPermissions.map((perm) => {
                const info = PERMISSION_DESCRIPTIONS[perm];
                const isGranted = userPermissions.includes(perm);

                return (
                  <div
                    key={perm}
                    className={cn(
                      "p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between gap-2.5",
                      isGranted
                        ? "bg-white border-slate-900 shadow-[2px_2px_0px_#18181b]"
                        : "bg-slate-100/70 border-slate-300 opacity-60"
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {info.category}
                        </span>
                        {isGranted ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono text-[9px] font-black flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" />
                            ALLOWED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 border border-slate-300 font-mono text-[9px] font-bold">
                            DENIED
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-mono font-black text-slate-950 leading-tight">
                        {info.label}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-600 leading-snug">
                        {info.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span className="truncate">{perm}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* TAB 2: ENDPOINT SECURITY MATRIX */}
        {activeTab === "endpoints" && (
          <motion.div
            key="endpoints"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            <div className="bg-white border-2 border-slate-900 rounded-2xl p-5 shadow-[4px_4px_0px_#18181b] space-y-2">
              <h3 className="text-base font-mono font-black uppercase text-slate-950">
                Matriks Perlindungan Endpoint Server (Server-Authoritative)
              </h3>
              <p className="text-xs text-slate-600 font-mono">
                Setiap endpoint transaksional di bawah ini divalidasi oleh middleware server Express (`authenticateToken` &amp; `requirePermission`). Permintaan tanpa izin yang memadai akan ditolak seketika dengan kode 403 Forbidden.
              </p>
            </div>

            <div className="space-y-3">
              {endpointsList.map((ep, idx) => (
                <div
                  key={idx}
                  className="bg-white border-2 border-slate-900 rounded-2xl p-4 shadow-[3px_3px_0px_#18181b] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
                      <span className="px-2 py-0.5 bg-slate-900 text-white rounded font-bold text-[10px]">
                        {ep.method}
                      </span>
                      <span className="font-bold text-slate-950 truncate">{ep.path}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded border border-slate-300 bg-slate-50 text-slate-600">
                        {ep.requiredPerm}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-mono">{ep.desc}</p>
                    <div className="text-[10px] font-mono text-slate-500">
                      Izin minimal: <span className="font-bold text-slate-800">{ep.requiredRole}</span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {ep.granted ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-900 border-2 border-emerald-300 rounded-xl font-mono text-xs font-black">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Akses Diizinkan</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-900 border-2 border-rose-300 rounded-xl font-mono text-xs font-bold">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Ditolak (403)</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* TAB 3: ORGANIZATIONAL ROLE DIRECTORY (READ-ONLY AUDIT) */}
        {activeTab === "directory" && (
          <motion.div
            key="directory"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            <div className="bg-white border-2 border-slate-900 rounded-2xl p-5 shadow-[4px_4px_0px_#18181b] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-mono font-black uppercase text-slate-950">
                  Direktori Anggota Organisasi &amp; Peran Resmi
                </h3>
                <p className="text-xs text-slate-600 font-mono">
                  Daftar profil resmi terdaftar dalam sistem enterprise. Untuk berganti akun atau menguji peran lain, gunakan tombol <strong>Sign Out</strong> di Header untuk kembali ke Auth Gateway.
                </p>
              </div>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl border-2 border-slate-900 font-mono text-xs font-bold shadow-[2px_2px_0px_#18181b] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer shrink-0"
              >
                Sign Out &amp; Switch Role
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DIRECTORY_USERS.map((user) => {
                const isCurrent = currentUser.email === user.email;
                const userPerms = ROLE_PERMISSIONS[user.role as UserRole] || [];

                return (
                  <div
                    key={user.id}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all flex flex-col justify-between gap-4",
                      isCurrent
                        ? "bg-[#FAF7EE] border-slate-900 shadow-[4px_4px_0px_#18181b] ring-2 ring-[#2ec4b6]"
                        : "bg-white border-slate-900 shadow-[2px_2px_0px_#18181b]"
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
                            <h4 className="text-sm font-mono font-black text-slate-950">{user.name}</h4>
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

                      <div className="p-2.5 bg-[#FAF7EE] rounded-xl border-2 border-slate-900/30 text-[11px] text-slate-800 font-mono space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                          <span>TOTAL HAK AKSES RESMI:</span>
                          <span className="text-emerald-700 font-black">{userPerms.length} / 20 Izin</span>
                        </div>
                        <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-slate-900/30">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${(userPerms.length / 20) * 100}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-600 font-semibold pt-1">
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

                    {isCurrent ? (
                      <div className="w-full py-2 bg-emerald-50 text-emerald-800 border-2 border-emerald-300 rounded-xl text-xs font-mono font-black text-center flex items-center justify-center gap-2">
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>SEDANG AKTIF PADA SESI INI</span>
                      </div>
                    ) : (
                      <div className="w-full py-1.5 bg-slate-50 text-slate-500 border border-slate-200 rounded-xl text-[11px] font-mono text-center">
                        Role Registered in Enterprise Directory
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
