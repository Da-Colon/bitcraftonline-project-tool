import { Box, Text, VStack, Badge, HStack, Divider, Button, useToast } from "@chakra-ui/react";
import { usePlayerInventories } from "~/hooks/usePlayerInventories";
import { useTrackedInventories } from "~/hooks/useTrackedInventories";
import { useSelectedPlayer } from "~/hooks/useSelectedPlayer";
import { combineTrackedInventories } from "~/utils/combineTrackedInventories";
import { InventoryTierTable } from "~/components/InventoryTierTable";
import type { CombinedInventoryItem } from "~/utils/combineTrackedInventories";


export function TrackedInventoryView() {
  const { player } = useSelectedPlayer();
  const { inventories, loading, error } = usePlayerInventories(player?.entityId);
  const { trackedInventories, clearAll } = useTrackedInventories();
  const toast = useToast();

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

  const handleClearAll = () => {
    clearAll();
    toast({
      title: "Tracking Cleared",
      description: "All inventory tracking has been removed",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

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

  // Convert combined items to format expected by InventoryTierTable
  const inventoryItems = combinedItems.map(item => ({
    itemId: item.itemId,
    name: item.name,
    category: item.category,
    tier: item.tier,
    quantity: item.totalQuantity
  }));

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
              <Button
                size="sm"
                variant="outline"
                colorScheme="red"
                onClick={handleClearAll}
              >
                Clear All Tracking
              </Button>
            </HStack>
          </HStack>
          <Divider />
        </Box>

        <InventoryTierTable items={inventoryItems} />
      </VStack>
    </Box>
  );
}
