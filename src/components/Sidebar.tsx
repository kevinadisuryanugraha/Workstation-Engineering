import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, X } from "lucide-react";
import {
  NAV_ITEMS,
  NAV_GROUPS,
  filterNavigation
} from "../config/navigation";
import type { ActiveTab, NavBadgeTone, NavGroupId, NavItem } from "../config/navigation";

/** Kompatibilitas: konsumen lama meng-import ActiveTab dari Sidebar. */
export type { ActiveTab } from "../config/navigation";
import { ROLE_PERMISSIONS } from "../lib/rbac";
import type { UserRole } from "../types";
import { Badge } from "./ui/Badge";
import { cn } from "../lib/utils";

/**
 * Course Correction 4 (Story 17.1): sidebar merender menu HANYA dari registry
 * `src/config/navigation.ts`, difilter per permission role, dikelompokkan
 * dalam 3 seksi collapsible (persist di localStorage).
 * Reduced motion: collapse animation otomatis non-aktif via
 * <MotionConfig reducedMotion="user"> di App root (AC 6).
 */

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  role: UserRole;
  openTicketsCount: number;
  criticalIncidentsCount: number;
  aiFindingsCount: number;
  isManagementView: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const COLLAPSED_GROUPS_KEY = "workstation.nav.collapsed-groups";

interface DynamicBadge {
  text: string;
  tone: NavBadgeTone;
  pulse?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  role,
  openTicketsCount,
  criticalIncidentsCount,
  aiFindingsCount,
  isManagementView,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const permissions = ROLE_PERMISSIONS[role] ?? [];
  const visibleItems = filterNavigation(NAV_ITEMS, permissions);

  const [collapsedGroups, setCollapsedGroups] = useState<NavGroupId[]>(() => {
    try {
      const raw = localStorage.getItem(COLLAPSED_GROUPS_KEY);
      return raw ? (JSON.parse(raw) as NavGroupId[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_GROUPS_KEY, JSON.stringify(collapsedGroups));
    } catch {
      // localStorage tidak tersedia (private mode) — abaikan.
    }
  }, [collapsedGroups]);

  const toggleGroup = (groupId: NavGroupId) => {
    setCollapsedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((g) => g !== groupId) : [...prev, groupId]
    );
  };

  const handleItemClick = (tabId: ActiveTab) => {
    onSelectTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  // Badge dinamis (dihitung App) menimpa badge statis registry untuk item terkait.
  const dynamicBadges: Partial<Record<ActiveTab, DynamicBadge>> = {
    tickets:
      openTicketsCount > 0
        ? { text: `${openTicketsCount} Open`, tone: "amber" }
        : undefined,
    incidents:
      criticalIncidentsCount > 0
        ? { text: `${criticalIncidentsCount} Critical`, tone: "destructive", pulse: true }
        : undefined,
    ai:
      aiFindingsCount > 0
        ? { text: `${aiFindingsCount} Findings`, tone: "purple", pulse: true }
        : undefined
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const dyn = dynamicBadges[item.id];
    const badgeText = dyn?.text ?? item.badge;
    const badgeTone: NavBadgeTone = dyn?.tone ?? item.badgeType ?? "default";
    const pulse = dyn?.pulse ?? false;

    return (
      <button
        key={item.id}
        onClick={() => handleItemClick(item.id)}
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
        {badgeText && (
          <span className="relative z-10 shrink-0 ml-auto pl-1">
            <Badge
              size="sm"
              variant={
                badgeTone === "emerald"
                  ? "success"
                  : badgeTone === "destructive"
                  ? "destructive"
                  : badgeTone === "amber"
                  ? "warning"
                  : badgeTone === "cyan"
                  ? "cyan"
                  : badgeTone === "purple"
                  ? "purple"
                  : "secondary"
              }
              pulse={pulse}
              className="whitespace-nowrap"
            >
              {badgeText}
            </Badge>
          </span>
        )}
      </button>
    );
  };

  const renderNavGroup = (
    group: (typeof NAV_GROUPS)[number],
    items: NavItem[]
  ) => {
    const isCollapsed = collapsedGroups.includes(group.id);
    const visibleCount = items.length;

    return (
      <div key={group.id} className="space-y-1.5">
        <button
          onClick={() => toggleGroup(group.id)}
          aria-expanded={!isCollapsed}
          aria-controls={`nav-group-${group.id}`}
          title={group.description}
          className="w-full px-3 py-1 flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1 hover:text-slate-900 cursor-pointer select-none outline-none group/header"
        >
          <span className="flex items-center gap-1">
            {group.label}
            <span className="text-slate-400 font-normal">({visibleCount})</span>
          </span>
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 stroke-[2.5] transition-transform motion-reduce:transition-none",
              isCollapsed && "-rotate-90"
            )}
          />
        </button>
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              id={`nav-group-${group.id}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="overflow-hidden space-y-1"
            >
              {items.map(renderNavItem)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const sidebarContent = (
    <div className="space-y-6">
      {NAV_GROUPS.map((group) => {
        const items = visibleItems.filter((item) => item.group === group.id);
        // Grup tanpa item yang visible untuk role ini tidak dirender sama sekali.
        if (items.length === 0) return null;
        return renderNavGroup(group, items);
      })}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 bg-[#FAF7EE] border-r-2 border-slate-900 flex-col justify-between p-3.5 select-none shrink-0 min-h-[calc(100vh-4rem)]">
        <div className="space-y-6">{sidebarContent}</div>

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
                <div className="space-y-6">{sidebarContent}</div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
