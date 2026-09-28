import React from "react";
import { Compass, ShieldCheck, Wifi } from "lucide-react";
import { Badge } from "../ui/Badge";
import { StationCode } from "../../types";

interface HeaderProps {
  selectedStation: StationCode;
  onSelectStation: (code: StationCode) => void;
  backendHealthy: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  selectedStation,
  onSelectStation,
  backendHealthy
}) => {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-polar-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 shadow-ice-glow">
            <Compass className="h-6 w-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-wider polar-gradient-text">
                POLARIS
              </span>
              <Badge variant="ice" size="sm">SIH26060</Badge>
              <Badge variant="neutral" size="sm" className="hidden sm:inline-flex">MoES / NCPOR</Badge>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Polar Operations & Logistics Automated Remote Intelligence System
            </p>
          </div>
        </div>

        {/* Station switcher and system status */}
        <div className="flex items-center gap-3">
          {/* Station selector buttons */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-polar-900 p-1">
            <button
              onClick={() => onSelectStation("BHARATI")}
              className={`rounded px-3 py-1 text-xs font-semibold transition-all ${
                selectedStation === "BHARATI"
                  ? "bg-sky-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Bharati
            </button>
            <button
              onClick={() => onSelectStation("MAITRI")}
              className={`rounded px-3 py-1 text-xs font-semibold transition-all ${
                selectedStation === "MAITRI"
                  ? "bg-sky-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Maitri
            </button>
          </div>

          {/* Connection state pill */}
          <div className="flex items-center gap-2">
            <Badge variant={backendHealthy ? "success" : "danger"} size="md">
              <Wifi className="h-3.5 w-3.5" />
              <span>{backendHealthy ? "API ONLINE" : "OFFLINE"}</span>
            </Badge>
            <Badge variant="ice" size="md" className="hidden md:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>PHASE 0 ARCH</span>
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
};
