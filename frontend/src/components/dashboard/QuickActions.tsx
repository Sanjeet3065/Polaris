import React from "react";
import { Link } from "react-router-dom";
import { Box, Zap, Wind, TriangleAlert, Settings2, Boxes, ArrowUpRight } from "lucide-react";
import { Card } from "../ui/Card";

export const QuickActions: React.FC = () => {
  const actions = [
    {
      title: "Open Digital Twin",
      description: "Interactive 3D spatial infrastructure view",
      path: "/digital-twin",
      icon: Box,
      color: "text-emerald-400 group-hover:text-emerald-300",
      border: "hover:border-emerald-500/50"
    },
    {
      title: "View Energy Matrix",
      description: "Microgrid load and solar/diesel balance",
      path: "/energy",
      icon: Zap,
      color: "text-sky-400 group-hover:text-sky-300",
      border: "hover:border-sky-500/50"
    },
    {
      title: "View Environment",
      description: "Microclimate weather and wind dynamics",
      path: "/environment",
      icon: Wind,
      color: "text-purple-400 group-hover:text-purple-300",
      border: "hover:border-purple-500/50"
    },
    {
      title: "Station Alarms",
      description: "Active threshold warnings & triage",
      path: "/alerts",
      icon: TriangleAlert,
      color: "text-amber-400 group-hover:text-amber-300",
      border: "hover:border-amber-500/50"
    },
    {
      title: "Machinery Fleet",
      description: "Health indices and diagnostic logs",
      path: "/equipment",
      icon: Settings2,
      color: "text-blue-400 group-hover:text-blue-300",
      border: "hover:border-blue-500/50"
    },
    {
      title: "Logistics & Cargo",
      description: "Fuel reserves, consumables, and shipping",
      path: "/logistics",
      icon: Boxes,
      color: "text-indigo-400 group-hover:text-indigo-300",
      border: "hover:border-indigo-500/50"
    }
  ];

  return (
    <Card className="p-5 bg-polar-900/60 border-slate-800/80 space-y-4">
      <div className="border-b border-slate-800/80 pb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
          Mission Control Quick Actions
        </h3>
        <p className="text-xs text-slate-400">Direct operational shortcuts to key station subsystems</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.title}
              to={act.path}
              className={`group flex flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 transition-all duration-200 hover:bg-slate-900/80 ${act.border}`}
            >
              <div className="flex items-center justify-between text-slate-400">
                <Icon className={`h-5 w-5 transition-colors ${act.color}`} />
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-300 transition-colors" />
              </div>
              <div className="mt-3">
                <h4 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">
                  {act.title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {act.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
};
