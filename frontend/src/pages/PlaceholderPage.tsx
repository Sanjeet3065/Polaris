import React from "react";
import { Link } from "react-router-dom";
import { LucideIcon, ArrowLeft, Layers, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

interface PlaceholderPageProps {
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  targetPhase: number;
  plannedFeatures: string[];
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  subtitle,
  description,
  icon: Icon,
  targetPhase,
  plannedFeatures
}) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      {/* Return button */}
      <div>
        <Link
          to="/overview"
          className="inline-flex items-center gap-2 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return to Station Overview</span>
        </Link>
      </div>

      {/* Main Module Card */}
      <Card glow className="p-8 bg-polar-900/80 border-slate-800 space-y-6 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/30 shadow-ice-glow">
            <Icon className="h-8 w-8" />
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <Badge variant="ice" size="md">
                PLANNED FOR PHASE {targetPhase}
              </Badge>
              <Badge variant="neutral" size="sm">
                POLARIS ARCHITECTED
              </Badge>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">{title}</h1>
            <p className="text-sm font-medium text-sky-300/90">{subtitle}</p>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">{description}</p>
          </div>
        </div>

        {/* Planned Subsystem Capabilities */}
        <div className="rounded-xl border border-slate-800/90 bg-slate-950/60 p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Layers className="h-4 w-4 text-sky-400" />
            Architected Capabilities for Phase {targetPhase}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {plannedFeatures.map((feat) => (
              <div
                key={feat}
                className="flex items-start gap-2 text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Development Note */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-800/80 pt-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Strict phased development protocol active (Phase 1 currently deployed)</span>
          </div>
          <Link
            to="/digital-twin"
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
          >
            Explore Digital Twin Simulation →
          </Link>
        </div>
      </Card>
    </div>
  );
};
