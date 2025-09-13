import { VStack, Box, Text, Checkbox, Collapse, Badge, HStack } from "@chakra-ui/react";
import { useState } from "react";
import type { ClaimInventory } from "~/types/inventory";
import { InventoryContents } from "~/components/InventoryContents";
import { useTrackedInventories } from "~/hooks/useTrackedInventories";

interface ClaimInventoryListProps {
  inventories: ClaimInventory[];
  viewMode?: 'list' | 'tier';
}

export function ClaimInventoryList({ inventories, viewMode = 'list' }: ClaimInventoryListProps) {
  const { isTracked, toggleTracking } = useTrackedInventories();
  const [expandedInventories, setExpandedInventories] = useState<Set<string>>(new Set());

  const handleTrackingChange = (inventoryId: string, checked: boolean) => {
    toggleTracking(inventoryId);
  };

  const handleExpandToggle = (inventoryId: string) => {
    const newExpanded = new Set(expandedInventories);
    if (newExpanded.has(inventoryId)) {
      newExpanded.delete(inventoryId);
    } else {
      newExpanded.add(inventoryId);
    }
    setExpandedInventories(newExpanded);
  };

  if (!inventories || inventories.length === 0) {
    return (
      <Box p={6} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
        <Text color="gray.600" textAlign="center">
          No claim inventories found
        </Text>
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Text fontSize="lg" fontWeight="semibold" mb={3}>
          Claim Inventories - {inventories[0]?.claimName}
        </Text>
        <VStack spacing={3} align="stretch">
          {inventories.map((inventory) => (
            <Box
              key={inventory.id}
              p={4}
              bg="gray.50"
              borderRadius="md"
              border="1px solid"
              borderColor="gray.200"
            >
              <HStack justify="space-between" align="center">
                <HStack spacing={3}>
                  <Checkbox
                    isChecked={isTracked(inventory.id)}
                    onChange={(e) => {
                      handleTrackingChange(inventory.id, e.target.checked);
                    }}
                  />
                  <Text fontWeight="medium">{inventory.name}</Text>
                  {inventory.buildingName && (
                    <Badge variant="subtle" colorScheme="purple">
                      {inventory.buildingName}
                    </Badge>
                  )}
                  <Badge variant="subtle" colorScheme="blue">
                    {inventory.items.length} items
                  </Badge>
                </HStack>
                <Text
                  as="button"
                  color="blue.400"
                  fontSize="sm"
                  onClick={() => handleExpandToggle(inventory.id)}
                  _hover={{ textDecoration: "underline" }}
                >
                  {expandedInventories.has(inventory.id) ? "Collapse" : "Expand"}
                </Text>
              </HStack>
              
              <Collapse in={expandedInventories.has(inventory.id)} animateOpacity>
                <Box mt={4}>
                  <InventoryContents items={inventory.items} viewMode={viewMode} />
                </Box>
              </Collapse>
            </Box>
          ))}
        </VStack>
      </Box>
    </VStack>
  );
}
