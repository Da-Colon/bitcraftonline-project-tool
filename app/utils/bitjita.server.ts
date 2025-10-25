/**
 * @fileoverview BitJita HTTP Client
 * 
 * Low-level HTTP client for BitJita API interactions.
 * This module provides the core HTTP functionality and data validation
 * for all BitJita API calls. Higher-level business logic should use
 * the BitJitaService instead.
 * 
 * @dependencies zod for data validation
 * @env BITJITA_BASE_URL - Base URL for BitJita API (defaults to https://bitjita.com)
 */

import { z } from "zod";

// TypeScript types for fetch API
type RequestInit = globalThis.RequestInit;

const DEFAULT_BASE = "https://bitjita.com";

/**
 * Custom error class for BitJita HTTP errors
 * 
 * Provides structured error information including status code,
 * URL, and response body for better error handling.
 */
export class BitJitaHttpError extends Error {
  status: number;
  url: string;
  body?: string;
  
  constructor(message: string, opts: { status: number; url: string; body?: string }) {
    super(message);
    this.name = "BitJitaHttpError";
    this.status = opts.status;
    this.url = opts.url;
    this.body = opts.body;
  }
}

/**
 * Get the base URL for BitJita API
 * 
 * @returns {string} Base URL from environment or default
 */
function baseUrl(): string {
  return process.env.BITJITA_BASE_URL || DEFAULT_BASE;
}

/**
 * Make HTTP request to BitJita API with error handling and timeout
 * 
 * @param path - API endpoint path
 * @param init - Request options
 * @returns Promise<T> - Parsed JSON response
 * @throws {BitJitaHttpError} When request fails or times out
 */
async function fetchJson<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${baseUrl()}${path}`;
  const headers = new Headers(init.headers || {});
  
  // Set default headers for JSON API
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  // Set up timeout (10 seconds)
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  
  try {
    const res = await fetch(url, { ...init, signal: controller.signal, headers });
    const text = await res.text();
    
    if (!res.ok) {
      throw new BitJitaHttpError(`Upstream error ${res.status}`, {
        status: res.status,
        url,
        body: text,
      });
    }
    
    return text ? (JSON.parse(text) as T) : ({} as T);
  } catch (err) {
    if (err && typeof err === 'object' && 'name' in err && err.name === "AbortError") {
      throw new BitJitaHttpError("Upstream timeout", { status: 504, url });
    }
    if (err instanceof BitJitaHttpError) throw err;
    const message = err && typeof err === 'object' && 'message' in err ? String(err.message) : "Network error";
    throw new BitJitaHttpError(message, { status: 503, url });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Zod schemas for BitJita API data validation
 * 
 * These schemas define the minimum required fields for each data type.
 * Additional fields are allowed via .passthrough() for API flexibility.
 */

// Player schema with required fields
export const PlayerSchema = z
  .object({
    entityId: z.string(),
    username: z.string(),
  })
  .passthrough();

export type Player = z.infer<typeof PlayerSchema>;

// Inventory pocket schema
export const PocketSchema = z.object({
  contents: z
    .object({ 
      itemId: z.number(), 
      quantity: z.number(), 
      itemType: z.number().optional() 
    })
    .nullable()
    .optional(),
});

// Inventory schema
export const InventorySchema = z
  .object({
    entityId: z.string(),
    inventoryName: z.string().nullable().optional(),
    pockets: z.array(PocketSchema),
    buildingName: z.string().nullable().optional(),
    claimName: z.string().nullable().optional(),
    regionId: z.number().optional(),
  })
  .passthrough();

// Inventories response schema
export const InventoriesResponseSchema = z.object({
  inventories: z.array(InventorySchema),
  items: z.record(z.unknown()),
  cargos: z.record(z.unknown()).optional(),
});

export type BitJitaInventoriesResponse = z.infer<typeof InventoriesResponseSchema>;

/**
 * BitJita API Client
 * 
 * Low-level HTTP client for BitJita API. All methods make direct HTTP calls
 * without caching or business logic. Use BitJitaService for higher-level operations.
 */
export const BitJita = {
  /**
   * Search for players by username
   * 
   * @param q - Search query
   * @returns Promise<Player[]> - Array of matching players
   */
  async searchPlayers(q: string): Promise<Player[]> {
    const data = await fetchJson<unknown>(`/api/players?q=${encodeURIComponent(q)}`);
    
    // Handle different response formats from BitJita API
    if (Array.isArray(data)) {
      return PlayerSchema.array().parse(data);
    }
    if (data && typeof data === "object") {
      if (Array.isArray((data as { players?: unknown }).players)) {
        return PlayerSchema.array().parse((data as { players: unknown }).players);
      }
      if (Array.isArray((data as { data?: unknown }).data)) {
        return PlayerSchema.array().parse((data as { data: unknown }).data);
      }
    }
    
    // Unknown shape; return empty array
    return [];
  },

  /**
   * Get player details by entity ID
   * 
   * @param id - Player entity ID
   * @returns Promise<unknown> - Player details
   */
  async getPlayerById(id: string): Promise<unknown> {
    return fetchJson(`/api/players/${encodeURIComponent(id)}`);
  },

  /**
   * Get player inventories
   * 
   * @param id - Player entity ID
   * @returns Promise<BitJitaInventoriesResponse> - Player inventories
   */
  async getPlayerInventories(id: string): Promise<BitJitaInventoriesResponse> {
    const json = await fetchJson(`/api/players/${encodeURIComponent(id)}/inventories`);
    return InventoriesResponseSchema.parse(json);
  },

  /**
   * Get claim inventories
   * 
   * @param claimId - Claim entity ID
   * @returns Promise<any> - Claim inventories
   */
  async getClaimInventories(claimId: string): Promise<unknown> {
    return fetchJson(`/api/claims/${encodeURIComponent(claimId)}/inventories`);
  },

  /**
   * Get player housing list
   * 
   * @param playerId - Player entity ID
   * @returns Promise<any> - Player housing data
   */
  async getPlayerHousing(playerId: string): Promise<unknown> {
    return fetchJson(`/api/players/${encodeURIComponent(playerId)}/housing`);
  },

  /**
   * Get player housing building details
   * 
   * @param playerId - Player entity ID
   * @param buildingId - Building entity ID
   * @returns Promise<any> - Building details
   */
  async getPlayerHousingDetails(playerId: string, buildingId: string): Promise<unknown> {
    return fetchJson(
      `/api/players/${encodeURIComponent(playerId)}/housing/${encodeURIComponent(buildingId)}`
    );
  },

  /**
   * Get crafts with filtering
   * 
   * @param params - Craft filtering parameters
   * @returns Promise<any> - Crafts data
   */
  async getCrafts(params: {
    claimEntityId?: string;
    playerEntityId?: string;
    regionId?: number;
    completed?: boolean;
    skillId?: number;
  }): Promise<unknown> {
    const queryParams = new URLSearchParams();
    if (params.claimEntityId) queryParams.set('claimEntityId', params.claimEntityId);
    if (params.playerEntityId) queryParams.set('playerEntityId', params.playerEntityId);
    if (params.regionId) queryParams.set('regionId', params.regionId.toString());
    if (params.completed !== undefined) queryParams.set('completed', params.completed.toString());
    if (params.skillId) queryParams.set('skillId', params.skillId.toString());
    
    return fetchJson(`/api/crafts?${queryParams.toString()}`);
  },

  // Export utility functions for advanced usage
  fetchJson,
  BitJitaHttpError,
};
