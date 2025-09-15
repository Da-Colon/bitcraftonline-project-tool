import { SimpleGrid, Box, Text, HStack, Badge } from "@chakra-ui/react"
import type { InventoryItem } from "~/types/inventory"
import { InventoryTierTable } from "~/components/InventoryTierTable"
import { GameDataIcon } from "~/components/GameDataIcon"

interface InventoryContentsProps {
  items: InventoryItem[]
  viewMode?: "list" | "tier"
}

export function InventoryContents({ items, viewMode = "list" }: InventoryContentsProps) {
  if (items.length === 0) {
    return (
      <Text color="text.muted" textAlign="center" py={4}>
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
            bg="surface.primary"
            borderRadius="sm"
            border="1px solid"
            borderColor="border.secondary"
          >
            <HStack justify="space-between" align="center">
              <HStack spacing={2} flex={1} minW={0}>
                <GameDataIcon
                  iconAssetName={item.iconAssetName}
                  alt={item.name || item.itemId}
                  size="20px"
                />
                <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                  {item.name || item.itemId}
                </Text>
              </HStack>
              <Badge variant="solid" colorScheme="green" fontSize="xs">
                {item.quantity}
              </Badge>
            </HStack>
            {(item.category || item.tier !== undefined) && (
              <HStack mt={1} spacing={2}>
                {item.category && (
                  <Badge variant="subtle" colorScheme="blue" fontSize="xs">
                    {item.category}
                  </Badge>
                )}
                {item.tier !== undefined && item.tier >= 0 && (
                  <Badge variant="subtle" colorScheme="purple" fontSize="xs">
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
