import { z } from "zod"

const DEFAULT_BASE = "https://bitjita.com"

export class BitJitaHttpError extends Error {
  status: number
  url: string
  body?: string
  constructor(message: string, opts: { status: number; url: string; body?: string }) {
    super(message)
    this.status = opts.status
    this.url = opts.url
    this.body = opts.body
  }
}

function baseUrl() {
  return process.env.BITJITA_BASE_URL || DEFAULT_BASE
}

async function fetchJson<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${baseUrl()}${path}`
  const headers = new Headers(init.headers || {})
  if (!headers.has("Accept")) headers.set("Accept", "application/json")
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json")

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal, headers })
    const text = await res.text()
    if (!res.ok) {
      throw new BitJitaHttpError(`Upstream error ${res.status}`, {
        status: res.status,
        url,
        body: text,
      })
    }
    return text ? (JSON.parse(text) as T) : ({} as T)
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new BitJitaHttpError("Upstream timeout", { status: 504, url })
    }
    if (err instanceof BitJitaHttpError) throw err
    throw new BitJitaHttpError(err?.message || "Network error", { status: 503, url })
  } finally {
    clearTimeout(timeout)
  }
}

// Schemas (minimum fields used by the app)
export const PlayerSchema = z
  .object({
    entityId: z.string(),
    username: z.string(),
  })
  .passthrough()

export type Player = z.infer<typeof PlayerSchema>

export const PocketSchema = z.object({
  contents: z
    .object({ itemId: z.number(), quantity: z.number(), itemType: z.number().optional() })
    .nullable()
    .optional(),
})

export const InventorySchema = z
  .object({
    entityId: z.string(),
    inventoryName: z.string().nullable().optional(),
    pockets: z.array(PocketSchema),
    buildingName: z.string().nullable().optional(),
    claimName: z.string().nullable().optional(),
    regionId: z.number().optional(),
  })
  .passthrough()

export const InventoriesResponseSchema = z.object({
  inventories: z.array(InventorySchema),
  items: z.record(z.any()),
  cargos: z.record(z.any()).optional(),
})

export type BitJitaInventoriesResponse = z.infer<typeof InventoriesResponseSchema>

export async function searchPlayers(q: string): Promise<Player[]> {
  const data = await fetchJson<any>(`/api/players?q=${encodeURIComponent(q)}`)
  if (Array.isArray(data)) {
    return PlayerSchema.array().parse(data)
  }
  if (data && typeof data === "object") {
    if (Array.isArray((data as any).players))
      return PlayerSchema.array().parse((data as any).players)
    if (Array.isArray((data as any).data)) return PlayerSchema.array().parse((data as any).data)
  }
  // Unknown shape; return empty
  return []
}

export async function getPlayerById(id: string): Promise<unknown> {
  return fetchJson(`/api/players/${encodeURIComponent(id)}`)
}

export async function getPlayerInventories(id: string): Promise<BitJitaInventoriesResponse> {
  const json = await fetchJson(`/api/players/${encodeURIComponent(id)}/inventories`)
  return InventoriesResponseSchema.parse(json)
}

export async function getClaimInventories(claimId: string): Promise<any> {
  return fetchJson(`/api/claims/${encodeURIComponent(claimId)}/inventories`)
}

export async function getPlayerHousing(playerId: string): Promise<any> {
  return fetchJson(`/api/players/${encodeURIComponent(playerId)}/housing`)
}

export async function getPlayerHousingDetails(playerId: string, buildingId: string): Promise<any> {
  return fetchJson(
    `/api/players/${encodeURIComponent(playerId)}/housing/${encodeURIComponent(buildingId)}`
  )
}

export async function getCrafts(params: {
  claimEntityId?: string;
  playerEntityId?: string;
  regionId?: number;
  completed?: boolean;
  skillId?: number;
}): Promise<any> {
  const queryParams = new URLSearchParams();
  if (params.claimEntityId) queryParams.set('claimEntityId', params.claimEntityId);
  if (params.playerEntityId) queryParams.set('playerEntityId', params.playerEntityId);
  if (params.regionId) queryParams.set('regionId', params.regionId.toString());
  if (params.completed !== undefined) queryParams.set('completed', params.completed.toString());
  if (params.skillId) queryParams.set('skillId', params.skillId.toString());
  
  return fetchJson(`/api/crafts?${queryParams.toString()}`);
}

export const BitJita = {
  searchPlayers,
  getPlayerById,
  getPlayerInventories,
  getClaimInventories,
  getPlayerHousing,
  getPlayerHousingDetails,
  getCrafts,
  fetchJson,
  BitJitaHttpError,
}
