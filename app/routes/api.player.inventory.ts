import { json, type LoaderFunctionArgs } from "@remix-run/node"

import { getGameDataIconLookup } from "~/services/gamedata-icon-lookup.server"
import { BitJita } from "~/utils/bitjita.server"
import type { BitJitaInventoriesResponse } from "~/utils/bitjita.server"
import { normalizeItemId } from "~/utils/itemId"

export interface PlayerInventoryItem {
  itemId: string
  quantity: number
  location: string // "house_inventory" | "personal_banks" | "personal_storages"
}

export interface PlayerInventoryResponse {
  playerName: string
  inventories: Record<string, PlayerInventoryItem[]>
  lastUpdated: string
}

interface BitJitaPlayerSearchResult {
  entityId: string
  username: string
  signedIn: boolean
  timePlayed: number
  timeSignedIn: number
  createdAt: string
  updatedAt: string
  lastLoginTimestamp: string
}

interface BitJitaSearchResponse {
  players?: BitJitaPlayerSearchResult[]
  data?: BitJitaPlayerSearchResult[]
  // Handle different possible response structures
}

// BitJita inventory response structure
// Upstream inventory response (validated by zod in the client)
type BitJitaInventoryData = BitJitaInventoriesResponse

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const playerName = url.searchParams.get("playerName")
  const inventoryTypes = url.searchParams.getAll("inventoryTypes")

  if (!playerName) {
    return json({ error: "Player name is required" }, { status: 400 })
  }

  try {
    // Fetch player data from BitJita API
    const playerData = await fetchPlayerInventoryFromBitJita(playerName, inventoryTypes)

    // If specific inventory types are requested, filter them.
    // Otherwise, return all inventories (for the 'Fetch Sources' step).
    if (inventoryTypes && inventoryTypes.length > 0) {
      const filteredInventories: Record<string, PlayerInventoryItem[]> = {}
      for (const type of inventoryTypes) {
        if (playerData.inventories[type]) {
          filteredInventories[type] = playerData.inventories[type]
        }
      }
      return json(
        { ...playerData, inventories: filteredInventories },
        {
          headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=30" },
        }
      )
    }

    // Return all inventories if no specific types are requested
    return json(playerData, {
      headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=30" },
    })
  } catch (error) {
    console.error("Failed to fetch player inventory:", error)
    return json({ error: "Failed to fetch player inventory data" }, { status: 500 })
  }
}

// Helper function to integrate with BitJita API
async function fetchPlayerInventoryFromBitJita(
  playerName: string,
  inventoryTypes: string[]
): Promise<PlayerInventoryResponse> {
  // Step 1: Search for player by name to get their ID
  const searchResults = await BitJita.searchPlayers(playerName)

  // Find exact match for player name
  const player = searchResults.find((p) => p.username.toLowerCase() === playerName.toLowerCase())
  if (!player) {
    throw new Error(`Player "${playerName}" not found`)
  }

  // Step 2: Fetch player inventories using their ID
  const inventoryData: BitJitaInventoryData = await BitJita.getPlayerInventories(player.entityId)

  // Enhance items with iconAssetName from GameData lookup
  const iconLookup = getGameDataIconLookup()
  if (inventoryData.items) {
    for (const [itemId, item] of Object.entries(inventoryData.items)) {
      if (item && typeof item === "object" && !item.iconAssetName) {
        const numericId = parseInt(itemId)
        const iconAssetName = iconLookup.getIconAssetName(numericId)
        if (iconAssetName) {
          ;(item as any).iconAssetName = iconAssetName
        }
      }
    }
  }

  const inventories: Record<string, PlayerInventoryItem[]> = {}

  // Process BitJita inventory data
  for (const inventory of inventoryData.inventories) {
    // Use the real inventory name as the category, and handle null names.
    const category = inventory.inventoryName || "Unknown"

    // Initialize the array for this category if it doesn't exist
    if (!inventories[category]) {
      inventories[category] = []
    }

    // Process each pocket in the inventory
    for (const pocket of inventory.pockets) {
      if (!pocket.contents) continue

      const item: PlayerInventoryItem = {
        itemId: normalizeItemId(pocket.contents.itemId),
        quantity: pocket.contents.quantity,
        location: category,
      }

      inventories[category].push(item)
    }
  }

  return {
    playerName: player.username,
    inventories,
    lastUpdated: new Date().toISOString(),
  }
}
