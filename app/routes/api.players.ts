import { json, type LoaderFunctionArgs } from "@remix-run/node";

import { BitJita } from "~/utils/bitjita.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() || "";

  if (q.length < 2) {
    return json({ players: [] });
  }

  try {
    const players = await BitJita.searchPlayers(q);
    return json({ players }, {
      headers: {
        // smooth typing bursts and allow short SWR
        "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
      },
    });
  } catch (err: unknown) {
    return json({ error: err instanceof Error ? err.message : "Proxy error" }, { status: 503 });
  }
}
