"use client";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => (
  <SidebarProvider className="font-body">
    <AppSidebar />
    <SidebarInset className="overflow-hidden bg-surface">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-outline-variant/40 bg-surface-container-lowest/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-surface-container-lowest/80">
        <SidebarTrigger className="-ml-1 text-on-surface hover:bg-surface-container-low" />
      </header>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </SidebarInset>
  </SidebarProvider>
);

export default DashboardLayout;
