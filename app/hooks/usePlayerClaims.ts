import { useMemo } from "react";

import { usePlayerDetails } from "~/hooks/usePlayerDetails";
import type { PlayerClaim } from "~/types/player";

export function usePlayerClaims(playerId?: string) {
  const { detail, loading, error } = usePlayerDetails(playerId);

  const claims = useMemo((): PlayerClaim[] => {
    if (!detail?.player?.claims) return [];
    return detail.player.claims;
  }, [detail]);

  return {
    claims,
    loading,
    error,
  };
}
