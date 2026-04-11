"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AssistantProvider } from "@/contexts/AssistantContext";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000 },
    },
  });
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AssistantProvider>
          {children}
          <Toaster />
          <Sonner position="top-right" toastOptions={{ className: "shadow-card border-border" }} />
        </AssistantProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
