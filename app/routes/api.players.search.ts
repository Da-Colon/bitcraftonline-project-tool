/**
 * @fileoverview Player Search API Endpoint
 * 
 * GET /api/players/search?q=...
 * 
 * Searches for players by username with intelligent caching.
 * Returns empty array for queries shorter than 2 characters.
 * 
 * @dependencies BitJitaService, StandardErrorResponse
 * @caching 10s cache, 30s stale-while-revalidate for smooth typing
 */

import { json, type LoaderFunctionArgs } from "@remix-run/node";

import { BitJitaService } from "~/services/bitjita.service";
import { ServiceError, type PlayerSearchResponse, type StandardErrorResponse } from "~/types/api-responses";

/**
 * GET /api/players/search
 * 
 * Search for players by username query
 * 
 * @param {string} q - Username search query (minimum 2 characters)
 * @returns {PlayerSearchResponse} Array of matching players
 * @throws {400} When query is too short
 * @throws {503} When external service unavailable
 * 
 * @example
 * GET /api/players/search?q=john
 * Returns: { players: [{ entityId: "123", username: "john_doe" }] }
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() || "";

  // Handle empty or short queries gracefully
  if (q.length < 2) {
    return json<PlayerSearchResponse>({ players: [] }, {
      headers: {
        // Short cache for empty results to handle typing bursts
        "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
      },
    });
  }

  try {
    // Use service layer with automatic caching and error handling
    const data = await BitJitaService.searchPlayers(q);
    
    return json<PlayerSearchResponse>(data, {
      headers: {
        // Smooth typing bursts and allow short SWR
        "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    // Service layer throws standardized ServiceError
    if (error instanceof ServiceError) {
      return json<StandardErrorResponse>(
        {
          error: error.message,
          detail: error.detail,
          service: error.service,
          isExternalError: true,
        },
        { status: error.status }
      );
    }

    // Unexpected errors
    // console.error("Unexpected error in player search:", error);
    return json<StandardErrorResponse>(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
