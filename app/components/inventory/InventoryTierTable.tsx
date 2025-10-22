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
} from "@chakra-ui/react"

import type { InventoryItem } from "~/types/inventory"
import { aggregateItemListByTier } from "~/utils/tierAggregation"

interface InventoryTierTableProps {
  items: InventoryItem[]
}

export function InventoryTierTable({ items }: InventoryTierTableProps) {
  const categories = aggregateItemListByTier(items)
  const tableBg = "rgba(24, 35, 60, 0.9)"
  const headerBg = "rgba(30, 41, 82, 0.85)"

  if (categories.length === 0) {
    return (
      <Box
        p={6}
        textAlign="center"
        bg={tableBg}
        borderRadius={{ base: "2xl", md: "3xl" }}
        border="1px solid rgba(148, 163, 184, 0.35)"
        backdropFilter="blur(12px)"
      >
        <Text color="white" fontSize="md">
          No items to display
        </Text>
        <Text color="whiteAlpha.700" fontSize="sm" mt={2}>
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
      borderRadius={{ base: "2xl", md: "3xl" }}
      border="1px solid rgba(148, 163, 184, 0.35)"
      overflow="hidden"
      boxShadow="xl"
      backdropFilter="blur(12px)"
    >
      <TableContainer>
        <Table size="sm" variant="simple">
          <Thead bg={headerBg}>
            <Tr>
              <Th py={2} fontSize="xs" fontWeight="bold" color="whiteAlpha.800" textTransform="uppercase">
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
                      ? "whiteAlpha.700"
                      : `${getTierColorScheme(tier)}.200`
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
                  bg={index % 2 === 0 ? "transparent" : "rgba(148, 163, 184, 0.08)"}
                  _hover={{ bg: "rgba(45, 212, 191, 0.12)" }}
                >
                  <Td py={2} fontWeight="semibold" color="white" fontSize="sm">
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
                        <Text color="whiteAlpha.500" fontSize="xs" fontWeight="medium">
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
