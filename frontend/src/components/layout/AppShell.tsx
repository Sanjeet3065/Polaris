import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";
import { GlobalStatusBar } from "./GlobalStatusBar";
import { DemoBanner } from "../demo/DemoBanner";
import { Footer } from "./Footer";
import { cn } from "../../lib/utils";

export const AppShell: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-polar-950 text-slate-100 flex flex-col selection:bg-orange-500/30 selection:text-orange-200 overflow-x-hidden w-full relative">
      {/* Sidebar Navigation */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area (Offset by Sidebar on Desktop) */}
      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-300 ease-in-out min-w-0 w-full",
          collapsed ? "lg:pl-16" : "lg:pl-64"
        )}
      >
        {/* Top Header */}
        <TopHeader onOpenMobileSidebar={() => setMobileOpen(true)} />

        {/* Global Operational Status Bar */}
        <GlobalStatusBar />

        {/* SIH Demo Mode Banner & Controls */}
        <DemoBanner />

        {/* Dynamic Route Content */}
        <main className="flex-1 px-3 py-4 sm:px-6 lg:px-8 max-w-[1600px] w-full mx-auto min-w-0">
          <Outlet />
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};
