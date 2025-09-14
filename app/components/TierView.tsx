import { VStack, Box, Text, HStack, Badge, SimpleGrid, useColorModeValue } from "@chakra-ui/react"
import type { InventoryTierSummary, CategoryTierSummary } from "~/utils/tierAggregation"

interface TierViewProps {
  inventories: InventoryTierSummary[]
}

// Helper function to get tier color scheme
function getTierColorScheme(tier: number) {
  if (tier >= 5) return "purple"
  if (tier >= 4) return "pink"
  if (tier >= 3) return "blue"
  if (tier >= 2) return "teal"
  if (tier >= 1) return "green"
  return "gray"
}

function CategoryCard({ category }: { category: CategoryTierSummary }) {
  const cardBg = useColorModeValue("white", "gray.800")
  const borderColor = useColorModeValue("gray.200", "gray.600")

  return (
    <Box
      p={2}
      bg={cardBg}
      borderRadius="md"
      border="1px solid"
      borderColor={borderColor}
      shadow="sm"
    >
      <VStack align="stretch" spacing={1}>
        <HStack justify="space-between" align="center">
          <Text fontWeight="semibold" fontSize="sm" color="gray.700">
            {category.category}
          </Text>
          <Badge variant="solid" colorScheme="blue" fontSize="xs" fontWeight="bold">
            {category.totalQuantity.toLocaleString()}
          </Badge>
        </HStack>

        <HStack spacing={1} wrap="wrap" justify="flex-start">
          {category.tiers
            .sort((a, b) => a.tier - b.tier)
            .map((tierData) => (
              <Badge
                key={tierData.tier}
                variant="solid"
                colorScheme={getTierColorScheme(tierData.tier)}
                fontSize="xs"
                px={2}
                py={0.5}
                borderRadius="full"
                fontWeight="bold"
              >
                {tierData.tier >= 0 ? `T${tierData.tier}` : "NT"}:{" "}
                {tierData.quantity.toLocaleString()}
              </Badge>
            ))}
        </HStack>
      </VStack>
    </Box>
  )
}

export function TierView({ inventories }: TierViewProps) {
  if (inventories.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Text color="gray.500">No items to display</Text>
      </Box>
    )
  }

  // Group inventories by type
  const groupedInventories = inventories.reduce((acc, inv) => {
    if (!acc[inv.inventoryType]) {
      acc[inv.inventoryType] = []
    }
    acc[inv.inventoryType].push(inv)
    return acc
  }, {} as Record<string, InventoryTierSummary[]>)

  const sectionBg = useColorModeValue("gray.50", "gray.900")
  const inventoryBg = useColorModeValue("white", "gray.800")
  const borderColor = useColorModeValue("gray.200", "gray.600")

  return (
    <VStack spacing={3} align="stretch">
      {Object.entries(groupedInventories).map(([type, invs]) => (
        <Box key={type}>
          <Text fontSize="lg" fontWeight="bold" mb={2} color="gray.700">
            {type}
          </Text>
          <VStack spacing={2} align="stretch">
            {invs.map((inventory) => (
              <Box
                key={inventory.inventoryId}
                p={3}
                bg={inventoryBg}
                borderRadius="lg"
                border="1px solid"
                borderColor={borderColor}
                shadow="sm"
              >
                <Text fontWeight="semibold" fontSize="md" mb={2} color="gray.600">
                  {inventory.inventoryName}
                </Text>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={2}>
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
  )
}
