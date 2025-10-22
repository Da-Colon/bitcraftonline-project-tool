import {
  VStack,
  Box,
  Text,
  useToast,
} from "@chakra-ui/react"
import { useState } from "react"

import { InventoryCardBase } from "~/components/inventory/InventoryCardBase"
import { useSharedPlayerInventoryTracking } from "~/contexts/PlayerInventoryTrackingContext"
import { useSelectedPlayer } from "~/hooks/useSelectedPlayer"
import type { ClaimInventory } from "~/types/inventory"

interface ClaimInventoryListProps {
  inventories: ClaimInventory[]
  viewMode?: "list" | "tier"
}

export function ClaimInventoryList({ inventories, viewMode = "list" }: ClaimInventoryListProps) {
  const { player } = useSelectedPlayer()
  const { isTracked, trackInventory, untrackInventory, getSnapshot } =
    useSharedPlayerInventoryTracking()
  const [expandedInventories, setExpandedInventories] = useState<Set<string>>(new Set())
  const [inventoryViewModes, setInventoryViewModes] = useState<Record<string, "list" | "tier">>({})
  const toast = useToast()

  const handleTrackingChange = async (inventory: ClaimInventory, checked: boolean) => {
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
        await trackInventory(inventory, "claim")
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
    } catch (error) {
      console.error("Failed to track/untrack inventory:", error)
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

  if (!inventories || inventories.length === 0) {
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
            🏗️
          </Text>
          <Text color="white" fontSize="xl" fontWeight="semibold">
            No Buildings Found
          </Text>
          <Text color="whiteAlpha.800" fontSize="md" maxW="md">
            This claim has no accessible building inventories. Buildings may be private or have no
            storage containers.
          </Text>
        </VStack>
      </Box>
    )
  }

  return (
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
            snapshot={snapshot}
            expanded={isExpanded}
            viewMode={inventoryViewModes[inventory.id] || "list"}
            onTrackingChange={(checked) => handleTrackingChange(inventory, checked)}
            onExpandToggle={() => handleExpandToggle(inventory.id)}
            onViewModeToggle={() => handleViewModeToggle(inventory.id)}
            showClaimBadge={false}
          />
        )
      })}
    </VStack>
  )
}
