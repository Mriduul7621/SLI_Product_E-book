import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Tiny history-API router.
 * The reader's in-page anchors (`#chapter-id`) stay untouched, so the e-book
 * keeps deep-linking while the hub itself uses clean paths.
 */

export type Route =
  | { name: "home" }
  | { name: "library" }
  | { name: "module"; id: string }
  | { name: "book" }
  | { name: "assessment" }
  | { name: "take"; quizId: string }
  | { name: "result"; attemptId: string }
  | { name: "admin" }
  | { name: "profile" }
  | { name: "notFound"; path: string };

export function parseRoute(pathname: string): Route {
  const clean = pathname.replace(/\/+$/, "") || "/";
  const parts = clean.split("/").filter(Boolean);
  if (parts.length === 0) return { name: "home" };
  if (parts[0] === "library") return parts[1] ? { name: "module", id: decodeURIComponent(parts[1]) } : { name: "library" };
  if (parts[0] === "book") return { name: "book" };
  if (parts[0] === "profile") return { name: "profile" };
  if (parts[0] === "admin") return { name: "admin" };
  if (parts[0] === "assessment") {
    if (parts[1] === "take" && parts[2]) return { name: "take", quizId: decodeURIComponent(parts[2]) };
    if (parts[1] === "result" && parts[2]) return { name: "result", attemptId: decodeURIComponent(parts[2]) };
    return { name: "assessment" };
  }
  return { name: "notFound", path: clean };
}

export function navigate(to: string, opts: { replace?: boolean; keepScroll?: boolean } = {}): void {
  if (typeof window === "undefined") return;
  const url = new URL(to, window.location.origin);
  const target = `${url.pathname}${url.search}`;
  const current = `${window.location.pathname}${window.location.search}`;
  if (target !== current) {
    if (opts.replace) window.history.replaceState({}, "", target);
    else window.history.pushState({}, "", target);
  }
  if (!opts.keepScroll) window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  // Dispatch now *and* on the next microtask: a child effect can call navigate
  // before the router's own subscription from the parent has mounted.
  window.dispatchEvent(new Event("hub:navigate"));
  queueMicrotask(() => window.dispatchEvent(new Event("hub:navigate")));
}

export function useLocation(): { pathname: string; search: string } {
  const read = useCallback(
    () => ({ pathname: window.location.pathname, search: window.location.search }),
    [],
  );
  const [loc, setLoc] = useState(read);

  useEffect(() => {
    const update = () => setLoc(read());
    window.addEventListener("popstate", update);
    window.addEventListener("hub:navigate", update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener("hub:navigate", update);
    };
  }, [read]);

  return loc;
}

export function useRoute(): { route: Route; search: URLSearchParams } {
  const { pathname, search } = useLocation();
  const route = useMemo(() => parseRoute(pathname), [pathname]);
  const params = useMemo(() => new URLSearchParams(search), [search]);
  return { route, search: params };
}

export function Link({
  to,
  children,
  className,
  onClick,
  replace,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; replace?: boolean }) {
  return (
    <a
      href={to}
      className={className}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        onClick?.(event);
        navigate(to, { replace });
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
