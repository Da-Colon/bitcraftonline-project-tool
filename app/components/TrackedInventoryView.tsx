import {
  Badge,
  Box,
  Button,
  HStack,
  Spinner,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react"
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

  const glassPanelStyles = {
    bg: "rgba(24,35,60,0.9)",
    border: "1px solid rgba(148, 163, 184, 0.35)",
    borderRadius: "2xl",
    boxShadow: "xl",
    backdropFilter: "blur(12px)",
  } as const

  // Don't render if no player is selected
  if (!player) return null

  if (loading) {
    return (
      <Box {...glassPanelStyles} p={6} textAlign="center">
        <VStack spacing={3} align="center">
          <Spinner size="md" color="teal.300" />
          <Text color="whiteAlpha.800" fontWeight="medium">
            Loading tracked inventories...
          </Text>
        </VStack>
      </Box>
    )
  }

  if (error) {
    return (
      <Box
        {...glassPanelStyles}
        p={6}
        bg="rgba(190, 24, 93, 0.18)"
        borderColor="rgba(190, 24, 93, 0.5)"
        textAlign="center"
      >
        <VStack spacing={2}>
          <Text color="white" fontWeight="bold">
            Something went wrong
          </Text>
          <Text color="whiteAlpha.800">Error loading inventories: {error}</Text>
        </VStack>
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
        {...glassPanelStyles}
        p={8}
        textAlign="center"
      >
        <VStack spacing={3}>
          <Text fontSize="2xl" mb={1}>
            📦
          </Text>
          <Text color="white" fontSize="lg" fontWeight="semibold">
            No Inventories Tracked Yet
          </Text>
          <Text color="whiteAlpha.800" fontSize="sm" maxW="md">
            Start tracking your personal inventories and claim storages to see a unified view of all
            your items organized by tier.
          </Text>
          <VStack spacing={2} mt={3}>
            <Text color="whiteAlpha.700" fontSize="sm" fontWeight="medium">
              Quick Actions:
            </Text>
            <HStack spacing={2}>
              <Button
                as="a"
                href="/inventory"
                size="sm"
                colorScheme="teal"
                bg="teal.500"
                color="gray.900"
                _hover={{ bg: "teal.400" }}
              >
                Track Personal Inventories
              </Button>
              <Button
                as="a"
                href="/claim-inventories"
                size="sm"
                colorScheme="purple"
                bg="purple.500"
                color="gray.900"
                _hover={{ bg: "purple.400" }}
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
      <Box {...glassPanelStyles} p={6} textAlign="center">
        <VStack spacing={2}>
          <Text color="white" fontWeight="semibold">
            No items found in tracked inventories
          </Text>
          <Text color="whiteAlpha.700" fontSize="sm">
            Add inventories or refresh your selection to sync the latest data.
          </Text>
        </VStack>
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
    <VStack spacing={4} align="stretch">
      <Box {...glassPanelStyles} p={{ base: 4, md: 6 }}>
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between" align="center" flexWrap="wrap" rowGap={2}>
            <Text fontSize="xl" fontWeight="bold" color="white">
              Detailed Inventory Breakdown
            </Text>
            <Button
              size="sm"
              colorScheme="pink"
              bg="pink.500"
              color="gray.900"
              _hover={{ bg: "pink.400" }}
              onClick={handleClearAll}
            >
              Clear All Tracking
            </Button>
          </HStack>

          <HStack spacing={3} flexWrap="wrap">
            <Badge colorScheme="teal" borderRadius="full" px={3} py={1}>
              {trackedInventoryIds.size} inventories tracked
            </Badge>
            <Badge colorScheme="purple" borderRadius="full" px={3} py={1}>
              {combinedItems.length.toLocaleString()} unique items
            </Badge>
          </HStack>

          <Text color="whiteAlpha.800" fontSize="sm">
            Review your synced inventories tier by tier. Values update automatically whenever your
            tracked sources change.
          </Text>
        </VStack>
      </Box>

      <InventoryTierTable items={inventoryItems} />
    </VStack>
  )
}
