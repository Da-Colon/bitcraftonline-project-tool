import { Box, Text, VStack, Badge, HStack, Divider, Button, useToast } from "@chakra-ui/react"
import { usePlayerInventories } from "~/hooks/usePlayerInventories"
import { useClaimInventories } from "~/hooks/useClaimInventories"
import { useTrackedInventories } from "~/hooks/useTrackedInventories"
import { useSelectedPlayer } from "~/hooks/useSelectedPlayer"
import { useSelectedClaim } from "~/hooks/useSelectedClaim"
import { combineAllTrackedInventories } from "~/utils/combineAllTrackedInventories"
import { InventoryTierTable } from "~/components/InventoryTierTable"
import type { CombinedInventoryItem } from "~/utils/combineAllTrackedInventories"

export function TrackedInventoryView() {
  const { player } = useSelectedPlayer()
  const { claim } = useSelectedClaim()
  const {
    inventories: playerInventories,
    loading: playerLoading,
    error: playerError,
  } = usePlayerInventories(player?.entityId)
  const {
    inventories: claimInventories,
    loading: claimLoading,
    error: claimError,
  } = useClaimInventories(claim?.claimId)
  const { trackedInventories, clearAll } = useTrackedInventories()
  const toast = useToast()

  // Don't render if no player is selected
  if (!player) return null

  const loading = playerLoading || claimLoading
  const error = playerError || claimError

  if (loading) {
    return (
      <Box p={6} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
        <Text color="gray.600" textAlign="center">
          Loading tracked inventories...
        </Text>
      </Box>
    )
  }

  if (error) {
    return (
      <Box p={6} bg="red.50" borderRadius="md" border="1px solid" borderColor="red.200">
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

  if (trackedInventories.size === 0) {
    return (
      <Box
        p={8}
        bg="gray.50"
        borderRadius="lg"
        border="1px solid"
        borderColor="gray.200"
        textAlign="center"
      >
        <VStack spacing={4}>
          <Text fontSize="2xl" mb={2}>
            📦
          </Text>
          <Text color="gray.600" fontSize="xl" fontWeight="semibold">
            No Inventories Tracked Yet
          </Text>
          <Text color="gray.500" fontSize="md" maxW="md">
            Start tracking your personal inventories and claim storages to see a unified view of all
            your items organized by tier.
          </Text>
          <VStack spacing={2} mt={4}>
            <Text color="gray.400" fontSize="sm" fontWeight="medium">
              Quick Actions:
            </Text>
            <HStack spacing={3}>
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

  const combinedItems = combineAllTrackedInventories(
    playerInventories || { personal: [], banks: [], storage: [], recovery: [] },
    claimInventories,
    trackedInventories
  )

  if (combinedItems.length === 0) {
    return (
      <Box p={6} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
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

  const totalItems = combinedItems.reduce(
    (sum: number, item: CombinedInventoryItem) => sum + item.totalQuantity,
    0
  )

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <Box>
          <HStack justify="space-between" align="center" mb={4}>
            <Text fontSize="xl" fontWeight="bold">
              Detailed Inventory Breakdown
            </Text>
            <Button size="sm" variant="outline" colorScheme="red" onClick={handleClearAll}>
              Clear All Tracking
            </Button>
          </HStack>
        </Box>

        <InventoryTierTable items={inventoryItems} />
      </VStack>
    </Box>
  )
}
