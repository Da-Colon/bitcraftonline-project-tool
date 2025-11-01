import { useFetcher } from "@remix-run/react";
import { useEffect, useMemo } from "react";

import type { StandardErrorResponse } from "~/types/api-responses";
import type { ClaimInventoriesResponse } from "~/types/inventory";
import {
  isClaimInventoriesResponse,
  isStandardErrorResponse,
} from "~/utils/type-guards";

export function useClaimInventories(claimId?: string) {
  const fetcher = useFetcher<ClaimInventoriesResponse | StandardErrorResponse>();

  // Load data when claimId changes
  useEffect(() => {
    if (!claimId) {
      return;
    }
    fetcher.load(`/api/claims/${claimId}/inventories`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimId]);

  // Extract data from fetcher
  const inventories = useMemo<ClaimInventoriesResponse | null>(() => {
    if (!fetcher.data || !isClaimInventoriesResponse(fetcher.data)) {
      return null;
    }
    return fetcher.data;
  }, [fetcher.data]);

  // Extract error from fetcher response
  const error = useMemo<string | null>(() => {
    if (fetcher.data && isStandardErrorResponse(fetcher.data)) {
      const errorData = fetcher.data;
      return errorData.isExternalError
        ? `${errorData.service || "External API"} Error: ${
            errorData.detail || "Service unavailable"
          }`
        : errorData.detail || errorData.error || "Failed to fetch claim inventories";
    }
    return null;
  }, [fetcher.data]);

  // Derive loading state
  const loading =
    fetcher.state === "loading" || fetcher.state === "submitting";

  return { inventories, loading, error };
}
