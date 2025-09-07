import { json, type LoaderFunctionArgs } from "@remix-run/node";

interface PlayerInventoryItem {
  itemId: string;
  quantity: number;
  location: string; // "house_inventory" | "personal_banks" | "personal_storages"
}

interface PlayerInventoryResponse {
  playerName: string;
  inventories: {
    house_inventory: PlayerInventoryItem[];
    personal_banks: PlayerInventoryItem[];
    personal_storages: PlayerInventoryItem[];
  };
  lastUpdated: string;
}

interface BitJitaPlayerSearchResult {
  entityId: string;
  username: string;
  signedIn: boolean;
  timePlayed: number;
  timeSignedIn: number;
  createdAt: string;
  updatedAt: string;
  lastLoginTimestamp: string;
}

interface BitJitaSearchResponse {
  players?: BitJitaPlayerSearchResult[];
  data?: BitJitaPlayerSearchResult[];
  // Handle different possible response structures
}

// BitJita inventory responses can vary a bit; support both arrays and maps
type BitJitaInventoryItems =
  | Array<{ item_id?: string; id?: string; itemId?: string; quantity?: number; qty?: number; count?: number }>
  | Record<string, number>;

interface BitJitaInventoryObjectEntry {
  items?: BitJitaInventoryItems;
  type?: string;
  name?: string;
}

interface BitJitaInventoryData {
  inventories: Record<string, BitJitaInventoryObjectEntry> | Array<BitJitaInventoryObjectEntry & { key?: string }>;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const playerName = url.searchParams.get("playerName");
  const inventoryTypes = url.searchParams.getAll("inventoryTypes");

  if (!playerName) {
    return json({ error: "Player name is required" }, { status: 400 });
  }

  if (!inventoryTypes.length) {
    return json({ error: "At least one inventory type is required" }, { status: 400 });
  }

  try {
    // Fetch player data from BitJita API
    const playerData = await fetchPlayerInventoryFromBitJita(playerName, inventoryTypes);

    // Filter based on requested inventory types
    const filteredInventories: Partial<PlayerInventoryResponse["inventories"]> = {};
    for (const type of inventoryTypes) {
      if (type in playerData.inventories) {
        filteredInventories[type as keyof PlayerInventoryResponse["inventories"]] = 
          playerData.inventories[type as keyof PlayerInventoryResponse["inventories"]];
      }
    }

    return json({
      ...playerData,
      inventories: filteredInventories,
    });

  } catch (error) {
    console.error("Failed to fetch player inventory:", error);
    return json(
      { error: "Failed to fetch player inventory data" },
      { status: 500 }
    );
  }
}

// Helper function to integrate with BitJita API
async function fetchPlayerInventoryFromBitJita(
  playerName: string,
  inventoryTypes: string[]
): Promise<PlayerInventoryResponse> {
  const bitJitaBaseUrl = process.env.BITJITA_BASE_URL || "https://bitjita.com";

  // Step 1: Search for player by name to get their ID
  const searchResponse = await fetch(`${bitJitaBaseUrl}/api/players?q=${encodeURIComponent(playerName)}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });

  if (!searchResponse.ok) {
    throw new Error(`BitJita search API error: ${searchResponse.status} ${searchResponse.statusText}`);
  }

  const searchData: BitJitaSearchResponse | BitJitaPlayerSearchResult[] = await searchResponse.json();
  
  // Debug logging to understand actual response structure
  console.log('BitJita search response:', JSON.stringify(searchData, null, 2));
  
  // Handle different possible response structures
  let searchResults: BitJitaPlayerSearchResult[];
  if (Array.isArray(searchData)) {
    searchResults = searchData;
  } else if (searchData && typeof searchData === 'object' && 'players' in searchData && searchData.players) {
    searchResults = searchData.players;
  } else if (searchData && typeof searchData === 'object' && 'data' in searchData && searchData.data) {
    searchResults = searchData.data;
  } else {
    console.error('Unexpected BitJita search response structure:', searchData);
    throw new Error(`Unexpected response format from BitJita search API. Response type: ${typeof searchData}, keys: ${searchData && typeof searchData === 'object' ? Object.keys(searchData).join(', ') : 'none'}`);
  }
  
  // Find exact match for player name
  const player = searchResults.find(p => p.username.toLowerCase() === playerName.toLowerCase());
  if (!player) {
    throw new Error(`Player "${playerName}" not found`);
  }

  // Step 2: Fetch player inventories using their ID
  const inventoryResponse = await fetch(`${bitJitaBaseUrl}/api/players/${player.entityId}/inventories`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });

  if (!inventoryResponse.ok) {
    throw new Error(`BitJita inventory API error: ${inventoryResponse.status} ${inventoryResponse.statusText}`);
  }

  const inventoryData: BitJitaInventoryData = await inventoryResponse.json();
  // Debug log actual inventory response once to aid parsing adjustments
  console.log('BitJita inventories response:', JSON.stringify(inventoryData, null, 2));
  
  // Transform BitJita data to our expected format
  const inventories: PlayerInventoryResponse["inventories"] = {
    house_inventory: [],
    personal_banks: [],
    personal_storages: [],
  };

  // Helpers to normalize varying inventory shapes
  const normalizeInventories = (
    inv: BitJitaInventoryData["inventories"]
  ): Array<[string, BitJitaInventoryObjectEntry]> => {
    if (Array.isArray(inv)) {
      return inv.map((entry, idx) => [entry.type || entry.name || `inv_${idx}`, entry]);
    }
    if (inv && typeof inv === 'object') {
      return Object.entries(inv as Record<string, BitJitaInventoryObjectEntry>);
    }
    return [];
  };

  const normalizeItems = (
    items: BitJitaInventoryItems | undefined
  ): Array<{ item_id: string; quantity: number }> => {
    if (!items) return [];
    if (Array.isArray(items)) {
      return items
        .map((raw) => {
          const item_id = String(raw.item_id ?? raw.id ?? raw.itemId ?? '');
          const quantity = Number(raw.quantity ?? raw.qty ?? raw.count ?? 0);
          return { item_id, quantity };
        })
        .filter((x) => x.item_id && !Number.isNaN(x.quantity));
    }
    // items as a map
    return Object.entries(items)
      .map(([id, qty]) => ({ item_id: String(id), quantity: Number(qty) }))
      .filter((x) => x.item_id && !Number.isNaN(x.quantity));
  };

  // Map BitJita inventory data to our structure based on inventory types
  const normalizedInventories = normalizeInventories(inventoryData.inventories);
  for (const [inventoryKey, inventoryInfo] of normalizedInventories) {
    const itemsArr = normalizeItems(inventoryInfo.items);
    const location = mapBitJitaInventoryType(inventoryKey);

    for (const normalized of itemsArr) {
      const item = {
        itemId: normalized.item_id,
        quantity: normalized.quantity,
        location,
      } as PlayerInventoryItem;

      if (inventoryTypes.includes('house_inventory') && item.location === 'house_inventory') {
        inventories.house_inventory.push(item);
      } else if (inventoryTypes.includes('personal_banks') && item.location === 'personal_banks') {
        inventories.personal_banks.push(item);
      } else if (inventoryTypes.includes('personal_storages') && item.location === 'personal_storages') {
        inventories.personal_storages.push(item);
      }
    }
  }

  return {
    playerName: player.username,
    inventories,
    lastUpdated: new Date().toISOString(),
  };
}

// Helper function to map BitJita inventory types to our categories
function mapBitJitaInventoryType(bitJitaType: string): string {
  // Map BitJita inventory types to our standardized categories
  const typeMapping: Record<string, string> = {
    'house': 'house_inventory',
    'inventory': 'house_inventory',
    'bank': 'personal_banks',
    'storage': 'personal_storages',
    'trader': 'personal_storages',
    'boat': 'personal_storages',
    // Add more mappings as needed based on actual BitJita response
  };

  return typeMapping[bitJitaType.toLowerCase()] || 'personal_storages';
}
