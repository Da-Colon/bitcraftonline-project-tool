import { SimpleGrid, Box, Text, HStack, Badge } from "@chakra-ui/react"

import { InventoryTierTable } from "./InventoryTierTable"

import { GameDataIcon } from "~/components/GameDataIcon"
import type { InventoryItem } from "~/types/inventory"

interface InventoryContentsProps {
  items: InventoryItem[]
  viewMode?: "list" | "tier"
}

export function InventoryContents({ items, viewMode = "list" }: InventoryContentsProps) {
  if (items.length === 0) {
    return (
      <Text color="whiteAlpha.700" textAlign="center" py={4}>
        This inventory is empty
      </Text>
    )
  }

  if (viewMode === "tier") {
    return <InventoryTierTable items={items} />
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
      {items.map((item, index) => {
        return (
          <Box
            key={`${item.itemId}-${index}`}
            p={3}
            bg="rgba(24, 35, 60, 0.9)"
            borderRadius="lg"
            border="1px solid rgba(148, 163, 184, 0.35)"
            backdropFilter="blur(8px)"
          >
            <HStack justify="space-between" align="center">
              <HStack spacing={2} flex={1} minW={0}>
                <GameDataIcon
                  iconAssetName={item.iconAssetName}
                  alt={item.name || item.itemId}
                  size="20px"
                />
                <Text fontSize="sm" fontWeight="medium" noOfLines={1} color="white">
                  {item.name || item.itemId}
                </Text>
              </HStack>
              <Badge variant="solid" colorScheme="teal" fontSize="xs">
                {item.quantity}
              </Badge>
            </HStack>
            {(item.category || item.tier !== undefined) && (
              <HStack mt={1} spacing={2}>
                {item.category && (
                  <Badge
                    variant="subtle"
                    colorScheme="teal"
                    fontSize="xs"
                    bg="rgba(45, 212, 191, 0.12)"
                    color="teal.100"
                  >
                    {item.category}
                  </Badge>
                )}
                {item.tier !== undefined && item.tier >= 0 && (
                  <Badge
                    variant="subtle"
                    colorScheme="purple"
                    fontSize="xs"
                    bg="rgba(192, 132, 252, 0.16)"
                    color="purple.100"
                  >
                    T{item.tier}
                  </Badge>
                )}
              </HStack>
            )}
          </Box>
        )
      })}
    </SimpleGrid>
  )
}
