import React from "react";
import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-14 left-4 z-50 flex items-center gap-2 rounded-xl bg-[#f6ae2d] text-slate-950 border-2 border-slate-900 px-3.5 py-2 font-mono text-xs font-bold shadow-[3px_3px_0px_#18181b] animate-bounce">
      <WifiOff className="w-4 h-4 stroke-[2.5]" />
      <span>Mode Offline — Cache data telemetry lokal sedang aktif</span>
    </div>
  );
};
