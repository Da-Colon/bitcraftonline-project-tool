import { json, type LoaderFunctionArgs } from "@remix-run/node";

type Cached<T> = { data: T; fetchedAt: number };
const CACHE = new Map<string, Cached<any>>();
const TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function loader({ params }: LoaderFunctionArgs) {
  const id = params.id;
  if (!id) return json({ error: "Missing player id" }, { status: 400 });

  const now = Date.now();
  const cached = CACHE.get(id);
  if (cached && now - cached.fetchedAt < TTL_MS) {
    return json(cached.data, { headers: { "Cache-Control": "private, max-age=30" } });
  }

  const base = process.env.BITJITA_BASE_URL || "https://bitjita.com";
  
  try {
    const upstream = await fetch(`${base}/api/players/${encodeURIComponent(id)}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      console.error(`[EXTERNAL API ERROR] BitJita API failed for player ${id}:`, {
        status: upstream.status,
        statusText: upstream.statusText,
        response: text,
        url: `${base}/api/players/${encodeURIComponent(id)}`,
        timestamp: new Date().toISOString()
      });
      
      // All upstream errors are external API issues, not our fault
      return json({ 
        error: "External API Error", 
        service: "BitJita API",
        status: upstream.status, 
        detail: upstream.status >= 500 
          ? "The BitJita API is currently experiencing issues. This is not a problem with our application."
          : upstream.status === 404 
            ? "Player not found in BitJita database"
            : `BitJita API returned ${upstream.status}: ${upstream.statusText}`,
        isExternalError: true
      }, { status: 503 }); // Always return 503 for external API issues
    }

    const data = await upstream.json();
    CACHE.set(id, { data, fetchedAt: now });
    console.log(`[API SUCCESS] BitJita API responded successfully for player ${id}`);
    return json(data, { headers: { "Cache-Control": "private, max-age=30" } });
    
  } catch (error) {
    console.error(`[NETWORK ERROR] Failed to connect to BitJita API for player ${id}:`, {
      error: error instanceof Error ? error.message : String(error),
      url: `${base}/api/players/${encodeURIComponent(id)}`,
      timestamp: new Date().toISOString()
    });
    
    return json({ 
      error: "Network Error", 
      service: "BitJita API",
      detail: "Unable to connect to BitJita API. This could be a network issue or the external service may be down.",
      isExternalError: true
    }, { status: 503 });
  }
}

