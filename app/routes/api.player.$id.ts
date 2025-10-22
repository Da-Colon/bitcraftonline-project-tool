import { json, type LoaderFunctionArgs } from "@remix-run/node";

import { BitJita, BitJitaHttpError } from "~/utils/bitjita.server";

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

  try {
    const data = await BitJita.getPlayerById(id);
    CACHE.set(id, { data, fetchedAt: now });
    return json(data, { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=30" } });
  } catch (error) {
    const detail = error instanceof BitJitaHttpError ? error.body || error.message : String(error);
    return json({
      error: "External API Error",
      service: "BitJita API",
      detail,
      isExternalError: true,
    }, { status: 503 });
  }
}
