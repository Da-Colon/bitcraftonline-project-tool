import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Text,
  Badge,
  Box,
  useColorModeValue,
} from "@chakra-ui/react"
import type { InventoryItem } from "~/types/inventory"
import { aggregateItemListByTier } from "~/utils/tierAggregation"

interface InventoryTierTableProps {
  items: InventoryItem[]
}

export function InventoryTierTable({ items }: InventoryTierTableProps) {
  const categories = aggregateItemListByTier(items)
  const tableBg = useColorModeValue("white", "gray.800")
  const headerBg = useColorModeValue("gray.50", "gray.700")

  if (categories.length === 0) {
    return (
      <Box
        p={8}
        textAlign="center"
        bg={tableBg}
        borderRadius="md"
        border="1px solid"
        borderColor="gray.200"
      >
        <Text color="gray.500" fontSize="lg">
          No items to display
        </Text>
        <Text color="gray.400" fontSize="sm" mt={2}>
          Track some inventories to see your items organized by tier
        </Text>
      </Box>
    )
  }

  // Get all unique tiers across all categories
  const allTiers = new Set<number>()
  categories.forEach((category) => {
    category.tiers.forEach((tier) => allTiers.add(tier.tier))
  })
  const sortedTiers = Array.from(allTiers).sort((a, b) => a - b)

  // Helper function to get tier color scheme
  const getTierColorScheme = (tier: number) => {
    if (tier >= 5) return "purple"
    if (tier >= 4) return "pink"
    if (tier >= 3) return "blue"
    if (tier >= 2) return "teal"
    if (tier >= 1) return "green"
    return "gray"
  }

  return (
    <Box bg={tableBg} borderRadius="lg" border="1px solid" borderColor="gray.200" overflow="hidden">
      <TableContainer>
        <Table size="md" variant="simple">
          <Thead bg={headerBg}>
            <Tr>
              <Th py={4} fontSize="sm" fontWeight="bold" color="gray.700">
                Category
              </Th>
              {sortedTiers.map((tier) => (
                <Th
                  key={tier}
                  textAlign="center"
                  py={4}
                  fontSize="sm"
                  fontWeight="bold"
                  color="gray.700"
                >
                  {tier >= 0 ? `Tier ${tier}` : "No Tier"}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {categories.map((category, index) => {
              // Create a map for quick tier lookup
              const tierMap = new Map(category.tiers.map((t) => [t.tier, t.quantity]))

              return (
                <Tr
                  key={category.category}
                  bg={index % 2 === 0 ? "transparent" : useColorModeValue("gray.25", "gray.750")}
                  _hover={{ bg: useColorModeValue("blue.25", "blue.900") }}
                >
                  <Td py={4} fontWeight="semibold" color="gray.700">
                    {category.category}
                  </Td>
                  {sortedTiers.map((tier) => (
                    <Td key={tier} textAlign="center" py={4}>
                      {tierMap.has(tier) ? (
                        <Badge
                          variant="solid"
                          colorScheme={getTierColorScheme(tier)}
                          fontSize="sm"
                          px={3}
                          py={1}
                          borderRadius="full"
                          fontWeight="bold"
                        >
                          {tierMap.get(tier)?.toLocaleString()}
                        </Badge>
                      ) : (
                        <Text color="gray.400" fontSize="sm" fontWeight="medium">
                          -
                        </Text>
                      )}
                    </Td>
                  ))}
                </Tr>
              )
            })}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  )
}
