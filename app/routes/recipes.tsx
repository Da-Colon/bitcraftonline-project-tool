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
} from "@chakra-ui/react";
import { useState, useEffect, useMemo } from "react";
import { DeleteIcon, AddIcon } from "@chakra-ui/icons";
import type { Item, ProjectItem, Recipe } from "~/types/recipes";
import { RecipeTree } from "~/components/ItemBreakdown";
import { RECIPE_PROJECTS_KEY } from "~/constants/storage";
import { useLoaderData } from "@remix-run/react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { RecipeCalculator } from "~/services/recipe-calculator.server";

export async function loader({}: LoaderFunctionArgs) {
  // Build a minimal searchable index server-side
  const calc = new RecipeCalculator();
  const items = calc.getAllItems();
  return json({ items });
}

export default function Recipes() {
  const { items: loaderItems } = useLoaderData<typeof loader>();
  const [searchQuery, setSearchQuery] = useState("");
  const [projectItems, setProjectItems] = useState<ProjectItem[]>([]);
  const [projectName, setProjectName] = useState("New Project");
  const toast = useToast();
  const itemMap = useMemo(() => new Map(loaderItems.map((i: Item) => [i.id, i])), [loaderItems]);

  type CalcResponse = {
    rawMaterials: Array<[string, number]>;
    intermediates: Array<[string, number]>;
    totalItems: Array<[string, number]>;
    steps: Array<{ itemId: string; quantity: number; tier: number }>;
    items: Record<string, Item>;
    recipes: Record<string, Recipe>;
  };

  const [calcData, setCalcData] = useState<CalcResponse | null>(null);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return loaderItems
      .filter(
        (item: Item) =>
          item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [searchQuery, loaderItems]);

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

  const addItem = (item: Item) => {
    const existingIndex = projectItems.findIndex(pi => pi.itemId === item.id);
    
    if (existingIndex >= 0) {
      // Item already exists, increase quantity
      const updated = [...projectItems];
      updated[existingIndex].quantity += 1;
      setProjectItems(updated);
    } else {
      // Add new item
      const newProjectItem: ProjectItem = {
        itemId: item.id,
        quantity: 1,
      };
      setProjectItems([...projectItems, newProjectItem]);
    }
    
    setSearchQuery("");
    toast({
      title: "Item added",
      description: `${item.name} added to project`,
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  // Recalculate server-side when projectItems change
  useEffect(() => {
    const run = async () => {
      if (projectItems.length === 0) {
        setCalcData(null);
        return;
      }
      const res = await fetch("/api/recipes/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: projectItems }),
      });
      if (res.ok) {
        const data: CalcResponse = await res.json();
        setCalcData(data);
      }
    };
    run();
  }, [projectItems]);

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    
    const updated = projectItems.map(item =>
      item.itemId === itemId ? { ...item, quantity } : item
    );
    setProjectItems(updated);
  };

  const removeItem = (itemId: string) => {
    setProjectItems(projectItems.filter(item => item.itemId !== itemId));
  };

  const saveProject = () => {
    const project = {
      id: Date.now().toString(),
      name: projectName,
      items: projectItems,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const savedProjects = JSON.parse(localStorage.getItem(RECIPE_PROJECTS_KEY) || "[]");
    savedProjects.push(project);
    localStorage.setItem(RECIPE_PROJECTS_KEY, JSON.stringify(savedProjects));

    toast({
      title: "Project saved",
      description: `${projectName} has been saved`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const clearProject = () => {
    setProjectItems([]);
    setProjectName("New Project");
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="xl" mb={4}>Recipe Calculator</Heading>
          <Text color="gray.600">
            Plan your crafting projects and calculate required materials
          </Text>
        </Box>

        {/* Project Controls */}
        <Box p={6} bg="gray.50" borderRadius="lg">
          <Flex mb={4}>
            <Input
              placeholder="Project Name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              maxW="300px"
            />
            <Spacer />
            <HStack>
              <Button onClick={saveProject} colorScheme="blue" isDisabled={projectItems.length === 0}>
                Save Project
              </Button>
              <Button onClick={clearProject} variant="outline">
                Clear
              </Button>
            </HStack>
          </Flex>

          {/* Search & Add Items */}
          <VStack spacing={4} align="stretch">
            <Heading size="md">Add Items</Heading>
            <Input
              placeholder="Search for items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            {searchResults.length > 0 && (
              <Box maxH="200px" overflowY="auto" border="1px" borderColor="gray.200" borderRadius="md">
                {searchResults.map((item) => (
                  <Flex
                    key={item.id}
                    p={3}
                    borderBottom="1px"
                    borderColor="gray.100"
                    cursor="pointer"
                    _hover={{ bg: "gray.100" }}
                    onClick={() => addItem(item)}
                  >
                    <Box>
                      <Text fontWeight="medium">{item.name}</Text>
                      <Text fontSize="sm" color="gray.600">{item.category}</Text>
                    </Box>
                    <Spacer />
                    <Badge colorScheme="blue">Tier {item.tier}</Badge>
                  </Flex>
                ))}
              </Box>
            )}
          </VStack>
        </Box>

        {/* Project Items Table */}
        {projectItems.length > 0 && (
          <Box>
            <Heading size="md" mb={4}>Project Items</Heading>
            <Table variant="simple">
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
                          onChange={(_, value) => updateItemQuantity(projectItem.itemId, value)}
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
                        <Badge colorScheme={breakdown?.intermediates.has(projectItem.itemId) ? "green" : "gray"}>
                          {breakdown?.intermediates.has(projectItem.itemId) ? "Yes" : "Raw Material"}
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
        )}

        {/* Breakdown Tabs */}
        {projectItems.length > 0 && breakdown && (
          <Tabs>
            <TabList>
              <Tab>Raw Materials</Tab>
              <Tab>All Requirements</Tab>
              <Tab>Crafting Steps</Tab>
              <Tab>Recipe Trees</Tab>
            </TabList>

            <TabPanels>
              {/* Raw Materials Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  {breakdown.rawMaterials.size === 0 ? (
                    <Text color="gray.500">No raw materials needed</Text>
                  ) : (
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Item</Th>
                          <Th>Category</Th>
                          <Th isNumeric>Quantity</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {Array.from(breakdown.rawMaterials.entries()).map(([itemId, quantity]) => {
                          const item = calcData?.items[itemId] || itemMap.get(itemId);
                          return (
                            <Tr key={itemId}>
                              <Td fontWeight="medium">{item?.name || itemId}</Td>
                              <Td>
                                <Badge colorScheme={item?.tier === 0 ? "orange" : "blue"}>
                                  {item?.category}
                                </Badge>
                              </Td>
                              <Td isNumeric fontWeight="bold">{quantity}</Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  )}
                </VStack>
              </TabPanel>

              {/* All Requirements Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Heading size="md">All Items Required</Heading>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Item</Th>
                        <Th>Category</Th>
                        <Th>Type</Th>
                        <Th isNumeric>Quantity</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {Array.from(breakdown.totalItems.entries()).map(([itemId, quantity]) => {
                        const item = calcData?.items[itemId] || itemMap.get(itemId);
                        if (!item) return null;
                        
                        const isRaw = breakdown.rawMaterials.has(itemId);
                        const isIntermediate = breakdown.intermediates.has(itemId);
                        
                        return (
                          <Tr key={itemId}>
                            <Td>{item.name}</Td>
                            <Td>{item.category}</Td>
                            <Td>
                              <Badge colorScheme={isRaw ? "orange" : isIntermediate ? "blue" : "gray"}>
                                {isRaw ? "Raw" : isIntermediate ? "Crafted" : "Final"}
                              </Badge>
                            </Td>
                            <Td isNumeric>{quantity}</Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </VStack>
              </TabPanel>

              {/* Crafting Steps Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Heading size="md">Crafting Order</Heading>
                  {craftingSteps.length === 0 ? (
                    <Text color="gray.500">No crafting required (only raw materials)</Text>
                  ) : (
                    <Table variant="simple">
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
                </VStack>
              </TabPanel>

              {/* Recipe Trees Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Heading size="md">Recipe Trees</Heading>
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
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}

        {projectItems.length === 0 && (
          <Box textAlign="center" py={12}>
            <Text fontSize="lg" color="gray.500">
              Start by searching and adding items to your project
            </Text>
          </Box>
        )}
      </VStack>
    </Container>
  );
}
