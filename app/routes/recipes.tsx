import { useState, useEffect, useMemo } from "react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import {
  Box,
  Container,
  VStack,
  Text,
  Heading,
} from "@chakra-ui/react";
import { PlayerHeader } from "~/components/PlayerHeader";
import { ItemSearchCard } from "~/components/recipes/ItemSearchCard";
import { SelectedItemCard } from "~/components/recipes/SelectedItemCard";
import { RecipeBreakdownCard } from "~/components/recipes/RecipeBreakdownCard";
import { useDebounce } from "~/hooks/useDebounce";
import { useRecipeSelection } from "~/hooks/useRecipeSelection";
import { useRecipeInventoryData } from "~/hooks/useRecipeInventoryData";
import type { Item, RecipeBreakdownItem } from "~/types/recipes";
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
  const [searchResults, setSearchResults] = useState<Item[]>(items);
  
  // Use persistent recipe selection
  const {
    selectedItem,
    targetQuantity,
    updateSelectedItem,
    updateTargetQuantity,
    clearSelection,
  } = useRecipeSelection();

  // Get combined inventory data
  const {
    combinedInventory,
  } = useRecipeInventoryData();



  // Debounce search query to prevent excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const debouncedQuantity = useDebounce(targetQuantity, 200);

  // Create a stable key for inventory to avoid triggering recalcs on referential changes
  const inventoryKey = useMemo(() => JSON.stringify(combinedInventory), [combinedInventory]);

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
    // Calculation is triggered by the effect that watches selectedItem/id, debouncedQuantity, and inventoryKey
  };

  const handleQuantityChange = (newQuantity: number) => {
    updateTargetQuantity(newQuantity);
    // Calculation is triggered by the effect
  };

  const breakdown = (calculationFetcher.data as any)?.breakdown || [];
  const isLoading = calculationFetcher.state !== "idle";

  // Filter breakdown based on hideCompleted state
  const filteredBreakdown = hideCompleted 
    ? breakdown.filter((item: RecipeBreakdownItem) => item.deficit > 0)
    : breakdown;

  // Auto-calculate when inputs change (debounced) to avoid duplicate submits
  useEffect(() => {
    if (!selectedItem) return;
    const formData = new FormData();
    formData.append("itemId", selectedItem.id);
    formData.append("quantity", String(debouncedQuantity));
    formData.append("inventory", inventoryKey);
    calculationFetcher.submit(formData, {
      method: "post",
      action: "/api/recipes/calculate",
    });
  }, [selectedItem?.id, debouncedQuantity, inventoryKey]);

  // Keep last good search results to prevent flicker during fetcher transitions
  useEffect(() => {
    const data = (searchFetcher.data as any)?.items as Item[] | undefined;
    if (data) {
      setSearchResults(data);
    } else if (debouncedSearchQuery.length <= 2) {
      setSearchResults(items);
    }
  }, [searchFetcher.data, debouncedSearchQuery, items]);


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

        <ItemSearchCard
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchResults={searchResults}
          selectedItem={selectedItem}
          onItemSelect={handleItemSelect}
        />

        {selectedItem && (
          <SelectedItemCard
            selectedItem={selectedItem}
            targetQuantity={targetQuantity}
            onQuantityChange={handleQuantityChange}
            onClear={() => {
              clearSelection();
              setSearchQuery("");
            }}
          />
        )}

        {selectedItem && (
          <RecipeBreakdownCard
            breakdown={breakdown}
            filteredBreakdown={filteredBreakdown}
            hideCompleted={hideCompleted}
            onHideCompletedChange={setHideCompleted}
            isLoading={isLoading}
          />
        )}
      </VStack>
    </Container>
    </Box>
  );
}
