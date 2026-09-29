import React from "react";
import { Link } from "react-router-dom";
import { RadioTower, Home } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card glow className="max-w-md w-full p-8 text-center space-y-5 bg-polar-900/90 border-slate-800">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/30 shadow-ice-glow">
          <RadioTower className="h-8 w-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-sky-400">
            POLARIS · Antarctic Mission Control
          </span>
          <div className="text-5xl font-black text-white tracking-tight font-mono">
            404
          </div>
          <h1 className="text-lg font-bold text-slate-200">
            Station route not found.
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            The requested polar control path or telemetry module does not exist on the Antarctic station network.
          </p>
        </div>

        <div className="pt-2">
          <Link to="/overview">
            <Button variant="primary" size="md" className="w-full font-bold">
              <Home className="h-4 w-4" />
              <span>Return to Overview</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};
