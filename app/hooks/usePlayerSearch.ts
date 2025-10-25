import { useEffect, useMemo, useRef, useState } from "react";

import { useDebounce } from "~/hooks/useDebounce";
import type { Player, PlayerSearchResponse } from "~/types/player";

type UsePlayerSearchOptions = {
  minLength?: number;
  delay?: number;
};

export function usePlayerSearch(query: string, opts: UsePlayerSearchOptions = {}) {
  const minLength = opts.minLength ?? 2;
  const delay = opts.delay ?? 300;
  const debounced = useDebounce(query, delay);
  const [results, setResults] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setError(null);
    // Clear results if query too short
    if (!debounced || debounced.trim().length < minLength) {
      setResults([]);
      if (abortRef.current) abortRef.current.abort();
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    const q = encodeURIComponent(debounced.trim());
    const url = `/api/players/search?q=${q}`;

    setLoading(true);
    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Search failed (${res.status})`);
        return res.json() as Promise<PlayerSearchResponse>;
      })
      .then((data) => {
        setResults(data.players ?? []);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message || "Search error");
        setResults([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [debounced, minLength]);

  return useMemo(() => ({ results, loading, error }), [results, loading, error]);
}
