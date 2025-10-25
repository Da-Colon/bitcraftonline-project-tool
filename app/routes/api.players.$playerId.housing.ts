/**
 * @fileoverview Player Housing API Endpoint
 * 
 * GET /api/players/:playerId/housing
 * 
 * Fetches player housing list with building information.
 * Uses 3-minute cache since housing data changes moderately.
 * 
 * @dependencies BitJitaService, StandardErrorResponse
 * @caching 3min cache with stale-while-revalidate
 */

import { json, type LoaderFunctionArgs } from "@remix-run/node";

import { BitJitaService } from "~/services/bitjita.service";
import { ServiceError, type StandardErrorResponse } from "~/types/api-responses";

/**
 * GET /api/players/:playerId/housing
 * 
 * Get player housing list with building information
 * 
 * @param {string} playerId - Player entity ID
 * @returns {BitJitaHousingResponse} Player housing data
 * @throws {400} When player ID is missing
 * @throws {404} When player housing not found
 * @throws {503} When external service unavailable
 * 
 * @example
 * GET /api/players/123/housing
 * Returns: { buildings: [...], ... }
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
    const data = await BitJitaService.getPlayerHousing(playerId);
    
    return json(data, {
      headers: {
        // 3-minute cache since housing data changes moderately
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
    // console.error("Unexpected error fetching player housing:", error);
    return json<StandardErrorResponse>(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
