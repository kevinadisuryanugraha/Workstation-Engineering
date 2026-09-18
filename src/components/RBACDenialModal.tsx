import React from "react";
import { motion } from "motion/react";
import { ShieldAlert, Lock, ArrowRight, X, AlertTriangle } from "lucide-react";
import { User, Permission } from "../types";
import { PERMISSION_DESCRIPTIONS } from "../lib/rbac";
import { Badge } from "./ui/Badge";

interface RBACDenialModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  requiredPermission?: Permission;
  requiredRole?: string;
  actionName?: string;
  onOpenAuthModal?: () => void;
}

export const RBACDenialModal: React.FC<RBACDenialModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  requiredPermission,
  requiredRole,
  actionName = "Operasi Sistem",
  onOpenAuthModal
}) => {
  if (!isOpen) return null;

  const permInfo = requiredPermission ? PERMISSION_DESCRIPTIONS[requiredPermission] : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#FAF7EE] border-2 border-slate-900 rounded-2xl max-w-md w-full shadow-[6px_6px_0px_#18181b] overflow-hidden"
      >
        {/* Retro Header Red */}
        <div className="bg-[#ff5a5f] border-b-2 border-slate-900 px-4 py-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white border-2 border-slate-900 flex items-center justify-center text-slate-950 font-bold shadow-[1.5px_1.5px_0px_#18181b]">
              <ShieldAlert className="w-4 h-4 text-rose-600 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-black uppercase tracking-wider text-slate-950">
                403 RBAC ACCESS DENIED
              </h3>
              <p className="text-[10px] font-mono text-slate-900 font-bold">
                Middleware Keamanan Menolak Permintaan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 text-slate-950 border-2 border-slate-900 flex items-center justify-center font-bold text-xs shadow-[1.5px_1.5px_0px_#18181b] cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 font-mono text-xs">
          <div className="p-3.5 bg-rose-50 border-2 border-rose-300 rounded-xl space-y-2 text-rose-950">
            <div className="flex items-center gap-2 font-bold text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Izin Tidak Memadai</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Akun Anda (<strong>{currentUser.name}</strong> • Role:{" "}
              <span className="underline font-bold">{currentUser.role}</span>) tidak memiliki izin yang disyaratkan untuk menjalankan tindakan <strong>"{actionName}"</strong>.
            </p>
          </div>

          <div className="p-3 bg-white border-2 border-slate-900 rounded-xl space-y-1.5 shadow-[2px_2px_0px_#18181b]">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Syarat Otorisasi:</div>
            {requiredPermission && (
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Required Permission:</span>
                <span className="font-bold text-slate-950 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                  {requiredPermission}
                </span>
              </div>
            )}
            {permInfo && (
              <p className="text-[10px] text-slate-600 pt-1 border-t border-slate-100">
                {permInfo.description}
              </p>
            )}
            {requiredRole && (
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Minimum Role:</span>
                <span className="font-bold text-purple-700">{requiredRole}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-900 text-slate-950 font-bold transition-all shadow-[2px_2px_0px_#18181b] cursor-pointer"
            >
              Tutup
            </button>
            {onOpenAuthModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAuthModal();
                }}
                className="flex-1 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold transition-all shadow-[2px_2px_0px_#2ec4b6] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-[#2ec4b6]" />
                <span>Ganti Akun</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
