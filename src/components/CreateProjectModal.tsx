import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FolderPlus, X, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { Project } from "../types";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (payload: {
    name: string;
    key: string;
    tagline?: string;
    description?: string;
    status?: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'AT_RISK' | 'COMPLETED' | 'ARCHIVED';
  }) => Promise<any>;
  onProjectCreated?: (newProj: Project) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
  onProjectCreated,
}) => {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'AT_RISK'>('ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    closeBtnRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedKey = key.trim().toUpperCase();
    const trimmedName = name.trim();

    if (trimmedKey.length < 2 || trimmedKey.length > 6 || !/^[A-Z]{2,6}$/.test(trimmedKey)) {
      setErrorMessage("Key Proyek wajib 2-6 huruf kapital (contoh: CORE, APP, POS, WRK).");
      return;
    }

    if (trimmedName.length < 2) {
      setErrorMessage("Nama Proyek minimal 2 karakter.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await onCreateProject({
        name: trimmedName,
        key: trimmedKey,
        tagline: tagline.trim() || undefined,
        description: description.trim() || undefined,
        status,
      });

      if (res?.data && onProjectCreated) {
        onProjectCreated(res.data);
      }

      setName("");
      setKey("");
      setTagline("");
      setDescription("");
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || "Gagal membuat proyek baru.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Buat Proyek Baru"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#FAF7EE] border-2 border-slate-900 rounded-2xl max-w-lg w-full shadow-[6px_6px_0px_#18181b] overflow-hidden my-8"
      >
        {/* Retro Header Emerald */}
        <div className="bg-[#2ec4b6] border-b-2 border-slate-900 px-4 py-3 flex items-center justify-between text-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white border-2 border-slate-900 flex items-center justify-center text-slate-950 font-bold shadow-[1.5px_1.5px_0px_#18181b]">
              <FolderPlus className="w-4 h-4 text-emerald-800 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-black uppercase tracking-wider text-slate-950">
                Buat Proyek Baru (Single Source of Truth)
              </h3>
              <p className="text-[10px] font-mono text-slate-900 font-bold">
                Daftarkan Project Domain &amp; Evidence Workspace
              </p>
            </div>
          </div>
          <button
            ref={closeBtnRef}
            aria-label="Tutup dialog"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 text-slate-950 border-2 border-slate-900 flex items-center justify-center font-bold text-xs shadow-[1.5px_1.5px_0px_#18181b] cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 font-mono text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Project Key <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="CORE"
                maxLength={6}
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                className="w-full text-xs font-mono font-bold uppercase p-2.5 rounded-lg border-2 border-slate-900 bg-white shadow-[2px_2px_0px_#18181b] outline-none"
                required
              />
              <p className="text-[10px] text-slate-600 mt-1">2-6 huruf kapital (mis. WRK, POS)</p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Nama Proyek <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="Core Banking Engine"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs font-mono font-bold p-2.5 rounded-lg border-2 border-slate-900 bg-white shadow-[2px_2px_0px_#18181b] outline-none"
                required
              />
              <p className="text-[10px] text-slate-600 mt-1">Nama resmi inisiatif / sistem</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              Tagline / Subjudul
            </label>
            <input
              type="text"
              placeholder="Payment Gateway &amp; QRIS Settlement Platform"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full text-xs font-mono p-2.5 rounded-lg border-2 border-slate-900 bg-white shadow-[2px_2px_0px_#18181b] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Status Awal
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full text-xs font-mono font-bold p-2.5 rounded-lg border-2 border-slate-900 bg-white shadow-[2px_2px_0px_#18181b] outline-none cursor-pointer"
              >
                <option value="ACTIVE">ACTIVE (Aktif Berjalan)</option>
                <option value="PLANNING">PLANNING (Perencanaan)</option>
                <option value="AT_RISK">AT_RISK (Membutuhkan Perhatian)</option>
                <option value="ON_HOLD">ON_HOLD (Ditunda)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Target Default
              </label>
              <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-100 text-slate-600 text-[11px] font-semibold">
                Sprint 01 • Target v1.0.0
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              Deskripsi Proyek
            </label>
            <textarea
              rows={2}
              placeholder="Deskripsikan tujuan proyek dan cakupan operasional tim..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs font-mono p-2.5 rounded-lg border-2 border-slate-900 bg-white shadow-[2px_2px_0px_#18181b] outline-none resize-none"
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-xs font-mono font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-400 text-slate-700 font-bold transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 border-2 border-slate-900 text-slate-950 font-bold transition-all shadow-[2px_2px_0px_#18181b] cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Menyimpan..." : "Buat Proyek"}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
