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

        <div className="space-y-1.5">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-sky-400">
            Error 404 · Navigation Out of Bounds
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">Signal Lost</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            The requested polar control module or telemetry route could not be located on the high-latitude station network.
          </p>
        </div>

        <div className="pt-2">
          <Link to="/overview">
            <Button variant="primary" size="md" className="w-full">
              <Home className="h-4 w-4" />
              <span>Return to Station Overview</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};
