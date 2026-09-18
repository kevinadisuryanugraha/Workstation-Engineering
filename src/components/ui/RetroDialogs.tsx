import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, ArrowRight, Heart, Star, Disc, HardDrive, AlertTriangle, HelpCircle } from "lucide-react";

// 1. Retro Error / Alert Dialog (From image.png top-left & top-middle)
interface RetroErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  code?: string;
  message?: string;
}

export const RetroErrorDialog: React.FC<RetroErrorDialogProps> = ({
  isOpen,
  onClose,
  title = "ERROR 404",
  code = "404",
  message = "PAGE NOT FOUND / INCIDENT TRIGGERED"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 15 }}
        className="bg-white border-[2.5px] border-slate-900 rounded-2xl w-full max-w-md shadow-[6px_6px_0px_#18181b] overflow-hidden"
      >
        {/* Teal Browser Titlebar from image.png */}
        <div className="bg-[#2ec4b6] border-b-[2.5px] border-slate-900 p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-900">
              &lt; &gt;
            </span>
            <div className="bg-white border-[1.5px] border-slate-900 rounded-md px-2 py-0.5 text-[11px] font-mono text-slate-900 font-bold truncate max-w-[200px]">
              https://workstation.local/404
            </div>
            <span className="font-mono text-xs font-bold text-slate-900">&gt;&gt; ☰</span>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={onClose} className="retro-window-btn font-bold">✕</button>
            <button className="retro-window-btn">_</button>
            <button className="retro-window-btn">O</button>
          </div>
        </div>

        {/* Dialog Body */}
        <div className="p-8 text-center bg-[#FAF7EE] flex flex-col items-center justify-center space-y-4">
          <span className="text-xs font-mono font-black text-slate-700 tracking-wider">ERROR</span>
          <div className="text-6xl font-black text-[#2ec4b6] tracking-tighter drop-shadow-[2px_2px_0px_#18181b]">
            {code}
          </div>
          <h3 className="text-sm font-black text-slate-900 font-mono tracking-tight uppercase">
            {message}
          </h3>

          {/* Retro Error Button from image.png */}
          <div className="flex items-center gap-3 pt-2">
            <div className="w-10 h-10 rounded-full bg-[#ff70a6] border-2 border-slate-900 flex items-center justify-center shadow-[2px_2px_0px_#18181b]">
              <X className="w-6 h-6 text-white stroke-[3]" />
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-[#ff70a6] hover:bg-[#ff5d8f] text-white font-mono font-bold text-xs border-2 border-slate-900 shadow-[3px_3px_0px_#18181b] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            >
              DISMISS ERROR
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// 2. Retro Loading Dialog with segmented blocks (From image.png bottom-middle)
interface RetroLoadingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  progressPercent?: number;
}

export const RetroLoadingDialog: React.FC<RetroLoadingDialogProps> = ({
  isOpen,
  onClose,
  title = "LOADING SPRINT TELEMETRY...",
  progressPercent = 65
}) => {
  if (!isOpen) return null;

  const totalBlocks = 12;
  const activeBlocks = Math.round((progressPercent / 100) * totalBlocks);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#FAF7EE] border-[2.5px] border-slate-900 rounded-2xl w-full max-w-sm shadow-[6px_6px_0px_#18181b] overflow-hidden"
      >
        {/* Yellow Header from image.png */}
        <div className="bg-[#f6ae2d] border-b-[2.5px] border-slate-900 px-3 py-2 flex items-center justify-between">
          <span className="font-mono text-xs font-black text-slate-900">TASK PROGRESS</span>
          <div className="flex items-center gap-1">
            <span className="retro-window-btn">_</span>
            <span className="retro-window-btn">□</span>
            <button onClick={onClose} className="retro-window-btn font-bold">✕</button>
          </div>
        </div>

        <div className="p-6 text-center space-y-4">
          <p className="text-xs font-mono font-bold text-slate-800 tracking-wider">
            {title}
          </p>

          {/* Segmented Yellow Block Progress Bar */}
          <div className="bg-[#FFFDF9] border-2 border-slate-900 p-2 rounded-xl flex items-center justify-center gap-1 shadow-[2px_2px_0px_#18181b]">
            {Array.from({ length: totalBlocks }).map((_, i) => (
              <div
                key={i}
                className={`h-6 w-5 rounded-[4px] border-[1.5px] border-slate-900 transition-all ${
                  i < activeBlocks ? "bg-[#f6ae2d] shadow-xs" : "bg-[#f1f5f9]"
                }`}
              />
            ))}
          </div>

          {/* Retro OK & CANCEL Buttons from image.png */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#2ec4b6] hover:bg-[#25a99d] text-slate-950 font-mono font-bold text-xs border-2 border-slate-900 shadow-[2.5px_2.5px_0px_#18181b] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
            >
              OK
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#ff70a6] hover:bg-[#ff5d8f] text-slate-950 font-mono font-bold text-xs border-2 border-slate-900 shadow-[2.5px_2.5px_0px_#18181b] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
            >
              CANCEL
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// 3. Retro Login / User Switch Dialog (From image.png top-right)
interface RetroLoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: string;
  onConfirm: (nickname: string) => void;
}

export const RetroLoginDialog: React.FC<RetroLoginDialogProps> = ({
  isOpen,
  onClose,
  currentUser,
  onConfirm
}) => {
  const [nickname, setNickname] = useState(currentUser);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white border-[2.5px] border-slate-900 rounded-2xl w-full max-w-sm shadow-[6px_6px_0px_#18181b] overflow-hidden"
      >
        {/* Pink Header from image.png */}
        <div className="bg-[#ff70a6] border-b-[2.5px] border-slate-900 p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-white border-[1.5px] border-slate-900 flex items-center justify-center font-bold text-xs">
              &lt;
            </span>
            <span className="font-mono text-[11px] font-bold text-slate-900 bg-white/90 border border-slate-900 px-2 py-0.5 rounded">
              www.workstation.local
            </span>
            <span className="w-5 h-5 rounded-full bg-white border-[1.5px] border-slate-900 flex items-center justify-center font-bold text-xs">
              &gt;
            </span>
          </div>
          <button onClick={onClose} className="retro-window-btn font-bold">✕</button>
        </div>

        {/* Login Form */}
        <div className="p-6 bg-[#FAF7EE] space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-slate-800">Login:</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Your Nickname Here"
              className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-lg text-xs font-mono font-bold text-slate-900 shadow-[2px_2px_0px_#18181b] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-slate-800">Password:</label>
            <input
              type="password"
              defaultValue="admin123"
              className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-lg text-xs font-mono font-bold text-slate-900 shadow-[2px_2px_0px_#18181b] focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => {
                onConfirm(nickname);
                onClose();
              }}
              className="px-6 py-2 rounded-xl bg-[#ff70a6] hover:bg-[#ff5d8f] text-white font-mono font-black text-xs border-2 border-slate-900 shadow-[3px_3px_0px_#18181b] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer uppercase tracking-wider"
            >
              NEXT &gt;
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// 4. Retro Heart Reaction Bar & Star Rating (From image.png middle & bottom-left)
export const RetroReactions: React.FC = () => {
  const [hearts, setHearts] = useState(4);
  const [stars, setStars] = useState(5);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Heart Reaction Bar */}
      <div className="inline-flex items-center gap-1 bg-[#FAF7EE] border-2 border-slate-900 px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_#18181b]">
        {[1, 2, 3, 4, 5].map((h) => (
          <button
            key={h}
            onClick={() => setHearts(h)}
            className="focus:outline-none hover:scale-110 transition-transform cursor-pointer"
          >
            <Heart
              className={`w-4 h-4 stroke-[2.5] ${
                h <= hearts ? "fill-[#ff70a6] text-slate-900" : "fill-transparent text-slate-400"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Star Rating Bar */}
      <div className="inline-flex items-center gap-1 bg-[#FAF7EE] border-2 border-slate-900 px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_#18181b]">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onClick={() => setStars(s)}
            className="focus:outline-none hover:scale-110 transition-transform cursor-pointer"
          >
            <Star
              className={`w-4 h-4 stroke-[2.5] ${
                s <= stars ? "fill-[#f6ae2d] text-slate-900" : "fill-transparent text-slate-400"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
};
