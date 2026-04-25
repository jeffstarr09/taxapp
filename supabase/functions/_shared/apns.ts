// APNs JWT signing + HTTP/2 send.
// Runs on Deno (Supabase Edge Functions).
// Apple's HTTP/2 endpoint is reachable from fetch() on Deno deploy.

interface ApnsConfig {
  keyId: string;          // Key ID from Apple Developer (10 chars)
  teamId: string;         // 10-char team ID
  bundleId: string;       // app.dropfit.drop
  privateKeyPem: string;  // contents of the .p8 file (BEGIN PRIVATE KEY ...)
  useSandbox: boolean;    // true = api.sandbox.push.apple.com, false = api.push.apple.com
}

let cachedToken: { token: string; expiresAt: number } | null = null;

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function base64UrlEncode(input: string | Uint8Array): string {
  const bytes = typeof input === "string"
    ? new TextEncoder().encode(input)
    : input;
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signJwt(config: ApnsConfig): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  // Apple recommends rotating tokens at least every 20 min and at most every 60 min.
  if (cachedToken && cachedToken.expiresAt > now + 300) {
    return cachedToken.token;
  }

  const header = { alg: "ES256", kid: config.keyId, typ: "JWT" };
  const claims = { iss: config.teamId, iat: now };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const claimsB64 = base64UrlEncode(JSON.stringify(claims));
  const signingInput = `${headerB64}.${claimsB64}`;

  const keyData = pemToArrayBuffer(config.privateKeyPem);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const sigBuf = await crypto.subtle.sign(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  const sigB64 = base64UrlEncode(new Uint8Array(sigBuf));
  const token = `${signingInput}.${sigB64}`;

  cachedToken = { token, expiresAt: now + 50 * 60 };
  return token;
}

export interface ApnsPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: string;
  badge?: number;
  category?: string;
  threadId?: string;
}

export interface ApnsSendResult {
  status: number;
  body: string;
  ok: boolean;
  apnsId: string | null;
  reason: string | null;
}

export async function sendApnsPush(
  config: ApnsConfig,
  deviceToken: string,
  payload: ApnsPayload
): Promise<ApnsSendResult> {
  const jwt = await signJwt(config);
  const host = config.useSandbox
    ? "api.sandbox.push.apple.com"
    : "api.push.apple.com";

  const apsBody = {
    aps: {
      alert: { title: payload.title, body: payload.body },
      sound: payload.sound ?? "default",
      ...(payload.badge !== undefined && { badge: payload.badge }),
      ...(payload.category && { category: payload.category }),
      ...(payload.threadId && { "thread-id": payload.threadId }),
    },
    ...(payload.data ?? {}),
  };

  const res = await fetch(`https://${host}/3/device/${deviceToken}`, {
    method: "POST",
    headers: {
      "authorization": `bearer ${jwt}`,
      "apns-topic": config.bundleId,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
    },
    body: JSON.stringify(apsBody),
  });

  const text = await res.text();
  let reason: string | null = null;
  try {
    if (text) reason = (JSON.parse(text) as { reason?: string }).reason ?? null;
  } catch {
    /* non-JSON response */
  }

  return {
    status: res.status,
    body: text,
    ok: res.ok,
    apnsId: res.headers.get("apns-id"),
    reason,
  };
}

export function loadApnsConfigFromEnv(): ApnsConfig {
  const keyId = Deno.env.get("APNS_KEY_ID");
  const teamId = Deno.env.get("APNS_TEAM_ID");
  const bundleId = Deno.env.get("APNS_BUNDLE_ID");
  const privateKeyPem = Deno.env.get("APNS_PRIVATE_KEY");
  const useSandbox = (Deno.env.get("APNS_USE_SANDBOX") ?? "false") === "true";

  if (!keyId || !teamId || !bundleId || !privateKeyPem) {
    throw new Error(
      "Missing APNs env vars. Required: APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID, APNS_PRIVATE_KEY"
    );
  }

  return { keyId, teamId, bundleId, privateKeyPem, useSandbox };
}
