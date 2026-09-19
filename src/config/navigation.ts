/**
 * Navigation Registry — Course Correction 4 (Story 17.1)
 *
 * Single source of truth untuk sidebar: setiap item nav dianotasi dengan
 * grup tampilan dan permission minimal (memakai Permission eksisting dari
 * src/types.ts — mirror dari server/constants/permissions.ts).
 *
 * Prinsip: progressive disclosure — item yang permission-nya tidak dimiliki
 * role pengguna disembunyikan sepenuhnya (bukan disabled).
 * Lihat: bmad-output/decision-log.md (CC-4, 2026-09-19).
 */
import {
  LayoutDashboard,
  Compass,
  CheckSquare,
  Ticket as TicketIcon,
  GitBranch,
  Rocket,
  Server,
  Sparkles,
  FileText,
  BookOpen,
  History,
  Code2,
  ShieldAlert,
  ShieldCheck
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Permission } from "../types";

export type NavGroupId = "kerjaanku" | "operations" | "governance";

/** Semua id view yang valid. (blueprint dihapus di story 17.3.) */
export type ActiveTab =
  | "overview"
  | "project360"
  | "workitems"
  | "tickets"
  | "incidents"
  | "git"
  | "deployments"
  | "infrastructure"
  | "ai"
  | "reports"
  | "report-id"
  | "blueprint"
  | "knowledge"
  | "audit"
  | "security";

export type NavBadgeTone =
  | "default"
  | "emerald"
  | "amber"
  | "cyan"
  | "purple"
  | "destructive";

export interface NavItem {
  id: ActiveTab;
  label: string;
  icon: LucideIcon;
  group: NavGroupId;
  /** Permission minimal — bila role tidak memilikinya, item disembunyikan. */
  requiredPermission: Permission;
  /** Badge statis (data demo di-gating di story 17.2; badge dinamis di-inject Sidebar). */
  badge?: string;
  badgeType?: NavBadgeTone;
}

export interface NavGroupDef {
  id: NavGroupId;
  label: string;
  description: string;
}

/** Urutan grup = urutan tampil di sidebar. */
export const NAV_GROUPS: NavGroupDef[] = [
  { id: "kerjaanku", label: "Kerjaanku", description: "Ruang kerja harian" },
  { id: "operations", label: "Operations", description: "Telemetry, delivery & intelijen" },
  { id: "governance", label: "Governance", description: "Keamanan & audit trail" }
];

export const NAV_ITEMS: NavItem[] = [
  // ── Kerjaanku ──────────────────────────────────────────────────────────
  {
    id: "overview",
    label: "Global Overview",
    icon: LayoutDashboard,
    group: "kerjaanku",
    requiredPermission: "PERM_VIEW_DASHBOARD"
  },
  {
    id: "project360",
    label: "Project 360°",
    icon: Compass,
    group: "kerjaanku",
    requiredPermission: "PERM_VIEW_MANAGEMENT",
    badge: "82%",
    badgeType: "emerald"
  },
  {
    id: "workitems",
    label: "Work Items & Sprints",
    icon: CheckSquare,
    group: "kerjaanku",
    requiredPermission: "PERM_WORK_ITEM_UPDATE",
    badge: "3 Active",
    badgeType: "default"
  },
  {
    id: "tickets",
    label: "Ticketing & ITSM",
    icon: TicketIcon,
    group: "kerjaanku",
    requiredPermission: "PERM_TICKET_CREATE"
  },
  // ── Operations ─────────────────────────────────────────────────────────
  {
    id: "incidents",
    label: "Incident Room",
    icon: ShieldAlert,
    group: "operations",
    requiredPermission: "PERM_VIEW_ENGINEERING"
  },
  {
    id: "git",
    label: "Git Intelligence",
    icon: GitBranch,
    group: "operations",
    requiredPermission: "PERM_VIEW_ENGINEERING",
    badge: "4 Commits",
    badgeType: "default"
  },
  {
    id: "deployments",
    label: "Deployments",
    icon: Rocket,
    group: "operations",
    requiredPermission: "PERM_DEPLOYMENT_EXECUTE",
    badge: "v1.4.2",
    badgeType: "emerald"
  },
  {
    id: "infrastructure",
    label: "Infrastructure (Nodes)",
    icon: Server,
    group: "operations",
    requiredPermission: "PERM_SERVER_TELEMETRY",
    badge: "2 Live",
    badgeType: "cyan"
  },
  {
    id: "ai",
    label: "AI Codebase Intel",
    icon: Sparkles,
    group: "operations",
    requiredPermission: "PERM_VIEW_ENGINEERING"
  },
  {
    id: "reports",
    label: "Reports & Daily Logs",
    icon: FileText,
    group: "operations",
    requiredPermission: "PERM_VIEW_MANAGEMENT",
    badge: "Today",
    badgeType: "default"
  },
  {
    id: "report-id",
    label: "Laporan Manajemen (ID)",
    icon: FileText,
    group: "operations",
    requiredPermission: "PERM_VIEW_MANAGEMENT",
    badge: "Auto",
    badgeType: "emerald"
  },
  {
    id: "knowledge",
    label: "Knowledge Base",
    icon: BookOpen,
    group: "operations",
    requiredPermission: "PERM_VIEW_DASHBOARD"
  },
  // ── Governance ─────────────────────────────────────────────────────────
  {
    id: "security",
    label: "Security & RBAC",
    icon: ShieldCheck,
    group: "governance",
    requiredPermission: "PERM_AUDIT_LOGS_VIEW",
    badge: "Validasi Ketat",
    badgeType: "emerald"
  },
  {
    id: "audit",
    label: "Event Bus & Audit",
    icon: History,
    group: "governance",
    requiredPermission: "PERM_AUDIT_LOGS_VIEW"
  },
  {
    // Catatan: item ini keluar dari produk di story 17.3 (CC-4).
    id: "blueprint",
    label: "Blueprint 01–21 (Specs)",
    icon: Code2,
    group: "governance",
    requiredPermission: "PERM_VIEW_MANAGEMENT",
    badge: "v1.0",
    badgeType: "default"
  }
];

/**
 * Pure function (tanpa dependensi React) — menyaring item nav berdasarkan
 * permission yang dimiliki role. Dipakai Sidebar dan fallback view di App.
 */
export function filterNavigation<T extends { requiredPermission: Permission }>(
  items: readonly T[],
  permissions: readonly Permission[]
): T[] {
  const owned = new Set(permissions);
  return items.filter((item) => owned.has(item.requiredPermission));
}
