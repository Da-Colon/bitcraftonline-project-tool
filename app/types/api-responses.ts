/**
 * @fileoverview Shared types for API responses and error handling
 * 
 * This file contains standardized types for all API endpoints to ensure
 * consistent error handling and response shapes across the application.
 */

/**
 * Standard error response shape for all API endpoints
 * 
 * @example
 * ```json
 * {
 *   "error": "Player not found",
 *   "detail": "No player found with ID 'invalid-id'",
 *   "service": "BitJita API",
 *   "isExternalError": true
 * }
 * ```
 */
export interface StandardErrorResponse {
  /** Human-readable error message */
  error: string;
  /** Additional error details (optional) */
  detail?: string;
  /** Service that generated the error (e.g., "BitJita API") */
  service?: string;
  /** Whether this is an error from an external service */
  isExternalError?: boolean;
}

/**
 * Custom error class for service layer operations
 * 
 * Provides consistent error handling across all BitJita service calls
 * with proper typing and standardized error messages.
 */
export class ServiceError extends Error {
  /** HTTP status code to return */
  status: number;
  /** Additional error details */
  detail?: string;
  /** Service that generated the error */
  service: string;

  constructor(
    message: string,
    status: number,
    service: string = "BitJita Service",
    detail?: string
  ) {
    super(message);
    this.name = "ServiceError";
    this.status = status;
    this.service = service;
    this.detail = detail;
  }
}

/**
 * Cache configuration for service methods
 * 
 * Controls how long data should be cached in memory
 */
export interface CacheConfig {
  /** Time to live in milliseconds */
  ttl: number;
  /** Whether to use stale-while-revalidate pattern */
  staleWhileRevalidate?: boolean;
}

/**
 * Standard cache TTL values based on data volatility
 * 
 * These values are chosen based on how frequently the data changes:
 * - Players: 5min (rarely change)
 * - Inventories: 1min (change frequently) 
 * - Crafts: 2min (moderate changes)
 * - Housing: 3min (moderate changes)
 */
export const CACHE_TTL = {
  PLAYERS: 5 * 60 * 1000,      // 5 minutes
  INVENTORIES: 1 * 60 * 1000,   // 1 minute
  CRAFTS: 2 * 60 * 1000,        // 2 minutes
  HOUSING: 3 * 60 * 1000,       // 3 minutes
} as const;

/**
 * Response type for player search endpoints
 */
export interface PlayerSearchResponse {
  players: Array<{
    entityId: string;
    username: string;
  }>;
}

/**
 * Response type for player details endpoints
 */
export interface PlayerDetailsResponse {
  entityId: string;
  username: string;
  [key: string]: unknown; // Allow additional fields from BitJita
}

/**
 * Response type for crafts endpoints
 */
export interface CraftsResponse {
  crafts: Array<{
    id: string;
    [key: string]: unknown; // Allow additional fields from BitJita
  }>;
  totalCount: number;
}
