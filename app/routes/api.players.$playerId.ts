/**
 * @fileoverview Player Details API Endpoint
 * 
 * GET /api/players/:playerId
 * 
 * Fetches detailed player information by entity ID with intelligent caching.
 * Uses 5-minute cache since player data rarely changes.
 * 
 * @dependencies BitJitaService, StandardErrorResponse
 * @caching 5min cache with stale-while-revalidate
 */

import { json, type LoaderFunctionArgs } from "@remix-run/node";

import { BitJitaService } from "~/services/bitjita.service";
import { ServiceError, type PlayerDetailsResponse, type StandardErrorResponse } from "~/types/api-responses";

/**
 * GET /api/players/:playerId
 * 
 * Get detailed player information by entity ID
 * 
 * @param {string} playerId - Player entity ID
 * @returns {PlayerDetailsResponse} Player details object
 * @throws {400} When player ID is missing
 * @throws {404} When player not found
 * @throws {503} When external service unavailable
 * 
 * @example
 * GET /api/players/123
 * Returns: { entityId: "123", username: "john_doe", ... }
 */
export async function loader({ params }: LoaderFunctionArgs) {
  const { playerId } = params;

  // Validate required parameter
  if (!playerId) {
    return json<StandardErrorResponse>(
      { error: "Player ID is required" },
      { status: 400 }
    );
  }

  try {
    // Use service layer with automatic caching and error handling
    const data = await BitJitaService.getPlayerById(playerId);
    
    return json<PlayerDetailsResponse>(data, {
      headers: {
        // 5-minute cache since player data rarely changes
        "Cache-Control": "private, max-age=300, stale-while-revalidate=300",
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
    // console.error("Unexpected error fetching player details:", error);
    return json<StandardErrorResponse>(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
