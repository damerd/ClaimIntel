import { useAuth } from "@/lib/AuthContext";
import { useAdminMode } from "@/lib/useAdminMode";

/**
 * Determines the user's platform experience based on their role.
 * Roles: beta, admin, professional, enterprise
 * - beta: shows beta banners, review counters, upgrade prompts, lock screens
 * - admin: production experience + hidden admin access
 * - professional: production experience, no beta messaging
 * - enterprise: production experience + subtle organization context
 */
export function useUserRole() {
  const { user } = useAuth();
  const { adminMode } = useAdminMode(user);

  let role = user?.role || "beta";
  if (role === "user") role = "beta";

  const isBeta = role === "beta";
  const isAdmin = role === "admin";
  const isProfessional = role === "professional";
  const isEnterprise = role === "enterprise";

  const isProduction = !isBeta;

  const showBetaElements = isBeta && !adminMode;

  const organizationName = user?.organization_name;
  const clientAccountName = user?.client_account_name;
  const showOrgContext = isEnterprise && !!organizationName;

  return {
    role,
    isBeta,
    isAdmin,
    isProfessional,
    isEnterprise,
    isProduction,
    showBetaElements,
    adminMode,
    organizationName,
    clientAccountName,
    showOrgContext,
  };
}