/**
 * Admin authentication with a Microsoft work/school account (Entra ID).
 *
 * The browser runs a standard OAuth 2.0 authorization-code flow with PKCE —
 * a public SPA needs no client secret. The access token is then handed to the
 * Apps Script backend, which calls Microsoft Graph (`/me`) to verify it and
 * checks the returned e-mail against the sheet's `Admins` list. Only then does
 * the backend mint its own short-lived admin session token.
 *
 * Nothing secret lives in the bundle: tenant and client IDs are public.
 */

const LS_CONFIG = "sli_hub_entra";
const SS_VERIFIER = "sli_ms_verifier";
const SS_STATE = "sli_ms_state";
const SS_REDIRECT = "sli_ms_redirect";
const SS_SESSION = "sli_hub_admin_session";

export type EntraConfig = {
  tenantId: string;
  clientId: string;
  /** optional e-mail domain restriction, e.g. "shantalife.com" */
  domain?: string;
};

export type AdminSession = {
  token: string;
  email: string;
  name: string;
  expiresAt: string;
};

const env = (key: string): string => {
  const value = (import.meta as unknown as { env?: Record<string, string> }).env?.[key];
  return typeof value === "string" ? value.trim() : "";
};

/** Build/runtime config: sheet (server) → build env → local override. */
export function resolveConfig(server?: Partial<EntraConfig> | null): EntraConfig | null {
  const local = readLocalConfig();
  const candidates: Partial<EntraConfig>[] = [
    local ?? {},
    server ?? {},
    {
      tenantId: env("VITE_ENTRA_TENANT_ID"),
      clientId: env("VITE_ENTRA_CLIENT_ID"),
      domain: env("VITE_ADMIN_DOMAIN"),
    },
  ];
  for (const candidate of candidates) {
    if (candidate.tenantId && candidate.clientId) {
      return {
        tenantId: candidate.tenantId,
        clientId: candidate.clientId,
        domain: (candidate.domain ?? "").trim().toLowerCase() || undefined,
      };
    }
  }
  return null;
}

export function readLocalConfig(): EntraConfig | null {
  try {
    const raw = localStorage.getItem(LS_CONFIG);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EntraConfig;
    return parsed.tenantId && parsed.clientId ? parsed : null;
  } catch {
    return null;
  }
}

export function saveLocalConfig(config: EntraConfig | null): void {
  if (!config || !config.tenantId || !config.clientId) localStorage.removeItem(LS_CONFIG);
  else localStorage.setItem(LS_CONFIG, JSON.stringify(config));
}

/* ------------------------------------------------------------------ */
/* PKCE helpers                                                        */
/* ------------------------------------------------------------------ */

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomString(length = 64): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return base64Url(bytes).slice(0, length);
}

async function challengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

export function redirectUri(): string {
  return `${window.location.origin}/admin`;
}

/** Sends the browser to Microsoft; returns only if the redirect is blocked. */
export async function beginMicrosoftLogin(config: EntraConfig): Promise<void> {
  const verifier = randomString(64);
  const state = randomString(24);
  sessionStorage.setItem(SS_VERIFIER, verifier);
  sessionStorage.setItem(SS_STATE, state);
  sessionStorage.setItem(SS_REDIRECT, `${window.location.pathname}${window.location.search}`);

  const url = new URL(
    `https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/authorize`,
  );
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri());
  url.searchParams.set("response_mode", "query");
  url.searchParams.set("scope", "openid profile email User.Read");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", await challengeFor(verifier));
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account");

  window.location.assign(url.toString());
}

export type CallbackResult =
  | { status: "none" }
  | { status: "error"; message: string }
  | { status: "code"; code: string; verifier: string };

/** Reads `?code=…&state=…` from the URL after Microsoft redirects back. */
export function readCallback(search: string): CallbackResult {
  const params = new URLSearchParams(search);
  const error = params.get("error");
  if (error) {
    return {
      status: "error",
      message: params.get("error_description") || error,
    };
  }
  const code = params.get("code");
  if (!code) return { status: "none" };

  const expectedState = sessionStorage.getItem(SS_STATE);
  if (!expectedState || params.get("state") !== expectedState) {
    return { status: "error", message: "state যাচাই ব্যর্থ — আবার চেষ্টা করুন" };
  }
  const verifier = sessionStorage.getItem(SS_VERIFIER);
  if (!verifier) return { status: "error", message: "PKCE verifier পাওয়া যায়নি — আবার চেষ্টা করুন" };
  return { status: "code", code, verifier };
}

/** Exchanges the authorization code for an access token (public client, PKCE). */
export async function exchangeCode(
  config: EntraConfig,
  code: string,
  verifier: string,
): Promise<string> {
  const body = new URLSearchParams({
    client_id: config.clientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(),
    code_verifier: verifier,
    scope: "openid profile email User.Read",
  });

  const res = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    },
  );

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.access_token) {
    throw new Error(json?.error_description || json?.error || `টোকেন বিনিময় ব্যর্থ (HTTP ${res.status})`);
  }
  return json.access_token as string;
}

export function clearCallbackState(): void {
  sessionStorage.removeItem(SS_VERIFIER);
  sessionStorage.removeItem(SS_STATE);
  sessionStorage.removeItem(SS_REDIRECT);
}

/* ------------------------------------------------------------------ */
/* Admin session (issued by Apps Script)                               */
/* ------------------------------------------------------------------ */

export function readAdminSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(SS_SESSION);
    if (!raw) return null;
    const session = JSON.parse(raw) as AdminSession;
    if (!session.token) return null;
    if (session.expiresAt && Date.parse(session.expiresAt) < Date.now()) {
      sessionStorage.removeItem(SS_SESSION);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function storeAdminSession(session: AdminSession): void {
  sessionStorage.setItem(SS_SESSION, JSON.stringify(session));
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(SS_SESSION);
}

export function adminToken(): string {
  return readAdminSession()?.token ?? "";
}
