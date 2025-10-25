/**
 * @fileoverview Player Inventories API Endpoint
 * 
 * GET /api/players/:playerId/inventories
 * 
 * Fetches player inventories with icon enrichment from GameData.
 * Uses 1-minute cache since inventory data changes frequently.
 * 
 * @dependencies BitJitaService, StandardErrorResponse
 * @caching 1min cache with stale-while-revalidate
 */

import { json, type LoaderFunctionArgs } from "@remix-run/node";

import { BitJitaService } from "~/services/bitjita.service";
import { ServiceError, type StandardErrorResponse } from "~/types/api-responses";

/**
 * GET /api/players/:playerId/inventories
 * 
 * Get player inventories with enriched icon data
 * 
 * @param {string} playerId - Player entity ID
 * @returns {BitJitaInventoriesResponse} Player inventories with iconAssetName enriched
 * @throws {400} When player ID is missing
 * @throws {404} When player inventories not found
 * @throws {503} When external service unavailable
 * 
 * @example
 * GET /api/players/123/inventories
 * Returns: { inventories: [...], items: {...}, cargos: [...] }
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
    // Use service layer with automatic caching, error handling, and icon enrichment
    const data = await BitJitaService.getPlayerInventories(playerId);
    
    return json(data, {
      headers: {
        // 1-minute cache since inventory data changes frequently
        "Cache-Control": "private, max-age=60, stale-while-revalidate=60",
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
    // console.error("Unexpected error fetching player inventories:", error);
    return json<StandardErrorResponse>(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
