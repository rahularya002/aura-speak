import type { ReactNode } from "react";

/** Standalone shell for iframe / direct links — no dashboard chrome. */
export default function EmbedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground">{children}</div>
  );
}
