import { SimpleGrid, Box, Text, HStack, Badge } from "@chakra-ui/react";
import type { InventoryItem } from "~/types/inventory";

interface InventoryContentsProps {
  items: InventoryItem[];
}

export function InventoryContents({ items }: InventoryContentsProps) {
  if (items.length === 0) {
    return (
      <Text color="text.muted" textAlign="center" py={4}>
        This inventory is empty
      </Text>
    );
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
              <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                {item.name || item.itemId}
              </Text>
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
        );
      })}
    </SimpleGrid>
  );
}
