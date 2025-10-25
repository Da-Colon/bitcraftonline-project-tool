import { ChakraProvider } from "@chakra-ui/react"
import { withEmotionCache } from "@emotion/react"
import type { LinksFunction, MetaFunction } from "@remix-run/node"
import { Links, Meta, Outlet, Scripts, ScrollRestoration , isRouteErrorResponse, useRouteError } from "@remix-run/react"
import React, { useContext, useEffect } from "react";

import { migrateInventoryTracking } from "~/utils/migrate-inventory-tracking"

import { ServerStyleContext, ClientStyleContext } from "./context"


interface DocumentProps {
  children: React.ReactNode
}

export const meta: MetaFunction = () => [
  { title: "BitCraft Project Planner" },
  {
    name: "description",
    content: "Plan projects and calculate crafting resources for BitCraft.",
  },
  { name: "theme-color", content: "#ffffff" },
  // Open Graph
  { property: "og:type", content: "website" },
  { property: "og:title", content: "BitCraft Project Planner" },
  {
    property: "og:description",
    content: "Plan projects and calculate crafting resources for BitCraft.",
  },
  // Twitter
  { name: "twitter:card", content: "summary" },
  { name: "twitter:title", content: "BitCraft Project Planner" },
  {
    name: "twitter:description",
    content: "Plan projects and calculate crafting resources for BitCraft.",
  },
]

export const links: LinksFunction = () => [
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
]

const Document = withEmotionCache(({ children }: DocumentProps, emotionCache) => {
  const serverStyleData = useContext(ServerStyleContext)
  const clientStyleData = useContext(ClientStyleContext)

  useEffect(() => {
    emotionCache.sheet.container = document.head
    const tags = emotionCache.sheet.tags
    emotionCache.sheet.flush()
    tags.forEach((tag) => {
      ;(emotionCache.sheet as unknown as { _insertTag: (tag: unknown) => void })._insertTag(tag)
    })
    if (clientStyleData?.cache.sheet) {
      clientStyleData.cache.sheet.container = document.head
    }
  }, [clientStyleData?.cache.sheet, emotionCache.sheet])

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
  )
})

export default function App() {
  useEffect(() => {
    // Run migration on app initialization (non-blocking)
    setTimeout(() => {
      migrateInventoryTracking().catch(() => {
        // Ignore migration errors
      })
    }, 100)
  }, [])

  return (
    <Document>
      <ChakraProvider>
        <Outlet />
      </ChakraProvider>
    </Document>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  let title = "Something went wrong"
  let message = "An unexpected error occurred."
  if (isRouteErrorResponse(error)) {
    title = `Error ${error.status}`
    message = error.data || error.statusText
  } else if (error instanceof Error) {
    message = error.message
  }

  return (
    <Document>
      <ChakraProvider>
        <div style={{ padding: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>{title}</h1>
          <p style={{ marginTop: 8, color: "#4a5568" }}>{message}</p>
        </div>
      </ChakraProvider>
    </Document>
  )
}
