import { json, type LoaderFunctionArgs } from "@remix-run/node";

interface BitJitaInventorySlot {
  locked: boolean;
  volume: number;
  contents: {
    item_id: number;
    quantity: number;
    item_type: string;
  };
}

interface BitJitaBuilding {
  entityId: string;
  buildingDescriptionId: number;
  buildingName: string;
  buildingNickname?: string;
  iconAssetName: string;
  inventory: BitJitaInventorySlot[];
}

interface BitJitaItem {
  id: number;
  name: string;
  iconAssetName: string;
  rarity: number;
  rarityStr: string;
  tier: number;
  tag: string;
}

interface BitJitaClaimInventoriesResponse {
  buildings: BitJitaBuilding[];
  items: BitJitaItem[];
  cargos?: any[];
}

export async function loader({ params }: LoaderFunctionArgs) {
  const { claimId } = params;
  
  if (!claimId) {
    return json({ error: "Claim ID is required" }, { status: 400 });
  }

  const bitjitaBaseUrl = process.env.BITJITA_BASE_URL;
  if (!bitjitaBaseUrl) {
    return json({ error: "BitJita API not configured" }, { status: 500 });
  }

  try {
    const response = await fetch(`${bitjitaBaseUrl}/api/claims/${claimId}/inventories`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return json({ error: "Claim not found" }, { status: 404 });
      }
      return json(
        { 
          error: "Failed to fetch claim inventories", 
          detail: response.statusText,
          isExternalError: true,
          service: "BitJita API"
        }, 
        { status: 503 }
      );
    }

    const bitjitaData: BitJitaClaimInventoriesResponse = await response.json();
    
    // Create a lookup map for items by ID
    const itemsMap = new Map<number, BitJitaItem>();
    bitjitaData.items?.forEach(item => {
      itemsMap.set(item.id, item);
    });
    
    // Transform BitJita response to our expected format
    const transformedData = {
      claimId,
      claimName: `Claim ${claimId}`, // We'll need to get the actual name from somewhere else
      inventories: bitjitaData.buildings?.map((building: BitJitaBuilding) => ({
        id: building.entityId,
        name: building.buildingNickname || building.buildingName || `Building ${building.entityId}`,
        type: 'building',
        items: building.inventory?.map((slot: BitJitaInventorySlot) => {
          const itemData = itemsMap.get(slot.contents.item_id);
          return {
            itemId: slot.contents.item_id.toString(),
            name: itemData?.name || `Item ${slot.contents.item_id}`,
            quantity: slot.contents.quantity,
            tier: itemData?.tier || 0,
            category: itemData?.tag || 'Unknown',
            rarity: itemData?.rarityStr || 'Common'
          };
        }) || [],
        buildingName: building.buildingName,
        buildingNickname: building.buildingNickname,
        claimName: `Claim ${claimId}`,
        claimId: claimId,
        entityId: building.entityId,
        iconAssetName: building.iconAssetName
      })) || []
    };

    return json(transformedData);
  } catch (error) {
    console.error("Error fetching claim inventories:", error);
    return json(
      { 
        error: "External service unavailable", 
        detail: error instanceof Error ? error.message : "Unknown error",
        isExternalError: true,
        service: "BitJita API"
      }, 
      { status: 503 }
    );
  }
}
