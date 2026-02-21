import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";

export function AppLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col ml-[240px] transition-all duration-300" id="main-content">
        <TopBar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
