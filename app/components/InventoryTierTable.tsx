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
        p={4}
        textAlign="center"
        bg={tableBg}
        borderRadius="md"
        border="1px solid"
        borderColor="gray.200"
      >
        <Text color="gray.500" fontSize="md">
          No items to display
        </Text>
        <Text color="gray.400" fontSize="sm" mt={1}>
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

  // Helper function to get tier display name
  const getTierDisplayName = (tier: number) => {
    return tier >= 0 ? `T${tier}` : "NT"
  }

  return (
    <Box
      bg={tableBg}
      borderRadius="lg"
      border="1px solid"
      borderColor="gray.200"
      overflow="hidden"
      shadow="sm"
    >
      <TableContainer>
        <Table size="sm" variant="simple">
          <Thead bg={headerBg}>
            <Tr>
              <Th py={2} fontSize="xs" fontWeight="bold" color="gray.700" textTransform="uppercase">
                Category
              </Th>
              {sortedTiers.map((tier) => (
                <Th
                  key={tier}
                  textAlign="center"
                  py={2}
                  fontSize="xs"
                  fontWeight="bold"
                  color={
                    getTierColorScheme(tier) === "gray"
                      ? "gray.600"
                      : `${getTierColorScheme(tier)}.600`
                  }
                  textTransform="uppercase"
                >
                  {getTierDisplayName(tier)}
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
                  bg={index % 2 === 0 ? "transparent" : useColorModeValue("gray.50", "gray.750")}
                  _hover={{ bg: useColorModeValue("blue.50", "blue.900") }}
                >
                  <Td py={2} fontWeight="semibold" color="gray.700" fontSize="sm">
                    {category.category}
                  </Td>
                  {sortedTiers.map((tier) => (
                    <Td key={tier} textAlign="center" py={2}>
                      {tierMap.has(tier) ? (
                        <Badge
                          variant="solid"
                          colorScheme={getTierColorScheme(tier)}
                          fontSize="xs"
                          px={2}
                          py={0.5}
                          borderRadius="full"
                          fontWeight="bold"
                          minW="40px"
                        >
                          {tierMap.get(tier)?.toLocaleString()}
                        </Badge>
                      ) : (
                        <Text color="gray.300" fontSize="xs" fontWeight="medium">
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
