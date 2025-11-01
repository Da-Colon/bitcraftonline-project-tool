/**
 * @fileoverview Type guard utilities for runtime type validation
 * 
 * These type guards provide runtime validation for API responses and data structures,
 * replacing unsafe type assertions with proper type narrowing.
 */

import type { StandardErrorResponse } from "~/types/api-responses"
import type {
  BitJitaInventoriesResponse,
  ClaimInventoriesResponse,
  BitJitaHousingResponse,
} from "~/types/inventory"
import type { Item, RecipeBreakdownItem } from "~/types/recipes"

/**
 * Type guard for StandardErrorResponse
 * Validates that data has the error property structure
 */
export function isStandardErrorResponse(data: unknown): data is StandardErrorResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof (data as { error?: unknown }).error === "string"
  )
}

/**
 * Type guard for BitJitaInventoriesResponse
 * Validates the structure of player inventory responses from BitJita API
 */
export function isBitJitaInventoriesResponse(
  data: unknown
): data is BitJitaInventoriesResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "inventories" in data &&
    Array.isArray((data as { inventories?: unknown }).inventories) &&
    "items" in data &&
    typeof (data as { items?: unknown }).items === "object" &&
    (data as { items?: unknown }).items !== null
  )
}

/**
 * Type guard for ClaimInventoriesResponse
 * Validates the structure of claim inventory responses
 */
export function isClaimInventoriesResponse(
  data: unknown
): data is ClaimInventoriesResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "inventories" in data &&
    Array.isArray((data as { inventories?: unknown }).inventories) &&
    "claimId" in data &&
    typeof (data as { claimId?: unknown }).claimId === "string" &&
    "claimName" in data &&
    typeof (data as { claimName?: unknown }).claimName === "string"
  )
}

/**
 * Type guard for BitJitaHousingResponse
 * Validates that data is an array of housing information
 */
export function isBitJitaHousingResponse(data: unknown): data is BitJitaHousingResponse {
  return Array.isArray(data)
}

/**
 * Type guard for recipe calculation response
 * Validates that data has an optional breakdown array
 */
export function isRecipeCalculationResponse(
  data: unknown
): data is { breakdown?: RecipeBreakdownItem[] } {
  if (typeof data !== "object" || data === null) {
    return false
  }
  
  // If breakdown is present, it must be an array
  if ("breakdown" in data) {
    const breakdown = (data as { breakdown?: unknown }).breakdown
    return breakdown === undefined || Array.isArray(breakdown)
  }
  
  // Empty object is valid (breakdown is optional)
  return true
}

/**
 * Type guard for player search response
 * Validates that data has an optional items array
 */
export function isPlayerSearchResponse(data: unknown): data is { items?: Item[] } {
  if (typeof data !== "object" || data === null) {
    return false
  }
  
  // If items is present, it must be an array
  if ("items" in data) {
    const items = (data as { items?: unknown }).items
    return items === undefined || Array.isArray(items)
  }
  
  // Empty object is valid (items is optional)
  return true
}

