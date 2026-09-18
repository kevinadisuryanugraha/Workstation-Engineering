import React from "react";
import { motion } from "motion/react";
import {
  Search,
  Terminal,
  Briefcase,
  Sparkles,
  Command,
  ChevronDown,
  Menu,
  ShieldCheck,
  Key,
  LogOut
} from "lucide-react";
import { Project, User } from "../types";
import { Badge } from "./ui/Badge";
import { cn } from "../lib/utils";

interface HeaderProps {
  currentProject: Project;
  projects: Project[];
  onSelectProject: (p: Project) => void;
  isManagementView: boolean;
  onToggleView: () => void;
  onOpenSearch: () => void;
  currentUser: User;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  onTriggerAIScanModal?: () => void;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProject,
  projects,
  onSelectProject,
  isManagementView,
  onToggleView,
  onOpenSearch,
  currentUser,
  onOpenAuth,
  onLogout,
  onTriggerAIScanModal,
  onOpenMobileMenu
}) => {
  return (
    <header className="h-14 sm:h-16 bg-[#FAF7EE] border-b-2 border-slate-900 px-3 sm:px-5 flex items-center justify-between text-slate-900 z-30 sticky top-0 gap-3 select-none">
      {/* Left: Brand & Project Selector */}
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1 sm:flex-initial">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 sm:p-2 rounded-xl bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-50 shadow-[2px_2px_0px_#18181b] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer shrink-0"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Workstation Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#f6ae2d] border-2 border-slate-900 flex items-center justify-center text-slate-950 font-mono font-black text-xs shadow-[2px_2px_0px_#18181b]">
            WS
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#2ec4b6] border border-slate-900" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xs sm:text-sm tracking-tight text-slate-950 uppercase font-mono">
                WORKSTATION
              </span>
              <Badge variant="cyan" size="sm" className="font-mono text-[9px] px-1.5 py-0">
                v1.0 OS
              </Badge>
            </div>
            <p className="text-[10px] text-slate-600 font-mono font-bold leading-tight">
              Engineering Intel &amp; Operations
            </p>
          </div>
        </div>

        <div className="h-6 w-0.5 bg-slate-300 hidden md:block shrink-0" />

        {/* Project Selector Styled cleanly with project icon and proper width */}
        <div className="relative min-w-0 max-w-[140px] sm:max-w-[220px] md:max-w-[260px]">
          <div className="flex items-center bg-white rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] hover:bg-slate-50 transition-colors">
            <select
              value={currentProject.id}
              onChange={(e) => {
                const selected = projects.find((p) => p.id === e.target.value);
                if (selected) onSelectProject(selected);
              }}
              aria-label="Active Project"
              className="w-full appearance-none bg-transparent text-[11px] sm:text-xs font-mono font-bold text-slate-950 pl-2.5 sm:pl-3 pr-7 py-1.5 focus:outline-none cursor-pointer truncate"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-white text-slate-900 font-mono">
                  [{p.key}] {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-900 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Middle: Global Quick Search Button (Desktop) */}
      <div className="hidden xl:flex items-center max-w-sm flex-1 mx-4">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-950 text-xs rounded-xl border-2 border-slate-900 transition-all shadow-[2px_2px_0px_#18181b] group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-700 group-hover:text-[#2ec4b6] transition-colors stroke-[2.5]" />
            <span className="truncate font-mono font-medium text-[11px]">Cari tiket, commit, rilis...</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[10px] text-slate-900 bg-[#FAF7EE] border border-slate-900 px-1.5 py-0.5 rounded font-bold shadow-xs">
            <Command className="w-2.5 h-2.5 stroke-[2.5]" />
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Right Controls: View Switcher, Quick Search & RBAC User Badge */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick Search on tablet/mobile */}
        <button
          onClick={onOpenSearch}
          className="xl:hidden p-1.5 sm:p-2 rounded-xl bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-50 shadow-[2px_2px_0px_#18181b] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer shrink-0"
          title="Search (Cmd+K)"
        >
          <Search className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Dual Language / Perspective Toggle with clean retro segmented pill */}
        <div className="flex items-center bg-white p-0.5 sm:p-1 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#18181b]">
          <button
            onClick={() => isManagementView && onToggleView()}
            className={cn(
              "relative px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-mono font-bold transition-all outline-none cursor-pointer flex items-center gap-1.5 z-10",
              !isManagementView ? "text-slate-950" : "text-slate-500 hover:text-slate-900"
            )}
          >
            {!isManagementView && (
              <motion.div
                layoutId="header-view-pill"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                className="absolute inset-0 bg-[#2ec4b6] border border-slate-900 rounded-lg -z-10"
              />
            )}
            <Terminal className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Engineering</span>
          </button>

          <button
            onClick={() => !isManagementView && onToggleView()}
            className={cn(
              "relative px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-mono font-bold transition-all outline-none cursor-pointer flex items-center gap-1.5 z-10",
              isManagementView ? "text-slate-950" : "text-slate-500 hover:text-slate-900"
            )}
          >
            {isManagementView && (
              <motion.div
                layoutId="header-view-pill"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                className="absolute inset-0 bg-[#ff70a6] border border-slate-900 rounded-lg -z-10"
              />
            )}
            <Briefcase className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Management</span>
          </button>
        </div>

        {/* Real RBAC Authenticated User Clearance Button */}
        <button
          onClick={onOpenAuth}
          className="flex items-center gap-2 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-white hover:bg-slate-50 border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer font-mono group shrink-0"
          title="Buka Izin Akses & Autentikasi RBAC"
        >
          <div className="w-6 h-6 rounded-lg bg-[#2ec4b6] border border-slate-900 flex items-center justify-center font-bold text-[10px] text-slate-950 shadow-xs shrink-0">
            {currentUser.avatar || "US"}
          </div>
          <div className="text-left hidden lg:block">
            <div className="text-[11px] font-black text-slate-950 leading-tight whitespace-nowrap">
              {currentUser.name}
            </div>
            <div className="text-[9px] font-bold text-emerald-700 flex items-center gap-0.5">
              <ShieldCheck className="w-2.5 h-2.5 shrink-0" />
              <span>{currentUser.role}</span>
            </div>
          </div>
          <Key className="w-3 h-3 text-slate-400 group-hover:text-slate-900 transition-colors hidden sm:block shrink-0" />
        </button>

        {/* Explicit Sign Out Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="p-1.5 sm:p-2 rounded-xl bg-red-50 hover:bg-red-100 border-2 border-slate-900 text-red-900 shadow-[2px_2px_0px_#18181b] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer shrink-0"
            title="Sign Out / Lock Workspace"
          >
            <LogOut className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}
      </div>
    </header>
  );
};
