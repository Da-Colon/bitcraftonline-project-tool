import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Checkbox,
  useToast,
  Divider,
  Spinner,
  Text,
  useDisclosure,
  Alert,
  AlertIcon,
} from "@chakra-ui/react"
import { useState, useCallback, useEffect } from "react"

import { InventoryReviewModal } from "~/components/inventory/InventoryReviewModal"
import { usePlayerInventorySelections } from "~/hooks/usePlayerInventorySelections"
import type { PlayerInventoryResponse } from "~/routes/api.player.inventory"
import type { Item } from "~/types/recipes"

interface PlayerSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onApplyInventory: (inventory: PlayerInventoryResponse) => void
  itemMap: Map<string, Item>
}

export function PlayerSearchModal({
  isOpen,
  onClose,
  onApplyInventory,
  itemMap,
}: PlayerSearchModalProps) {
  const toast = useToast()
  const [playerName, setPlayerName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingSources, setIsFetchingSources] = useState(false)
  const [availableInventories, setAvailableInventories] = useState<string[]>([])
  const [selectedInventories, setSelectedInventories] = useState<Set<string>>(new Set())
  const [fetchedInventory, setFetchedInventory] = useState<PlayerInventoryResponse | null>(null)
  const { isOpen: isReviewOpen, onOpen: onOpenReview, onClose: onReviewClose } = useDisclosure()

  // Persistent inventory selections
  const { getPlayerSelections, updatePlayerSelections, areSelectionsStale } =
    usePlayerInventorySelections()

  const handleFetchSources = useCallback(async () => {
    if (!playerName) return
    setIsFetchingSources(true)
    setAvailableInventories([])
    try {
      const response = await fetch(
        `/api/player/inventory?playerName=${encodeURIComponent(playerName)}`
      )
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch inventory sources")
      }
      const data: PlayerInventoryResponse = await response.json()
      const sources = Object.keys(data.inventories).sort()
      setAvailableInventories(sources)

      // Check for existing selections or use defaults
      const existingSelections = getPlayerSelections(playerName)
      if (existingSelections && !areSelectionsStale(playerName)) {
        // Use saved selections if they're not stale and match available sources
        const validSelections = existingSelections.selectedInventories.filter((inv) =>
          sources.includes(inv)
        )
        setSelectedInventories(new Set(validSelections.length > 0 ? validSelections : sources))
      } else {
        // Select all by default for new/stale selections
        setSelectedInventories(new Set(sources))
      }

      // Update stored selections with fresh data
      updatePlayerSelections(playerName, {
        availableInventories: sources,
        selectedInventories:
          existingSelections && !areSelectionsStale(playerName)
            ? existingSelections.selectedInventories.filter((inv) => sources.includes(inv))
            : sources,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsFetchingSources(false)
    }
  }, [playerName, toast, getPlayerSelections, areSelectionsStale, updatePlayerSelections])

  const handleApplySelected = useCallback(async () => {
    if (!playerName || selectedInventories.size === 0) return
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ playerName })
      selectedInventories.forEach((inv) => params.append("inventoryTypes", inv))
      const response = await fetch(`/api/player/inventory?${params.toString()}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch inventory details")
      }
      const data: PlayerInventoryResponse = await response.json()
      setFetchedInventory(data)

      // Save current selections to localStorage
      updatePlayerSelections(playerName, {
        selectedInventories: Array.from(selectedInventories),
      })

      onOpenReview()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }, [playerName, selectedInventories, toast, onOpenReview, updatePlayerSelections])

  const handleApplyFromReview = (inventory: PlayerInventoryResponse) => {
    onApplyInventory(inventory)
    onReviewClose()
    onClose() // Close the main modal as well
  }

  const handleMainClose = () => {
    onClose()
  }

  // Load saved selections when player name changes
  useEffect(() => {
    if (playerName && availableInventories.length === 0) {
      // Check if we have saved selections for this player
      const existingSelections = getPlayerSelections(playerName)
      if (existingSelections && !areSelectionsStale(playerName)) {
        setAvailableInventories(existingSelections.availableInventories)
        setSelectedInventories(new Set(existingSelections.selectedInventories))
      }
    }
  }, [playerName, availableInventories.length, getPlayerSelections, areSelectionsStale])

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setPlayerName("")
      setAvailableInventories([])
      setSelectedInventories(new Set())
      setFetchedInventory(null)
    }
  }, [isOpen])

  // Handle inventory selection changes and persist them
  const handleInventorySelectionChange = useCallback(
    (inventory: string, checked: boolean) => {
      const newSelection = new Set(selectedInventories)
      if (checked) {
        newSelection.add(inventory)
      } else {
        newSelection.delete(inventory)
      }
      setSelectedInventories(newSelection)

      // Persist selection change immediately
      if (playerName && availableInventories.length > 0) {
        updatePlayerSelections(playerName, {
          selectedInventories: Array.from(newSelection),
        })
      }
    },
    [selectedInventories, playerName, availableInventories.length, updatePlayerSelections]
  )

  // Check if selections are stale for UI feedback
  const selectionsAreStale = playerName ? areSelectionsStale(playerName) : false

  // Handle Enter key press on input field
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (availableInventories.length === 0 && playerName) {
        handleFetchSources()
      } else if (availableInventories.length > 0 && selectedInventories.size > 0) {
        handleApplySelected()
      }
    }
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleMainClose} size="md" isCentered>
        <ModalOverlay />
        <ModalContent bg="white">
          <ModalHeader>Auto-fill from Player Inventory</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Player Name</FormLabel>
                <Input
                  placeholder="Enter exact player name..."
                  value={playerName}
                  onChange={(e) => {
                    setPlayerName(e.target.value)
                    setAvailableInventories([])
                    setSelectedInventories(new Set())
                  }}
                  onKeyDown={handleKeyDown}
                />
              </FormControl>
              <Divider />
              <FormControl>
                <FormLabel>Inventory Sources</FormLabel>
                {selectionsAreStale && availableInventories.length > 0 && (
                  <Alert status="warning" size="sm" mb={2}>
                    <AlertIcon />
                    <Text fontSize="sm">
                      Saved selections are over 24 hours old. Consider refreshing.
                    </Text>
                  </Alert>
                )}
                {isFetchingSources ? (
                  <Spinner />
                ) : availableInventories.length > 0 ? (
                  <VStack
                    as="div"
                    spacing={2}
                    align="stretch"
                    maxHeight="200px"
                    overflowY="auto"
                    p={2}
                    bg="gray.50"
                    borderRadius="md"
                  >
                    {availableInventories.map((inv) => (
                      <Checkbox
                        key={inv}
                        isChecked={selectedInventories.has(inv)}
                        onChange={(e) => handleInventorySelectionChange(inv, e.target.checked)}
                      >
                        {inv}
                      </Checkbox>
                    ))}
                  </VStack>
                ) : (
                  <Text color="gray.500">Click 'Fetch Sources' to begin.</Text>
                )}
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter borderTop="1px solid" borderColor="gray.200">
            <Button variant="ghost" mr={3} onClick={handleMainClose}>
              Cancel
            </Button>
            {availableInventories.length === 0 ? (
              <Button
                colorScheme="blue"
                onClick={handleFetchSources}
                isLoading={isFetchingSources}
                isDisabled={!playerName}
              >
                Fetch Sources
              </Button>
            ) : (
              <Button
                colorScheme="green"
                onClick={handleApplySelected}
                isLoading={isLoading}
                isDisabled={selectedInventories.size === 0}
              >
                Apply Selected
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      <InventoryReviewModal
        isOpen={isReviewOpen}
        onClose={onReviewClose}
        inventoryData={fetchedInventory}
        itemMap={itemMap}
        onApply={handleApplyFromReview}
      />
    </>
  )
}
