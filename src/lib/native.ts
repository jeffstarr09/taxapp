import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { App, type URLOpenListenerEvent } from "@capacitor/app";

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
