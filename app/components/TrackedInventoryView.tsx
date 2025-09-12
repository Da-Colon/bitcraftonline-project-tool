import { Box, Text, VStack, SimpleGrid, Badge, HStack, Divider } from "@chakra-ui/react";
import { usePlayerInventories } from "~/hooks/usePlayerInventories";
import { useTrackedInventories } from "~/hooks/useTrackedInventories";
import { useSelectedPlayer } from "~/hooks/useSelectedPlayer";
import { combineTrackedInventories } from "~/utils/combineTrackedInventories";
import type { CombinedInventoryItem } from "~/utils/combineTrackedInventories";

interface TierGroupProps {
  tier: number;
  items: CombinedInventoryItem[];
}

function TierGroup({ tier, items }: TierGroupProps) {
  return (
    <Box>
      <HStack spacing={2} mb={3}>
        <Text fontSize="lg" fontWeight="semibold">
          Tier {tier}
        </Text>
        <Badge colorScheme="blue" variant="subtle">
          {items.length} items
        </Badge>
      </HStack>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={3}>
        {items.map((item) => (
          <Box
            key={item.itemId}
            p={3}
            bg="white"
            borderRadius="md"
            border="1px solid"
            borderColor="gray.200"
            _hover={{ borderColor: "blue.300", shadow: "sm" }}
          >
            <VStack align="start" spacing={1}>
              <Text fontWeight="medium" fontSize="sm" noOfLines={2}>
                {item.name || `Item ${item.itemId}`}
              </Text>
              <HStack spacing={2}>
                <Badge colorScheme="green" variant="solid" fontSize="xs">
                  {item.totalQuantity}
                </Badge>
                {item.tier && (
                  <Badge colorScheme="purple" variant="outline" fontSize="xs">
                    T{item.tier}
                  </Badge>
                )}
              </HStack>
              {item.category && (
                <Text fontSize="xs" color="gray.600">
                  {item.category}
                </Text>
              )}
            </VStack>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}

export function TrackedInventoryView() {
  const { player } = useSelectedPlayer();
  const { inventories, loading, error } = usePlayerInventories(player?.entityId);
  const { trackedInventories } = useTrackedInventories();

  console.log("TrackedInventoryView - player:", player?.entityId);
  console.log("TrackedInventoryView - inventories:", inventories);
  console.log("TrackedInventoryView - trackedInventories:", Array.from(trackedInventories));
  console.log("TrackedInventoryView - loading:", loading, "error:", error);

  if (loading) {
    return (
      <Box p={6} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
        <Text color="gray.600" textAlign="center">
          Loading tracked inventories...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={6} bg="red.50" borderRadius="md" border="1px solid" borderColor="red.200">
        <Text color="red.600" textAlign="center">
          Error loading inventories: {error}
        </Text>
      </Box>
    );
  }

  if (trackedInventories.size === 0) {
    return (
      <Box p={6} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
        <VStack spacing={3}>
          <Text color="gray.600" textAlign="center" fontSize="lg" fontWeight="medium">
            No Tracked Inventories
          </Text>
          <Text color="gray.500" textAlign="center" fontSize="sm">
            Go to Personal Inventories and select inventories to track them here.
          </Text>
        </VStack>
      </Box>
    );
  }

  const combinedItems = combineTrackedInventories(inventories || { personal: [], banks: [], storage: [], recovery: [] }, trackedInventories);

  if (combinedItems.length === 0) {
    return (
      <Box p={6} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
        <Text color="gray.600" textAlign="center">
          No items found in tracked inventories
        </Text>
      </Box>
    );
  }

  // Group items by tier
  const itemsByTier = combinedItems.reduce((acc, item) => {
    const tier = item.tier || 0;
    if (!acc[tier]) {
      acc[tier] = [];
    }
    acc[tier].push(item);
    return acc;
  }, {} as Record<number, CombinedInventoryItem[]>);

  const tiers = Object.keys(itemsByTier)
    .map(Number)
    .sort((a, b) => b - a); // Sort tiers descending

  const totalItems = combinedItems.reduce((sum, item) => sum + item.totalQuantity, 0);

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <Box>
          <HStack justify="space-between" align="center" mb={4}>
            <Text fontSize="xl" fontWeight="bold">
              Tracked Inventory
            </Text>
            <HStack spacing={3}>
              <Badge colorScheme="blue" variant="subtle" fontSize="sm">
                {trackedInventories.size} inventories
              </Badge>
              <Badge colorScheme="green" variant="subtle" fontSize="sm">
                {totalItems} total items
              </Badge>
            </HStack>
          </HStack>
          <Divider />
        </Box>

        {tiers.map((tier) => (
          <TierGroup key={tier} tier={tier} items={itemsByTier[tier]} />
        ))}
      </VStack>
    </Box>
  );
}
