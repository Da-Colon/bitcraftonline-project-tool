/// <reference types="@remix-run/node" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BITJITA_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
