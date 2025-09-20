import { useState, useEffect, useMemo } from "react"
import { json, type LoaderFunctionArgs } from "@remix-run/node"
import { useLoaderData, useFetcher } from "@remix-run/react"
import {
  Badge,
  Box,
  Button,
  Divider,
  Heading,
  HStack,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { PlayerHeader } from "~/components/PlayerHeader"
import { RecipeOverview } from "~/components/RecipeOverview"
import { ItemSearchCard } from "~/components/recipes/ItemSearchCard"
import { SelectedItemCard } from "~/components/recipes/SelectedItemCard"
import { RecipeBreakdownCard } from "~/components/recipes/RecipeBreakdownCard"
import { useDebounce } from "~/hooks/useDebounce"
import { useRecipeSelection } from "~/hooks/useRecipeSelection"
import { useRecipeInventoryData } from "~/hooks/useRecipeInventoryData"
import type { Item, RecipeBreakdownItem } from "~/types/recipes"
import { getEnhancedRecipeCalculator } from "~/services/enhanced-recipe-calculator.server"
import { DashboardLayout } from "~/components/DashboardLayout"
import { Link as RemixLink } from "@remix-run/react"

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const query = url.searchParams.get("q")

  const calculator = getEnhancedRecipeCalculator()

  if (query) {
    const items = calculator.searchItems(query)
    return json({ items: items.slice(0, 20) }) // Limit results
  }

  return json({ items: [] })
}

export default function RecipesRoute() {
  const { items } = useLoaderData<typeof loader>()
  const searchFetcher = useFetcher()
  const calculationFetcher = useFetcher()

  const [searchQuery, setSearchQuery] = useState("")
  const [hideCompleted, setHideCompleted] = useState(false)
  const [searchResults, setSearchResults] = useState<Item[]>(items)

  // Use persistent recipe selection
  const { selectedItem, targetQuantity, updateSelectedItem, updateTargetQuantity, clearSelection } =
    useRecipeSelection()

  // Get combined inventory data
  const { combinedInventory } = useRecipeInventoryData()

  // Debounce search query to prevent excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const debouncedQuantity = useDebounce(targetQuantity, 200)

  // Create a stable key for inventory to avoid triggering recalcs on referential changes
  const inventoryKey = useMemo(() => JSON.stringify(combinedInventory), [combinedInventory])

  // Fetch search results when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery.length > 2) {
      const params = new URLSearchParams({ q: debouncedSearchQuery })
      searchFetcher.load(`/recipes?${params}`)
    }
  }, [debouncedSearchQuery]) // Only depend on the debounced query, not the fetcher

  const handleItemSelect = (item: Item) => {
    updateSelectedItem(item)
    setSearchQuery(item.name)
    // Calculation is triggered by the effect that watches selectedItem/id, debouncedQuantity, and inventoryKey
  }

  const handleQuantityChange = (newQuantity: number) => {
    updateTargetQuantity(newQuantity)
    // Calculation is triggered by the effect
  }

  const breakdown = (calculationFetcher.data as any)?.breakdown || []
  const isLoading = calculationFetcher.state !== "idle"

  // Filter breakdown based on hideCompleted state
  const filteredBreakdown = hideCompleted
    ? breakdown.filter((item: RecipeBreakdownItem) => item.deficit > 0)
    : breakdown

  // Auto-calculate when inputs change (debounced) to avoid duplicate submits
  useEffect(() => {
    if (!selectedItem) return
    const formData = new FormData()
    formData.append("itemId", selectedItem.id)
    formData.append("quantity", String(debouncedQuantity))
    formData.append("inventory", inventoryKey)
    calculationFetcher.submit(formData, {
      method: "post",
      action: "/api/recipes/calculate",
    })
  }, [selectedItem?.id, debouncedQuantity, inventoryKey])

  // Keep last good search results to prevent flicker during fetcher transitions
  useEffect(() => {
    const data = (searchFetcher.data as any)?.items as Item[] | undefined
    if (data) {
      setSearchResults(data)
    } else if (debouncedSearchQuery.length <= 2) {
      setSearchResults(items)
    }
  }, [searchFetcher.data, debouncedSearchQuery, items])

  const totalInventoryItems = combinedInventory.reduce((sum, item) => sum + item.quantity, 0)
  const uniqueInventoryItems = combinedInventory.length

  const hero = (
    <Box px={{ base: 6, md: 10 }} py={{ base: 12, md: 20 }}>
      <VStack spacing={6} align="flex-start" maxW="4xl">
        <Text textTransform="uppercase" fontSize="sm" letterSpacing="widest" color="whiteAlpha.800">
          Recipe Planning Suite
        </Text>
        <Heading size="2xl" lineHeight="1.1" color="white">
          Chart tonight's crafting with inventory-powered insights.
        </Heading>
        <Text fontSize={{ base: "lg", md: "xl" }} color="whiteAlpha.900">
          Search every BitCraft recipe, see live deficits, and let your tracked inventories shoulder
          the math. Cozy planning vibes meet production-ready clarity.
        </Text>

        <HStack spacing={3} flexWrap="wrap">
          <Badge colorScheme="teal" px={3} py={1} borderRadius="full">
            {uniqueInventoryItems} inventory sources
          </Badge>
          <Badge colorScheme="purple" px={3} py={1} borderRadius="full">
            {totalInventoryItems.toLocaleString()} materials on hand
          </Badge>
          {selectedItem && (
            <Badge colorScheme="pink" px={3} py={1} borderRadius="full">
              Focused on {selectedItem.name}
            </Badge>
          )}
        </HStack>

        <Stack direction={{ base: "column", sm: "row" }} spacing={3}>
          <Button as="a" href="#recipe-calculator" colorScheme="teal" size="lg">
            Start planning
          </Button>
          <Button as={RemixLink} to="/" variant="ghost" colorScheme="whiteAlpha" size="lg">
            Return to dashboard
          </Button>
        </Stack>
      </VStack>
    </Box>
  )

  return (
    <Box bg="gray.900" minH="100vh">
      <PlayerHeader />
      <DashboardLayout hero={hero}>
        <VStack spacing={{ base: 8, md: 10 }} align="stretch">
          <Box>
            <Heading size="lg" mb={3} color="white">
              Recipe Calculator
            </Heading>
            <Text color="whiteAlpha.900">
              Search for an item to see its complete recipe breakdown with inventory-aware
              calculations. The calculator automatically deducts materials you already have from
              tracked inventories.
            </Text>
          </Box>

          {/* Recipe Overview */}
          <RecipeOverview
            combinedInventory={combinedInventory}
            selectedItem={selectedItem}
            breakdown={breakdown}
            isCalculating={isLoading}
          />

          {/* Divider */}
          <Divider borderColor="whiteAlpha.200" />

          {/* Recipe Calculator Section */}
          <Box id="recipe-calculator">
            <Text fontSize="xl" fontWeight="bold" mb={4} color="white">
              Recipe Calculator
            </Text>
            <Text color="whiteAlpha.900" mb={6}>
              Search for items, select quantities, and see exactly what materials you need to
              gather.
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
                clearSelection()
                setSearchQuery("")
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
      </DashboardLayout>
    </Box>
  )
}
