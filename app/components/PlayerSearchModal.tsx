import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, FormControl, FormLabel, Input, VStack, Checkbox, useToast, Divider,
  Spinner, Text, useDisclosure
} from "@chakra-ui/react";
import { useState, useCallback, useEffect } from "react";
import type { Item } from "~/types/recipes";
import type { PlayerInventoryResponse } from "~/routes/api.player.inventory";
import { InventoryReviewModal } from "./InventoryReviewModal";

interface PlayerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyInventory: (inventory: PlayerInventoryResponse) => void;
  itemMap: Map<string, Item>;
}

export function PlayerSearchModal({
  isOpen,
  onClose,
  onApplyInventory,
  itemMap,
}: PlayerSearchModalProps) {
  const toast = useToast();
  const [playerName, setPlayerName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSources, setIsFetchingSources] = useState(false);
  const [availableInventories, setAvailableInventories] = useState<string[]>([]);
  const [selectedInventories, setSelectedInventories] = useState<Set<string>>(new Set());
  const [fetchedInventory, setFetchedInventory] = useState<PlayerInventoryResponse | null>(null);
  const { isOpen: isReviewOpen, onOpen: onOpenReview, onClose: onReviewClose } = useDisclosure();

  const handleFetchSources = useCallback(async () => {
    if (!playerName) return;
    setIsFetchingSources(true);
    setAvailableInventories([]);
    try {
      const response = await fetch(`/api/player/inventory?playerName=${encodeURIComponent(playerName)}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch inventory sources");
      }
      const data: PlayerInventoryResponse = await response.json();
      const sources = Object.keys(data.inventories).sort();
      setAvailableInventories(sources);
      setSelectedInventories(new Set(sources)); // Select all by default
    } catch (error: any) {
      toast({ title: "Error", description: error.message, status: "error", duration: 5000, isClosable: true });
    } finally {
      setIsFetchingSources(false);
    }
  }, [playerName, toast]);

  const handleApplySelected = useCallback(async () => {
    if (!playerName || selectedInventories.size === 0) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ playerName });
      selectedInventories.forEach(inv => params.append("inventoryTypes", inv));
      const response = await fetch(`/api/player/inventory?${params.toString()}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch inventory details");
      }
      const data: PlayerInventoryResponse = await response.json();
      setFetchedInventory(data);
      onOpenReview();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, status: "error", duration: 5000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  }, [playerName, selectedInventories, toast, onOpenReview]);

  const handleApplyFromReview = (inventory: PlayerInventoryResponse) => {
    onApplyInventory(inventory);
    onReviewClose();
    onClose(); // Close the main modal as well
  };
  
  const handleMainClose = () => {
    onClose();
  }

  // Reset state when modal opens/closes or player name changes
  useEffect(() => {
    if (!isOpen) {
      setPlayerName("");
      setAvailableInventories([]);
      setSelectedInventories(new Set());
      setFetchedInventory(null);
    }
  }, [isOpen]);

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleMainClose} size="md" isCentered>
        <ModalOverlay />
        <ModalContent bg="surface.primary">
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
                    setPlayerName(e.target.value);
                    setAvailableInventories([]);
                    setSelectedInventories(new Set());
                  }}
                />
              </FormControl>
              <Divider />
              <FormControl>
                <FormLabel>Inventory Sources</FormLabel>
                {isFetchingSources ? (
                  <Spinner />
                ) : availableInventories.length > 0 ? (
                  <VStack as="div" spacing={2} align="stretch" maxHeight="200px" overflowY="auto" p={2} bg="surface.secondary" borderRadius="md">
                    {availableInventories.map((inv) => (
                      <Checkbox
                        key={inv}
                        isChecked={selectedInventories.has(inv)}
                        onChange={(e) => {
                          const newSelection = new Set(selectedInventories);
                          if (e.target.checked) newSelection.add(inv); else newSelection.delete(inv);
                          setSelectedInventories(newSelection);
                        }}
                      >
                        {inv}
                      </Checkbox>
                    ))}
                  </VStack>
                ) : (
                  <Text color="text.muted">Click 'Fetch Sources' to begin.</Text>
                )}
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter borderTop="1px solid" borderColor="border.secondary">
            <Button variant="ghost" mr={3} onClick={handleMainClose}>
              Cancel
            </Button>
            {availableInventories.length === 0 ? (
              <Button colorScheme="blue" onClick={handleFetchSources} isLoading={isFetchingSources} isDisabled={!playerName}>
                Fetch Sources
              </Button>
            ) : (
              <Button colorScheme="green" onClick={handleApplySelected} isLoading={isLoading} isDisabled={selectedInventories.size === 0}>
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
  );
}
