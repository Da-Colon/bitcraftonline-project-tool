import { useFetcher } from "@remix-run/react";
import { useEffect, useMemo } from "react";

import type { StandardErrorResponse } from "~/types/api-responses";
import type { ClaimInventoriesResponse } from "~/types/inventory";
import { extractFetcherError } from "~/utils/error-handling";
import { isClaimInventoriesResponse } from "~/utils/type-guards";

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
    return extractFetcherError(fetcher.data, "Failed to fetch claim inventories");
  }, [fetcher.data]);

  // Derive loading state
  const loading =
    fetcher.state === "loading" || fetcher.state === "submitting";

  return { inventories, loading, error };
}
