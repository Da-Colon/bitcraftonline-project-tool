/// <reference types="@remix-run/node" />
/// <reference types="vite/client" />

// Client-side Vite env variables
// Note: currently the app does not consume a VITE_ client env var.
// Add here if you introduce client-side env usage.
interface ImportMetaEnv {}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
