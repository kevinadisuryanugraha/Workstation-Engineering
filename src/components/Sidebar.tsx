import React from "react";
import { motion, AnimatePresence } from "motion/react";
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
  ShieldCheck,
  Activity,
  X
} from "lucide-react";
import { Badge } from "./ui/Badge";
import { cn } from "../lib/utils";

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

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  openTicketsCount: number;
  criticalIncidentsCount: number;
  aiFindingsCount: number;
  isManagementView: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  openTicketsCount,
  criticalIncidentsCount,
  aiFindingsCount,
  isManagementView,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const mainNav = [
    { id: "overview", label: "Global Overview", icon: LayoutDashboard, badge: null },
    { id: "project360", label: "Project 360°", icon: Compass, badge: "82%", badgeType: "emerald" },
    { id: "workitems", label: "Work Items & Sprints", icon: CheckSquare, badge: "3 Active", badgeType: "default" },
    { id: "tickets", label: "Ticketing & ITSM", icon: TicketIcon, badge: openTicketsCount > 0 ? `${openTicketsCount} Open` : null, badgeType: "amber" },
    {
      id: "incidents",
      label: "Incident Room",
      icon: ShieldAlert,
      badge: criticalIncidentsCount > 0 ? `${criticalIncidentsCount} Critical` : null,
      badgeType: "destructive",
      pulse: criticalIncidentsCount > 0
    }
  ];

  const opsNav = [
    { id: "git", label: "Git Intelligence", icon: GitBranch, badge: "4 Commits", badgeType: "default" },
    { id: "deployments", label: "Deployments", icon: Rocket, badge: "v1.4.2", badgeType: "emerald" },
    { id: "infrastructure", label: "Infrastructure (Nodes)", icon: Server, badge: "2 Live", badgeType: "cyan" },
    {
      id: "ai",
      label: "AI Codebase Intel",
      icon: Sparkles,
      badge: `${aiFindingsCount} Findings`,
      badgeType: "purple",
      pulse: aiFindingsCount > 0
    }
  ];

  const deliveryNav = [
    { id: "security", label: "Security & RBAC", icon: ShieldCheck, badge: "Validasi Ketat", badgeType: "emerald" },
    { id: "reports", label: "Reports & Daily Logs", icon: FileText, badge: "Today", badgeType: "default" },
    { id: "report-id", label: "Laporan Manajemen (ID)", icon: FileText, badge: "Auto", badgeType: "emerald" },
    { id: "blueprint", label: "Blueprint 01–21 (Specs)", icon: Code2, badge: "v1.0", badgeType: "default" },
    { id: "knowledge", label: "Knowledge Base", icon: BookOpen, badge: null },
    { id: "audit", label: "Event Bus & Audit", icon: History, badge: null }
  ];

  const handleItemClick = (tabId: ActiveTab) => {
    onSelectTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderNavGroup = (title: string, items: typeof mainNav) => (
    <div className="space-y-1.5">
      <p className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center justify-between">
        <span>{title}</span>
      </p>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id as ActiveTab)}
              className={cn(
                "relative w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all text-left group select-none outline-none cursor-pointer",
                isActive
                  ? "text-slate-950 font-black"
                  : "text-slate-700 hover:text-slate-950 hover:bg-white/80"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  className="absolute inset-0 bg-[#f6ae2d] border-2 border-slate-900 rounded-xl shadow-[2px_2px_0px_#18181b]"
                />
              )}
              <div className="relative z-10 flex items-center gap-2.5 min-w-0 flex-1">
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors stroke-[2.5]",
                    isActive ? "text-slate-950" : "text-slate-700 group-hover:text-slate-950"
                  )}
                />
                <span className="truncate" title={item.label}>{item.label}</span>
              </div>
              {item.badge && (
                <span className="relative z-10 shrink-0 ml-auto pl-1">
                  <Badge
                    size="sm"
                    variant={
                      item.badgeType === "emerald"
                        ? "success"
                        : item.badgeType === "destructive"
                        ? "destructive"
                        : item.badgeType === "amber"
                        ? "warning"
                        : item.badgeType === "cyan"
                        ? "cyan"
                        : item.badgeType === "purple"
                        ? "purple"
                        : "secondary"
                    }
                    pulse={item.pulse}
                    className="whitespace-nowrap"
                  >
                    {item.badge}
                  </Badge>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const sidebarContent = (
    <>
      <div className="space-y-6">
        {/* Navigation Section 1: Core Lifecycle */}
        {renderNavGroup("Core Workstation", mainNav)}

        {/* Navigation Section 2: Operations & AI */}
        {renderNavGroup("Telemetry & Observability", opsNav)}

        {/* Navigation Section 3: Delivery & Governance */}
        {renderNavGroup("Delivery & Specifications", deliveryNav)}
      </div>

      {/* Retro Status Card on Footer */}
      <div className="mt-6 pt-3 border-t-2 border-slate-900 space-y-2">
        <div className="p-2.5 rounded-xl bg-white border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] space-y-1.5 font-mono">
          <div className="flex items-center justify-between text-[11px] font-black text-slate-900">
            <span>KONTABO NODE</span>
            <span className="text-[#10b981] font-bold">ONLINE</span>
          </div>
          <p className="text-[10px] text-slate-600 font-bold leading-tight">
            100% telemetry verified via systemd agent daemon.
          </p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 bg-[#FAF7EE] border-r-2 border-slate-900 flex-col justify-between p-3.5 select-none shrink-0 min-h-[calc(100vh-4rem)]">
        {sidebarContent}
      </aside>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px]"
            />

            {/* Slide-in Window */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="relative w-80 max-w-[85vw] h-full bg-[#FAF7EE] border-r-[3px] border-slate-900 shadow-[6px_0px_0px_#18181b] flex flex-col z-10 select-none overflow-y-auto"
            >
              {/* Drawer Top Header (Retro OS Style) */}
              <div className="bg-[#2ec4b6] border-b-2 border-slate-900 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#f6ae2d] border border-slate-900 flex items-center justify-center font-mono font-black text-xs text-slate-950 shadow-xs">
                    WS
                  </div>
                  <span className="font-mono font-black text-xs text-slate-950 uppercase tracking-wider">
                    NAVIGATION MENU
                  </span>
                </div>
                <button
                  onClick={onCloseMobile}
                  className="w-7 h-7 rounded-lg bg-white hover:bg-[#ff70a6] hover:text-white border-2 border-slate-900 flex items-center justify-center font-bold text-xs shadow-[1.5px_1.5px_0px_#18181b] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                {sidebarContent}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
