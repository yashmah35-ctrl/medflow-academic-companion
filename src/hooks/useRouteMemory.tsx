import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ROUTE_KEY = "last_route";

/**
 * Persists the current route in localStorage so the app can
 * return to it after a page reload instead of falling back to "/".
 */
export function useRouteMemory() {
  const location = useLocation();

  useEffect(() => {
    // Don't persist auth-related routes or the root (to avoid overwriting on fresh load)
    if (
      location.pathname !== "/" &&
      location.pathname !== "/auth" &&
      location.pathname !== "/reset-password"
    ) {
      localStorage.setItem(ROUTE_KEY, location.pathname);
    }
  }, [location.pathname]);
}

/**
 * On mount, if the current path is "/" and there's a saved route,
 * redirect to it. Call this once at the top-level layout.
 */
export function useRestoreRoute() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/") {
      const saved = localStorage.getItem(ROUTE_KEY);
      if (saved && saved !== "/" && saved !== "/auth") {
        navigate(saved, { replace: true });
      }
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
