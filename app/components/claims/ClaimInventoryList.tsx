import {
  VStack,
  Box,
  Text,
  Checkbox,
  Collapse,
  Badge,
  HStack,
  Card,
  CardBody,
  Icon,
  Button,
  useToast,
} from "@chakra-ui/react"
import { useState } from "react"
import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons"
import type { ClaimInventory } from "~/types/inventory"
import { InventoryContents } from "~/components/inventory/InventoryContents"
import { usePlayerInventoryTracking } from "~/hooks/usePlayerInventoryTracking"
import { useSelectedPlayer } from "~/hooks/useSelectedPlayer"
import { getSnapshotAge } from "~/utils/inventory-snapshot"

interface ClaimInventoryListProps {
  inventories: ClaimInventory[]
  viewMode?: "list" | "tier"
}

export function ClaimInventoryList({ inventories, viewMode = "list" }: ClaimInventoryListProps) {
  const { player } = useSelectedPlayer()
  const { isTracked, trackInventory, untrackInventory, refreshSnapshot, getSnapshot } =
    usePlayerInventoryTracking(player?.entityId || null)
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

  const handleRefreshSnapshot = async (inventory: ClaimInventory) => {
    if (!player?.entityId) {
      toast({
        title: "No Player Selected",
        description: "Please select a player first",
        status: "warning",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      await refreshSnapshot(inventory.id, inventory, "claim")
      toast({
        title: "Snapshot Refreshed",
        description: `${inventory.name} data has been updated`,
        status: "success",
        duration: 2000,
        isClosable: true,
      })
    } catch (error) {
      console.error("Failed to refresh snapshot:", error)
      toast({
        title: "Error",
        description: "Failed to refresh snapshot",
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
        const snapshotAge = snapshot ? getSnapshotAge(snapshot) : null

        return (
          <Card
            key={inventory.id}
            bg="rgba(24, 35, 60, 0.9)"
            border="1px solid"
            borderColor={tracked ? "teal.300" : "rgba(148, 163, 184, 0.35)"}
            backdropFilter="blur(12px)"
            boxShadow="xl"
            _hover={{
              borderColor: tracked ? "teal.200" : "rgba(148, 163, 184, 0.55)",
              transform: "translateY(-2px)",
            }}
            transition="all 0.2s"
          >
            <CardBody p={4}>
              <HStack justify="space-between" align="center" mb={isExpanded ? 4 : 0}>
                <HStack spacing={4} flex={1}>
                  <Checkbox
                    isChecked={tracked}
                    onChange={(e) => handleTrackingChange(inventory, e.target.checked)}
                    colorScheme="teal"
                    size="lg"
                  />
                  <VStack align="start" spacing={1} flex={1}>
                    <HStack spacing={3} align="center">
                      <Text fontWeight="semibold" fontSize="md" color="white">
                        {inventory.name}
                      </Text>
                      {inventory.buildingName && (
                        <Badge
                          variant="subtle"
                          colorScheme="purple"
                          fontSize="xs"
                          bg="rgba(192, 132, 252, 0.16)"
                          color="purple.100"
                        >
                          {inventory.buildingName}
                        </Badge>
                      )}
                    </HStack>
                    <HStack spacing={2}>
                      <Badge
                        variant="subtle"
                        colorScheme={inventory.items.length > 0 ? "teal" : "gray"}
                        fontSize="xs"
                        bg={
                          inventory.items.length > 0
                            ? "rgba(45, 212, 191, 0.12)"
                            : "rgba(148, 163, 184, 0.18)"
                        }
                        color={inventory.items.length > 0 ? "teal.100" : "whiteAlpha.700"}
                      >
                        {inventory.items.length} items
                      </Badge>
                      {inventory.claimName && (
                        <Badge
                          variant="subtle"
                          colorScheme="teal"
                          fontSize="xs"
                          bg="rgba(45, 212, 191, 0.12)"
                          color="teal.100"
                        >
                          {inventory.claimName}
                        </Badge>
                      )}
                      {tracked && (
                        <Badge variant="solid" colorScheme="teal" fontSize="xs">
                          Tracked
                        </Badge>
                      )}
                      {snapshotAge && (
                        <Badge
                          variant="subtle"
                          colorScheme="blue"
                          fontSize="xs"
                          bg="rgba(59, 130, 246, 0.15)"
                          color="blue.100"
                        >
                          {snapshotAge}
                        </Badge>
                      )}
                    </HStack>
                  </VStack>
                </HStack>

                <HStack spacing={2}>
                  {tracked && snapshot && (
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="blue"
                      onClick={() => handleRefreshSnapshot(inventory)}
                      _hover={{ bg: "rgba(59, 130, 246, 0.12)" }}
                    >
                      Refresh
                    </Button>
                  )}
                  <Button
                    size="xs"
                    variant="ghost"
                    colorScheme="teal"
                    onClick={() => handleViewModeToggle(inventory.id)}
                    _hover={{ bg: "rgba(45, 212, 191, 0.12)" }}
                  >
                    {inventoryViewModes[inventory.id] === "tier" ? "List" : "Tier"}
                  </Button>
                  <HStack
                    as="button"
                    spacing={2}
                    color="teal.200"
                    fontSize="sm"
                    onClick={() => handleExpandToggle(inventory.id)}
                    _hover={{
                      color: "teal.100",
                      bg: "rgba(45, 212, 191, 0.12)",
                    }}
                    px={3}
                    py={2}
                    borderRadius="md"
                    transition="all 0.2s"
                  >
                    <Text fontWeight="medium">{isExpanded ? "Collapse" : "Expand"}</Text>
                    <Icon as={isExpanded ? ChevronDownIcon : ChevronRightIcon} boxSize={4} />
                  </HStack>
                </HStack>
              </HStack>

              <Collapse in={isExpanded} animateOpacity>
                <Box mt={4} pt={4} borderTop="1px solid" borderColor="whiteAlpha.200">
                  <InventoryContents items={inventory.items} viewMode={inventoryViewModes[inventory.id] || "list"} />
                </Box>
              </Collapse>
            </CardBody>
          </Card>
        )
      })}
    </VStack>
  )
}
