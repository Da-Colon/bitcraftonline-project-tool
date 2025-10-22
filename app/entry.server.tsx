import { CacheProvider } from "@emotion/react";
import createEmotionServer from "@emotion/server/create-instance";
import type { AppLoadContext, EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { renderToString } from "react-dom/server";

import { ServerStyleContext } from "./context";
import createEmotionCache from "./createEmotionCache";

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  _loadContext: AppLoadContext
) {
  // First render to string to collect Emotion styles
  const cache = createEmotionCache();
  const { extractCriticalToChunks } = createEmotionServer(cache);

  const initialMarkup = renderToString(
    <CacheProvider value={cache}>
      <RemixServer context={remixContext} url={request.url} />
    </CacheProvider>
  );

  const chunks = extractCriticalToChunks(initialMarkup);

  // Second render with styles available via context so <Document> can inline them
  const markup = renderToString(
    <ServerStyleContext.Provider value={chunks.styles as any}>
      <CacheProvider value={cache}>
        <RemixServer context={remixContext} url={request.url} />
      </CacheProvider>
    </ServerStyleContext.Provider>
  );

  const headers = new Headers(responseHeaders);
  headers.set("Content-Type", "text/html; charset=utf-8");

  // Security headers
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    // Emotion generates inline <style> tags during SSR
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    // Allow calling BitJita API
    "connect-src 'self' https://bitjita.com ws: wss:",
    "font-src 'self' data:",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    // Remix outputs external scripts; no inline scripts are used here
    "script-src 'self' 'unsafe-inline'",
  ].join("; ");
  headers.set("Content-Security-Policy", csp);
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return new Response(`<!DOCTYPE html>${  markup}`, {
    status: responseStatusCode,
    headers,
  });
}
