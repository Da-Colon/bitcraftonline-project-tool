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
  Divider,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Avatar,
  Tag,
  Link,
} from "@chakra-ui/react";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  DeleteIcon,
  SearchIcon,
  ChevronDownIcon,
  TimeIcon,
  ExternalLinkIcon,
} from "@chakra-ui/icons";
import type { Item, ProjectItem, Recipe } from "~/types/recipes";
import { RecipeTree } from "~/components/ItemBreakdown";
import { RECIPE_PROJECTS_KEY } from "~/constants/storage";
import { RecipeCalculator } from "~/services/recipe-calculator.server";

export async function loader({}: LoaderFunctionArgs) {
  const calc = new RecipeCalculator();
  const items = calc.getAllItems();
  return json({ items });
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
  const { items: loaderItems } = useLoaderData<typeof loader>();
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

  // Crafting steps
  const craftingSteps = useMemo(() => calcData?.steps ?? [], [calcData]);

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
        <Flex
          p={4}
          borderRadius="lg"
          bg="gray.800"
          border="1px solid"
          borderColor="whiteAlpha.200"
          align="center"
        >
          <HStack spacing={3}>
            <Avatar size="sm" name="BC" bg="gray.700" color="white" />
            <Box>
              <HStack spacing={2}>
                <Heading size="md">BitCraft Project Planner</Heading>
                <Tag size="sm" colorScheme="gray" opacity={0.8}>
                  v2.1.0
                </Tag>
              </HStack>
              <Text fontSize="sm" color="gray.400">
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

        {/* Project header area + Tabs wrapper */}
        <Tabs colorScheme="gray" variant="enclosed" defaultIndex={2}>
          <Box p={5} bg="gray.800" borderRadius="lg" border="1px solid" borderColor="whiteAlpha.200">
          <Flex align="center" gap={4} mb={4}>
            <Heading size="lg">{projectName || "Untitled Project"}</Heading>
            <Badge colorScheme="gray" variant="subtle">
              {projectItems.length} items
            </Badge>
            <HStack spacing={1} color="gray.400">
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
                bg="gray.900"
                borderColor="whiteAlpha.300"
              />
              <Button onClick={saveProject} colorScheme="blue" variant="solid" isDisabled={projectItems.length === 0}>
                Save Project
              </Button>
              <Button onClick={clearProject} variant="outline">Clear</Button>
            </HStack>
          </Flex>

          {/* Primary tabs across the app */}
            <TabList bg="gray.900" p={2} borderRadius="md" border="1px solid" borderColor="whiteAlpha.200">
              <Tab>Project Planner</Tab>
              <Tab>Recipe Tree</Tab>
              <Tab>Resource Summary</Tab>
              <Tab>Stats</Tab>
              <Tab>Budget</Tab>
            </TabList>
          </Box>

          {/* Add Items card (global action area) */}
          <Box p={5} mt={4} bg="gray.800" borderRadius="lg" border="1px solid" borderColor="whiteAlpha.200">
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
              bg="gray.900"
              borderColor="whiteAlpha.300"
            />

            {searchResults.length > 0 && (
              <Box
                mt={3}
                maxH="220px"
                overflowY="auto"
                border="1px"
                borderColor="whiteAlpha.300"
                borderRadius="md"
              >
                {searchResults.map((item) => (
                  <Flex
                    key={item.id}
                    p={3}
                    borderBottom="1px"
                    borderColor="whiteAlpha.200"
                    cursor="pointer"
                    _hover={{ bg: "whiteAlpha.100" }}
                    onClick={() => addItem(item)}
                  >
                    <Box>
                      <Text fontWeight="medium">{item.name}</Text>
                      <Text fontSize="sm" color="gray.400">
                        {item.category}
                      </Text>
                    </Box>
                    <Spacer />
                    <Badge colorScheme="blue">Tier {item.tier}</Badge>
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
                <Box bg="gray.800" borderRadius="lg" border="1px solid" borderColor="whiteAlpha.200" p={4}>
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
                                    : "gray"
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
                <Box bg="gray.800" borderRadius="lg" border="1px solid" borderColor="whiteAlpha.200" p={12} textAlign="center">
                  <Text fontSize="2xl" mb={2}>📦</Text>
                  <Heading size="sm" mb={2}>No items in project</Heading>
                  <Text color="gray.400">Use the search above to add items to your crafting project.</Text>
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
                <Text color="gray.400">Add items to view the recipe tree.</Text>
              )}
            </TabPanel>

            {/* 2: Resource Summary (raw materials) */}
            <TabPanel>
              {projectItems.length > 0 && breakdown ? (
                <VStack spacing={4} align="stretch">
                  <Heading size="md">Raw Materials</Heading>
                  {breakdown.rawMaterials.size === 0 ? (
                    <Text color="gray.400">No raw materials needed</Text>
                  ) : (
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Item</Th>
                          <Th>Category</Th>
                          <Th isNumeric>Quantity</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {Array.from(breakdown.rawMaterials.entries()).map(
                          ([itemId, quantity]) => {
                            const item = calcData?.items[itemId] || itemMap.get(itemId);
                            if (!item) return null;
                            return (
                              <Tr key={itemId}>
                                <Td fontWeight="medium">{item?.name || itemId}</Td>
                                <Td>
                                  <Badge
                                    colorScheme={item?.tier === 0 ? "orange" : "blue"}
                                  >
                                    {item?.category}
                                  </Badge>
                                </Td>
                                <Td isNumeric fontWeight="bold">{quantity}</Td>
                              </Tr>
                            );
                          }
                        )}
                      </Tbody>
                    </Table>
                  )}
                </VStack>
              ) : (
                <Text color="gray.400">Add items to see resource summary.</Text>
              )}
            </TabPanel>

            {/* 3: Stats (All requirements + crafting steps) */}
            <TabPanel>
              {projectItems.length > 0 && breakdown ? (
                <VStack spacing={8} align="stretch">
                  <Box>
                    <Heading size="md" mb={3}>All Items Required</Heading>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Item</Th>
                          <Th>Category</Th>
                          <Th>Type</Th>
                          <Th isNumeric>Quantity</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {Array.from(breakdown.totalItems.entries()).map(
                          ([itemId, quantity]) => {
                            const item = calcData?.items[itemId] || itemMap.get(itemId);
                            if (!item) return null;

                            const isRaw = breakdown.rawMaterials.has(itemId);
                            const isIntermediate = breakdown.intermediates.has(itemId);

                            return (
                              <Tr key={itemId}>
                                <Td>{item.name}</Td>
                                <Td>{item.category}</Td>
                                <Td>
                                  <Badge
                                    colorScheme={
                                      isRaw ? "orange" : isIntermediate ? "blue" : "gray"
                                    }
                                  >
                                    {isRaw ? "Raw" : isIntermediate ? "Crafted" : "Final"}
                                  </Badge>
                                </Td>
                                <Td isNumeric>{quantity}</Td>
                              </Tr>
                            );
                          }
                        )}
                      </Tbody>
                    </Table>
                  </Box>

                  <Divider borderColor="whiteAlpha.300" />

                  <Box>
                    <Heading size="md" mb={3}>Crafting Order</Heading>
                    {craftingSteps.length === 0 ? (
                      <Text color="gray.400">No crafting required (only raw materials)</Text>
                    ) : (
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Step</Th>
                            <Th>Item</Th>
                            <Th>Tier</Th>
                            <Th isNumeric>Quantity to Craft</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {craftingSteps.map((step, index) => {
                            const item = calcData?.items[step.itemId] || itemMap.get(step.itemId);
                            if (!item) return null;

                            return (
                              <Tr key={step.itemId}>
                                <Td>{index + 1}</Td>
                                <Td>{item.name}</Td>
                                <Td>
                                  <Badge colorScheme="purple">Tier {step.tier}</Badge>
                                </Td>
                                <Td isNumeric>{step.quantity}</Td>
                              </Tr>
                            );
                          })}
                        </Tbody>
                      </Table>
                    )}
                  </Box>
                </VStack>
              ) : (
                <Text color="gray.400">Stats will appear after adding items.</Text>
              )}
            </TabPanel>

            {/* 4: Budget placeholder */}
            <TabPanel>
              <Box bg="gray.800" borderRadius="lg" border="1px solid" borderColor="whiteAlpha.200" p={6}>
                <Heading size="md" mb={2}>Budget</Heading>
                <Text color="gray.400">Budget planning UI is coming soon.</Text>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
        
      </VStack>
    </Container>
  );
}
