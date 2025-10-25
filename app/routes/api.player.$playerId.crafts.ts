import { json, type LoaderFunctionArgs } from "@remix-run/node";

import { BitJita, BitJitaHttpError } from "~/utils/bitjita.server";
import type { CraftsResponse } from "~/types/crafts";

type Cached<T> = { data: T; fetchedAt: number };
const CACHE = new Map<string, Cached<any>>();
const TTL_MS = 2 * 60 * 1000; // 2 minutes (shorter than other endpoints since crafts change more frequently)

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { playerId } = params;
  const url = new URL(request.url);
  const completed = url.searchParams.get("completed") === "true";

  if (!playerId) {
    return json({ error: "Missing player ID" }, { status: 400 });
  }

  const now = Date.now();
  const cacheKey = `${playerId}-${completed}`;
  const cached = CACHE.get(cacheKey);
  if (cached && now - cached.fetchedAt < TTL_MS) {
    return json(cached.data, { headers: { "Cache-Control": "private, max-age=30" } });
  }

  try {
    // Fetch crafts for the player
    const crafts = await BitJita.getCrafts({
      playerEntityId: playerId,
      completed: completed,
    });

    const response: CraftsResponse = {
      crafts: crafts.craftResults || [],
      totalCount: crafts.craftResults?.length || 0,
    };

    CACHE.set(cacheKey, { data: response, fetchedAt: now });
    return json(response, {
      headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=30" },
    });
  } catch (error) {
    console.error("Failed to fetch crafts for player:", error);
    
    if (error instanceof BitJitaHttpError) {
      return json(
        {
          error: "External API Error",
          service: "BitJita API",
          detail: error.body || error.message,
          isExternalError: true,
        },
        { status: error.status }
      );
    }

    return json({ error: "Failed to fetch player crafts" }, { status: 500 });
  }
}
