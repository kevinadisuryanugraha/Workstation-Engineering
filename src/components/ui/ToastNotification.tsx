import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "../../lib/utils";

export type ToastType = "success" | "warning" | "error" | "info";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (t: Omit<Toast, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(({ title, description, type = "info", duration = 4000 }: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, description, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((title: string, description?: string) => toast({ title, description, type: "success" }), [toast]);
  const error = useCallback((title: string, description?: string) => toast({ title, description, type: "error" }), [toast]);
  const warning = useCallback((title: string, description?: string) => toast({ title, description, type: "warning" }), [toast]);
  const info = useCallback((title: string, description?: string) => toast({ title, description, type: "info" }), [toast]);

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />,
    error: <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />,
    info: <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />,
  };

  const borders = {
    success: "border-emerald-500/30 bg-slate-900/95 shadow-emerald-950/20",
    warning: "border-amber-500/30 bg-slate-900/95 shadow-amber-950/20",
    error: "border-rose-500/30 bg-slate-900/95 shadow-rose-950/20",
    info: "border-cyan-500/30 bg-slate-900/95 shadow-cyan-950/20",
  };

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md text-slate-100",
                borders[t.type || "info"]
              )}
            >
              {icons[t.type || "info"]}
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-xs font-semibold leading-tight text-white">{t.title}</p>
                {t.description && (
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-200 transition-colors p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};
