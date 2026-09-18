import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { authManager } from '../lib/auth.ts';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        <h1 className="text-3xl font-black text-slate-900 tracking-tight font-mono">
          WORKSTATION
        </h1>
        <p className="text-xs font-mono text-slate-600 max-w-md mx-auto">
          Centralized engineering workspace turning activity into verifiable,
          evidence-backed progress.
        </p>
      </div>

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm bg-[#FBF7EC] border-2 border-slate-900 rounded-2xl retro-shadow overflow-hidden"
      >
        {/* Card Header */}
        <div className="bg-[#F5F1E4] border-b-2 border-slate-900 px-4 py-2.5 flex items-center justify-between">
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

        {/* Card Body */}
        <div className="p-6">
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
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
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@workstation.io"
                  className="w-full pl-9 pr-3 py-2 bg-white border-2 border-slate-900 rounded-lg text-xs font-mono font-bold text-slate-900 shadow-[2px_2px_0px_#18181b] focus:outline-none focus:ring-2 focus:ring-teal-400"
                aria-label="user@workstation.io"
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
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2 bg-white border-2 border-slate-900 rounded-lg text-xs font-mono font-bold text-slate-900 shadow-[2px_2px_0px_#18181b] focus:outline-none focus:ring-2 focus:ring-teal-400"
                aria-label="••••••••••••"
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
