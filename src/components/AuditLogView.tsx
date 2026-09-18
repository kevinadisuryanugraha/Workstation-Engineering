import React from "react";
import { motion } from "motion/react";
import { History, Shield, CheckCircle2, Clock, Filter, Terminal } from "lucide-react";
import { EngineeringEvent } from "../types";
import { KokonutCard } from "./ui/KokonutCard";
import { Badge } from "./ui/Badge";
import { cn } from "../lib/utils";

interface AuditLogViewProps {
  events: EngineeringEvent[];
  isManagementView: boolean;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ events, isManagementView }) => {
  return (
    <div className="space-y-6 pb-12">
      <KokonutCard variant="default" className="p-5" interactive={false}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="cyan" size="sm" dot>
                Domain Event Stream & Audit Log
              </Badge>
              <span className="text-xs text-slate-600 font-mono font-bold">Append-Only Immutability</span>
            </div>
            <h1 className="text-lg sm:text-xl font-mono font-black text-slate-950 tracking-tight">
              Cryptographic Audit Trail & Engineering Event Bus
            </h1>
            <p className="text-xs text-slate-600 font-mono mt-0.5 font-semibold">
              Every critical action (commits, deployments, ticket status changes, AI reviews) is permanently logged with verifiable actor and SHA.
            </p>
          </div>

          <div className="text-right shrink-0">
            <Badge variant="success" size="md">
              Audit Retention: 365 Days Guaranteed
            </Badge>
          </div>
        </div>
      </KokonutCard>

      <KokonutCard variant="default" className="p-0 overflow-hidden" interactive={false}>
        <div className="p-4 border-b border-slate-900/20 flex items-center justify-between">
          <span className="text-xs font-mono font-black text-slate-950 uppercase tracking-wider">
            Event Ledger Stream
          </span>
          <span className="text-xs font-mono text-slate-600 font-bold">Total: {events.length} Events Ingested</span>
        </div>

        <div className="divide-y divide-slate-900/10">
          {events.map((evt) => (
            <motion.div
              key={evt.id}
              whileHover={{ x: 2 }}
              className="p-4 hover:bg-[#FAF7EE] flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors bg-white"
            >
              <div className="flex items-start gap-3">
                <span className="text-xs font-mono px-2 py-1 rounded-lg bg-[#FAF7EE] text-slate-950 font-bold border-2 border-slate-900 shadow-[1px_1px_0px_#18181b] shrink-0">
                  {evt.timestamp}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="cyan" size="sm">
                      {evt.type}
                    </Badge>
                    <span className="text-xs font-mono font-bold text-slate-950">{evt.title}</span>
                  </div>
                  <p className="text-xs text-slate-800 mt-1 font-mono text-[11px] leading-relaxed">
                    {isManagementView ? evt.descriptionManagement : evt.descriptionTechnical}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0 text-xs font-mono text-slate-600 font-semibold">
                <span>Actor: <strong className="text-slate-950 font-bold">{evt.actor}</strong></span>
                <Badge variant="secondary" size="sm">
                  Ref: {evt.evidenceRef}
                </Badge>
              </div>
            </motion.div>
          ))}
        </div>
      </KokonutCard>
    </div>
  );
};
