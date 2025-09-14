import { useState, useEffect, useCallback } from "react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import {
  Box,
  Container,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  Heading,
  Card,
  CardBody,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useColorModeValue,
  Spinner,
  Checkbox,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  CardHeader,
  Alert,
  AlertIcon,
  SimpleGrid,
} from "@chakra-ui/react";
import { PlayerHeader } from "~/components/PlayerHeader";
import { useDebounce } from "~/hooks/useDebounce";
import { useRecipeSelection } from "~/hooks/useRecipeSelection";
import { useRecipeInventoryData } from "~/hooks/useRecipeInventoryData";
import type { Item, RecipeBreakdownItem, InventoryItem } from "~/types/recipes";
import { getEnhancedRecipeCalculator } from "~/services/enhanced-recipe-calculator.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");
  
  const calculator = getEnhancedRecipeCalculator();
  
  if (query) {
    const items = calculator.searchItems(query);
    return json({ items: items.slice(0, 20) }); // Limit results
  }
  
  return json({ items: [] });
}

export default function RecipesRoute() {
  const { items } = useLoaderData<typeof loader>();
  const searchFetcher = useFetcher();
  const calculationFetcher = useFetcher();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [hideCompleted, setHideCompleted] = useState(false);
  
  // Use persistent recipe selection
  const {
    selectedItem,
    targetQuantity,
    isStale: isRecipeStale,
    updateSelectedItem,
    updateTargetQuantity,
    clearSelection,
  } = useRecipeSelection();

  // Get combined inventory data
  const {
    combinedInventory,
    inventoryMap,
    hasInventoryData,
    isLoading: isInventoryLoading,
    selectedPlayer,
    selectedClaim,
    isPlayerDataStale,
  } = useRecipeInventoryData();


  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const hoverColor = useColorModeValue("gray.50", "gray.700");

  // Debounce search query to prevent excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch search results when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery.length > 2) {
      const params = new URLSearchParams({ q: debouncedSearchQuery });
      searchFetcher.load(`/recipes?${params}`);
    }
  }, [debouncedSearchQuery]); // Only depend on the debounced query, not the fetcher

  const handleItemSelect = (item: Item) => {
    updateSelectedItem(item);
    setSearchQuery(item.name);
    
    const formData = new FormData();
    formData.append("itemId", item.id);
    formData.append("quantity", targetQuantity.toString());
    formData.append("inventory", JSON.stringify(combinedInventory));
    
    calculationFetcher.submit(formData, {
      method: "post",
      action: "/api/recipes/calculate",
    });
  };

  const handleQuantityChange = (newQuantity: number) => {
    updateTargetQuantity(newQuantity);
    
    if (selectedItem) {
      const formData = new FormData();
      formData.append("itemId", selectedItem.id);
      formData.append("quantity", newQuantity.toString());
      formData.append("inventory", JSON.stringify(combinedInventory));
      
      calculationFetcher.submit(formData, {
        method: "post",
        action: "/api/recipes/calculate",
      });
    }
  };

  const breakdown = (calculationFetcher.data as any)?.breakdown || [];
  const isLoading = calculationFetcher.state === "loading";
  
  // Get search results from search fetcher
  const searchResults = (searchFetcher.data as any)?.items || items;

  // Filter breakdown based on hideCompleted state
  const filteredBreakdown = hideCompleted 
    ? breakdown.filter((item: RecipeBreakdownItem) => item.deficit > 0)
    : breakdown;

  // Auto-calculate when component loads with persisted selection
  // Use a ref to track if we've already calculated for the current selection
  const [hasCalculated, setHasCalculated] = useState(false);
  
  // Create a stable reference for inventory to prevent unnecessary recalculations
  const inventoryString = JSON.stringify(combinedInventory);
  const [lastInventoryString, setLastInventoryString] = useState(inventoryString);
  
  useEffect(() => {
    if (selectedItem && calculationFetcher.state === "idle" && combinedInventory.length >= 0 && !hasCalculated) {
      const formData = new FormData();
      formData.append("itemId", selectedItem.id);
      formData.append("quantity", targetQuantity.toString());
      formData.append("inventory", inventoryString);
      
      calculationFetcher.submit(formData, {
        method: "post",
        action: "/api/recipes/calculate",
      });
      setHasCalculated(true);
      setLastInventoryString(inventoryString);
    }
  }, [selectedItem, calculationFetcher.state, inventoryString, targetQuantity, hasCalculated]);

  // Reset calculation flag when selection or inventory changes
  useEffect(() => {
    if (selectedItem?.id && (inventoryString !== lastInventoryString)) {
      setHasCalculated(false);
    }
  }, [selectedItem?.id, targetQuantity, inventoryString, lastInventoryString]);


  return (
    <Box minH="100vh">
      <PlayerHeader />
      <Container maxW="container.xl" py={4}>
      <VStack spacing={4} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>Recipe Calculator</Heading>
          <Text color="gray.600">
            Search for an item to see its complete recipe breakdown with tier-based inventory calculations.
          </Text>
          
        </Box>

        {/* Item Search */}
        <Card>
          <CardHeader pb={2}>
            <Heading size="md">Item Search</Heading>
          </CardHeader>
          <CardBody pt={0}>
            <VStack spacing={3} align="stretch">
              <Input
                placeholder="Search for items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              {searchQuery.length > 2 && searchResults.length > 0 && !selectedItem && (
                <Box maxH="300px" overflowY="auto" border="1px" borderColor={borderColor} borderRadius="md">
                  {searchResults.map((item: Item) => (
                    <Box
                      key={item.id}
                      p={2}
                      borderBottom="1px"
                      borderColor={borderColor}
                      cursor="pointer"
                      _hover={{ bg: hoverColor }}
                      onClick={() => handleItemSelect(item)}
                    >
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium">{item.name}</Text>
                        <HStack>
                          <Badge colorScheme="blue" size="sm">Tier {item.tier}</Badge>
                          <Badge variant="outline" size="sm">{item.category}</Badge>
                        </HStack>
                      </VStack>
                    </Box>
                  ))}
                </Box>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Selected Item & Quantity */}
        {selectedItem && (
          <Card>
            <CardHeader pb={2}>
              <Heading size="md">Selected Item</Heading>
            </CardHeader>
            <CardBody pt={0}>
              <HStack spacing={4} align="center">
                <VStack align="start" spacing={1}>
                  <Text fontSize="lg" fontWeight="bold">{selectedItem.name}</Text>
                  <HStack>
                    <Badge colorScheme="blue" size="sm">Tier {selectedItem.tier}</Badge>
                    <Badge variant="outline" size="sm">{selectedItem.category}</Badge>
                  </HStack>
                </VStack>
                
                <HStack spacing={2}>
                  <Text>Quantity:</Text>
                  <Button
                    size="sm"
                    onClick={() => handleQuantityChange(Math.max(1, targetQuantity - 1))}
                    disabled={targetQuantity <= 1}
                  >
                    -
                  </Button>
                  <Text minW="40px" textAlign="center" fontWeight="bold">
                    {targetQuantity}
                  </Text>
                  <Button
                    size="sm"
                    onClick={() => handleQuantityChange(targetQuantity + 1)}
                  >
                    +
                  </Button>
                </HStack>
                
                <Button
                  colorScheme="red"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearSelection();
                    setSearchQuery("");
                  }}
                >
                  Clear
                </Button>
              </HStack>
            </CardBody>
          </Card>
        )}

        {/* Recipe Breakdown */}
        {selectedItem && (
          <Card>
            <CardHeader pb={2}>
              <HStack justify="space-between" align="center">
                <Heading size="md">Recipe Breakdown</Heading>
                <HStack spacing={4}>
                  <Checkbox 
                    isChecked={hideCompleted}
                    onChange={(e) => setHideCompleted(e.target.checked)}
                  >
                    Hide completed items
                  </Checkbox>
                  {isLoading && <Spinner size="sm" />}
                </HStack>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              {breakdown.length > 0 ? (
                <Tabs variant="enclosed">
                  <TabList>
                    <Tab>Detailed Breakdown</Tab>
                    <Tab>Summary by Tier</Tab>
                    <Tab>Raw Materials Only</Tab>
                  </TabList>
                  
                  <TabPanels>
                    <TabPanel px={0}>
                      <RecipeBreakdownTable breakdown={filteredBreakdown} />
                    </TabPanel>
                    
                    <TabPanel px={0}>
                      <TierSummaryView breakdown={filteredBreakdown} />
                    </TabPanel>
                    
                    <TabPanel px={0}>
                      <RawMaterialsView breakdown={filteredBreakdown} />
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              ) : !isLoading ? (
                <Alert status="info">
                  <AlertIcon />
                  Select an item and quantity to see the recipe breakdown.
                </Alert>
              ) : null}
            </CardBody>
          </Card>
        )}
      </VStack>
    </Container>
    </Box>
  );
}

function RecipeBreakdownTable({ breakdown }: { breakdown: RecipeBreakdownItem[] }) {
  
  return (
    <TableContainer>
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>Item</Th>
            <Th>Tier</Th>
            <Th>Category</Th>
            <Th isNumeric>Recipe Required</Th>
            <Th isNumeric>Current Inventory</Th>
            <Th isNumeric>Actual Required</Th>
            <Th isNumeric>Deficit</Th>
          </Tr>
        </Thead>
        <Tbody>
          {breakdown.map((item) => (
            <Tr key={item.itemId}>
              <Td fontWeight="medium">{item.name}</Td>
              <Td>
                <Badge colorScheme="blue" size="sm">
                  T{item.tier}
                </Badge>
              </Td>
              <Td>
                <Badge variant="outline" size="sm">
                  {item.category}
                </Badge>
              </Td>
              <Td isNumeric>{item.recipeRequired.toLocaleString()}</Td>
              <Td isNumeric>
                <Text color={item.currentInventory > 0 ? "green.500" : "gray.500"}>
                  {(item.currentInventory || 0).toLocaleString()}
                </Text>
              </Td>
              <Td isNumeric>{item.actualRequired.toLocaleString()}</Td>
              <Td isNumeric>
                <Text color={item.deficit > 0 ? "red.500" : "green.500"} fontWeight="bold">
                  {item.deficit.toLocaleString()}
                </Text>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}

function TierSummaryView({ breakdown }: { breakdown: RecipeBreakdownItem[] }) {
  const tierGroups = breakdown.reduce((acc, item) => {
    if (!acc[item.tier]) acc[item.tier] = [];
    acc[item.tier].push(item);
    return acc;
  }, {} as Record<number, RecipeBreakdownItem[]>);

  const sortedTiers = Object.keys(tierGroups)
    .map(Number)
    .sort((a, b) => b - a); // Highest tier first

  return (
    <VStack spacing={3} align="stretch">
      {sortedTiers.map((tier) => (
        <Card key={tier} variant="outline">
          <CardHeader pb={1}>
            <HStack justify="space-between">
              <Heading size="sm">Tier {tier}</Heading>
              <Badge colorScheme="blue" size="sm">
                {tierGroups[tier].length} items
              </Badge>
            </HStack>
          </CardHeader>
          <CardBody pt={0}>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={2}>
              {tierGroups[tier].map((item) => (
                <Box
                  key={item.itemId}
                  p={2}
                  border="1px"
                  borderColor="gray.200"
                  borderRadius="md"
                  bg={item.deficit > 0 ? "red.50" : "green.50"}
                >
                  <Text fontWeight="medium" fontSize="sm">{item.name}</Text>
                  <HStack justify="space-between" mt={1}>
                    <Text fontSize="xs" color="gray.600">
                      Need: {item.deficit.toLocaleString()}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      Have: {item.currentInventory.toLocaleString()}
                    </Text>
                  </HStack>
                </Box>
              ))}
            </SimpleGrid>
          </CardBody>
        </Card>
      ))}
    </VStack>
  );
}

function RawMaterialsView({ breakdown }: { breakdown: RecipeBreakdownItem[] }) {
  // Raw materials are items with tier <= 1 or items without recipes
  const rawMaterials = breakdown.filter(item => item.tier <= 1);

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
      {rawMaterials.map((item) => (
        <Card key={item.itemId} variant="outline" size="sm">
          <CardBody p={3}>
            <VStack align="start" spacing={2}>
              <Text fontWeight="bold">{item.name}</Text>
              <HStack>
                <Badge colorScheme="blue" size="sm">T{item.tier}</Badge>
                <Badge variant="outline" size="sm">{item.category}</Badge>
              </HStack>
              <VStack align="start" spacing={1} fontSize="sm" w="full">
                <HStack justify="space-between" w="full">
                  <Text>Required:</Text>
                  <Text fontWeight="bold">{item.recipeRequired.toLocaleString()}</Text>
                </HStack>
                <HStack justify="space-between" w="full">
                  <Text>Available:</Text>
                  <Text color="green.500">{item.currentInventory.toLocaleString()}</Text>
                </HStack>
                <HStack justify="space-between" w="full">
                  <Text>Still Need:</Text>
                  <Text color={item.deficit > 0 ? "red.500" : "green.500"} fontWeight="bold">
                    {item.deficit.toLocaleString()}
                  </Text>
                </HStack>
              </VStack>
            </VStack>
          </CardBody>
        </Card>
      ))}
    </SimpleGrid>
  );
}
