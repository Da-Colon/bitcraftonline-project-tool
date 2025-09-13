import { Table, Thead, Tbody, Tr, Th, Td, TableContainer, Text, Badge } from "@chakra-ui/react";
import type { InventoryItem } from "~/types/inventory";
import { aggregateItemListByTier } from "~/utils/tierAggregation";

interface InventoryTierTableProps {
  items: InventoryItem[];
}

export function InventoryTierTable({ items }: InventoryTierTableProps) {
  const categories = aggregateItemListByTier(items);

  if (categories.length === 0) {
    return (
      <Text color="text.muted" textAlign="center" py={4}>
        This inventory is empty
      </Text>
    );
  }

  // Get all unique tiers across all categories
  const allTiers = new Set<number>();
  categories.forEach(category => {
    category.tiers.forEach(tier => allTiers.add(tier.tier));
  });
  const sortedTiers = Array.from(allTiers).sort((a, b) => a - b);

  return (
    <TableContainer>
      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            <Th>Category</Th>
            {sortedTiers.map(tier => (
              <Th key={tier} textAlign="center">
                {tier >= 0 ? `Tier ${tier}` : 'No Tier'}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {categories.map(category => {
            // Create a map for quick tier lookup
            const tierMap = new Map(category.tiers.map(t => [t.tier, t.quantity]));
            
            return (
              <Tr key={category.category}>
                <Td fontWeight="medium">{category.category}</Td>
                {sortedTiers.map(tier => (
                  <Td key={tier} textAlign="center">
                    {tierMap.has(tier) ? (
                      <Badge variant="solid" colorScheme="green" fontSize="xs">
                        {tierMap.get(tier)}
                      </Badge>
                    ) : (
                      <Text color="text.muted" fontSize="xs">-</Text>
                    )}
                  </Td>
                ))}
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </TableContainer>
  );
}
