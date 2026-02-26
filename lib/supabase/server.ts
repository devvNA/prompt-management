import { createClient } from "@supabase/supabase-js";

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function decodeJwtRole(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as { role?: string };
    return json.role ?? null;
  } catch {
    return null;
  }
}

function assertPrivilegedSupabaseServerKey(key: string) {
  if (key.startsWith("sb_publishable_")) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is using a publishable key. Use the project service_role/secret key instead."
    );
  }

  // Legacy JWT keys can be decoded to confirm role.
  const jwtRole = decodeJwtRole(key);
  if (jwtRole && jwtRole !== "service_role") {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY has JWT role '${jwtRole}', expected 'service_role'. Replace it with the service_role key from Supabase API settings.`
    );
  }
}

export function getSupabaseAdminClient() {
  const url = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  assertPrivilegedSupabaseServerKey(serviceRoleKey);

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export function getPromptOwnerUserId() {
  return getRequiredEnv("SUPABASE_PROMPT_OWNER_USER_ID");
}

export function getPromptResultsBucket() {
  return process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "prompt-results";
}
