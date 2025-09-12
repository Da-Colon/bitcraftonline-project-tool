import { useState, useEffect } from "react";
import type { PlayerInventories } from "~/types/inventory";

export function usePlayerInventories(playerId?: string) {
  const [inventories, setInventories] = useState<PlayerInventories | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId) {
      setInventories(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchInventories = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/player/${playerId}/inventories`);
        if (!response.ok) {
          throw new Error(`Failed to fetch inventories: ${response.statusText}`);
        }
        
        const data = await response.json();
        setInventories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setInventories(null);
      } finally {
        setLoading(false);
      }
    };

    fetchInventories();
  }, [playerId]);

  return { inventories, loading, error };
}
