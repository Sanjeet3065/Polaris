import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Compass,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Radio,
  ShieldCheck,
  ChevronRight,
  Sparkles
} from "lucide-react";

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect destination after successful login
  const locationState = location.state as { from?: { pathname?: string } } | null;
  const from = locationState?.from?.pathname || "/overview";

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // If already authenticated, redirect immediately
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email address and password");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#020b18] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 overflow-hidden selection:bg-sky-500/30 selection:text-sky-200">
      {/* Subtle Aurora & Grid Ambient Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Background Mission Control Coordinate Markers */}
      <div className="absolute top-4 left-6 hidden lg:flex items-center gap-3 text-[10px] font-mono text-slate-600">
        <Radio className="h-3 w-3 text-sky-500 animate-pulse" />
        <span>MAITRI: 70°45'57"S 11°44'09"E</span>
        <span className="text-slate-700">|</span>
        <span>BHARATI: 69°24'29"S 76°11'14"E</span>
      </div>

      <div className="absolute top-4 right-6 hidden lg:flex items-center gap-2 text-[10px] font-mono text-slate-500">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span>GATEWAY: POLAR-MESH-SECURE</span>
      </div>

      {/* Main Terminal Login Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-indigo-500 to-indigo-700 shadow-ice-glow ring-1 ring-sky-300/30">
            <Compass className="h-8 w-8 text-slate-950" />
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-widest polar-gradient-text uppercase">
            POLARIS
          </h1>
          <p className="mt-1 text-xs font-semibold tracking-wider text-sky-400 uppercase">
            Polar Operations & Logistics Automated Remote Intelligence System
          </p>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-400">
            <span>MoES / NCPOR</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-sky-300">SIH 2026 (SIH26060)</span>
          </div>
        </div>

        {/* Login Form Container */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-950/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400" />

          <div className="mb-5 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Terminal Authentication
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-sky-950/60 border border-sky-800/50 px-2 py-0.5 text-[10px] font-mono text-sky-300">
              <ShieldCheck className="h-3 w-3" />
              Argon2id + JWT
            </span>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="email-input">
                Operator Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="commander@polaris.local"
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 pl-10 pr-4 text-xs text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all font-mono"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300" htmlFor="password-input">
                  Security Passkey
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Min 8 chars</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 pl-10 pr-10 text-xs text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 py-2.5 px-4 text-xs font-bold text-slate-950 shadow-ice-glow hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Authorizing Session...</span>
                </>
              ) : (
                <>
                  <span>Connect to Station Gateway</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials for Evaluation & Hackathon Jury */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 mb-2.5 text-[11px] font-bold text-slate-400">
              <Sparkles className="h-3 w-3 text-sky-400" />
              <span>SIH 2026 Demo Access Credentials:</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill("admin@polaris.local", "Polaris@Admin2026!")}
                className="flex flex-col items-center p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-850 transition-all text-center group"
              >
                <span className="text-[10px] font-bold text-sky-300 group-hover:text-sky-200">
                  ADMIN
                </span>
                <span className="text-[9px] text-slate-400 font-mono mt-0.5">Full Access</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("operator@polaris.local", "Polaris@Operator2026!")}
                className="flex flex-col items-center p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 transition-all text-center group"
              >
                <span className="text-[10px] font-bold text-emerald-300 group-hover:text-emerald-200">
                  OPERATOR
                </span>
                <span className="text-[9px] text-slate-400 font-mono mt-0.5">Operations</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("viewer@polaris.local", "Polaris@Viewer2026!")}
                className="flex flex-col items-center p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 transition-all text-center group"
              >
                <span className="text-[10px] font-bold text-indigo-300 group-hover:text-indigo-200">
                  VIEWER
                </span>
                <span className="text-[9px] text-slate-400 font-mono mt-0.5">Read-Only</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Notice */}
        <p className="mt-4 text-center text-[11px] text-slate-500 font-mono">
          National Centre for Polar and Ocean Research • Ministry of Earth Sciences, Govt. of India
        </p>
      </div>
    </div>
  );
};
