import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Input,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  SimpleGrid,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Text,
  Badge,
  IconButton,
  useToast,
  Flex,
  Spacer,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Avatar,
} from "@chakra-ui/react";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  DeleteIcon,
  SearchIcon,
  ChevronDownIcon,
  TimeIcon,
} from "@chakra-ui/icons";
import type { Item, ProjectItem, Recipe } from "~/types/recipes";
import { RecipeTree } from "~/components/ItemBreakdown";
import { RECIPE_PROJECTS_KEY } from "~/constants/storage";
import { RecipeCalculator } from "~/services/recipe-calculator.server";
import { getTierColorScheme } from "~/theme";

export async function loader({}: LoaderFunctionArgs) {
  const calc = new RecipeCalculator();
  const items = calc.getAllItems();
  const { getAppVersion } = await import("~/utils/version.server");
  const version = await getAppVersion();
  return json({ items, version });
}

type CalcResponse = {
  rawMaterials: Array<[string, number]>;
  intermediates: Array<[string, number]>;
  totalItems: Array<[string, number]>;
  steps: Array<{ itemId: string; quantity: number; tier: number }>;
  items: Record<string, Item>;
  recipes: Record<string, Recipe>;
};

export default function Index() {
  const { items: loaderItems, version } = useLoaderData<typeof loader>();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [projectItems, setProjectItems] = useState<ProjectItem[]>([]);
  const [projectName, setProjectName] = useState("New Project");
  const [calcData, setCalcData] = useState<CalcResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const toast = useToast();

  const itemMap = useMemo(
    () => new Map(loaderItems.map((i: Item) => [i.id, i])),
    [loaderItems]
  );

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search results with debounced query
  const searchResults = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return [];
    const q = debouncedSearchQuery.toLowerCase();
    return loaderItems
      .filter(
        (item: Item) =>
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [debouncedSearchQuery, loaderItems]);

  // Calculate breakdown
  const breakdown = useMemo(() => {
    if (!calcData) return null;
    return {
      rawMaterials: new Map(calcData.rawMaterials),
      intermediates: new Map(calcData.intermediates),
      totalItems: new Map(calcData.totalItems),
    };
  }, [calcData]);
 
  // Group raw materials by category (as a proxy for professions)
  const groupedRawMaterials = useMemo(() => {
    if (!breakdown) return [] as Array<{ category: string; items: Array<{ item: Item; quantity: number }> }>;
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
  
  const addItem = useCallback(
    (item: Item) => {
      const existingIndex = projectItems.findIndex(
        (pi) => pi.itemId === item.id
      );

      if (existingIndex >= 0) {
        const updated = [...projectItems];
        updated[existingIndex].quantity += 1;
        setProjectItems(updated);
      } else {
        const newProjectItem: ProjectItem = {
          itemId: item.id,
          quantity: 1,
        };
        setProjectItems([...projectItems, newProjectItem]);
      }

      setSearchQuery("");
      setDebouncedSearchQuery("");
      toast({
        title: "Item added",
        description: `${item.name} added to project`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    },
    [projectItems, toast]
  );

  const recalc = useCallback(async (items: ProjectItem[]) => {
    if (items.length === 0) {
      setCalcData(null);
      return;
    }
    const res = await fetch("/api/recipes/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    if (res.ok) {
      const data: CalcResponse = await res.json();
      setCalcData(data);
    }
  }, []);

  // Recalculate when projectItems change
  useEffect(() => {
    recalc(projectItems);
    setLastUpdated(new Date());
  }, [projectItems, recalc]);

  const updateItemQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setProjectItems((prev) => prev.filter((item) => item.itemId !== itemId));
      return;
    }

    setProjectItems((prev) =>
      prev.map((item) => (item.itemId === itemId ? { ...item, quantity } : item))
    );
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setProjectItems((prev) => prev.filter((item) => item.itemId !== itemId));
  }, []);

  const saveProject = useCallback(() => {
    const project = {
      id: Date.now().toString(),
      name: projectName,
      items: projectItems,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const savedProjects = JSON.parse(
      localStorage.getItem(RECIPE_PROJECTS_KEY) || "[]"
    );
    savedProjects.push(project);
    localStorage.setItem(RECIPE_PROJECTS_KEY, JSON.stringify(savedProjects));

    toast({
      title: "Project saved",
      description: `${projectName} has been saved`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  }, [projectName, projectItems, toast]);

  const clearProject = useCallback(() => {
    setProjectItems([]);
    setProjectName("New Project");
  }, []);

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Top App Bar */}
        <Box bg="surface.primary" borderRadius="lg" border="1px solid" borderColor="border.primary" p={4}>
          <Flex align="center">
            <HStack spacing={3}>
              <Avatar size="sm" name="BC" />
              <Box>
                <HStack spacing={2}>
                  <Heading size="md">BitCraft Project Planner</Heading>
                  <Badge variant="status">
                    {`v${version}`}
                  </Badge>
                </HStack>
                <Text fontSize="sm" color="text.muted">
                  Plan a single project and its resources
                </Text>
              </Box>
            </HStack>

            <Spacer />

            <Menu>
              <MenuButton as={Button} size="sm" rightIcon={<ChevronDownIcon />}>
                Switch Project
              </MenuButton>
              <MenuList>
                <MenuItem>New Project</MenuItem>
                <MenuItem>Demo Project A</MenuItem>
                <MenuItem>Demo Project B</MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </Box>

        {/* Project header area + Tabs wrapper */}
        <Tabs colorScheme="gray" variant="enclosed" defaultIndex={2}>
          <Box bg="surface.primary" borderRadius="lg" p={5}>
          <Flex align="center" justify="center" gap={4} mb={4}>
            <Heading size="lg">{projectName || "Untitled Project"}</Heading>
            <Badge variant="status">
              {projectItems.length} items
            </Badge>
            <HStack spacing={1} color="text.muted">
              <TimeIcon />
              <Text fontSize="sm">
                {lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString()}` : "Not updated yet"}
              </Text>
            </HStack>
            <Spacer />
            <HStack spacing={2}>
              <Input
                placeholder="Project Name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                maxW="280px"
              />
              <Button onClick={saveProject} variant="primary" isDisabled={projectItems.length === 0} px={6}>
                Save Project
              </Button>
              <Button onClick={clearProject} variant="secondary">Clear</Button>
            </HStack>
          </Flex>

          {/* Primary tabs across the app */}
            <TabList>
              <Tab>Project Planner</Tab>
              <Tab>Recipe Tree</Tab>
              <Tab>Resource Summary</Tab>
            </TabList>
          </Box>

          {/* Add Items card (global action area) */}
          <Box bg="surface.primary" borderRadius="lg" border="1px solid" borderColor="border.primary" p={5} mt={4}>
            <Flex align="center" mb={3}>
              <Heading size="md">Add Items to Project</Heading>
              <Spacer />
              <Button
                leftIcon={<SearchIcon />}
                onClick={() => recalc(projectItems)}
                isDisabled={projectItems.length === 0}
                variant="outline"
              >
                Calculate Complete Project Resources
              </Button>
            </Flex>
            <Input
              placeholder="Search items to add to project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {searchResults.length > 0 && (
              <Box
                mt={3}
                maxH="220px"
                overflowY="auto"
                border="1px"
                borderColor="border.secondary"
                borderRadius="md"
              >
                {searchResults.map((item) => (
                  <Flex
                    key={item.id}
                    p={3}
                    borderBottom="1px"
                    borderColor="border.primary"
                    cursor="pointer"
                    _hover={{ bg: "surface.secondary" }}
                    onClick={() => addItem(item)}
                  >
                    <Box>
                      <Text fontWeight="medium">{item.name}</Text>
                      <Text fontSize="sm" color="text.muted">
                        {item.category}
                      </Text>
                    </Box>
                    <Spacer />
                    <Badge colorScheme={getTierColorScheme(item.tier)}>Tier {item.tier}</Badge>
                  </Flex>
                ))}
              </Box>
            )}
          </Box>

          {/* Main content driven by tabs */}
          <TabPanels>
            {/* 0: Project Planner */}
            <TabPanel>
              {projectItems.length > 0 ? (
                <Box bg="surface.primary" borderRadius="lg" border="1px solid" borderColor="border.primary" p={4}>
                  <Heading size="md" mb={4}>
                    Project Items
                  </Heading>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Item</Th>
                        <Th>Category</Th>
                        <Th>Quantity</Th>
                        <Th>Has Recipe</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {projectItems.map((projectItem) => {
                        const item = itemMap.get(projectItem.itemId);
                        if (!item) return null;

                        return (
                          <Tr key={projectItem.itemId}>
                            <Td>{item.name}</Td>
                            <Td>{item.category}</Td>
                            <Td>
                              <NumberInput
                                value={projectItem.quantity}
                                onChange={(_, value) =>
                                  updateItemQuantity(projectItem.itemId, value)
                                }
                                min={1}
                                max={1000}
                                w="100px"
                              >
                                <NumberInputField />
                                <NumberInputStepper>
                                  <NumberIncrementStepper />
                                  <NumberDecrementStepper />
                                </NumberInputStepper>
                              </NumberInput>
                            </Td>
                            <Td>
                              <Badge
                                colorScheme={
                                  breakdown?.intermediates.has(projectItem.itemId)
                                    ? "green"
                                    : "orange"
                                }
                              >
                                {breakdown?.intermediates.has(projectItem.itemId)
                                  ? "Yes"
                                  : "Raw Material"}
                              </Badge>
                            </Td>
                            <Td>
                              <IconButton
                                aria-label="Remove item"
                                icon={<DeleteIcon />}
                                size="sm"
                                colorScheme="red"
                                variant="ghost"
                                onClick={() => removeItem(projectItem.itemId)}
                              />
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              ) : (
                <Box bg="surface.primary" borderRadius="lg" border="1px solid" borderColor="border.primary" p={12} textAlign="center">
                  <Text fontSize="2xl" mb={2}>📦</Text>
                  <Heading size="sm" mb={2}>No items in project</Heading>
                  <Text color="text.muted">Use the search above to add items to your crafting project.</Text>
                </Box>
              )}
            </TabPanel>

            {/* 1: Recipe Tree */}
            <TabPanel>
              {projectItems.length > 0 && breakdown ? (
                <VStack spacing={4} align="stretch">
                  <Heading size="md">Recipe Tree</Heading>
                  {projectItems.map((projectItem) => {
                    const lookup = {
                      getItem: (id: string) => calcData?.items[id] || itemMap.get(id),
                      getRecipe: (id: string) => (calcData?.recipes || {})[id],
                    };
                    return (
                      <RecipeTree
                        key={projectItem.itemId}
                        itemId={projectItem.itemId}
                        quantity={projectItem.quantity}
                        lookup={lookup}
                      />
                    );
                  })}
                </VStack>
              ) : (
                <Text color="text.muted">Add items to view the recipe tree.</Text>
              )}
            </TabPanel>

            {/* 2: Resource Summary (with nested tabs) */}
            <TabPanel>
              {projectItems.length > 0 && breakdown ? (
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
              ) : (
                <Text color="text.muted">Add items to see resource summary.</Text>
              )}
            </TabPanel>

            
          </TabPanels>
        </Tabs>
        
      </VStack>
    </Container>
  );
}
