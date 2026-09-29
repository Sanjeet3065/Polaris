import React from "react";
import { Html, useProgress } from "@react-three/drei";
import { Compass, Loader2 } from "lucide-react";

export const Loading3DScene: React.FC = () => {
  const { progress } = useProgress();

  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-8 bg-slate-950/85 backdrop-blur-md rounded-2xl border border-cyan-500/30 text-white shadow-2xl min-w-[300px]">
        <div className="relative mb-5">
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center animate-spin">
            <Compass className="w-8 h-8 text-cyan-400" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-cyan-300 animate-spin" />
          </div>
        </div>

        <h4 className="text-base font-bold tracking-wider text-cyan-300 uppercase mb-1">
          INITIALIZING DIGITAL TWIN...
        </h4>
        <p className="text-xs text-slate-400 mb-4">
          Loading 3D Antarctic Station Environment
        </p>

        {/* Progress bar */}
        <div className="w-full bg-slate-800 rounded-full h-2 mb-2 overflow-hidden border border-slate-700">
          <div
            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.max(15, Math.round(progress))}%` }}
          />
        </div>

        <span className="text-[11px] font-mono text-cyan-400/80">
          {Math.round(progress)}% SHADERS & GEOMETRY
        </span>
      </div>
    </Html>
  );
};
