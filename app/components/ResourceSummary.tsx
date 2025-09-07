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
  Button,
  ButtonGroup,
} from "@chakra-ui/react";
import { SettingsIcon } from "@chakra-ui/icons";
import type { Item, ProjectItem } from "~/types/recipes";
import type { TrackingStatus } from "~/types/tracking";
import { getTierColorScheme } from "~/theme";
import { useMemo } from "react";
import { useTracking } from "~/hooks/useTracking";
import { ProgressTrackingTab } from "~/components/tracking";

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
  const {
    trackingData,
    professionProgress,
    overallStats,
    toggleItemTracking,
    resetAllTracking,
    autoFillCompleted,
    applyPlayerInventory,
  } = useTracking({ breakdown, calcData, itemMap });

  // Group raw materials by category (as a proxy for professions)
  const groupedRawMaterials = useMemo(() => {
    if (!breakdown) return [];
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
  }, [breakdown, calcData, itemMap]);

  if (projectItems.length === 0 || !breakdown) {
    return <Text color="text.muted">Add items to see resource summary.</Text>;
  }

  return (
    <VStack spacing={4} align="stretch">
      <Tabs colorScheme="gray" variant="enclosed">
        <Box bg="surface.primary" borderRadius="md" p={3} border="1px solid" borderColor="border.primary">
          <TabList>
            <Tab>Lists</Tab>
            <Tab>Tracking</Tab>
            <Tab>Stats</Tab>
            <Tab>Budget</Tab>
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
                  <Badge variant="status">{breakdown ? Array.from(breakdown.rawMaterials.values()).reduce((a, b) => a + b, 0) : 0} total</Badge>
                  <Spacer />
                  <ButtonGroup size="sm">
                    <Button leftIcon={<SettingsIcon />} onClick={autoFillCompleted}>
                      Add All to Tracking
                    </Button>
                  </ButtonGroup>
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
                        <Button size="xs" onClick={() => {
                          group.items.forEach(({ item }) => toggleItemTracking(item.id, 'completed'));
                        }}>
                          Add Section
                        </Button>
                      </HStack>
                      <Table size="sm" variant="bitcraft">
                        <Thead>
                          <Tr>
                            <Th px={2} py={1}>Item</Th>
                            <Th px={2} py={1}>Tier</Th>
                            <Th px={2} py={1} isNumeric>Qty</Th>
                            <Th px={2} py={1}>Track</Th>
                          </Tr>
                        </Thead>
                        <Tbody bg="surface.primary">
                          {group.items.map(({ item, quantity }) => {
                            const tracked = trackingData.trackedItems.get(item.id);
                            return (
                              <Tr key={item.id} _hover={{ bg: "surface.elevated" }}>
                                <Td px={2} py={1} fontWeight="medium" whiteSpace="normal">{item.name}</Td>
                                <Td px={2} py={1}>
                                  <Badge colorScheme={getTierColorScheme(item.tier)}>T{item.tier}</Badge>
                                </Td>
                                <Td px={2} py={1} isNumeric fontWeight="semibold">{quantity}</Td>
                                <Td px={2} py={1}>
                                  <Button
                                    size="xs"
                                    colorScheme={tracked?.status === 'completed' ? 'green' : tracked?.status === 'in_progress' ? 'yellow' : 'gray'}
                                    onClick={() => {
                                      const nextStatus: TrackingStatus = 
                                        !tracked ? 'in_progress' :
                                        tracked.status === 'in_progress' ? 'completed' :
                                        tracked.status === 'completed' ? 'not_started' : 'in_progress';
                                      toggleItemTracking(item.id, nextStatus);
                                    }}
                                  >
                                    {!tracked ? '+' : 
                                     tracked.status === 'in_progress' ? '◐' :
                                     tracked.status === 'completed' ? '✓' : '+'}
                                  </Button>
                                </Td>
                              </Tr>
                            );
                          })}
                        </Tbody>
                      </Table>
                    </Box>
                  ))}
                </SimpleGrid>
              </VStack>
            )}
          </TabPanel>
          
          {/* Tracking Resources */}
          <TabPanel>
            <ProgressTrackingTab
              professionProgress={professionProgress}
              overallStats={overallStats}
              onAutoFillCompleted={autoFillCompleted}
              onResetAllTracking={resetAllTracking}
              onApplyPlayerInventory={applyPlayerInventory}
            />
          </TabPanel>
          
          {/* Stats placeholder */}
          <TabPanel>
            <Box p={6} textAlign="center" bg="surface.primary" borderRadius="md" border="1px solid" borderColor="border.primary">
              <Text color="text.muted">Stats coming soon.</Text>
            </Box>
          </TabPanel>
          
          {/* Budget placeholder */}
          <TabPanel>
            <Box p={6} textAlign="center" bg="surface.primary" borderRadius="md" border="1px solid" borderColor="border.primary">
              <Text color="text.muted">Budget coming soon.</Text>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
}
