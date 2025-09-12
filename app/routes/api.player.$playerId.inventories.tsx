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
    const response = await fetch(`${bitjitaBaseUrl}/api/players/${playerId}/inventories`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Response("Player not found", { status: 404 });
      }
      throw new Response(`BitJita API error: ${response.statusText}`, { status: response.status });
    }

    const data = await response.json();
    return json(data);
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    
    console.error("Failed to fetch player inventories:", error);
    throw new Response("Failed to fetch inventories", { status: 500 });
  }
}
