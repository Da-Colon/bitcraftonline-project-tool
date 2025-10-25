/**
 * @fileoverview Player Crafts API Endpoint
 * 
 * GET /api/players/:playerId/crafts?completed=...
 * 
 * Fetches player crafts with optional completion filter.
 * Uses 2-minute cache since craft data changes moderately.
 * 
 * @dependencies BitJitaService, StandardErrorResponse, CraftsResponse
 * @caching 2min cache with stale-while-revalidate
 */

import { json, type LoaderFunctionArgs } from "@remix-run/node";

import { BitJitaService } from "~/services/bitjita.service";
import { ServiceError, type CraftsResponse, type StandardErrorResponse } from "~/types/api-responses";

/**
 * GET /api/players/:playerId/crafts
 * 
 * Get player crafts with optional completion filter
 * 
 * @param {string} playerId - Player entity ID
 * @param {boolean} completed - Optional filter for completed crafts (query param)
 * @returns {CraftsResponse} Crafts data with total count
 * @throws {400} When player ID is missing
 * @throws {404} When player not found
 * @throws {503} When external service unavailable
 * 
 * @example
 * GET /api/players/123/crafts?completed=true
 * Returns: { crafts: [...], totalCount: 5 }
 */
export async function loader({ params, request }: LoaderFunctionArgs) {
  const { playerId } = params;
  const url = new URL(request.url);
  const completed = url.searchParams.get("completed") === "true";

  // Validate required parameter
  if (!playerId) {
    return json<StandardErrorResponse>(
      { error: "Player ID is required" },
      { status: 400 }
    );
  }

  try {
    // Use service layer with automatic caching and error handling
    const data = await BitJitaService.getCrafts({
      playerEntityId: playerId,
      completed: completed,
    });
    
    return json<CraftsResponse>(data, {
      headers: {
        // 2-minute cache since craft data changes moderately
        "Cache-Control": "private, max-age=120, stale-while-revalidate=120",
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
    // console.error("Unexpected error fetching player crafts:", error);
    return json<StandardErrorResponse>(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
