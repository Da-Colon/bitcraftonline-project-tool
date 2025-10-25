/**
 * @fileoverview Player Housing Building Details API Endpoint
 * 
 * GET /api/players/:playerId/housing/:buildingId
 * 
 * Fetches detailed information for a specific building.
 * Uses 3-minute cache since building details change moderately.
 * 
 * @dependencies BitJitaService, StandardErrorResponse
 * @caching 3min cache with stale-while-revalidate
 */

import { json, type LoaderFunctionArgs } from "@remix-run/node";

import { BitJitaService } from "~/services/bitjita.service";
import { ServiceError, type StandardErrorResponse } from "~/types/api-responses";

/**
 * GET /api/players/:playerId/housing/:buildingId
 * 
 * Get detailed information for a specific building
 * 
 * @param {string} playerId - Player entity ID
 * @param {string} buildingId - Building entity ID
 * @returns {BitJitaHousingDetailsResponse} Building details
 * @throws {400} When player ID or building ID is missing
 * @throws {404} When building not found
 * @throws {503} When external service unavailable
 * 
 * @example
 * GET /api/players/123/housing/456
 * Returns: { building: {...}, inventory: [...] }
 */
export async function loader({ params }: LoaderFunctionArgs) {
  const { playerId, buildingId } = params;

  // Validate required parameters
  if (!playerId || !buildingId) {
    return json<StandardErrorResponse>(
      { error: "Player ID and Building ID are required" },
      { status: 400 }
    );
  }

  try {
    // Use service layer with automatic caching and error handling
    const data = await BitJitaService.getPlayerHousingDetails(playerId, buildingId);
    
    return json(data, {
      headers: {
        // 3-minute cache since building details change moderately
        "Cache-Control": "private, max-age=180, stale-while-revalidate=180",
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
    // console.error("Unexpected error fetching housing details:", error);
    return json<StandardErrorResponse>(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
