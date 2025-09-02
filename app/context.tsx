import { createContext } from "react";
import type { EmotionCache } from "@emotion/cache";

export interface ServerStyleContextData {
  key: string;
  ids: Array<string>;
  css: string;
}

export const ServerStyleContext = createContext<
  ServerStyleContextData[] | null
>(null);

export interface ClientStyleContextData {
  cache: EmotionCache;
}

export const ClientStyleContext = createContext<ClientStyleContextData | null>(
  null
);
