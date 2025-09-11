import { json, type LoaderFunctionArgs } from "@remix-run/node";

type Cached<T> = { data: T; fetchedAt: number };
const CACHE = new Map<string, Cached<any>>();
const TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function loader({ params }: LoaderFunctionArgs) {
  const id = params.id;
  if (!id) return json({ error: "Missing player id" }, { status: 400 });

  const now = Date.now();
  const cached = CACHE.get(id);
  if (cached && now - cached.fetchedAt < TTL_MS) {
    return json(cached.data, { headers: { "Cache-Control": "private, max-age=30" } });
  }

  const base = process.env.BITJITA_BASE_URL || "https://bitjita.com";
  const upstream = await fetch(`${base}/api/players/${encodeURIComponent(id)}`, {
    headers: { Accept: "application/json" },
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return json({ error: "Upstream error", status: upstream.status, detail: text }, { status: upstream.status });
  }

  const data = await upstream.json();
  CACHE.set(id, { data, fetchedAt: now });
  return json(data, { headers: { "Cache-Control": "private, max-age=30" } });
}

