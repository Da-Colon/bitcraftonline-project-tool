import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() || "";

  if (q.length < 3) {
    return json({ players: [] });
  }

  try {
    const upstream = await fetch(
      `https://bitjita.com/api/players?q=${encodeURIComponent(q)}`,
      {
        headers: { Accept: "application/json" },
      }
    );

    if (!upstream.ok) {
      const text = await upstream.text();
      return json(
        { error: "Upstream error", status: upstream.status, detail: text },
        { status: upstream.status }
      );
    }

    const data = await upstream.json();
    return json(data, {
      headers: {
        // small private cache to smooth typing bursts
        "Cache-Control": "private, max-age=10",
      },
    });
  } catch (err: any) {
    return json({ error: err?.message || "Proxy error" }, { status: 500 });
  }
}

