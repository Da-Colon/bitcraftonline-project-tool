import { 
  VStack, 
  Box, 
  Text, 
  Checkbox, 
  Collapse, 
  Badge, 
  HStack,
  Card,
  CardBody,
  Icon,
  useColorModeValue
} from "@chakra-ui/react";
import { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons";
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
  const cardBg = useColorModeValue("white", "gray.800");
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  const handleTrackingChange = (inventoryId: string) => {
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
      <Box p={8} textAlign="center" bg="gray.50" borderRadius="lg" border="1px solid" borderColor="gray.200">
        <VStack spacing={4}>
          <Text fontSize="3xl" mb={2}>🏗️</Text>
          <Text color="gray.600" fontSize="xl" fontWeight="semibold">
            No Buildings Found
          </Text>
          <Text color="gray.500" fontSize="md" maxW="md">
            This claim has no accessible building inventories. Buildings may be private or have no storage containers.
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      {inventories.map((inventory) => {
        const isExpanded = expandedInventories.has(inventory.id);
        const tracked = isTracked(inventory.id);
        
        return (
          <Card
            key={inventory.id}
            bg={cardBg}
            shadow="sm"
            border="1px solid"
            borderColor={tracked ? "purple.200" : "gray.200"}
            _hover={{ 
              shadow: "md",
              borderColor: tracked ? "purple.300" : "gray.300"
            }}
            transition="all 0.2s"
          >
            <CardBody p={4}>
              <HStack justify="space-between" align="center" mb={isExpanded ? 4 : 0}>
                <HStack spacing={4} flex={1}>
                  <Checkbox
                    isChecked={tracked}
                    onChange={() => handleTrackingChange(inventory.id)}
                    colorScheme="purple"
                    size="lg"
                  />
                  <VStack align="start" spacing={1} flex={1}>
                    <HStack spacing={3} align="center">
                      <Text fontWeight="semibold" fontSize="md">
                        {inventory.name}
                      </Text>
                      {inventory.buildingName && (
                        <Badge variant="subtle" colorScheme="purple" fontSize="xs">
                          {inventory.buildingName}
                        </Badge>
                      )}
                    </HStack>
                    <HStack spacing={2}>
                      <Badge 
                        variant="subtle" 
                        colorScheme={inventory.items.length > 0 ? "blue" : "gray"}
                        fontSize="xs"
                      >
                        {inventory.items.length} items
                      </Badge>
                      {inventory.claimName && (
                        <Badge variant="subtle" colorScheme="green" fontSize="xs">
                          {inventory.claimName}
                        </Badge>
                      )}
                      {tracked && (
                        <Badge variant="solid" colorScheme="purple" fontSize="xs">
                          Tracked
                        </Badge>
                      )}
                    </HStack>
                  </VStack>
                </HStack>
                
                <HStack
                  as="button"
                  spacing={2}
                  color="purple.500"
                  fontSize="sm"
                  onClick={() => handleExpandToggle(inventory.id)}
                  _hover={{ 
                    color: "purple.600",
                    bg: hoverBg
                  }}
                  px={3}
                  py={2}
                  borderRadius="md"
                  transition="all 0.2s"
                >
                  <Text fontWeight="medium">
                    {isExpanded ? "Collapse" : "Expand"}
                  </Text>
                  <Icon 
                    as={isExpanded ? ChevronDownIcon : ChevronRightIcon} 
                    boxSize={4}
                  />
                </HStack>
              </HStack>
              
              <Collapse in={isExpanded} animateOpacity>
                <Box 
                  mt={4} 
                  pt={4} 
                  borderTop="1px solid" 
                  borderColor="gray.200"
                >
                  <InventoryContents items={inventory.items} viewMode={viewMode} />
                </Box>
              </Collapse>
            </CardBody>
          </Card>
        );
      })}
    </VStack>
  );
}
