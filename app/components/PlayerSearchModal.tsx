import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  VStack,
  HStack,
  Checkbox,
  CheckboxGroup,
  Text,
  Divider,
  Alert,
  AlertIcon,
  Spinner,
  Box,
} from "@chakra-ui/react";
import { useState } from "react";

interface PlayerInventoryType {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface PlayerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyInventory: (playerName: string, selectedInventories: string[]) => Promise<void>;
}

export function PlayerSearchModal({
  isOpen,
  onClose,
  onApplyInventory,
}: PlayerSearchModalProps) {
  const [playerName, setPlayerName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedInventories, setSelectedInventories] = useState<string[]>([
    "house_inventory",
    "personal_banks",
  ]);

  const inventoryTypes: PlayerInventoryType[] = [
    {
      id: "house_inventory",
      label: "House Inventory",
      description: "Items stored in your house storage",
      enabled: true,
    },
    {
      id: "personal_banks",
      label: "Personal Banks",
      description: "Items in your personal bank accounts",
      enabled: true,
    },
    {
      id: "personal_storages",
      label: "Personal Storages",
      description: "Trader stands, boats, and other personal storage",
      enabled: true,
    },
  ];

  const handleApply = async () => {
    if (!playerName.trim()) {
      setError("Please enter a player name");
      return;
    }

    if (selectedInventories.length === 0) {
      setError("Please select at least one inventory type");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onApplyInventory(playerName.trim(), selectedInventories);
      onClose();
      setPlayerName("");
      setSelectedInventories(["house_inventory", "personal_banks"]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load player inventory");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setError(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent bg="surface.primary" borderColor="border.primary" border="1px solid">
        <ModalHeader color="text.primary">Auto-fill from Player Inventory</ModalHeader>
        <ModalCloseButton isDisabled={isLoading} />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel color="text.primary">Player Name</FormLabel>
              <Input
                placeholder="Enter player name..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                isDisabled={isLoading}
                bg="surface.elevated"
                borderColor="border.primary"
                color="text.primary"
                _placeholder={{ color: "text.muted" }}
                _hover={{ borderColor: "border.secondary" }}
                _focus={{ borderColor: "brand.primary", boxShadow: "0 0 0 1px var(--chakra-colors-brand-primary)" }}
              />
              <FormHelperText color="text.muted">
                Enter the exact player name to search for their inventory
              </FormHelperText>
            </FormControl>

            <Divider borderColor="border.primary" />

            <FormControl>
              <FormLabel color="text.primary">Inventory Sources</FormLabel>
              <Text fontSize="sm" color="text.muted" mb={3}>
                Select which inventory sources to include in the calculation
              </Text>
              
              <CheckboxGroup
                value={selectedInventories}
                onChange={(values) => setSelectedInventories(values as string[])}
              >
                <VStack align="stretch" spacing={3}>
                  {inventoryTypes.map((type) => (
                    <Box key={type.id} p={3} bg="surface.elevated" borderRadius="md" border="1px solid" borderColor="border.primary">
                      <Checkbox
                        value={type.id}
                        isDisabled={!type.enabled || isLoading}
                        colorScheme="blue"
                      >
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="medium" color="text.primary">{type.label}</Text>
                          <Text fontSize="sm" color="text.muted">
                            {type.description}
                          </Text>
                        </VStack>
                      </Checkbox>
                    </Box>
                  ))}
                </VStack>
              </CheckboxGroup>
            </FormControl>

            {error && (
              <Alert status="error">
                <AlertIcon />
                {error}
              </Alert>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter bg="surface.primary" borderTop="1px solid" borderColor="border.primary">
          <HStack spacing={3}>
            <Button variant="secondary" onClick={handleClose} isDisabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleApply}
              isLoading={isLoading}
              loadingText="Loading Inventory..."
              leftIcon={isLoading ? <Spinner size="sm" /> : undefined}
            >
              Apply Inventory
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
