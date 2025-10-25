import { json, type LoaderFunctionArgs } from "@remix-run/node";

import { BitJita, BitJitaHttpError } from "~/utils/bitjita.server";
import type { CraftsResponse } from "~/types/crafts";

type Cached<T> = { data: T; fetchedAt: number };
const CACHE = new Map<string, Cached<any>>();
const TTL_MS = 2 * 60 * 1000; // 2 minutes (shorter than other endpoints since crafts change more frequently)

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { claimId } = params;
  const url = new URL(request.url);
  const playerEntityId = url.searchParams.get("playerEntityId");

  if (!claimId) {
    return json({ error: "Missing claim ID" }, { status: 400 });
  }

  const now = Date.now();
  const cacheKey = `${claimId}-${playerEntityId || 'no-player'}`;
  const cached = CACHE.get(cacheKey);
  if (cached && now - cached.fetchedAt < TTL_MS) {
    return json(cached.data, { headers: { "Cache-Control": "private, max-age=30" } });
  }

  try {
    // Fetch active crafts for the claim
    const activeCrafts = await BitJita.getCrafts({
      claimEntityId: claimId,
      completed: false,
    });

    // Fetch completed crafts for the claim and player (if playerEntityId provided)
    let completedCrafts: any = { crafts: [] };
    if (playerEntityId) {
      completedCrafts = await BitJita.getCrafts({
        claimEntityId: claimId,
        playerEntityId: playerEntityId,
        completed: true,
      });
    }

    const response: CraftsResponse = {
      crafts: [
        ...(activeCrafts.crafts || []),
        ...(completedCrafts.crafts || []),
      ],
      totalCount: (activeCrafts.crafts?.length || 0) + (completedCrafts.crafts?.length || 0),
    };

    CACHE.set(cacheKey, { data: response, fetchedAt: now });
    return json(response, {
      headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=30" },
    });
  } catch (error) {
    console.error("Failed to fetch crafts for claim:", error);
    
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

    return json({ error: "Failed to fetch active tasks" }, { status: 500 });
  }
}
