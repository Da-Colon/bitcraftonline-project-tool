import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { BitJita, BitJitaHttpError } from "~/utils/bitjita.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const { playerId } = params;
  
  if (!playerId) {
    throw new Response("Player ID is required", { status: 400 });
  }

  try {
    const data = await BitJita.getPlayerInventories(playerId);
    return json(data, { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=30" } });
  } catch (error) {
    const detail = error instanceof BitJitaHttpError ? error.body || error.message : String(error);
    throw new Response(
      JSON.stringify({
        error: "External API Error",
        service: "BitJita API",
        detail,
        isExternalError: true,
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}
