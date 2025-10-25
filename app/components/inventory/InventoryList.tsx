import {
  VStack,
  Box,
  Text,
  useToast,
} from "@chakra-ui/react"
import { useState } from "react"


import { useSharedPlayerInventoryTracking } from "~/contexts/PlayerInventoryTrackingContext"
import { useSelectedPlayer } from "~/hooks/useSelectedPlayer"
import type { PlayerInventories, Inventory } from "~/types/inventory"
import type { InventorySource } from "~/types/inventory-tracking"

import { InventoryCardBase } from "./InventoryCardBase"

interface InventoryListProps {
  inventories: PlayerInventories
  isFiltered?: boolean
}

export function InventoryList({
  inventories,
  isFiltered = false,
}: InventoryListProps) {
  const { player } = useSelectedPlayer()
  const { isTracked, trackInventory, untrackInventory, getSnapshot } =
    useSharedPlayerInventoryTracking()
  const [expandedInventories, setExpandedInventories] = useState<Set<string>>(new Set())
  const [inventoryViewModes, setInventoryViewModes] = useState<Record<string, "list" | "tier">>({})
  const toast = useToast()

  const handleTrackingChange = async (inventory: Inventory, source: string, checked: boolean) => {
    // Validate player is selected
    if (!player?.entityId) {
      toast({
        title: "No Player Selected",
        description: "Please select a player before tracking inventories",
        status: "warning",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      if (checked) {
        await trackInventory(inventory, source as InventorySource)
        toast({
          title: "Inventory Tracked",
          description: `${inventory.name} is now being tracked`,
          status: "success",
          duration: 2000,
          isClosable: true,
        })
      } else {
        await untrackInventory(inventory.id)
        toast({
          title: "Inventory Untracked",
          description: `${inventory.name} is no longer tracked`,
          status: "info",
          duration: 2000,
          isClosable: true,
        })
      }
    } catch {
      // console.error("Failed to track/untrack inventory:", error)
      toast({
        title: "Error",
        description: `Failed to ${checked ? "track" : "untrack"} inventory`,
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }


  const handleExpandToggle = (inventoryId: string) => {
    const newExpanded = new Set(expandedInventories)
    if (newExpanded.has(inventoryId)) {
      newExpanded.delete(inventoryId)
    } else {
      newExpanded.add(inventoryId)
    }
    setExpandedInventories(newExpanded)
  }

  const handleViewModeToggle = (inventoryId: string) => {
    const currentMode = inventoryViewModes[inventoryId] || "list"
    const newMode = currentMode === "list" ? "tier" : "list"
    setInventoryViewModes(prev => ({
      ...prev,
      [inventoryId]: newMode
    }))
  }

  const renderInventorySection = (
    title: string,
    inventories: Inventory[] | undefined,
    source: string
  ) => {
    if (!inventories || inventories.length === 0) return null

    return (
      <Box>
        <Text fontSize="lg" fontWeight="semibold" mb={4} color="white">
          {title}
        </Text>
        <VStack spacing={4} align="stretch">
          {inventories.map((inventory) => {
            const isExpanded = expandedInventories.has(inventory.id)
            const tracked = isTracked(inventory.id)
            const snapshot = getSnapshot(inventory.id)

            return (
              <InventoryCardBase
                key={inventory.id}
                inventory={inventory}
                tracked={tracked}
                snapshot={snapshot || null}
                expanded={isExpanded}
                viewMode={inventoryViewModes[inventory.id] || "list"}
                onTrackingChange={(checked) => handleTrackingChange(inventory, source, checked)}
                onExpandToggle={() => handleExpandToggle(inventory.id)}
                onViewModeToggle={() => handleViewModeToggle(inventory.id)}
                showClaimBadge={title === "Banks"}
              />
            )
          })}
        </VStack>
      </Box>
    )
  }

  const hasAnyInventories = [
    inventories.personal,
    inventories.banks,
    inventories.storage,
    inventories.recovery,
    inventories.housing,
  ].some((section) => section && section.length > 0)

  if (!hasAnyInventories) {
    return (
      <Box
        p={8}
        textAlign="center"
        bg="rgba(24, 35, 60, 0.9)"
        borderRadius={{ base: "2xl", md: "3xl" }}
        border="1px solid rgba(148, 163, 184, 0.35)"
        backdropFilter="blur(12px)"
      >
        <VStack spacing={4}>
          <Text fontSize="3xl" mb={2}>
            {isFiltered ? "🔍" : "🎒"}
          </Text>
          <Text color="white" fontSize="xl" fontWeight="semibold">
            {isFiltered ? "No Matching Inventories" : "No Inventories Found"}
          </Text>
          <Text color="whiteAlpha.800" fontSize="md" maxW="md">
            {isFiltered
              ? "No inventories contain items matching your search. Try a different search term or clear the search to see all inventories."
              : "We couldn't find any inventories for this player. This might happen if:"}
          </Text>
          {!isFiltered && (
            <VStack spacing={2} align="start" fontSize="sm" color="whiteAlpha.700">
              <Text>• The player data is still loading</Text>
              <Text>• The player has no accessible inventories</Text>
              <Text>• There&apos;s a temporary connection issue</Text>
            </VStack>
          )}
          <Text fontSize="sm" color="whiteAlpha.600" mt={4}>
            {isFiltered
              ? "Try searching for a different item or clear the search to see all inventories."
              : "Try refreshing the page or checking back later."}
          </Text>
        </VStack>
      </Box>
    )
  }

  return (
    <VStack spacing={8} align="stretch">
      {renderInventorySection("Personal Inventories", inventories.personal, "personal")}
      {renderInventorySection("Storage", inventories.storage, "storage")}
      {renderInventorySection("Housing Inventories", inventories.housing, "housing")}
      {renderInventorySection("Banks", inventories.banks, "bank")}
      {renderInventorySection("Recovery Chests", inventories.recovery, "recovery")}
    </VStack>
  )
}
