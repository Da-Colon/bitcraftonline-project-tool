/**
 * @fileoverview Player Inventory Search API Endpoint
 * 
 * GET /api/inventory/player?playerName=...&inventoryTypes=...
 * 
 * Searches for a player by name and fetches their inventories.
 * Supports filtering by specific inventory types.
 * Uses service layer for player search and inventory fetching.
 * 
 * @dependencies BitJitaService, StandardErrorResponse
 * @caching Inherits from service layer (1min for inventories)
 */

import { json, type LoaderFunctionArgs } from "@remix-run/node";

import { BitJitaService } from "~/services/bitjita.service";
import { ServiceError, type StandardErrorResponse } from "~/types/api-responses";

/**
 * Player inventory response interface
 */
export interface PlayerInventoryResponse {
  playerName: string;
  inventories: Record<string, Array<{
    itemId: string;
    quantity: number;
    location: string;
  }>>;
  lastUpdated: string;
}

/**
 * GET /api/inventory/player
 * 
 * Search for player by name and fetch their inventories
 * 
 * @param {string} playerName - Player username to search for
 * @param {string[]} inventoryTypes - Optional array of inventory types to filter
 * @returns {PlayerInventoryResponse} Player inventories grouped by type
 * @throws {400} When player name is missing
 * @throws {404} When player not found
 * @throws {503} When external service unavailable
 * 
 * @example
 * GET /api/inventory/player?playerName=john&inventoryTypes=house_inventory
 * Returns: { playerName: "john", inventories: {...}, lastUpdated: "..." }
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const playerName = url.searchParams.get("playerName");
  const inventoryTypes = url.searchParams.getAll("inventoryTypes");

  // Validate required parameter
  if (!playerName) {
    return json<StandardErrorResponse>(
      { error: "Player name is required" },
      { status: 400 }
    );
  }

  try {
    // Step 1: Search for player by name
    const searchResults = await BitJitaService.searchPlayers(playerName);
    
    // Find exact match for player name
    const player = searchResults.players.find(
      (p) => p.username.toLowerCase() === playerName.toLowerCase()
    );
    
    if (!player) {
      return json<StandardErrorResponse>(
        { error: `Player "${playerName}" not found` },
        { status: 404 }
      );
    }

    // Step 2: Fetch player inventories
    const inventoryData = await BitJitaService.getPlayerInventories(player.entityId) as { inventories: Array<{ inventoryName?: string; pockets: Array<{ contents?: { itemId: number; quantity: number } }> }> };

    // Step 3: Transform data to our expected format
    const inventories: Record<string, Array<{
      itemId: string;
      quantity: number;
      location: string;
    }>> = {};

    // Process BitJita inventory data
    for (const inventory of inventoryData.inventories || []) {
      // Use the real inventory name as the category, handle null names
      const category = inventory.inventoryName || "Unknown";

      // Initialize the array for this category if it doesn't exist
      if (!inventories[category]) {
        inventories[category] = [];
      }

      // Process each pocket in the inventory
      for (const pocket of inventory.pockets) {
        if (!pocket.contents) continue;

        inventories[category].push({
          itemId: pocket.contents.itemId.toString(),
          quantity: pocket.contents.quantity,
          location: category,
        });
      }
    }

    // Step 4: Filter by inventory types if specified
    let filteredInventories = inventories;
    if (inventoryTypes && inventoryTypes.length > 0) {
      filteredInventories = {};
      for (const type of inventoryTypes) {
        if (inventories[type]) {
          filteredInventories[type] = inventories[type];
        }
      }
    }

    const response: PlayerInventoryResponse = {
      playerName: player.username,
      inventories: filteredInventories,
      lastUpdated: new Date().toISOString(),
    };

    return json<PlayerInventoryResponse>(response, {
      headers: {
        // Inherit cache settings from service layer (1min for inventories)
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
    // console.error("Unexpected error fetching player inventory:", error);
    return json<StandardErrorResponse>(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
