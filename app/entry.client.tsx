import { CacheProvider } from "@emotion/react";
import { RemixBrowser } from "@remix-run/react";
import React, { startTransition, StrictMode, useState } from "react";
import { hydrateRoot } from "react-dom/client";

import { ClientStyleContext } from "./context";
import { defaultCache } from "./createEmotionCache";

interface ClientCacheProviderProps {
  children: React.ReactNode;
}

function ClientCacheProvider({ children }: ClientCacheProviderProps) {
  const [cache] = useState(defaultCache);

  return (
    <ClientStyleContext.Provider value={{ cache }}>
      <CacheProvider value={cache}>{children}</CacheProvider>
    </ClientStyleContext.Provider>
  );
}

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <ClientCacheProvider>
        <RemixBrowser />
      </ClientCacheProvider>
    </StrictMode>
  );
});
