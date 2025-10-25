/**
 * @fileoverview BitJita Service Layer
 * 
 * Centralized service for all BitJita API interactions with:
 * - Consistent error handling and response normalization
 * - In-memory caching with configurable TTL per endpoint
 * - Type-safe interfaces for all responses
 * - Comprehensive documentation for each method
 * 
 * This service wraps the low-level BitJita HTTP client with business logic,
 * caching, and error handling to provide a clean interface for API routes.
 */

import { getGameDataIconLookup } from "~/services/gamedata-icon-lookup.server";
import { ServiceError, CACHE_TTL, type PlayerSearchResponse, type PlayerDetailsResponse, type CraftsResponse } from "~/types/api-responses";
import { BitJita, BitJitaHttpError } from "~/utils/bitjita.server";
import { normalizeItemId } from "~/utils/itemId";

/**
 * In-memory cache for service responses
 * 
 * Uses a simple Map with TTL-based expiration. In production,
 * consider Redis for distributed caching.
 */
type CachedItem<T> = { 
  data: T; 
  fetchedAt: number; 
  ttl: number;
};

const cache = new Map<string, CachedItem<unknown>>();

/**
 * Cache utility functions
 */
const cacheUtils = {
  /**
   * Get cached data if still valid
   */
  get<T>(key: string): T | null {
    const item = cache.get(key);
    if (!item) return null;
    
    const now = Date.now();
    if (now - item.fetchedAt > item.ttl) {
      cache.delete(key);
      return null;
    }
    
    return item.data as T;
  },

  /**
   * Store data in cache with TTL
   */
  set<T>(key: string, data: T, ttl: number): void {
    cache.set(key, {
      data,
      fetchedAt: Date.now(),
      ttl,
    });
  },

  /**
   * Clear expired entries from cache
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of cache.entries()) {
      if (now - item.fetchedAt > item.ttl) {
        cache.delete(key);
      }
    }
  }
};

/**
 * BitJita Service - Centralized API for all BitJita interactions
 * 
 * Provides a clean, cached, and error-handled interface to BitJita API.
 * All methods include automatic caching, error normalization, and type safety.
 */
export class BitJitaService {
  /**
   * Search for players by username query
   * 
   * @param query - Username search query (minimum 2 characters)
   * @param cacheTTL - Optional cache TTL override (default: 5min)
   * @returns Promise<PlayerSearchResponse> - Array of matching players
   * @throws {ServiceError} When query is too short or API fails
   * 
   * @example
   * ```typescript
   * const players = await BitJitaService.searchPlayers("john");
   * // Returns: { players: [{ entityId: "123", username: "john_doe" }] }
   * ```
   */
  static async searchPlayers(
    query: string, 
    cacheTTL: number = CACHE_TTL.PLAYERS
  ): Promise<PlayerSearchResponse> {
    // Validate input
    if (!query || query.trim().length < 2) {
      throw new ServiceError(
        "Query must be at least 2 characters",
        400,
        "BitJita Service"
      );
    }

    const cacheKey = `search:${query.toLowerCase()}`;
    
    // Check cache first
    const cached = cacheUtils.get<PlayerSearchResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const players = await BitJita.searchPlayers(query);
      
      const response: PlayerSearchResponse = { players };
      
      // Cache the response
      cacheUtils.set(cacheKey, response, cacheTTL);
      
      return response;
    } catch (error) {
      if (error instanceof BitJitaHttpError) {
        throw new ServiceError(
          "Failed to search players",
          error.status,
          "BitJita API",
          error.body || error.message
        );
      }
      throw new ServiceError(
        "Player search failed",
        503,
        "BitJita Service",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Get player details by entity ID
   * 
   * @param id - Player entity ID
   * @param cacheTTL - Optional cache TTL override (default: 5min)
   * @returns Promise<PlayerDetailsResponse> - Player details
   * @throws {ServiceError} When player not found or API fails
   * 
   * @example
   * ```typescript
   * const player = await BitJitaService.getPlayerById("123");
   * // Returns: { entityId: "123", username: "john_doe", ... }
   * ```
   */
  static async getPlayerById(
    id: string,
    cacheTTL: number = CACHE_TTL.PLAYERS
  ): Promise<PlayerDetailsResponse> {
    if (!id) {
      throw new ServiceError("Player ID is required", 400, "BitJita Service");
    }

    const cacheKey = `player:${id}`;
    
    // Check cache first
    const cached = cacheUtils.get<PlayerDetailsResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const data = await BitJita.getPlayerById(id);
      
      // Cache the response
      cacheUtils.set(cacheKey, data, cacheTTL);
      
      return data as PlayerDetailsResponse;
    } catch (error) {
      if (error instanceof BitJitaHttpError) {
        if (error.status === 404) {
          throw new ServiceError(
            "Player not found",
            404,
            "BitJita API",
            `No player found with ID '${id}'`
          );
        }
        throw new ServiceError(
          "Failed to fetch player details",
          error.status,
          "BitJita API",
          error.body || error.message
        );
      }
      throw new ServiceError(
        "Player details fetch failed",
        503,
        "BitJita Service",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Get player inventories with icon enrichment
   * 
   * @param id - Player entity ID
   * @param cacheTTL - Optional cache TTL override (default: 1min)
   * @returns Promise<BitJitaInventoriesResponse> - Player inventories with enriched icons
   * @throws {ServiceError} When player not found or API fails
   * 
   * @example
   * ```typescript
   * const inventories = await BitJitaService.getPlayerInventories("123");
   * // Returns inventories with iconAssetName enriched from GameData
   * ```
   */
  static async getPlayerInventories(
    id: string,
    cacheTTL: number = CACHE_TTL.INVENTORIES
  ) {
    if (!id) {
      throw new ServiceError("Player ID is required", 400, "BitJita Service");
    }

    const cacheKey = `inventories:${id}`;
    
    // Check cache first
    const cached = cacheUtils.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const data = await BitJita.getPlayerInventories(id);

      // Enrich items with iconAssetName from local GameData
      const iconLookup = getGameDataIconLookup();
      if (data.items) {
        for (const [itemId, item] of Object.entries(data.items)) {
          if (item && typeof item === "object" && !(item as { iconAssetName?: string }).iconAssetName) {
            const numericId = parseInt(itemId);
            const iconAssetName = iconLookup.getIconAssetName(numericId);
            if (iconAssetName) {
              (item as Record<string, unknown>).iconAssetName = iconAssetName;
            }
          }
        }
      }

      // Cache the enriched response
      cacheUtils.set(cacheKey, data, cacheTTL);
      
      return data;
    } catch (error) {
      if (error instanceof BitJitaHttpError) {
        if (error.status === 404) {
          throw new ServiceError(
            "Player inventories not found",
            404,
            "BitJita API",
            `No inventories found for player '${id}'`
          );
        }
        throw new ServiceError(
          "Failed to fetch player inventories",
          error.status,
          "BitJita API",
          error.body || error.message
        );
      }
      throw new ServiceError(
        "Player inventories fetch failed",
        503,
        "BitJita Service",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Get player housing list
   * 
   * @param id - Player entity ID
   * @param cacheTTL - Optional cache TTL override (default: 3min)
   * @returns Promise<BitJitaHousingResponse> - Player housing data
   * @throws {ServiceError} When player not found or API fails
   */
  static async getPlayerHousing(
    id: string,
    cacheTTL: number = CACHE_TTL.HOUSING
  ) {
    if (!id) {
      throw new ServiceError("Player ID is required", 400, "BitJita Service");
    }

    const cacheKey = `housing:${id}`;
    
    // Check cache first
    const cached = cacheUtils.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const data = await BitJita.getPlayerHousing(id);
      
      // Cache the response
      cacheUtils.set(cacheKey, data, cacheTTL);
      
      return data;
    } catch (error) {
      if (error instanceof BitJitaHttpError) {
        if (error.status === 404) {
          throw new ServiceError(
            "Player housing not found",
            404,
            "BitJita API",
            `No housing found for player '${id}'`
          );
        }
        throw new ServiceError(
          "Failed to fetch player housing",
          error.status,
          "BitJita API",
          error.body || error.message
        );
      }
      throw new ServiceError(
        "Player housing fetch failed",
        503,
        "BitJita Service",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Get player housing building details
   * 
   * @param playerId - Player entity ID
   * @param buildingId - Building entity ID
   * @param cacheTTL - Optional cache TTL override (default: 3min)
   * @returns Promise<BitJitaHousingDetailsResponse> - Building details
   * @throws {ServiceError} When building not found or API fails
   */
  static async getPlayerHousingDetails(
    playerId: string,
    buildingId: string,
    cacheTTL: number = CACHE_TTL.HOUSING
  ) {
    if (!playerId || !buildingId) {
      throw new ServiceError(
        "Player ID and Building ID are required", 
        400, 
        "BitJita Service"
      );
    }

    const cacheKey = `housing-details:${playerId}:${buildingId}`;
    
    // Check cache first
    const cached = cacheUtils.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const data = await BitJita.getPlayerHousingDetails(playerId, buildingId);
      
      // Cache the response
      cacheUtils.set(cacheKey, data, cacheTTL);
      
      return data;
    } catch (error) {
      if (error instanceof BitJitaHttpError) {
        if (error.status === 404) {
          throw new ServiceError(
            "Housing details not found",
            404,
            "BitJita API",
            `No building '${buildingId}' found for player '${playerId}'`
          );
        }
        throw new ServiceError(
          "Failed to fetch housing details",
          error.status,
          "BitJita API",
          error.body || error.message
        );
      }
      throw new ServiceError(
        "Housing details fetch failed",
        503,
        "BitJita Service",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Get claim inventories with data transformation
   * 
   * @param claimId - Claim entity ID
   * @param cacheTTL - Optional cache TTL override (default: 1min)
   * @returns Promise<TransformedClaimInventories> - Transformed claim data
   * @throws {ServiceError} When claim not found or API fails
   */
  static async getClaimInventories(
    claimId: string,
    cacheTTL: number = CACHE_TTL.INVENTORIES
  ) {
    if (!claimId) {
      throw new ServiceError("Claim ID is required", 400, "BitJita Service");
    }

    const cacheKey = `claim-inventories:${claimId}`;
    
    // Check cache first
    const cached = cacheUtils.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const bitjitaData = await BitJita.getClaimInventories(claimId);

      // Transform BitJita response to our expected format
      const transformedData = this.transformClaimInventories(claimId, bitjitaData as { 
        items?: { id: number; name: string; tier: number; tag: string; rarityStr: string; iconAssetName?: string }[]; 
        buildings?: { entityId: string; buildingName: string; buildingNickname?: string; iconAssetName: string; inventory: { contents: { item_id: number; quantity: number; }; }[] }[] 
      });

      // Cache the transformed response
      cacheUtils.set(cacheKey, transformedData, cacheTTL);
      
      return transformedData;
    } catch (error) {
      if (error instanceof BitJitaHttpError) {
        if (error.status === 404) {
          throw new ServiceError(
            "Claim not found",
            404,
            "BitJita API",
            `No claim found with ID '${claimId}'`
          );
        }
        throw new ServiceError(
          "Failed to fetch claim inventories",
          error.status,
          "BitJita API",
          error.body || error.message
        );
      }
      throw new ServiceError(
        "Claim inventories fetch failed",
        503,
        "BitJita Service",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Get crafts with flexible filtering
   * 
   * @param params - Craft filtering parameters
   * @param cacheTTL - Optional cache TTL override (default: 2min)
   * @returns Promise<CraftsResponse> - Filtered crafts data
   * @throws {ServiceError} When API fails
   */
  static async getCrafts(
    params: {
      claimEntityId?: string;
      playerEntityId?: string;
      regionId?: number;
      completed?: boolean;
      skillId?: number;
    },
    cacheTTL: number = CACHE_TTL.CRAFTS
  ): Promise<CraftsResponse> {
    // Create cache key from params
    const cacheKey = `crafts:${JSON.stringify(params)}`;
    
    // Check cache first
    const cached = cacheUtils.get<CraftsResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const crafts = await BitJita.getCrafts(params);

      const craftsData = crafts as { craftResults?: { [key: string]: unknown; id: string }[] };
      const response: CraftsResponse = {
        crafts: craftsData.craftResults || [],
        totalCount: craftsData.craftResults?.length || 0,
      };

      // Cache the response
      cacheUtils.set(cacheKey, response, cacheTTL);
      
      return response;
    } catch (error) {
      if (error instanceof BitJitaHttpError) {
        throw new ServiceError(
          "Failed to fetch crafts",
          error.status,
          "BitJita API",
          error.body || error.message
        );
      }
      throw new ServiceError(
        "Crafts fetch failed",
        503,
        "BitJita Service",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Transform BitJita claim inventories to our expected format
   * 
   * @private
   */
  private static transformClaimInventories(claimId: string, bitjitaData: { items?: Array<{ id: number; name: string; tier: number; tag: string; rarityStr: string; iconAssetName?: string }>; buildings?: Array<{ entityId: string; buildingName: string; buildingNickname?: string; iconAssetName: string; inventory: Array<{ contents: { item_id: number; quantity: number } }> }> }) {
    // Create a lookup map for items by ID
    const itemsMap = new Map<number, { id: number; name: string; tier: number; tag: string; rarityStr: string; iconAssetName?: string }>();
    bitjitaData.items?.forEach((item) => {
      itemsMap.set(item.id, item);
    });

    // Transform BitJita response to our expected format
    return {
      claimId,
      claimName: `Claim ${claimId}`, // We'll need to get the actual name from somewhere else
      inventories:
        bitjitaData.buildings?.map((building) => ({
          id: building.entityId,
          name:
            building.buildingNickname || building.buildingName || `Building ${building.entityId}`,
          type: "building",
          items:
            building.inventory?.map((slot) => {
              const itemData = itemsMap.get(slot.contents.item_id);
              return {
                itemId: normalizeItemId(slot.contents.item_id),
                name: itemData?.name || `Item ${slot.contents.item_id}`,
                quantity: slot.contents.quantity,
                tier: itemData?.tier || 0,
                category: itemData?.tag || "Unknown",
                rarity: itemData?.rarityStr || "Common",
                iconAssetName: itemData?.iconAssetName,
              };
            }) || [],
          buildingName: building.buildingName,
          buildingNickname: building.buildingNickname,
          claimName: `Claim ${claimId}`,
          claimId: claimId,
          entityId: building.entityId,
          iconAssetName: building.iconAssetName,
        })) || [],
    };
  }

  /**
   * Clear all cached data
   * 
   * Useful for testing or when cache needs to be reset
   */
  static clearCache(): void {
    cache.clear();
  }

  /**
   * Clean up expired cache entries
   * 
   * Should be called periodically to prevent memory leaks
   */
  static cleanupCache(): void {
    cacheUtils.cleanup();
  }

  /**
   * Get cache statistics
   * 
   * @returns Object with cache size and memory usage info
   */
  static getCacheStats() {
    return {
      size: cache.size,
      keys: Array.from(cache.keys()),
    };
  }
}
