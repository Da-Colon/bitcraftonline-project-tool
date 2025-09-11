import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction, MetaFunction } from "@remix-run/node";
import { ChakraProvider } from "@chakra-ui/react";
import { useContext, useEffect } from "react";
import { withEmotionCache } from "@emotion/react";
import { ServerStyleContext, ClientStyleContext } from "./context";

interface DocumentProps {
  children: React.ReactNode;
}

export const meta: MetaFunction = () => [
  { title: "BitCraft Project Planner" },
  {
    name: "description",
    content:
      "Plan projects and calculate crafting resources for BitCraft.",
  },
  { name: "theme-color", content: "#ffffff" },
  // Open Graph
  { property: "og:type", content: "website" },
  { property: "og:title", content: "BitCraft Project Planner" },
  {
    property: "og:description",
    content:
      "Plan projects and calculate crafting resources for BitCraft.",
  },
  // Twitter
  { name: "twitter:card", content: "summary" },
  { name: "twitter:title", content: "BitCraft Project Planner" },
  {
    name: "twitter:description",
    content:
      "Plan projects and calculate crafting resources for BitCraft.",
  },
];

export const links: LinksFunction = () => [
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
];

const Document = withEmotionCache(
  ({ children }: DocumentProps, emotionCache) => {
    const serverStyleData = useContext(ServerStyleContext);
    const clientStyleData = useContext(ClientStyleContext);

    useEffect(() => {
      emotionCache.sheet.container = document.head;
      const tags = emotionCache.sheet.tags;
      emotionCache.sheet.flush();
      tags.forEach((tag) => {
        (emotionCache.sheet as any)._insertTag(tag);
      });
      if (clientStyleData?.cache.sheet) {
        clientStyleData.cache.sheet.container = document.head;
      }
    }, []);

    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <Meta />
          <Links />
          {serverStyleData?.map(({ key, ids, css }) => (
            <style
              key={key}
              data-emotion={`${key} ${ids.join(" ")}`}
              dangerouslySetInnerHTML={{ __html: css }}
            />
          ))}
        </head>
        <body>
          {children}
          <ScrollRestoration />
          <Scripts />
        </body>
      </html>
    );
  }
);

export default function App() {
  return (
    <Document>
      <ChakraProvider>
        <Outlet />
      </ChakraProvider>
    </Document>
  );
}
