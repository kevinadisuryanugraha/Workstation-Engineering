import React, { useState } from "react";
import { Download, Smartphone, X, Check, Share2, PlusSquare } from "lucide-react";
import { usePWAInstall } from "../../hooks/usePWAInstall";
import { motion, AnimatePresence } from "motion/react";

interface PWAInstallButtonProps {
  compact?: boolean;
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  compact = false,
  className = ""
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed and running standalone, hide the prompt
  if (isInstalled) {
    return null;
  }

  // If neither chromium-installable nor iOS, provide a retro PWA readiness button
  const handleAction = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Fallback guide for other browsers / desktop
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleAction}
        id="pwa-install-btn"
        title="Install WORKSTATION app on this device"
        className={`bg-[#2ec4b6] hover:bg-[#28b2a5] text-slate-950 font-mono font-bold border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer rounded-xl ${
          compact ? "px-2.5 py-1 text-xs" : "px-3.5 py-2 text-xs"
        } ${className}`}
      >
        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>{compact ? "Install" : "Install App (PWA)"}</span>
        <span className="hidden sm:inline-block px-1 py-0.2 bg-white/70 rounded text-[9px] border border-slate-900 ml-0.5">
          v1.0
        </span>
      </button>

      {/* Retro Installation Guidance Dialog (for iOS and desktop manual setup) */}
      <AnimatePresence>
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-[#FAF7EE] border-[2.5px] border-slate-900 rounded-2xl shadow-[6px_6px_0px_#18181b] overflow-hidden flex flex-col font-sans"
            >
              {/* Window Header */}
              <div className="bg-[#2ec4b6] border-b-2 border-slate-900 px-3.5 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono font-black text-xs text-slate-900">
                  <span>💾</span>
                  <span>INSTALL WORKSTATION PWA</span>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="w-5 h-5 rounded bg-white border border-slate-900 flex items-center justify-center font-bold text-xs hover:bg-[#ff70a6] hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Window Body */}
              <div className="p-4 space-y-3 font-mono text-xs text-slate-900">
                <div className="p-3 bg-white border-2 border-slate-900 rounded-xl space-y-2 shadow-[2px_2px_0px_#18181b]">
                  <div className="flex items-center gap-2 font-bold text-[#0f766e]">
                    <Smartphone className="w-4 h-4" />
                    <span>Cara Pasang di Home Screen</span>
                  </div>

                  {isIOS ? (
                    <div className="space-y-2 text-[11px] text-slate-700 leading-relaxed">
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#f6ae2d] border border-slate-900 flex items-center justify-center font-bold shrink-0">
                          1
                        </span>
                        <span>
                          Tekan tombol <strong>Share</strong> (ikon kotak panah ke atas) di bar bawah Safari browser.
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#f6ae2d] border border-slate-900 flex items-center justify-center font-bold shrink-0">
                          2
                        </span>
                        <span>
                          Scroll ke bawah lalu pilih <strong>Add to Home Screen</strong> (+).
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#2ec4b6] border border-slate-900 flex items-center justify-center font-bold shrink-0">
                          3
                        </span>
                        <span>
                          Tekan <strong>Add</strong> di pojok kanan atas. WORKSTATION siap digunakan mandiri tanpa tab browser!
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-[11px] text-slate-700 leading-relaxed">
                      <p>
                        Aplikasi ini mendukung instalasi native Progressive Web App di Android (Chrome), Windows, macOS, dan Linux.
                      </p>
                      <div className="p-2 bg-[#FAF7EE] border border-slate-900 rounded-lg text-[10px]">
                        💡 Jika prompt otomatis tidak muncul, klik ikon titik tiga (⋮) di browser Anda lalu pilih <strong>"Install Workstation"</strong> atau <strong>"Add to Home screen"</strong>.
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setShowIOSGuide(false)}
                    className="w-full py-2 bg-[#f6ae2d] hover:bg-[#fab005] border-2 border-slate-900 font-bold rounded-xl shadow-[2px_2px_0px_#18181b] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer text-center"
                  >
                    [ MENGERTI &amp; TUTUP ]
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
