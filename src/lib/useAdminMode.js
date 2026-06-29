import { useState, useEffect, useCallback } from "react";

const ADMIN_MODE_KEY = "claimintel_admin_mode";
const ADMIN_MODE_EVENT = "claimintel_admin_mode_change";

/**
 * Hook for managing Admin Mode state.
 * Admin Mode is activated via the hidden logo trigger and persists
 * in localStorage. It only takes effect when the current user has
 * the built-in "admin" role.
 */
export function useAdminMode(user) {
  const [adminMode, setAdminMode] = useState(
    () => localStorage.getItem(ADMIN_MODE_KEY) === "true"
  );

  useEffect(() => {
    const handler = () => {
      setAdminMode(localStorage.getItem(ADMIN_MODE_KEY) === "true");
    };
    window.addEventListener(ADMIN_MODE_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(ADMIN_MODE_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const isAdminUser = user?.role === "admin";

  // Clear admin mode if the current user is not an admin
  useEffect(() => {
    if (!isAdminUser && localStorage.getItem(ADMIN_MODE_KEY) === "true") {
      localStorage.removeItem(ADMIN_MODE_KEY);
      setAdminMode(false);
    }
  }, [isAdminUser]);

  const enableAdminMode = useCallback(() => {
    if (isAdminUser) {
      localStorage.setItem(ADMIN_MODE_KEY, "true");
      window.dispatchEvent(new Event(ADMIN_MODE_EVENT));
      return true;
    }
    return false;
  }, [isAdminUser]);

  const disableAdminMode = useCallback(() => {
    localStorage.removeItem(ADMIN_MODE_KEY);
    window.dispatchEvent(new Event(ADMIN_MODE_EVENT));
  }, []);

  return {
    adminMode: adminMode && isAdminUser,
    isAdminUser,
    enableAdminMode,
    disableAdminMode,
  };
}

export { ADMIN_MODE_KEY, ADMIN_MODE_EVENT };