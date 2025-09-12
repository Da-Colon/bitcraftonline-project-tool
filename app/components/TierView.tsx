import { VStack, Box, Text, HStack, Badge, SimpleGrid } from "@chakra-ui/react";
import type { InventoryTierSummary, CategoryTierSummary } from "~/utils/tierAggregation";

interface TierViewProps {
  inventories: InventoryTierSummary[];
}

function CategoryCard({ category }: { category: CategoryTierSummary }) {
  return (
    <Box
      p={3}
      bg="surface.primary"
      borderRadius="sm"
      border="1px solid"
      borderColor="border.secondary"
    >
      <VStack align="stretch" spacing={2}>
        <HStack justify="space-between" align="center">
          <Text fontWeight="medium" fontSize="sm">
            {category.category}
          </Text>
          <Badge variant="solid" colorScheme="blue" fontSize="xs">
            {category.totalQuantity}
          </Badge>
        </HStack>
        
        <HStack spacing={1} wrap="wrap">
          {category.tiers.map((tierData) => (
            <HStack
              key={tierData.tier}
              spacing={1}
              p={1}
              bg="surface.secondary"
              borderRadius="xs"
            >
              <Badge 
                variant="subtle" 
                colorScheme={tierData.tier >= 0 ? "purple" : "gray"}
                fontSize="xs"
              >
                {tierData.tier >= 0 ? `T${tierData.tier}` : 'No Tier'}
              </Badge>
              <Badge variant="solid" colorScheme="green" fontSize="xs">
                {tierData.quantity}
              </Badge>
            </HStack>
          ))}
        </HStack>
      </VStack>
    </Box>
  );
}

export function TierView({ inventories }: TierViewProps) {
  if (inventories.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="text.muted">No items to display</Text>
      </Box>
    );
  }

  // Group inventories by type
  const groupedInventories = inventories.reduce((acc, inv) => {
    if (!acc[inv.inventoryType]) {
      acc[inv.inventoryType] = [];
    }
    acc[inv.inventoryType].push(inv);
    return acc;
  }, {} as Record<string, InventoryTierSummary[]>);

  return (
    <VStack spacing={6} align="stretch">
      {Object.entries(groupedInventories).map(([type, invs]) => (
        <Box key={type}>
          <Text fontSize="lg" fontWeight="semibold" mb={3}>{type}</Text>
          <VStack spacing={4} align="stretch">
            {invs.map((inventory) => (
              <Box
                key={inventory.inventoryId}
                p={4}
                bg="surface.secondary"
                borderRadius="md"
                border="1px solid"
                borderColor="border.primary"
              >
                <Text fontWeight="bold" fontSize="md" mb={3}>
                  {inventory.inventoryName}
                </Text>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
                  {inventory.categories.map((category) => (
                    <CategoryCard key={category.category} category={category} />
                  ))}
                </SimpleGrid>
              </Box>
            ))}
          </VStack>
        </Box>
      ))}
    </VStack>
  );
}
