import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ROUTE_KEY = "last_route";

/**
 * Persists the current route in localStorage so the app can
 * return to it after a page reload instead of falling back to "/dashboard".
 */
export function useRouteMemory() {
  const location = useLocation();

  useEffect(() => {
    const isExcludedRoute =
      location.pathname === "/" ||
      location.pathname === "/dashboard" ||
      location.pathname === "/auth" ||
      location.pathname === "/reset-password";

    if (!isExcludedRoute) {
      const fullRoute = `${location.pathname}${location.search}${location.hash}`;
      localStorage.setItem(ROUTE_KEY, fullRoute);
    }
  }, [location.pathname, location.search, location.hash]);
}

/**
 * On mount, if the current path is "/dashboard" and there's a saved route,
 * redirect to it. Call this once at the top-level layout.
 */
export function useRestoreRoute() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/dashboard") {
      const saved = localStorage.getItem(ROUTE_KEY);
      if (
        saved &&
        saved !== "/" &&
        saved !== "/dashboard" &&
        !saved.startsWith("/auth") &&
        !saved.startsWith("/reset-password")
      ) {
        navigate(saved, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
