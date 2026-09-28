import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Role } from "../types/auth";
import { Compass, ShieldAlert, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface ProtectedRouteProps {
  allowedRoles?: Role[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-polar-950 flex flex-col items-center justify-center text-slate-200">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 shadow-ice-glow animate-pulse">
          <Compass className="h-8 w-8 text-slate-950 animate-spin" />
        </div>
        <h2 className="mt-4 text-base font-black tracking-widest polar-gradient-text uppercase">
          POLARIS Terminal
        </h2>
        <p className="mt-1 text-xs text-slate-400 font-mono">
          Verifying cryptographic credentials with Antarctic Base...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role permissions if route has restricted roles
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 shadow-lg">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-slate-100">Restricted Security Clearance</h2>
        <p className="mt-2 text-sm text-slate-400 max-w-md">
          Your current personnel classification (<span className="font-mono text-amber-400 font-semibold">{role}</span>) does not possess the required clearance level to access this administrative facility.
        </p>
        <div className="mt-4 rounded-lg bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-mono text-slate-400">
          Required Clearance: [{allowedRoles.join(", ")}]
        </div>
        <Link
          to="/overview"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-sky-500/20 border border-sky-500/30 px-4 py-2 text-xs font-semibold text-sky-300 hover:bg-sky-500/30 transition-all shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Operations Overview</span>
        </Link>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};
