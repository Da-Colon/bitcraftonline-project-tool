import {
  Box,
  Text,
  VStack,
  Spinner,
  HStack,
  Button,
  Heading,
  Divider,
  useToast,
  Input,
  InputGroup,
  InputLeftElement,
  Badge,
} from "@chakra-ui/react"
import { SearchIcon, CloseIcon } from "@chakra-ui/icons"
import { useState } from "react"
import { useSelectedPlayer } from "~/hooks/useSelectedPlayer"
import { usePlayerInventories } from "~/hooks/usePlayerInventories"
import { usePlayerInventoryTracking } from "~/hooks/usePlayerInventoryTracking"
import { InventoryList } from "./InventoryList"
import { InventoryOverview } from "./InventoryOverview"
import { useDebounce } from "~/hooks/useDebounce"
import type { Inventory } from "~/types/inventory"

export function PersonalInventoriesView() {
  const { player } = useSelectedPlayer()
  const { inventories, loading, error } = usePlayerInventories(player?.entityId)
  const {
    snapshots,
    trackInventory,
    untrackInventory,
    trackInventories,
    untrackAll,
    isTracked,
    isLoading: trackingLoading,
    error: trackingError,
  } = usePlayerInventoryTracking(player?.entityId || null)
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const toast = useToast()

  // Filter inventories by item name
  const filterInventoriesByItem = (
    inventories: Inventory[] | undefined,
    query: string
  ): Inventory[] => {
    if (!inventories || !query.trim()) return inventories || []

    const lowercaseQuery = query.toLowerCase()
    return inventories.filter((inventory) =>
      inventory.items.some((item) => item.name?.toLowerCase().includes(lowercaseQuery))
    )
  }

  if (loading) {
    return (
      <Box
        textAlign="center"
        bg="rgba(24, 35, 60, 0.9)"
        border="1px solid rgba(148, 163, 184, 0.35)"
        borderRadius={{ base: "2xl", md: "3xl" }}
        px={{ base: 6, md: 8 }}
        py={{ base: 8, md: 10 }}
      >
        <Spinner size="lg" color="teal.300" />
        <Text mt={4} color="whiteAlpha.800">
          Loading inventories...
        </Text>
      </Box>
    )
  }

  if (error) {
    return (
      <Box
        bg="rgba(63, 34, 53, 0.85)"
        border="1px solid rgba(248, 180, 217, 0.35)"
        borderRadius={{ base: "2xl", md: "3xl" }}
        px={{ base: 6, md: 8 }}
        py={{ base: 8, md: 10 }}
      >
        <VStack spacing={3} align="center">
          <Text fontSize="2xl">⚠️</Text>
          <Text color="pink.200" fontWeight="semibold">
            Failed to load inventories
          </Text>
          <Text color="whiteAlpha.800" textAlign="center">
            {error}
          </Text>
        </VStack>
      </Box>
    )
  }

  if (!inventories) {
    return (
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" mb={2} color="white">
            Personal Inventories
          </Heading>
          <Text color="whiteAlpha.800">
            Manage and track your personal inventories, banks, storage containers, recovery chests,
            and housing inventories.
          </Text>
        </Box>
        <Box
          p={8}
          textAlign="center"
          bg="rgba(24, 35, 60, 0.9)"
          borderRadius={{ base: "2xl", md: "3xl" }}
          border="1px solid rgba(148, 163, 184, 0.35)"
        >
          <Text fontSize="2xl" mb={2}>
            📦
          </Text>
          <Text color="white" fontSize="xl" fontWeight="semibold" mb={2}>
            No Inventory Data Available
          </Text>
          <Text color="whiteAlpha.800" fontSize="md">
            Unable to load your inventory data. Please try refreshing the page or check your
            connection.
          </Text>
        </Box>
      </VStack>
    )
  }

  // Filter inventories based on search query
  const filteredInventories = {
    personal: filterInventoriesByItem(inventories.personal, debouncedSearchQuery),
    banks: filterInventoriesByItem(inventories.banks, debouncedSearchQuery),
    storage: filterInventoriesByItem(inventories.storage, debouncedSearchQuery),
    recovery: filterInventoriesByItem(inventories.recovery, debouncedSearchQuery),
    housing: filterInventoriesByItem(inventories.housing, debouncedSearchQuery),
  }

  // Calculate tracked count
  const allInventories = [
    ...(inventories.personal || []),
    ...(inventories.banks || []),
    ...(inventories.storage || []),
    ...(inventories.recovery || []),
    ...(inventories.housing || []),
  ]
  const trackedCount = allInventories.filter((inv) => isTracked(inv.id)).length

  // Calculate filtered count for display
  const allFilteredInventories = [
    ...filteredInventories.personal,
    ...filteredInventories.banks,
    ...filteredInventories.storage,
    ...filteredInventories.recovery,
    ...filteredInventories.housing,
  ]
  const isSearchActive = debouncedSearchQuery.trim().length > 0

  const handleTrackAll = async () => {
    try {
      const personalInventories = inventories.personal || []
      const bankInventories = inventories.banks || []
      const storageInventories = inventories.storage || []
      const recoveryInventories = inventories.recovery || []
      const housingInventories = inventories.housing || []

      // Track each type separately with appropriate source
      if (personalInventories.length > 0) {
        await trackInventories(personalInventories, "personal")
      }
      if (bankInventories.length > 0) {
        await trackInventories(bankInventories, "bank")
      }
      if (storageInventories.length > 0) {
        await trackInventories(storageInventories, "storage")
      }
      if (recoveryInventories.length > 0) {
        await trackInventories(recoveryInventories, "recovery")
      }
      if (housingInventories.length > 0) {
        await trackInventories(housingInventories, "housing")
      }

      toast({
        title: "All Inventories Tracked",
        description: `Now tracking ${allInventories.length} inventories`,
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: "Error Tracking Inventories",
        description: "Failed to track some inventories",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleUntrackAll = async () => {
    try {
      await untrackAll()
      toast({
        title: "All Tracking Cleared",
        description: "No inventories are being tracked",
        status: "info",
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: "Error Clearing Tracking",
        description: "Failed to clear tracking",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  return (
    <VStack spacing={8} align="stretch">
      {/* Page Header */}
      <Box>
        <Heading size="lg" mb={2} color="white">
          Personal Inventories
        </Heading>
        <Text color="whiteAlpha.800">
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
      <Divider borderColor="whiteAlpha.200" />

      {/* Inventory Management Section */}
      <Box>
        <Text fontSize="xl" fontWeight="bold" color="white" mb={4}>
          Inventory Management
        </Text>

        {/* Search Input */}
        <Box mb={4}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="whiteAlpha.600" />
            </InputLeftElement>
            <Input
              placeholder="Search for items in inventories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg="rgba(24, 35, 60, 0.9)"
              border="1px solid rgba(148, 163, 184, 0.35)"
              color="white"
              _placeholder={{ color: "whiteAlpha.600" }}
              _focus={{
                borderColor: "teal.300",
                boxShadow: "0 0 0 1px rgba(45, 212, 191, 0.3)",
              }}
              _hover={{
                borderColor: "rgba(148, 163, 184, 0.55)",
              }}
            />
          </InputGroup>

          {/* Search Results Info */}
          {isSearchActive && (
            <HStack mt={2} spacing={3}>
              <Badge
                colorScheme="teal"
                variant="subtle"
                bg="rgba(45, 212, 191, 0.15)"
                color="teal.100"
                px={3}
                py={1}
                borderRadius="full"
              >
                Showing {allFilteredInventories.length} of {allInventories.length} inventories
              </Badge>
              <Button
                size="xs"
                variant="ghost"
                color="whiteAlpha.600"
                leftIcon={<CloseIcon />}
                onClick={() => setSearchQuery("")}
                _hover={{ bg: "whiteAlpha.200", color: "white" }}
              >
                Clear search
              </Button>
            </HStack>
          )}
        </Box>

        <Text color="whiteAlpha.800" mb={6}>
          Select inventories to track. Use the checkboxes to add or remove inventories from tracking.
        </Text>
      </Box>

      <InventoryList
        inventories={filteredInventories}
        isFiltered={isSearchActive}
      />
    </VStack>
  )
}
