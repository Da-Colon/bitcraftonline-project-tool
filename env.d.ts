/// <reference types="@remix-run/node" />
/// <reference types="vite/client" />

// Client-side Vite env variables
interface ImportMetaEnv {
  readonly VITE_BITJITA_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
