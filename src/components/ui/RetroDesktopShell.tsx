import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Monitor,
  Folder,
  Ticket,
  Rocket,
  HardDrive,
  Trash2,
  HelpCircle,
  AlertTriangle,
  Volume2,
  Wifi,
  Clock,
  Sparkles,
  ChevronRight,
  Disc,
  FileCode,
  Shield,
  Layers,
  Search,
  RefreshCw,
  Download
} from "lucide-react";
import { ActiveTab } from "../Sidebar";
import { RetroErrorDialog, RetroLoadingDialog, RetroReactions } from "./RetroDialogs";
import { PWAInstallButton } from "./PWAInstallButton";
import { OfflineIndicator } from "./OfflineIndicator";

interface RetroDesktopShellProps {
  children: React.ReactNode;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  projectName: string;
  projectKey: string;
  userName: string;
  onOpenSearch: () => void;
}

export const RetroDesktopShell: React.FC<RetroDesktopShellProps> = ({
  children,
  activeTab,
  onSelectTab,
  projectName,
  projectKey,
  userName,
  onOpenSearch
}) => {
  const [currentTime, setCurrentTime] = useState("");
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  // Retro Dialog States (from image.png)
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const tabLabels: Record<ActiveTab, string> = {
    overview: "Global Overview",
    project360: "Project 360°",
    workitems: "Work Items & DAG",
    tickets: "Ticketing Desk",
    incidents: "Incident Room",
    git: "Git Intelligence",
    deployments: "Production Deployments",
    infrastructure: "Infrastructure Nodes",
    ai: "AI Code Scanner",
    reports: "Automated Reports",
    "report-id": "Laporan Manajemen (ID)",
    knowledge: "Knowledge Runbooks",
    audit: "Audit Event Ledger",
    security: "Security & RBAC Engine"
  };

  return (
    <div className="min-h-screen bg-retro-grid flex flex-col justify-between select-none font-sans text-slate-900 relative overflow-x-hidden">
      <OfflineIndicator />

      {/* Top Retro Menubar / Quick Utility Bar */}
      <div className="bg-[#FAF7EE] border-b-2 border-slate-900 px-2.5 sm:px-4 py-1.5 flex items-center justify-between text-xs font-mono font-bold z-20 gap-2 flex-nowrap">
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#f6ae2d] border border-slate-900 inline-block shrink-0" />
            <span className="font-black text-slate-900 tracking-wider text-[11px] sm:text-xs whitespace-nowrap">WORKSTATION 98</span>
          </div>

          <div className="hidden lg:flex items-center gap-3 text-slate-700">
            <button onClick={() => onSelectTab("overview")} className="hover:text-slate-950 cursor-pointer">File</button>
            <button onClick={onOpenSearch} className="hover:text-slate-950 cursor-pointer">Search (Cmd+K)</button>
            <button onClick={() => onSelectTab("project360")} className="hover:text-slate-950 cursor-pointer">View</button>
            <button onClick={() => onSelectTab("security")} className="hover:text-slate-950 cursor-pointer text-[#2ec4b6]">Security Clearance</button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* PWA Install Button */}
          <PWAInstallButton compact />

          <div className="hidden sm:block">
            <RetroReactions />
          </div>

          <button
            onClick={() => onSelectTab("security")}
            className="px-2 py-1 rounded-md bg-white hover:bg-slate-100 border border-slate-900 font-mono text-[10px] sm:text-[11px] font-bold cursor-pointer retro-shadow-sm flex items-center gap-1 shrink-0"
            title="View User Clearance"
          >
            <span>👤</span>
            <span className="hidden sm:inline max-w-[80px] truncate">{userName}</span>
          </button>
        </div>
      </div>

      {/* Main Content Stage */}
      <div className="flex-1 p-1.5 sm:p-3 md:p-5 flex flex-col justify-center">
        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full mx-auto bg-white border-[2px] sm:border-[2.5px] border-slate-900 rounded-xl sm:rounded-2xl shadow-[3px_3px_0px_#18181b] sm:shadow-[6px_6px_0px_#18181b] flex flex-col overflow-hidden transition-all ${
                isMaximized ? "max-w-[1550px] min-h-[82vh]" : "max-w-5xl min-h-[600px]"
              }`}
            >
              {/* Retro Window Teal Header Bar (from image.png) */}
              <div className="bg-[#2ec4b6] border-b-[2px] sm:border-b-[2.5px] border-slate-900 px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2">
                {/* Browser Navigation & Address Bar */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 max-w-xl">
                  <div className="flex items-center gap-1 font-mono text-xs font-black text-slate-900 shrink-0">
                    <button
                      onClick={() => onSelectTab("overview")}
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-white border border-slate-900 flex items-center justify-center hover:bg-slate-100 font-bold cursor-pointer text-[10px] sm:text-xs"
                      title="Back to Overview"
                    >
                      &lt;
                    </button>
                    <button
                      onClick={() => onSelectTab("workitems")}
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-white border border-slate-900 flex items-center justify-center hover:bg-slate-100 font-bold cursor-pointer text-[10px] sm:text-xs"
                      title="Next to Work Items"
                    >
                      &gt;
                    </button>
                  </div>

                  <div className="flex-1 min-w-0 bg-white border-[1.5px] sm:border-[2px] border-slate-900 rounded-lg sm:rounded-xl px-2 sm:px-3 py-0.5 sm:py-1 flex items-center justify-between text-[11px] sm:text-xs font-mono font-bold text-slate-900 shadow-[1.5px_1.5px_0px_#18181b]">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-xs sm:text-sm shrink-0">🌐</span>
                      <span className="truncate text-[10px] sm:text-xs font-semibold">
                        {window.location.hostname || "workstation.local"}/{projectKey.toLowerCase()}/{activeTab}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 hidden md:inline ml-1">&gt;&gt; ☰</span>
                  </div>
                </div>

                {/* Window Control Buttons from image.png */}
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                  <button
                    onClick={() => setIsMinimized(true)}
                    title="Minimize"
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-white border-[1.5px] border-slate-900 flex items-center justify-center font-mono font-black text-[10px] sm:text-xs hover:bg-slate-100 cursor-pointer shadow-[1px_1px_0px_#18181b] active:translate-x-0.5 active:translate-y-0.5"
                  >
                    _
                  </button>
                  <button
                    onClick={() => setIsMaximized(!isMaximized)}
                    title="Maximize / Restore"
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-white border-[1.5px] border-slate-900 flex items-center justify-center font-mono font-black text-[10px] sm:text-xs hover:bg-slate-100 cursor-pointer shadow-[1px_1px_0px_#18181b] active:translate-x-0.5 active:translate-y-0.5"
                  >
                    {isMaximized ? "❐" : "□"}
                  </button>
                  <button
                    onClick={() => setIsMinimized(true)}
                    title="Minimize Window"
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#ff70a6] text-white border-[1.5px] border-slate-900 flex items-center justify-center font-mono font-black text-[10px] sm:text-xs hover:bg-[#ff5d8f] cursor-pointer shadow-[1px_1px_0px_#18181b] active:translate-x-0.5 active:translate-y-0.5"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Window Content Container */}
              <div className="flex-1 bg-[#FAF7EE] flex flex-col retro-theme overflow-hidden">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isMinimized && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-white border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_#18181b] flex items-center justify-center text-4xl">
              💻
            </div>
            <h2 className="text-base font-bold font-mono text-slate-900">
              WORKSTATION Window Minimized to Taskbar
            </h2>
            <button
              onClick={() => setIsMinimized(false)}
              className="px-5 py-2 bg-[#2ec4b6] border-2 border-slate-900 rounded-xl font-mono font-bold text-xs shadow-[3px_3px_0px_#18181b] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              Restore Window
            </button>
          </div>
        )}
      </div>

      {/* Bottom Retro Windows Taskbar */}
      <footer className="bg-[#FAF7EE] border-t-[2.5px] border-slate-900 px-2 sm:px-3 py-1.5 sm:py-2 flex items-center justify-between z-30 relative font-mono text-xs shadow-[0px_-2px_0px_rgba(0,0,0,0.05)] overflow-hidden gap-1.5">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {/* Retro START Button */}
          <button
            onClick={() => setIsStartOpen(!isStartOpen)}
            className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl border-2 border-slate-900 font-black flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer shrink-0 text-xs ${
              isStartOpen
                ? "bg-[#2ec4b6] translate-x-0.5 translate-y-0.5 shadow-none"
                : "bg-[#f6ae2d] hover:bg-[#fab005] shadow-[2px_2px_0px_#18181b]"
            }`}
          >
            <span className="text-xs sm:text-sm">⚡</span>
            <span>START</span>
          </button>

          {/* Active Window Button on Taskbar */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className={`px-2.5 py-1 sm:py-1.5 rounded-xl border-2 border-slate-900 font-bold flex items-center gap-1.5 transition-all cursor-pointer truncate ${
              !isMinimized
                ? "bg-white shadow-[2px_2px_0px_#18181b]"
                : "bg-[#F3EDE0] opacity-80"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#2ec4b6] border border-slate-900 shrink-0" />
            <span className="truncate text-[11px] max-w-[90px] sm:max-w-[160px] md:max-w-[220px]">
              {tabLabels[activeTab]}
            </span>
          </button>

          {/* Quick Launch Icons */}
          <div className="hidden lg:flex items-center gap-1 border-l-2 border-slate-400 pl-2">
            <button
              onClick={() => onSelectTab("overview")}
              title="Overview"
              className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-900 cursor-pointer"
            >
              📊
            </button>
            <button
              onClick={() => onSelectTab("tickets")}
              title="Ticketing"
              className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-900 cursor-pointer"
            >
              🎫
            </button>
            <button
              onClick={() => onSelectTab("deployments")}
              title="Deployments"
              className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-900 cursor-pointer"
            >
              🚀
            </button>
            <button
              onClick={() => setShowLoadingModal(true)}
              title="Show Loading Progress (image.png)"
              className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-900 cursor-pointer"
            >
              ⏳
            </button>
            <button
              onClick={() => setShowErrorModal(true)}
              title="Show 404 Dialog (image.png)"
              className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-900 cursor-pointer"
            >
              ❓
            </button>
          </div>
        </div>

        {/* System Tray (Right) */}
        <div className="flex items-center gap-2 sm:gap-2.5 bg-white border-2 border-slate-900 px-2 sm:px-3 py-1 rounded-xl shadow-[2px_2px_0px_#18181b] shrink-0 text-[11px]">
          <span className="hidden sm:inline" title="Audio Enabled">🔊</span>
          <span title="Kontabo Production Agent Online">📶</span>
          <div className="w-px h-3 bg-slate-300 hidden sm:block" />
          <div className="flex items-center gap-1 font-bold text-slate-900">
            <Clock className="w-3 h-3 text-slate-700" />
            <span className="whitespace-nowrap">{currentTime || "16:15"}</span>
          </div>
        </div>

        {/* Start Menu Popover */}
        <AnimatePresence>
          {isStartOpen && (
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.95 }}
              className="absolute bottom-12 sm:bottom-14 left-2 sm:left-3 w-[calc(100vw-16px)] sm:w-72 max-w-sm max-h-[80vh] overflow-y-auto bg-white border-[2.5px] border-slate-900 rounded-2xl shadow-[6px_6px_0px_#18181b] z-50 flex flex-col"
            >
              {/* Start Menu Banner */}
              <div className="bg-[#2ec4b6] border-b-2 border-slate-900 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border-2 border-slate-900 flex items-center justify-center text-base">
                    ⚡
                  </div>
                  <div>
                    <h3 className="font-black text-xs text-slate-900">WORKSTATION 98</h3>
                    <p className="text-[10px] text-slate-800 font-medium">Single Source of Truth OS</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsStartOpen(false)}
                  className="w-5 h-5 rounded bg-white border border-slate-900 flex items-center justify-center font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Launcher Items */}
              <div className="p-2 space-y-0.5 text-xs font-bold text-slate-800">
                <button
                  onClick={() => {
                    onSelectTab("overview");
                    setIsStartOpen(false);
                  }}
                  className="w-full p-2 rounded-lg hover:bg-[#FAF7EE] border border-transparent hover:border-slate-900 flex items-center gap-2.5 cursor-pointer text-left"
                >
                  <span>📊</span> Global Overview
                </button>
                <button
                  onClick={() => {
                    onSelectTab("project360");
                    setIsStartOpen(false);
                  }}
                  className="w-full p-2 rounded-lg hover:bg-[#FAF7EE] border border-transparent hover:border-slate-900 flex items-center gap-2.5 cursor-pointer text-left"
                >
                  <span>🧭</span> Project 360° Health
                </button>
                <button
                  onClick={() => {
                    onSelectTab("workitems");
                    setIsStartOpen(false);
                  }}
                  className="w-full p-2 rounded-lg hover:bg-[#FAF7EE] border border-transparent hover:border-slate-900 flex items-center gap-2.5 cursor-pointer text-left"
                >
                  <span>📋</span> Work Items &amp; DAG Engine
                </button>
                <button
                  onClick={() => {
                    onSelectTab("tickets");
                    setIsStartOpen(false);
                  }}
                  className="w-full p-2 rounded-lg hover:bg-[#FAF7EE] border border-transparent hover:border-slate-900 flex items-center gap-2.5 cursor-pointer text-left"
                >
                  <span>🎫</span> Ticketing &amp; Incidents
                </button>
                <button
                  onClick={() => {
                    onSelectTab("deployments");
                    setIsStartOpen(false);
                  }}
                  className="w-full p-2 rounded-lg hover:bg-[#FAF7EE] border border-transparent hover:border-slate-900 flex items-center gap-2.5 cursor-pointer text-left"
                >
                  <span>🚀</span> Production Releases
                </button>
                <div className="border-t border-slate-200 my-1" />
                <button
                  onClick={() => {
                    setShowLoadingModal(true);
                    setIsStartOpen(false);
                  }}
                  className="w-full p-2 rounded-lg hover:bg-[#f6ae2d]/20 text-[#d97706] flex items-center gap-2.5 cursor-pointer text-left"
                >
                  <span>⏳</span> Show Retro Progress Dialog
                </button>
                <button
                  onClick={() => {
                    setShowErrorModal(true);
                    setIsStartOpen(false);
                  }}
                  className="w-full p-2 rounded-lg hover:bg-[#ff70a6]/20 text-[#e11d48] flex items-center gap-2.5 cursor-pointer text-left"
                >
                  <span>❌</span> Show Retro 404 Dialog
                </button>
              </div>

              {/* Start Menu Footer with User Clearance Navigation */}
              <div className="p-2 bg-[#FAF7EE] border-t-2 border-slate-900 flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-600 truncate max-w-[120px]">User: {userName}</span>
                <button
                  onClick={() => {
                    onSelectTab("security");
                    setIsStartOpen(false);
                  }}
                  className="px-2 py-0.5 bg-white border border-slate-900 rounded-md hover:bg-slate-100 cursor-pointer shadow-xs shrink-0 text-slate-900 font-mono"
                >
                  Clearance
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </footer>

      {/* Retro Dialogs from image.png */}
      <RetroErrorDialog
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        code="404"
        message="PAGE NOT FOUND / DEMO INCIDENT DIALOG"
      />

      <RetroLoadingDialog
        isOpen={showLoadingModal}
        onClose={() => setShowLoadingModal(false)}
        title="SYNCHRONIZING REPOSITORY AND SERVER STATE..."
        progressPercent={70}
      />
    </div>
  );
};

