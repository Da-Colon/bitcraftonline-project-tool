import { Box, Text, VStack, HStack, Button, useToast } from "@chakra-ui/react"
import { useTrackedInventorySummary } from "~/hooks/useTrackedInventorySummary"
import { InventoryTierTable } from "~/components/InventoryTierTable"
import type { CombinedInventoryItem } from "~/utils/combineAllTrackedInventories"

export function TrackedInventoryView() {
  const {
    player,
    loading,
    error,
    trackedInventoryIds,
    combinedItems,
    clearAll,
  } = useTrackedInventorySummary()
  const toast = useToast()

  // Don't render if no player is selected
  if (!player) return null

  if (loading) {
    return (
      <Box p={4} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
        <Text color="gray.600" textAlign="center">
          Loading tracked inventories...
        </Text>
      </Box>
    )
  }

  if (error) {
    return (
      <Box p={4} bg="red.50" borderRadius="md" border="1px solid" borderColor="red.200">
        <Text color="red.600" textAlign="center">
          Error loading inventories: {error}
        </Text>
      </Box>
    )
  }

  const handleClearAll = () => {
    clearAll()
    toast({
      title: "Tracking Cleared",
      description: "All inventory tracking has been removed",
      status: "success",
      duration: 3000,
      isClosable: true,
    })
  }

  if (trackedInventoryIds.size === 0) {
    return (
      <Box
        p={6}
        bg="gray.50"
        borderRadius="lg"
        border="1px solid"
        borderColor="gray.200"
        textAlign="center"
      >
        <VStack spacing={3}>
          <Text fontSize="2xl" mb={1}>
            📦
          </Text>
          <Text color="gray.600" fontSize="lg" fontWeight="semibold">
            No Inventories Tracked Yet
          </Text>
          <Text color="gray.500" fontSize="sm" maxW="md">
            Start tracking your personal inventories and claim storages to see a unified view of all
            your items organized by tier.
          </Text>
          <VStack spacing={2} mt={3}>
            <Text color="gray.400" fontSize="sm" fontWeight="medium">
              Quick Actions:
            </Text>
            <HStack spacing={2}>
              <Button as="a" href="/inventory" size="sm" colorScheme="blue" variant="outline">
                Track Personal Inventories
              </Button>
              <Button
                as="a"
                href="/claim-inventories"
                size="sm"
                colorScheme="purple"
                variant="outline"
              >
                Track Claim Inventories
              </Button>
            </HStack>
          </VStack>
        </VStack>
      </Box>
    )
  }

  if (combinedItems.length === 0) {
    return (
      <Box p={4} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
        <Text color="gray.600" textAlign="center">
          No items found in tracked inventories
        </Text>
      </Box>
    )
  }

  // Convert combined items to format expected by InventoryTierTable
  const inventoryItems = combinedItems.map((item: CombinedInventoryItem) => ({
    itemId: item.itemId,
    name: item.name,
    category: item.category,
    tier: item.tier,
    quantity: item.totalQuantity,
  }))

  return (
    <Box>
      <VStack spacing={3} align="stretch">
        <HStack justify="space-between" align="center" mb={2}>
          <Text fontSize="xl" fontWeight="bold">
            Detailed Inventory Breakdown
          </Text>
          <Button size="sm" variant="outline" colorScheme="red" onClick={handleClearAll}>
            Clear All Tracking
          </Button>
        </HStack>

        <InventoryTierTable items={inventoryItems} />
      </VStack>
    </Box>
  )
}
