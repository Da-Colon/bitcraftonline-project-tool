// API route for BitJita proxy (server-only)
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { rateLimit } from "~/services/rate-limit.server";
import { cache } from "~/services/cache.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "unknown";
  
  if (!rateLimit.check(ip)) {
    return json(
      { error: "Rate limit exceeded" }, 
      { 
        status: 429,
        headers: {
          "Retry-After": "60",
        }
      }
    );
  }
  
  const path = params["*"];
  const url = new URL(request.url);
  const cacheKey = `bitjita:${path}:${url.search}`;
  
  // Try cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    return json(cached, {
      headers: {
        "X-Cache": "HIT",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600",
      }
    });
  }
  
  // TODO: Implement actual proxy logic
  const response = { 
    message: "Proxy endpoint ready", 
    path,
    timestamp: Date.now() 
  };
  
  // Cache the response
  await cache.set(cacheKey, response, 60);
  
  return json(response, {
    headers: {
      "X-Cache": "MISS",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600",
    }
  });
}
