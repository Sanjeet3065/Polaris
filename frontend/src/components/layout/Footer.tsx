import React from "react";
import { Terminal, Shield, Cpu } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/60 bg-polar-950/60 py-6 mt-12 text-xs text-slate-500">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-sky-400" />
          <span>POLARIS v0.1.0 • Phase 0 Architecture Active</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5 hover:text-slate-300 transition-colors">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            Security Baseline Verified
          </span>
          <span className="flex items-center gap-1.5 hover:text-slate-300 transition-colors">
            <Cpu className="h-3.5 w-3.5 text-sky-400" />
            Smart India Hackathon 2026 (SIH26060)
          </span>
        </div>
      </div>
    </footer>
  );
};
