import { json, type LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ params }: LoaderFunctionArgs) {
  const { playerId } = params;
  
  if (!playerId) {
    throw new Response("Player ID is required", { status: 400 });
  }

  const bitjitaBaseUrl = process.env.BITJITA_BASE_URL;
  if (!bitjitaBaseUrl) {
    throw new Response("BitJita API not configured", { status: 500 });
  }

  try {
    const response = await fetch(`${bitjitaBaseUrl}/api/players/${playerId}/inventories`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`[EXTERNAL API ERROR] BitJita API failed for inventories ${playerId}:`, {
        status: response.status,
        statusText: response.statusText,
        response: text,
        url: `${bitjitaBaseUrl}/api/players/${playerId}/inventories`,
        timestamp: new Date().toISOString()
      });
      
      // All upstream errors are external API issues, not our fault
      const errorDetail = response.status >= 500 
        ? "The BitJita API is currently experiencing issues. This is not a problem with our application."
        : response.status === 404 
          ? "Player not found in BitJita database"
          : `BitJita API returned ${response.status}: ${response.statusText}`;
      
      throw new Response(JSON.stringify({
        error: "External API Error",
        service: "BitJita API", 
        status: response.status,
        detail: errorDetail,
        isExternalError: true
      }), { 
        status: 503,
        headers: { "Content-Type": "application/json" }
      });
    }

    const data = await response.json();
    console.log(`[API SUCCESS] BitJita API responded successfully for inventories ${playerId}`);
    return json(data);
    
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    
    console.error(`[NETWORK ERROR] Failed to connect to BitJita API for inventories ${playerId}:`, {
      error: error instanceof Error ? error.message : String(error),
      url: `${bitjitaBaseUrl}/api/players/${playerId}/inventories`,
      timestamp: new Date().toISOString()
    });
    
    throw new Response(JSON.stringify({
      error: "Network Error",
      service: "BitJita API",
      detail: "Unable to connect to BitJita API. This could be a network issue or the external service may be down.",
      isExternalError: true
    }), { 
      status: 503,
      headers: { "Content-Type": "application/json" }
    });
  }
}
