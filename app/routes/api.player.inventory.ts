import { json, type LoaderFunctionArgs } from "@remix-run/node";

export interface PlayerInventoryItem {
  itemId: string;
  quantity: number;
  location: string; // "house_inventory" | "personal_banks" | "personal_storages"
}

export interface PlayerInventoryResponse {
  playerName: string;
  inventories: Record<string, PlayerInventoryItem[]>;
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

// BitJita inventory response structure
interface BitJitaPocket {
  locked: boolean;
  volume: number;
  contents: {
    itemId: number;
    itemType: number;
    quantity: number;
  };
}

interface BitJitaInventoryEntry {
  entityId: string;
  playerOwnerEntityId: string;
  ownerEntityId: string;
  pockets: BitJitaPocket[];
  inventoryIndex: number;
  cargoIndex: number;
  buildingName: string | null;
  claimEntityId: string | null;
  claimName: string | null;
  claimLocationX: number | null;
  claimLocationZ: number | null;
  claimLocationDimension: number | null;
  regionId: number;
  inventoryName: string;
}

interface BitJitaInventoryData {
  inventories: BitJitaInventoryEntry[];
  items: Record<string, any>;
  cargos: Record<string, any>;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const playerName = url.searchParams.get("playerName");
  const inventoryTypes = url.searchParams.getAll("inventoryTypes");

  if (!playerName) {
    return json({ error: "Player name is required" }, { status: 400 });
  }

  try {
    // Fetch player data from BitJita API
    const playerData = await fetchPlayerInventoryFromBitJita(playerName, inventoryTypes);

    // If specific inventory types are requested, filter them.
    // Otherwise, return all inventories (for the 'Fetch Sources' step).
    if (inventoryTypes && inventoryTypes.length > 0) {
      const filteredInventories: Record<string, PlayerInventoryItem[]> = {};
      for (const type of inventoryTypes) {
        if (playerData.inventories[type]) {
          filteredInventories[type] = playerData.inventories[type];
        }
      }
      return json({ ...playerData, inventories: filteredInventories });
    }

    // Return all inventories if no specific types are requested
    return json(playerData);

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
  
  const inventories: Record<string, PlayerInventoryItem[]> = {};

  // Process BitJita inventory data
  for (const inventory of inventoryData.inventories) {
    // Use the real inventory name as the category, and handle null names.
    const category = inventory.inventoryName || "Unknown";

    // Initialize the array for this category if it doesn't exist
    if (!inventories[category]) {
      inventories[category] = [];
    }

    // Process each pocket in the inventory
    for (const pocket of inventory.pockets) {
      if (!pocket.contents) continue;

      const itemId = String(pocket.contents.itemId);
      const internalId = itemId.startsWith('item_') ? itemId : `item_${itemId}`;

      const item: PlayerInventoryItem = {
        itemId: internalId,
        quantity: pocket.contents.quantity,
        location: category,
      };

      inventories[category].push(item);
    }
  }

  return {
    playerName: player.username,
    inventories,
    lastUpdated: new Date().toISOString(),
  };
}

