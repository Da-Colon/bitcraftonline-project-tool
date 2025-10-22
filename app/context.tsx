import type { EmotionCache } from "@emotion/cache";
import { createContext } from "react";

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
