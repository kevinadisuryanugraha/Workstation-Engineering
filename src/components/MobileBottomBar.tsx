import React from "react";
import { LayoutDashboard, CheckSquare, Ticket, Rocket, Menu } from "lucide-react";
import { ActiveTab } from "./Sidebar";

interface MobileBottomBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenMobileMenu: () => void;
  openTicketsCount: number;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  activeTab,
  onSelectTab,
  onOpenMobileMenu,
  openTicketsCount
}) => {
  const quickItems = [
    { id: "overview" as ActiveTab, label: "Overview", icon: LayoutDashboard },
    { id: "workitems" as ActiveTab, label: "Work", icon: CheckSquare },
    {
      id: "tickets" as ActiveTab,
      label: "Tickets",
      icon: Ticket,
      badge: openTicketsCount > 0 ? openTicketsCount : null
    },
    { id: "deployments" as ActiveTab, label: "Deploy", icon: Rocket }
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF7EE] border-t-2 border-slate-900 px-2 py-1.5 flex items-center justify-around shadow-[0px_-2px_0px_#18181b] select-none"
    >
      {quickItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`relative flex flex-col items-center justify-center min-w-[58px] min-h-[44px] py-1 px-1 rounded-xl transition-all font-mono cursor-pointer border ${
              isActive
                ? "bg-[#f6ae2d] text-slate-950 border-slate-900 shadow-[1.5px_1.5px_0px_#18181b] font-bold"
                : "text-slate-700 hover:text-slate-950 hover:bg-white/70 border-transparent font-medium"
            }`}
          >
            <div className="relative">
              <Icon className="w-4 h-4 stroke-[2.5]" />
              {item.badge && (
                <span className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-0.5 rounded-full bg-[#ff70a6] text-white text-[9px] font-bold border border-slate-900 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 leading-tight">{item.label}</span>
          </button>
        );
      })}

      {/* Menu / Drawer Toggle Button */}
      <button
        onClick={onOpenMobileMenu}
        aria-label="Open Full Navigation Menu"
        className="flex flex-col items-center justify-center min-w-[58px] min-h-[44px] py-1 px-1 rounded-xl transition-all font-mono cursor-pointer border border-transparent text-slate-700 hover:text-slate-950 hover:bg-white/70"
      >
        <Menu className="w-4 h-4 stroke-[2.5]" />
        <span className="text-[10px] mt-0.5 font-medium leading-tight">Menu</span>
      </button>
    </nav>
  );
};
