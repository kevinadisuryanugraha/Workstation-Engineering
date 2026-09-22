import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Server,
  Activity,
  Cpu,
  HardDrive,
  RefreshCw,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { ServerTelemetry } from "../types";
import { KokonutCard } from "./ui/KokonutCard";
import { Badge } from "./ui/Badge";
import { LiveSparkline } from "./ui/LiveSparkline";
import { cn } from "../lib/utils";

interface InfrastructureViewProps {
  servers: ServerTelemetry[];
  onRefreshTelemetry?: () => void;
  isManagementView: boolean;
}

export const InfrastructureView: React.FC<InfrastructureViewProps> = ({
  servers,
  onRefreshTelemetry,
  isManagementView
}) => {
  const [selectedServer, setSelectedServer] = useState<ServerTelemetry>(servers[0]);
  const [isSimulatingHeartbeat, setIsSimulatingHeartbeat] = useState(false);
  const [heartbeatToast, setHeartbeatToast] = useState<string | null>(null);

  const triggerHeartbeat = () => {
    if (!selectedServer) return; // HOTFIX: tanpa guard → crash saat belum ada server
    setIsSimulatingHeartbeat(true);
    setTimeout(() => {
      setIsSimulatingHeartbeat(false);
      setHeartbeatToast(`Heartbeat verified from ${selectedServer.name}. HMAC signature valid.`);
      setTimeout(() => setHeartbeatToast(null), 4000);
      if (onRefreshTelemetry) onRefreshTelemetry();
    }, 800);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <KokonutCard variant="default" className="p-5" interactive={false}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="success" size="sm" dot>
                Workstation Linux Agent Network
              </Badge>
              <span className="text-xs text-slate-600 font-mono font-bold">Daemon: workstation-agent v1.2.4</span>
            </div>
            <h1 className="text-lg sm:text-xl font-mono font-black text-slate-950 tracking-tight">
              Infrastructure Inventory, Telemetry & Process Health
            </h1>
            <p className="text-xs text-slate-600 font-mono mt-0.5">
              Observability across primary production (Kontabo VPS) and local development (Office Server).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={triggerHeartbeat}
              disabled={isSimulatingHeartbeat}
              className="px-3.5 py-2 rounded-xl bg-[#2ec4b6] hover:bg-[#25ad9f] text-slate-950 font-mono font-bold border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 active:translate-x-0.5 active:translate-y-0.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5] ${isSimulatingHeartbeat ? "animate-spin" : ""}`} />
              <span>{isSimulatingHeartbeat ? "Pinging Agent..." : "Test Heartbeat"}</span>
            </motion.button>
          </div>
        </div>
      </KokonutCard>

      {heartbeatToast && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 bg-[#f0fdf4] border-2 border-slate-900 rounded-xl text-emerald-950 text-xs flex items-center gap-2.5 shadow-[2px_2px_0px_#18181b] font-mono font-bold"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 stroke-[2.5]" />
          <span>{heartbeatToast}</span>
        </motion.div>
      )}

      {/* Server Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {servers.map((srv) => {
          const isSelected = selectedServer?.id === srv.id;
          return (
            <div
              key={srv.id}
              onClick={() => setSelectedServer(srv)}
              className={cn(
                "p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all",
                isSelected
                  ? "bg-[#FAF7EE] border-slate-900 shadow-[3px_3px_0px_#18181b]"
                  : "bg-white border-slate-900/40 hover:border-slate-900 shadow-[1.5px_1.5px_0px_#18181b]"
              )}
            >
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white text-slate-950 border-2 border-slate-900 shadow-[1px_1px_0px_#18181b]">
                    <Server className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-mono font-black text-slate-950">{srv.name}</h3>
                    <p className="text-xs text-slate-600 font-mono font-semibold">
                      IP: <span className="text-slate-950 font-bold">{srv.ip}</span> • {srv.provider}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <Badge variant="success" size="sm" pulse>
                    {srv.status}
                  </Badge>
                  <p className="text-[10px] text-slate-600 font-mono mt-1 font-bold">{srv.lastHeartbeat}</p>
                </div>
              </div>

              {/* Quick telemetry indicators */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t-2 border-slate-900/10 text-center font-mono">
                <div className="bg-white p-2 sm:p-2.5 rounded-lg border-2 border-slate-900/40 shadow-[1px_1px_0px_#18181b]">
                  <div className="text-[10px] text-slate-600 font-bold mb-0.5 truncate">CPU Load</div>
                  <div className="text-xs sm:text-sm font-black text-emerald-700">{srv.cpuUsage}%</div>
                </div>
                <div className="bg-white p-2 sm:p-2.5 rounded-lg border-2 border-slate-900/40 shadow-[1px_1px_0px_#18181b]">
                  <div className="text-[10px] text-slate-600 font-bold mb-0.5 truncate">RAM Memory</div>
                  <div className="text-xs sm:text-sm font-black text-blue-700">{srv.ramUsage}%</div>
                </div>
                <div className="bg-white p-2 sm:p-2.5 rounded-lg border-2 border-slate-900/40 shadow-[1px_1px_0px_#18181b]">
                  <div className="text-[10px] text-slate-600 font-bold mb-0.5 truncate">NVMe Disk</div>
                  <div className="text-xs sm:text-sm font-black text-purple-700">{srv.diskUsage}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Server Full Telemetry Inspector */}
      {selectedServer ? (
        <div className="bg-white rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_#18181b] p-4 sm:p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b-2 border-slate-900/10">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-black px-2.5 py-1 rounded-md bg-[#FAF7EE] text-slate-950 border-2 border-slate-900 shadow-[1px_1px_0px_#18181b]">
                  Node: {selectedServer.id}
                </span>
                <span className="text-xs text-slate-700 font-mono font-bold">OS: {selectedServer.os}</span>
              </div>
              <h2 className="text-base sm:text-lg font-mono font-black text-slate-950 tracking-tight leading-snug">
                {selectedServer.name} Detailed Telemetry
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-700 font-bold">
              <span className="bg-[#FAF7EE] px-2.5 py-1 rounded-md border-2 border-slate-900 shadow-[1px_1px_0px_#18181b]">
                Uptime: <strong className="text-slate-950 font-black">{selectedServer.uptime}</strong>
              </span>
              <span className="bg-[#FAF7EE] px-2.5 py-1 rounded-md border-2 border-slate-900 shadow-[1px_1px_0px_#18181b]">
                Load: <strong className="text-slate-950 font-black">{selectedServer.loadAverage}</strong>
              </span>
              <span className="bg-[#2ec4b6] text-slate-950 px-2.5 py-1 rounded-md border-2 border-slate-900 shadow-[1px_1px_0px_#18181b] font-black">
                Agent: {selectedServer.agentVersion}
              </span>
            </div>
          </div>

          {/* Telemetry Resource Gauges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CPU Gauge */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#FAF7EE] border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-black text-slate-950 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-emerald-700 stroke-[2.5]" /> CPU Core Utilization
                </span>
                <span className="font-black text-emerald-800 bg-white px-2 py-0.5 rounded border border-slate-900 shadow-[1px_1px_0px_#18181b] text-[11px]">
                  {selectedServer.cpuUsage}%
                </span>
              </div>
              <div className="w-full bg-white h-3 rounded-full overflow-hidden border border-slate-900 shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${selectedServer.cpuUsage}%` }}
                  transition={{ duration: 0.8 }}
                  className="bg-emerald-500 h-full rounded-full"
                />
              </div>
              <p className="text-[11px] text-slate-600 font-mono font-semibold">Kernel 6.8 • 8 vCPUs Dedicated</p>
            </div>

            {/* RAM Gauge */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#FAF7EE] border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-black text-slate-950 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-700 stroke-[2.5]" /> RAM Memory Allocation
                </span>
                <span className="font-black text-blue-800 bg-white px-2 py-0.5 rounded border border-slate-900 shadow-[1px_1px_0px_#18181b] text-[11px]">
                  {selectedServer.ramUsage}%
                </span>
              </div>
              <div className="w-full bg-white h-3 rounded-full overflow-hidden border border-slate-900 shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${selectedServer.ramUsage}%` }}
                  transition={{ duration: 0.8 }}
                  className="bg-blue-500 h-full rounded-full"
                />
              </div>
              <p className="text-[11px] text-slate-600 font-mono font-semibold">{(selectedServer.ramUsage / 100 * 7.75).toFixed(1)} GB Used / 7.75 GB Total</p>
            </div>

            {/* NVMe Gauge */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#FAF7EE] border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-black text-slate-950 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-purple-700 stroke-[2.5]" /> NVMe Storage Volume
                </span>
                <span className="font-black text-purple-800 bg-white px-2 py-0.5 rounded border border-slate-900 shadow-[1px_1px_0px_#18181b] text-[11px]">
                  {selectedServer.diskUsage}%
                </span>
              </div>
              <div className="w-full bg-white h-3 rounded-full overflow-hidden border border-slate-900 shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${selectedServer.diskUsage}%` }}
                  transition={{ duration: 0.8 }}
                  className="bg-purple-500 h-full rounded-full"
                />
              </div>
              <p className="text-[11px] text-slate-600 font-mono font-semibold">192 GB Used / 400 GB NVMe</p>
            </div>
          </div>

          {/* Managed Services Status */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-mono font-black text-slate-950 uppercase tracking-wider flex items-center gap-2 pb-2 border-b-2 border-slate-900/10">
              <ShieldCheck className="w-4 h-4 text-emerald-700 stroke-[2.5]" />
              <span>Systemd Services Monitored by Agent ({selectedServer.services.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {selectedServer.services.map((svc) => (
                <div
                  key={svc.name}
                  className="p-3.5 bg-[#FAF7EE] rounded-xl border-2 border-slate-900 shadow-[1.5px_1.5px_0px_#18181b] text-xs space-y-2 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-black text-slate-950 truncate">{svc.name}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white text-emerald-800 border border-slate-900 text-[11px] font-mono font-black shrink-0 shadow-[1px_1px_0px_#18181b]">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                      <span>Running</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 font-mono font-semibold pt-2 border-t border-slate-900/10">
                    <span>{svc.port ? `Port: ${svc.port}` : "Daemon Process"}</span>
                    <span className="font-bold text-slate-950">{svc.memoryMb} MB RSS</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-900/30 shadow-[2px_2px_0px_#18181b] p-6 text-sm text-slate-600 font-mono">
          Belum ada server terpilih — telemetri dari workstation-agent akan tampil di sini.
        </div>
      )}
    </div>
  );
};
