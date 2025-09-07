import {
  VStack,
  HStack,
  Box,
  Heading,
  Text,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  SimpleGrid,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spacer,
} from "@chakra-ui/react";
import type { Item, ProjectItem } from "~/types/recipes";
import { getTierColorScheme } from "~/theme";

interface ResourceSummaryProps {
  projectItems: ProjectItem[];
  breakdown: {
    rawMaterials: Map<string, number>;
    intermediates: Map<string, number>;
    totalItems: Map<string, number>;
  } | null;
  calcData: {
    items: Record<string, Item>;
  } | null;
  itemMap: Map<string, Item>;
}

export function ResourceSummary({
  projectItems,
  breakdown,
  calcData,
  itemMap,
}: ResourceSummaryProps) {
  if (projectItems.length === 0 || !breakdown) {
    return <Text color="text.muted">Add items to see resource summary.</Text>;
  }

  // Group raw materials by category (as a proxy for professions)
  const groupedRawMaterials = (() => {
    const groups = new Map<string, Array<{ item: Item; quantity: number }>>();
    for (const [itemId, quantity] of breakdown.rawMaterials.entries()) {
      const item = (calcData?.items[itemId] as Item | undefined) || itemMap.get(itemId);
      if (!item) continue;
      const key = item.category || "Other";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push({ item, quantity });
    }
    const result = Array.from(groups.entries()).map(([category, items]) => ({
      category,
      items: items.sort((a, b) => a.item.tier - b.item.tier || a.item.name.localeCompare(b.item.name)),
    }));
    // Sort groups by size (ascending) to compact smaller tables together, then by category name
    result.sort((a, b) => a.items.length - b.items.length || a.category.localeCompare(b.category));
    return result;
  })();

  return (
    <VStack spacing={4} align="stretch">
      <Tabs colorScheme="gray" variant="enclosed">
        <Box bg="surface.primary" borderRadius="md" p={3} border="1px solid" borderColor="border.primary">
          <TabList>
            <Tab>Lists</Tab>
            <Tab>Tracking Resources</Tab>
          </TabList>
        </Box>
        <TabPanels>
          {/* Lists sub-tab */}
          <TabPanel>
            {groupedRawMaterials.length === 0 ? (
              <Text color="text.muted">No raw materials needed</Text>
            ) : (
              <VStack spacing={3} align="stretch">
                <HStack>
                  <Heading size="md">Raw Materials</Heading>
                  <Badge variant="status">{Array.from(breakdown.rawMaterials.values()).reduce((a, b) => a + b, 0)} total</Badge>
                </HStack>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={3}>
                  {groupedRawMaterials.map((group) => (
                    <Box
                      key={group.category}
                      bg="surface.primary"
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="border.primary"
                      p={3}
                    >
                      <HStack mb={2}>
                        <Heading size="sm">{group.category}</Heading>
                        <Spacer />
                        <Badge variant="status">{group.items.length} items</Badge>
                      </HStack>
                      <Table size="sm" variant="bitcraft">
                        <Thead>
                          <Tr>
                            <Th px={2} py={1}>Item</Th>
                            <Th px={2} py={1}>Tier</Th>
                            <Th px={2} py={1} isNumeric>Qty</Th>
                          </Tr>
                        </Thead>
                        <Tbody bg="surface.primary">
                          {group.items.map(({ item, quantity }) => (
                            <Tr key={item.id} _hover={{ bg: "surface.elevated" }}>
                              <Td px={2} py={1} fontWeight="medium" whiteSpace="normal">{item.name}</Td>
                              <Td px={2} py={1}>
                                <Badge colorScheme={getTierColorScheme(item.tier)}>T{item.tier}</Badge>
                              </Td>
                              <Td px={2} py={1} isNumeric fontWeight="semibold">{quantity}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  ))}
                </SimpleGrid>
              </VStack>
            )}
          </TabPanel>
          {/* Tracking Resources placeholder */}
          <TabPanel>
            <Box p={6} textAlign="center" bg="surface.primary" borderRadius="md" border="1px solid" borderColor="border.primary">
              <Text color="text.muted">Tracking Resources coming soon.</Text>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
}
