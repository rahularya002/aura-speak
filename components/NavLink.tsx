"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type NavLinkProps = Omit<React.ComponentProps<typeof Link>, "className"> & {
  className?: string;
  activeClassName?: string;
  /** Reserved for future pending navigation styling. */
  pendingClassName?: string;
  /** When true, only the exact path counts as active (e.g. home `/`). */
  end?: boolean;
};

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, activeClassName, pendingClassName: _pending, href, end, ...props }, ref) => {
    const pathname = usePathname();
    const path = typeof href === "string" ? href : (href.pathname ?? "");
    const isActive = end
      ? pathname === path
      : pathname === path || (path !== "/" && pathname.startsWith(`${path}/`));

    return (
      <Link ref={ref} href={href} className={cn(className, isActive && activeClassName)} {...props} />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
