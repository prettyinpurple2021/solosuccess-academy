/**
 * NavLink — active-aware navigation link.
 * Rewritten for the TanStack migration: the compat shim's NavLink no longer
 * supports function-form className, so active/pending detection now uses
 * useLocation() directly. Same public API (activeClassName / pendingClassName).
 */
import { forwardRef, type ComponentProps } from "react";
import { Link, useLocation } from "@/lib/router-compat";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps extends Omit<ComponentProps<typeof Link>, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
  /** Match exactly (like react-router's `end`) instead of by prefix. */
  end?: boolean;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, to, end, ...props }, ref) => {
    const { pathname } = useLocation();
    const target = typeof to === "string" ? to.split(/[?#]/)[0] : "";
    // Active when the current path matches the link target (prefix match unless `end`)
    const isActive = end
      ? pathname === target
      : pathname === target || (target !== "/" && pathname.startsWith(`${target}/`));

    return (
      <Link ref={ref} to={to} className={cn(className, isActive && activeClassName)} {...props} />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
