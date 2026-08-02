import { createClient } from "@base44/sdk";
import { appParams } from "@/lib/app-params";

const { appId, token, functionsVersion, appBaseUrl } = appParams;

/**
 * Unwrapped Base44 SDK client used by repository modules.
 * Keeping this separate prevents the compatibility adapter from recursively
 * calling itself when it persists related database records.
 */
export const rawBase44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: "",
  requiresAuth: false,
  appBaseUrl,
});
