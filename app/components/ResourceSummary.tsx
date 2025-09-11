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
import type { Item, ProjectItem, Recipe } from "~/types/recipes";
import type { TrackingStatus } from "~/types/tracking";
import { getTierColorScheme } from "~/utils/colors";
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
    recipes: Record<string, Recipe>;
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
    addAllToTracking,
    applyPlayerInventory,
    lastApplyInfo,
    adjustedBreakdown,
  } = useTracking({ breakdown, calcData, itemMap });

  // Group ALL materials by category, using the adjusted breakdown from the hook.
  const groupedAllMaterials = useMemo(() => {
    const sourceBreakdown = adjustedBreakdown || breakdown;
    if (!sourceBreakdown) return [];

    const groups = new Map<string, Array<{ item: Item; quantity: number }>>();
    const allMaterials = new Map([
      ...sourceBreakdown.rawMaterials,
      ...sourceBreakdown.intermediates,
    ]);

    for (const [itemId, quantity] of allMaterials.entries()) {
      if (quantity <= 0) continue; // Hide fully satisfied items

      const item = itemMap.get(itemId);
      if (!item) continue;

      const key = item.category || "Other";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push({ item, quantity });
    }

    const result = Array.from(groups.entries()).map(([category, items]) => ({
      category,
      items: items.sort((a, b) => a.item.tier - b.item.tier || a.item.name.localeCompare(b.item.name)),
    }));
    result.sort((a, b) => a.items.length - b.items.length || a.category.localeCompare(b.category));
    return result;
  }, [adjustedBreakdown, breakdown, itemMap]);

  if (projectItems.length === 0 || !breakdown) {
    return <Text color="gray.500">Add items to see resource summary.</Text>;
  }

  return (
    <VStack spacing={4} align="stretch">
      <Tabs colorScheme="gray" variant="enclosed">
        <Box bg="white" borderRadius="md" p={3} border="1px solid" borderColor="gray.200">
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
            {lastApplyInfo && (
              <Box mb={3} bg="white" borderRadius="md" border="1px solid" borderColor="gray.200" p={3}>
                <HStack spacing={3}>
                  <Badge colorScheme={lastApplyInfo.matchedItems > 0 ? 'green' : 'yellow'}>
                    {lastApplyInfo.matchedItems > 0 ? 'Applied' : 'No Matches'}
                  </Badge>
                  <Text>
                    {lastApplyInfo.playerName ? `Inventory from ${lastApplyInfo.playerName}` : 'Inventory applied'}
                    {lastApplyInfo.selectedInventories && lastApplyInfo.selectedInventories.length > 0
                      ? ` • Sources: ${lastApplyInfo.selectedInventories.join(', ')}`
                      : ''}
                  </Text>
                  <Spacer />
                  <HStack spacing={4} fontSize="sm" color="gray.500">
                    <Text>Matched: {lastApplyInfo.matchedItems}</Text>
                    <Text>Full: {lastApplyInfo.fullySatisfiedItems}</Text>
                    <Text>Partial: {lastApplyInfo.partiallySatisfiedItems}</Text>
                    <Text>Qty added: {lastApplyInfo.totalCompletedQuantity}</Text>
                  </HStack>
                </HStack>
              </Box>
            )}
            {groupedAllMaterials.length === 0 ? (
              <Text color="gray.500">No materials needed</Text>
            ) : (
              <VStack spacing={3} align="stretch">
                <HStack>
                  <Heading size="md">All Materials</Heading>
                  <Badge variant="subtle">{groupedAllMaterials.reduce((sum, g) => sum + g.items.reduce((s, it) => s + it.quantity, 0), 0)} remaining</Badge>
                  <Spacer />
                  <ButtonGroup size="sm">
                    <Button leftIcon={<SettingsIcon />} onClick={addAllToTracking}>
                      Add All to Tracking
                    </Button>
                  </ButtonGroup>
                </HStack>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={3}>
                  {groupedAllMaterials.map((group) => (
                    <Box
                      key={group.category}
                      bg="white"
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="gray.200"
                      p={3}
                    >
                      <HStack mb={2}>
                        <Heading size="sm">{group.category}</Heading>
                        <Spacer />
                        <Badge variant="subtle">{group.items.length} items</Badge>
                        <Button size="xs" onClick={() => {
                          group.items.forEach(({ item }) => toggleItemTracking(item.id, 'completed'));
                        }}>
                          Add Section
                        </Button>
                      </HStack>
                      <Table size="sm" variant="simple">
                        <Thead>
                          <Tr>
                            <Th px={2} py={1}>Item</Th>
                            <Th px={2} py={1}>Tier</Th>
                            <Th px={2} py={1} isNumeric>Qty</Th>
                            <Th px={2} py={1}>Track</Th>
                          </Tr>
                        </Thead>
                        <Tbody bg="white">
                          {group.items.map(({ item, quantity }) => {
                            const tracked = trackingData.trackedItems.get(item.id);
                            return (
                              <Tr key={item.id} _hover={{ bg: "gray.50" }}>
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
              onAutoFillCompleted={addAllToTracking}
              onResetAllTracking={resetAllTracking}
              onApplyPlayerInventory={applyPlayerInventory}
              itemMap={itemMap}
            />
          </TabPanel>
          
          {/* Stats placeholder */}
          <TabPanel>
            <Box p={6} textAlign="center" bg="white" borderRadius="md" border="1px solid" borderColor="gray.200">
              <Text color="gray.500">Stats coming soon.</Text>
            </Box>
          </TabPanel>
          
          {/* Budget placeholder */}
          <TabPanel>
            <Box p={6} textAlign="center" bg="white" borderRadius="md" border="1px solid" borderColor="gray.200">
              <Text color="gray.500">Budget coming soon.</Text>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
}
