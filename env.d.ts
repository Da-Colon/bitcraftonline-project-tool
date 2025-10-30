/// <reference types="@remix-run/node" />
/// <reference types="vite/client" />

// Client-side Vite env variables
interface ImportMetaEnv {}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
