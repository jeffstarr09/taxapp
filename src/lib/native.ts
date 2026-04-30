import { Capacitor, registerPlugin } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { App, type URLOpenListenerEvent } from "@capacitor/app";

interface SignInWithApplePluginAPI {
  signIn(options: { nonce?: string }): Promise<{
    identityToken: string;
    authorizationCode?: string;
    email?: string;
    givenName?: string;
    familyName?: string;
    user: string;
  }>;
}

const SignInWithApplePlugin = registerPlugin<SignInWithApplePluginAPI>("SignInWithApplePlugin");

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export async function openOAuthUrl(url: string): Promise<void> {
  await Browser.open({ url, presentationStyle: "popover" });
}

export function registerDeepLinkHandler(
  handler: (url: string) => void | Promise<void>
): () => void {
  if (!isNative()) return () => {};

  const listenerHandle = App.addListener(
    "appUrlOpen",
    async (event: URLOpenListenerEvent) => {
      await handler(event.url);
      await Browser.close().catch(() => {});
    }
  );

  return () => {
    listenerHandle.then((h) => h.remove()).catch(() => {});
  };
}

export interface NativeAppleSignInResult {
  identityToken: string;
  rawNonce: string;
}

// Native Sign in with Apple via the iOS AuthenticationServices framework.
// Required because the web-OAuth fallback (browser + custom URL scheme bounce)
// is fragile on iPad and Apple's reviewers reject apps that don't use the
// native flow on iOS (Guideline 4.8). The returned identityToken is passed
// to supabase.auth.signInWithIdToken; the rawNonce is verified by Supabase
// against the JWT's hashed nonce claim.
export async function nativeAppleSignIn(): Promise<NativeAppleSignInResult> {
  if (!isNative()) {
    throw new Error("Native Apple sign-in is only available on iOS");
  }

  const rawNonce = crypto.randomUUID();
  const hashedNonce = await sha256Hex(rawNonce);

  const { identityToken } = await SignInWithApplePlugin.signIn({ nonce: hashedNonce });
  if (!identityToken) {
    throw new Error("Apple did not return an identity token");
  }

  return { identityToken, rawNonce };
}

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
