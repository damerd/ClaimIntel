import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useAdminMode } from "@/lib/useAdminMode";
import ClaimIntelLogo from "./ClaimIntelLogo";
import { base44 } from "@/api/base44Client";

/**
 * Wraps ClaimIntelLogo with a hidden admin entry point.
 * Activated by either:
 *   - 5 clicks within 3 seconds
 *   - Long-press (3 seconds)
 *
 * If not logged in → redirect to login (never bypasses auth).
 * If logged in as admin → enables Admin Mode and navigates to /admin.
 * If logged in as non-admin → silently ignored.
 */
export default function AdminTriggerLogo({
  size = 36,
  variant = "light",
  showTagline = false,
  tagline,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdminUser, enableAdminMode } = useAdminMode(user);
  const clickTimes = useRef([]);
  const longPressTimer = useRef(null);
  const longPressFired = useRef(false);

  const handleTrigger = () => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    if (isAdminUser) {
      if (enableAdminMode()) {
        navigate("/admin");
      }
    }
    // Non-admin: silently ignore
  };

  const handleClick = () => {
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    const now = Date.now();
    clickTimes.current = clickTimes.current.filter((t) => now - t < 3000);
    clickTimes.current.push(now);
    if (clickTimes.current.length >= 5) {
      clickTimes.current = [];
      handleTrigger();
    }
  };

  const handleMouseDown = () => {
    longPressFired.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      handleTrigger();
    }, 3000);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <div
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={cancelLongPress}
      onMouseLeave={cancelLongPress}
      onTouchStart={handleMouseDown}
      onTouchEnd={cancelLongPress}
      className="cursor-pointer select-none"
    >
      <ClaimIntelLogo
        size={size}
        variant={variant}
        showTagline={showTagline}
        tagline={tagline}
      />
    </div>
  );
}