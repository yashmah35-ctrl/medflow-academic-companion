import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { FloatingPomodoro } from "@/components/pomodoro/FloatingPomodoro";
import { useRouteMemory, useRestoreRoute } from "@/hooks/useRouteMemory";

export function AppLayout() {
  useRouteMemory();
  useRestoreRoute();

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar: hidden on mobile */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>

      <div className="flex flex-1 flex-col md:ml-[240px] transition-all duration-300" id="main-content">
        <TopBar />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav: visible on mobile only */}
      <BottomNav />

      {/* Floating Pomodoro mini-widget */}
      <FloatingPomodoro />
    </div>
  );
}
