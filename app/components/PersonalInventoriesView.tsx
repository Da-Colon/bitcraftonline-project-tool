import {
  Box,
  Text,
  VStack,
  Spinner,
  Alert,
  AlertIcon,
  HStack,
  Button,
  Heading,
  Divider,
  useToast,
} from "@chakra-ui/react"
import { useState } from "react"
import { useSelectedPlayer } from "~/hooks/useSelectedPlayer"
import { usePlayerInventories } from "~/hooks/usePlayerInventories"
import { useTrackedInventories } from "~/hooks/useTrackedInventories"
import { InventoryList } from "~/components/InventoryList"
import { InventoryOverview } from "~/components/InventoryOverview"

type InventoryViewType = "list" | "tier"

export function PersonalInventoriesView() {
  const { player } = useSelectedPlayer()
  const { inventories, loading, error } = usePlayerInventories(player?.entityId)
  const { trackedInventories, trackAll, untrackAll } = useTrackedInventories()
  const [viewType, setViewType] = useState<InventoryViewType>("list")
  const toast = useToast()

  if (loading) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="lg" />
        <Text mt={4} color="text.muted">
          Loading inventories...
        </Text>
      </Box>
    )
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        Failed to load inventories: {error}
      </Alert>
    )
  }

  if (!inventories) {
    return (
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>
            Personal Inventories
          </Heading>
          <Text color="gray.600">
            Manage and track your personal inventories, banks, storage containers, recovery chests,
            and housing inventories.
          </Text>
        </Box>
        <Box
          p={8}
          textAlign="center"
          bg="gray.50"
          borderRadius="lg"
          border="1px solid"
          borderColor="gray.200"
        >
          <Text fontSize="2xl" mb={2}>
            📦
          </Text>
          <Text color="gray.600" fontSize="xl" fontWeight="semibold" mb={2}>
            No Inventory Data Available
          </Text>
          <Text color="gray.500" fontSize="md">
            Unable to load your inventory data. Please try refreshing the page or check your
            connection.
          </Text>
        </Box>
      </VStack>
    )
  }

  // Calculate tracked count
  const allInventories = [
    ...(inventories.personal || []),
    ...(inventories.banks || []),
    ...(inventories.storage || []),
    ...(inventories.recovery || []),
    ...(inventories.housing || []),
  ]
  const trackedCount = allInventories.filter((inv) => trackedInventories.has(inv.id)).length

  const handleTrackAll = () => {
    const allIds = allInventories.map((inv) => inv.id)
    trackAll(allIds)
    toast({
      title: "All Inventories Tracked",
      description: `Now tracking ${allIds.length} inventories`,
      status: "success",
      duration: 3000,
      isClosable: true,
    })
  }

  const handleUntrackAll = () => {
    untrackAll()
    toast({
      title: "All Tracking Cleared",
      description: "No inventories are being tracked",
      status: "info",
      duration: 3000,
      isClosable: true,
    })
  }

  return (
    <VStack spacing={8} align="stretch">
      {/* Page Header */}
      <Box>
        <Heading size="lg" mb={2}>
          Personal Inventories
        </Heading>
        <Text color="gray.600">
          Manage and track your personal inventories, banks, storage containers, recovery chests,
          and housing inventories. Tracked inventories appear in your dashboard and can be used for
          recipe calculations.
        </Text>
      </Box>

      {/* Overview Section */}
      <InventoryOverview
        inventories={inventories}
        trackedCount={trackedCount}
        onTrackAll={handleTrackAll}
        onUntrackAll={handleUntrackAll}
      />

      {/* Divider */}
      <Divider />

      {/* Inventory Management Section */}
      <Box>
        <HStack justify="space-between" align="center" mb={4}>
          <Text fontSize="xl" fontWeight="bold">
            Inventory Management
          </Text>
          <HStack spacing={2}>
            <Button
              size="sm"
              variant={viewType === "list" ? "solid" : "outline"}
              onClick={() => setViewType("list")}
            >
              List View
            </Button>
            <Button
              size="sm"
              variant={viewType === "tier" ? "solid" : "outline"}
              onClick={() => setViewType("tier")}
            >
              Tier View
            </Button>
          </HStack>
        </HStack>
        <Text color="gray.600" mb={6}>
          {viewType === "list"
            ? "Select inventories to track. Use the checkboxes to add or remove inventories from tracking."
            : "View items grouped by category and tier within each inventory for better organization."}
        </Text>
      </Box>

      <InventoryList inventories={inventories} viewMode={viewType} />
    </VStack>
  )
}
