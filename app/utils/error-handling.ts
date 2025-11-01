/**
 * @fileoverview Error handling utilities for fetcher responses
 * 
 * Provides centralized error extraction and formatting for Remix fetcher responses.
 * Handles StandardErrorResponse formatting and special cases like 404-as-non-error.
 */

import type { StandardErrorResponse } from "~/types/api-responses"
import { isStandardErrorResponse } from "~/utils/type-guards"

export interface ExtractFetcherErrorOptions {
  /**
   * Whether to treat 404 errors as non-errors (return null)
   * Useful for endpoints where 404 means "no data" rather than "error"
   */
  treat404AsNonError?: boolean
}

/**
 * Format a StandardErrorResponse into a user-friendly error message
 * 
 * @param errorData - The error response data
 * @param fallbackMessage - Message to use if error data lacks details
 * @returns Formatted error string
 * 
 * @example
 * ```typescript
 * const error = formatFetcherError(errorResponse, "Failed to fetch data")
 * // Returns: "External API Error: Service unavailable" (if external)
 * // Returns: "Specific error detail" (if internal)
 * ```
 */
export function formatFetcherError(
  errorData: StandardErrorResponse,
  fallbackMessage: string
): string {
  if (errorData.isExternalError) {
    return `${errorData.service || "External API"} Error: ${
      errorData.detail || "Service unavailable"
    }`
  }
  
  return errorData.detail || errorData.error || fallbackMessage
}

/**
 * Extract and format error message from fetcher data
 * 
 * Checks if the fetcher data is a StandardErrorResponse and formats it appropriately.
 * Returns null if data is not an error or if error should be treated as non-error.
 * 
 * @param data - Fetcher data (unknown type)
 * @param fallbackMessage - Message to use if error lacks details
 * @param options - Optional configuration for error handling
 * @returns Formatted error string or null
 * 
 * @example
 * ```typescript
 * const error = extractFetcherError(fetcher.data, "Failed to fetch inventories")
 * if (error) {
 *   // Handle error
 * }
 * ```
 */
export function extractFetcherError(
  data: unknown,
  fallbackMessage: string,
  options: ExtractFetcherErrorOptions = {}
): string | null {
  if (!data || !isStandardErrorResponse(data)) {
    return null
  }

  const errorData = data

  // Handle 404-as-non-error case (e.g., for housing where 404 means "no housing")
  if (options.treat404AsNonError) {
    if (
      errorData.error?.toLowerCase().includes("not found") ||
      errorData.error?.toLowerCase().includes("404")
    ) {
      return null
    }
  }

  return formatFetcherError(errorData, fallbackMessage)
}

