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
  Flex,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  IconButton,
  Tooltip,
  Collapse,
  useDisclosure,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Switch,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import { ChevronDownIcon, SettingsIcon, DownloadIcon, DeleteIcon } from "@chakra-ui/icons";
import type { Item, ProjectItem, TrackingData, ProfessionProgress, TrackedItem, TrackingStatus } from "~/types/recipes";
import { getTierColorScheme } from "~/theme";
import { useState, useMemo, useCallback } from "react";

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
  const [trackingData, setTrackingData] = useState<TrackingData>({
    trackedItems: new Map(),
    professionProgress: [],
    globalFilters: {
      showCompleted: true,
      showInProgress: true,
      showNotStarted: true,
    },
  });
  const { isOpen: filtersOpen, onToggle: toggleFilters } = useDisclosure();

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

  // Calculate profession progress for tracking
  const professionProgress = useMemo(() => {
    if (!breakdown) return [];
    const professions = new Map<string, {
      category: string;
      items: Array<{ item: Item; quantity: number; tracked?: TrackedItem }>;
      tierQuantities: Record<number, { completed: number; total: number }>;
    }>();

    // Initialize profession data
    for (const [itemId, quantity] of breakdown.rawMaterials.entries()) {
      const item = (calcData?.items[itemId] as Item | undefined) || itemMap.get(itemId);
      if (!item) continue;
      
      const profession = item.category || "Other";
      if (!professions.has(profession)) {
        professions.set(profession, {
          category: profession,
          items: [],
          tierQuantities: {},
        });
      }
      
      const profData = professions.get(profession)!;
      const tracked = trackingData.trackedItems.get(itemId);
      profData.items.push({ item, quantity, tracked });
      
      // Initialize tier data if not exists
      if (!profData.tierQuantities[item.tier]) {
        profData.tierQuantities[item.tier] = { completed: 0, total: 0 };
      }
      profData.tierQuantities[item.tier].total += quantity;
      if (tracked?.status === 'completed') {
        profData.tierQuantities[item.tier].completed += tracked.completedQuantity;
      }
    }

    // Convert to ProfessionProgress array
    return Array.from(professions.entries()).map(([profession, data]) => {
      const totalItems = data.items.length;
      const completedItems = data.items.filter(i => i.tracked?.status === 'completed').length;
      const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
      
      return {
        profession,
        category: data.category,
        progress,
        completedItems,
        totalItems,
        tierQuantities: data.tierQuantities,
      } as ProfessionProgress;
    }).sort((a, b) => a.profession.localeCompare(b.profession));
  }, [breakdown, calcData, itemMap, trackingData]);

  // Calculate overall stats
  const overallStats = useMemo(() => {
    if (!breakdown) return { totalItems: 0, completedItems: 0, inProgressItems: 0, notStartedItems: 0 };
    const totalItems = Array.from(breakdown.rawMaterials.keys()).length;
    const completedItems = Array.from(trackingData.trackedItems.values())
      .filter(t => t.status === 'completed').length;
    const inProgressItems = Array.from(trackingData.trackedItems.values())
      .filter(t => t.status === 'in_progress').length;
    const notStartedItems = totalItems - completedItems - inProgressItems;
    
    return { totalItems, completedItems, inProgressItems, notStartedItems };
  }, [breakdown, trackingData]);

  const toggleItemTracking = useCallback((itemId: string, status: TrackingStatus) => {
    setTrackingData(prev => {
      const newTrackedItems = new Map(prev.trackedItems);
      const quantity = breakdown?.rawMaterials.get(itemId) || 0;
      
      if (status === 'not_started') {
        newTrackedItems.delete(itemId);
      } else {
        newTrackedItems.set(itemId, {
          itemId,
          status,
          completedQuantity: status === 'completed' ? quantity : 0,
          totalQuantity: quantity,
        });
      }
      
      return {
        ...prev,
        trackedItems: newTrackedItems,
      };
    });
  }, [breakdown]);

  const resetAllTracking = useCallback(() => {
    setTrackingData(prev => ({
      ...prev,
      trackedItems: new Map(),
    }));
  }, []);

  const autoFillCompleted = useCallback(() => {
    if (!breakdown) return;
    
    setTrackingData(prev => {
      const newTrackedItems = new Map(prev.trackedItems);
      
      for (const [itemId, quantity] of breakdown.rawMaterials.entries()) {
        newTrackedItems.set(itemId, {
          itemId,
          status: 'completed',
          completedQuantity: quantity,
          totalQuantity: quantity,
        });
      }
      
      return {
        ...prev,
        trackedItems: newTrackedItems,
      };
    });
  }, [breakdown]);

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
            <VStack spacing={4} align="stretch">
              {/* Progress Tracking Header */}
              <Box bg="surface.primary" borderRadius="md" p={4} border="1px solid" borderColor="border.primary">
                <VStack spacing={3}>
                  <HStack w="full">
                    <Heading size="md" color="orange.400">Progress Tracking</Heading>
                    <Badge bg="orange.400" color="white" px={2} py={1} borderRadius="md">Alpha</Badge>
                    <Spacer />
                    <Text fontSize="sm" color="text.muted">14 professions</Text>
                    <Button size="sm" variant="ghost" onClick={toggleFilters}>
                      Hide Profession
                    </Button>
                    <Button size="sm" variant="ghost">
                      Show Completed
                    </Button>
                    <Badge variant="outline">Required</Badge>
                    <Badge bg="orange.400" color="white">Remaining</Badge>
                  </HStack>
                  
                  {/* Stats Row */}
                  <StatGroup w="full">
                    <Stat textAlign="center">
                      <StatNumber fontSize="2xl" color="green.400">{overallStats.completedItems}</StatNumber>
                      <StatLabel>Complete</StatLabel>
                    </Stat>
                    <Stat textAlign="center">
                      <StatNumber fontSize="2xl" color="yellow.400">{overallStats.inProgressItems}</StatNumber>
                      <StatLabel>In Progress</StatLabel>
                    </Stat>
                    <Stat textAlign="center">
                      <StatNumber fontSize="2xl" color="gray.400">{overallStats.notStartedItems}</StatNumber>
                      <StatLabel>Not Started</StatLabel>
                    </Stat>
                    <Stat textAlign="center">
                      <StatNumber fontSize="2xl">{overallStats.totalItems}</StatNumber>
                      <StatLabel>Total</StatLabel>
                    </Stat>
                  </StatGroup>
                </VStack>
              </Box>

              {/* Global Filters */}
              <Collapse in={filtersOpen}>
                <Box bg="surface.primary" borderRadius="md" p={3} border="1px solid" borderColor="border.primary">
                  <HStack>
                    <Text fontWeight="medium">Global Filters</Text>
                    <Badge>Affects all tabs</Badge>
                    <Spacer />
                    <Button size="sm" variant="ghost">Show</Button>
                  </HStack>
                </Box>
              </Collapse>

              {/* Action Buttons */}
              <HStack spacing={2} flexWrap="wrap">
                <Menu>
                  <MenuButton as={Button} rightIcon={<ChevronDownIcon />} colorScheme="blue" size="sm">
                    Manage Tracking
                  </MenuButton>
                  <MenuList>
                    <MenuItem onClick={autoFillCompleted}>Auto-fill All Complete</MenuItem>
                    <MenuItem>Mark Section Complete</MenuItem>
                    <MenuItem>Import from CSV</MenuItem>
                  </MenuList>
                </Menu>
                <Button size="sm" colorScheme="green" leftIcon={<SettingsIcon />}>
                  Auto-fill
                </Button>
                <Button size="sm" colorScheme="blue">
                  Tiered
                </Button>
                <Button size="sm">
                  Detailed
                </Button>
                <Button size="sm" leftIcon={<DownloadIcon />}>
                  Export CSV
                </Button>
                <Button size="sm" colorScheme="red" leftIcon={<DeleteIcon />} onClick={resetAllTracking}>
                  Reset All
                </Button>
              </HStack>

              {/* Progress by Profession & Category Table */}
              <Box bg="surface.primary" borderRadius="md" border="1px solid" borderColor="border.primary" overflow="hidden">
                <Table variant="simple" size="sm">
                  <Thead bg="surface.elevated">
                    <Tr>
                      <Th>Profession</Th>
                      <Th>Category</Th>
                      <Th>Progress</Th>
                      <Th>T1</Th>
                      <Th>T2</Th>
                      <Th>T3</Th>
                      <Th>T4</Th>
                      <Th>T5</Th>
                      <Th>T6</Th>
                      <Th>T7</Th>
                      <Th>T8</Th>
                      <Th>T9</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {professionProgress.map((prof) => (
                      <Tr key={prof.profession} _hover={{ bg: "surface.elevated" }}>
                        <Td>
                          <HStack>
                            <Text fontWeight="medium">{prof.profession}</Text>
                            <Badge variant="outline" fontSize="xs">
                              {((prof.completedItems / prof.totalItems) * 100).toFixed(1)}%
                            </Badge>
                          </HStack>
                        </Td>
                        <Td>{prof.category}</Td>
                        <Td>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="sm" fontWeight="bold">{prof.progress}%</Text>
                            <Progress 
                              value={prof.progress} 
                              size="sm" 
                              w="60px" 
                              colorScheme={prof.progress === 100 ? "green" : prof.progress > 0 ? "yellow" : "gray"}
                            />
                          </VStack>
                        </Td>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(tier => {
                          const tierData = prof.tierQuantities[tier];
                          if (!tierData || tierData.total === 0) {
                            return <Td key={tier}>-</Td>;
                          }
                          return (
                            <Td key={tier} isNumeric>
                              <VStack spacing={0}>
                                <Text fontSize="xs" fontWeight="bold">
                                  {tierData.completed}
                                </Text>
                                <Text fontSize="xs" color="text.muted">
                                  {tierData.total}
                                </Text>
                              </VStack>
                            </Td>
                          );
                        })}
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </VStack>
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
