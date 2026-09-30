import React from "react";
import { Terminal, Shield, Cpu } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-polar-750/70 bg-polar-950/80 backdrop-blur-md py-6 mt-12 text-xs text-slate-400">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-orange-400" />
          <span className="font-mono tracking-wider">POLARIS v0.1.0 • Mission Telemetry Engine Active</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[11px] sm:text-xs">
          <span className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            Security Baseline Verified
          </span>
          <span className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors">
            <Cpu className="h-3.5 w-3.5 text-orange-400" />
            National Centre for Polar and Ocean Research (NCPOR)
          </span>
        </div>
      </div>
    </footer>
  );
};
