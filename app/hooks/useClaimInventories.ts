import { useState, useEffect } from "react";
import type { ClaimInventoriesResponse } from "~/types/inventory";

export function useClaimInventories(claimId?: string) {
  const [inventories, setInventories] = useState<ClaimInventoriesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!claimId) {
      setInventories(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchInventories = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/claims/${claimId}/inventories`);
        if (!response.ok) {
          if (response.status === 503) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.isExternalError 
              ? `${errorData.service || 'External API'} Error: ${errorData.detail || 'Service unavailable'}`
              : errorData.detail || "External service is currently unavailable";
            throw new Error(errorMsg);
          }
          throw new Error(`Failed to fetch claim inventories: ${response.statusText}`);
        }
        
        const data: ClaimInventoriesResponse = await response.json();
        setInventories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setInventories(null);
      } finally {
        setLoading(false);
      }
    };

    fetchInventories();
  }, [claimId]);

  return { inventories, loading, error };
}
