import { json, type LoaderFunctionArgs } from "@remix-run/node"
import { BitJita, BitJitaHttpError } from "~/utils/bitjita.server"
import { normalizeItemId } from "~/utils/itemId"

interface BitJitaInventorySlot {
  locked: boolean
  volume: number
  contents: {
    item_id: number
    quantity: number
    item_type: string
  }
}

interface BitJitaBuilding {
  entityId: string
  buildingDescriptionId: number
  buildingName: string
  buildingNickname?: string
  iconAssetName: string
  inventory: BitJitaInventorySlot[]
}

interface BitJitaItem {
  id: number
  name: string
  iconAssetName: string
  rarity: number
  rarityStr: string
  tier: number
  tag: string
}

interface BitJitaClaimInventoriesResponse {
  buildings: BitJitaBuilding[]
  items: BitJitaItem[]
  cargos?: any[]
}

export async function loader({ params }: LoaderFunctionArgs) {
  const { claimId } = params

  if (!claimId) {
    return json({ error: "Claim ID is required" }, { status: 400 })
  }

  try {
    const bitjitaData: BitJitaClaimInventoriesResponse = await BitJita.getClaimInventories(claimId)

    // Create a lookup map for items by ID
    const itemsMap = new Map<number, BitJitaItem>()
    bitjitaData.items?.forEach((item) => {
      itemsMap.set(item.id, item)
    })

    // Transform BitJita response to our expected format
    const transformedData = {
      claimId,
      claimName: `Claim ${claimId}`, // We'll need to get the actual name from somewhere else
      inventories:
        bitjitaData.buildings?.map((building: BitJitaBuilding) => ({
          id: building.entityId,
          name:
            building.buildingNickname || building.buildingName || `Building ${building.entityId}`,
          type: "building",
          items:
            building.inventory?.map((slot: BitJitaInventorySlot) => {
              const itemData = itemsMap.get(slot.contents.item_id)
              return {
                itemId: normalizeItemId(slot.contents.item_id),
                name: itemData?.name || `Item ${slot.contents.item_id}`,
                quantity: slot.contents.quantity,
                tier: itemData?.tier || 0,
                category: itemData?.tag || "Unknown",
                rarity: itemData?.rarityStr || "Common",
                iconAssetName: itemData?.iconAssetName,
              }
            }) || [],
          buildingName: building.buildingName,
          buildingNickname: building.buildingNickname,
          claimName: `Claim ${claimId}`,
          claimId: claimId,
          entityId: building.entityId,
          iconAssetName: building.iconAssetName,
        })) || [],
    }

    return json(transformedData, {
      headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=30" },
    })
  } catch (error) {
    if (error instanceof BitJitaHttpError && error.status === 404) {
      return json({ error: "Claim not found" }, { status: 404 })
    }
    return json(
      {
        error: "External service unavailable",
        detail: error instanceof Error ? error.message : "Unknown error",
        isExternalError: true,
        service: "BitJita API",
      },
      { status: 503 }
    )
  }
}
