import { useState, useEffect } from "react";

const SELECTED_CLAIM_KEY = "bitcraft-selected-claim";

export interface SelectedClaim {
  claimId: string;
  claimName: string;
}

export function useSelectedClaim() {
  const [claim, setClaim] = useState<SelectedClaim | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(SELECTED_CLAIM_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setClaim(parsed);
        }
      } catch (error) {
        console.warn("Failed to load selected claim from localStorage:", error);
      }
    }
  }, []);

  // Save to localStorage whenever claim changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        if (claim) {
          localStorage.setItem(SELECTED_CLAIM_KEY, JSON.stringify(claim));
        } else {
          localStorage.removeItem(SELECTED_CLAIM_KEY);
        }
      } catch (error) {
        console.warn("Failed to save selected claim to localStorage:", error);
      }
    }
  }, [claim]);

  const selectClaim = (claimId: string, claimName: string) => {
    setClaim({ claimId, claimName });
  };

  const clearClaim = () => {
    setClaim(null);
  };

  return {
    claim,
    selectClaim,
    clearClaim,
  };
}
