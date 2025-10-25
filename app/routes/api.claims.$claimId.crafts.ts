/**
 * @fileoverview Claim Crafts API Endpoint
 * 
 * GET /api/claims/:claimId/crafts
 * 
 * Fetches all crafts (active and completed) for a specific claim.
 * Combines both active and completed crafts into a single response.
 * Uses 2-minute cache since craft data changes moderately.
 * 
 * @dependencies BitJitaService, StandardErrorResponse, CraftsResponse
 * @caching 2min cache with stale-while-revalidate
 */

import { json, type LoaderFunctionArgs } from "@remix-run/node";

import { BitJitaService } from "~/services/bitjita.service";
import { ServiceError, type CraftsResponse, type StandardErrorResponse } from "~/types/api-responses";

/**
 * GET /api/claims/:claimId/crafts
 * 
 * Get all crafts (active and completed) for a claim
 * 
 * @param {string} claimId - Claim entity ID
 * @returns {CraftsResponse} Combined crafts data with total count
 * @throws {400} When claim ID is missing
 * @throws {404} When claim not found
 * @throws {503} When external service unavailable
 * 
 * @example
 * GET /api/claims/123/crafts
 * Returns: { crafts: [...], totalCount: 10 }
 */
export async function loader({ params }: LoaderFunctionArgs) {
  const { claimId } = params;

  // Validate required parameter
  if (!claimId) {
    return json<StandardErrorResponse>(
      { error: "Claim ID is required" },
      { status: 400 }
    );
  }

  try {
    // Fetch both active and completed crafts for the claim
    const [activeCrafts, completedCrafts] = await Promise.all([
      BitJitaService.getCrafts({
        claimEntityId: claimId,
        completed: false,
      }),
      BitJitaService.getCrafts({
        claimEntityId: claimId,
        completed: true,
      }),
    ]);

    // Combine both responses
    const response: CraftsResponse = {
      crafts: [
        ...(activeCrafts.crafts || []),
        ...(completedCrafts.crafts || []),
      ],
      totalCount: (activeCrafts.totalCount || 0) + (completedCrafts.totalCount || 0),
    };
    
    return json<CraftsResponse>(response, {
      headers: {
        // 2-minute cache since craft data changes moderately
        "Cache-Control": "private, max-age=120, stale-while-revalidate=120",
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
    // console.error("Unexpected error fetching claim crafts:", error);
    return json<StandardErrorResponse>(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
