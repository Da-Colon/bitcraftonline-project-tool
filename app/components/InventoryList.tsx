import { VStack, Box, Text, Checkbox, Collapse, SimpleGrid, Badge, HStack } from "@chakra-ui/react";
import { useState } from "react";
import type { PlayerInventories, Inventory } from "~/types/inventory";
import { InventoryContents } from "~/components/InventoryContents";
import { useTrackedInventories } from "~/hooks/useTrackedInventories";

interface InventoryListProps {
  inventories: PlayerInventories;
  viewMode?: 'list' | 'tier';
}

export function InventoryList({ inventories, viewMode = 'list' }: InventoryListProps) {
  const { isTracked, toggleTracking } = useTrackedInventories();
  const [expandedInventories, setExpandedInventories] = useState<Set<string>>(new Set());

  const handleTrackingChange = (inventoryId: string, checked: boolean) => {
    console.log('handleTrackingChange called:', inventoryId, checked);
    console.log('toggleTracking function:', toggleTracking);
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

  const renderInventorySection = (title: string, inventories: Inventory[] | undefined) => {
    if (!inventories || inventories.length === 0) return null;

    return (
      <Box>
        <Text fontSize="lg" fontWeight="semibold" mb={3}>{title}</Text>
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
                      console.log('Checkbox onChange fired:', inventory.id, e.target.checked);
                      handleTrackingChange(inventory.id, e.target.checked);
                    }}
                  />
                  <Text fontWeight="medium">{inventory.name}</Text>
                  {inventory.claimName && title === "Banks" && (
                    <Badge variant="subtle" colorScheme="green">
                      {inventory.claimName}
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
    );
  };

  return (
    <VStack spacing={6} align="stretch">
      {renderInventorySection("Personal Inventories", inventories.personal)}
      {renderInventorySection("Banks", inventories.banks)}
      {renderInventorySection("Storage", inventories.storage)}
      {renderInventorySection("Recovery Chests", inventories.recovery)}
    </VStack>
  );
}
