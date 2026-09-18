import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  Users,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import { authManager, DIRECTORY_USERS } from '../lib/auth.ts';
import { UserRole } from '../types.ts';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

// Quick pre-configured test credentials for internal dev/team evaluation
const DEMO_CREDENTIALS: Record<string, string> = {
  'vibelab.kd@gmail.com': 'admin123',
  'rina@workstation.io': 'techlead123',
  'kevin@workstation.io': 'dev123',
  'budi@workstation.io': 'pm123',
  'citra@workstation.io': 'manager123',
  'andi@workstation.io': 'qa123',
  'maya@workstation.io': 'viewer123',
};

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('vibelab.kd@gmail.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'directory'>('form');

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await authManager.login(email.trim(), password);
      if (result.success) {
        onLoginSuccess();
      } else {
        setErrorMessage(result.error || 'Authentication failed: Invalid credentials');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error: Failed to reach auth gateway');
    } finally {
      setIsLoading(false);
    }
  };

  const selectPersona = (userEmail: string) => {
    setEmail(userEmail);
    setPassword(DEMO_CREDENTIALS[userEmail] || '');
    setActiveTab('form');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-retro-grid flex flex-col items-center justify-center p-4 selection:bg-teal-200">
      {/* Top Header Label */}
      <div className="mb-6 text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border-2 border-slate-900 rounded-full retro-shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-xs font-black uppercase tracking-wider text-slate-800">
            Workstation OS :: Enterprise Gateway
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 font-mono">
          WORKSTATION
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-mono max-w-md mx-auto">
          Centralized engineering workspace turning activity into verifiable, evidence-backed progress.
        </p>
      </div>

      {/* Main Login Window */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md bg-[#FAF7EE] border-2 border-slate-900 rounded-2xl retro-shadow-lg overflow-hidden flex flex-col"
      >
        {/* Retro Window Header */}
        <div className="bg-[#2ec4b6] border-b-2 border-slate-900 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff70a6] border border-slate-900" />
            <div className="w-3 h-3 rounded-full bg-[#f6ae2d] border border-slate-900" />
            <div className="w-3 h-3 rounded-full bg-emerald-400 border border-slate-900" />
            <span className="ml-2 font-mono text-xs font-black text-slate-900 uppercase tracking-wider">
              Security Clearance Auth
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/90 border border-slate-900 text-slate-900">
            HMAC-SHA256
          </span>
        </div>

        {/* Tab Switcher: Direct Login vs Directory Picker */}
        <div className="bg-[#F5F1E4] border-b-2 border-slate-900 px-4 py-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-mono text-xs font-bold border-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'form'
                ? 'bg-white border-slate-900 text-slate-950 retro-shadow-sm'
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-mono text-xs font-bold border-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'directory'
                ? 'bg-white border-slate-900 text-slate-950 retro-shadow-sm'
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Role Directory ({DIRECTORY_USERS.length})</span>
          </button>
        </div>

        {/* Card Body */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'form' ? (
              <motion.form
                key="form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3 bg-red-100 border-2 border-red-900 rounded-lg text-xs font-mono text-red-950 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                    <div className="flex-1 font-semibold">{errorMessage}</div>
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-800 flex items-center justify-between">
                    <span>Corporate Email</span>
                    <span className="text-[10px] text-slate-500 font-normal">Registered Directory</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@workstation.io"
                      className="w-full pl-9 pr-3 py-2 bg-white border-2 border-slate-900 rounded-lg text-xs font-mono font-bold text-slate-900 shadow-[2px_2px_0px_#18181b] focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-800 flex items-center justify-between">
                    <span>Password</span>
                    <span className="text-[10px] text-slate-500 font-normal">Bcrypt Cost 12</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-10 py-2 bg-white border-2 border-slate-900 rounded-lg text-xs font-mono font-bold text-slate-900 shadow-[2px_2px_0px_#18181b] focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-900"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#2ec4b6] hover:bg-[#25a99d] text-slate-950 font-mono font-black text-xs border-2 border-slate-900 shadow-[3px_3px_0px_#18181b] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                  >
                    {isLoading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                        <span>Verifying Credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>Authenticate &amp; Enter Workspace</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.div
                key="directory"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-2.5"
              >
                <p className="text-[11px] font-mono text-slate-600 mb-2">
                  Select a team persona to quickly test RBAC permission enforcement:
                </p>

                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {DIRECTORY_USERS.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => selectPersona(user.email)}
                      className={`w-full p-2 rounded-xl border-2 border-slate-900 text-left transition-all flex items-center justify-between gap-3 ${
                        email === user.email
                          ? 'bg-teal-50 border-teal-900 retro-shadow-sm'
                          : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#2ec4b6] border border-slate-900 flex items-center justify-center font-bold text-[10px] text-slate-950 shrink-0 font-mono">
                          {user.avatar}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-900 leading-tight">
                            {user.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">
                            {user.email}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-800">
                          {user.role}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Security Footer Notice */}
        <div className="bg-[#F5F1E4] border-t-2 border-slate-900 p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-slate-600 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
            <span>Server-authoritative RBAC enforced with bcrypt &amp; HMAC-SHA256</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
