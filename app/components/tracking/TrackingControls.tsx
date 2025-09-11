/**
 * Tracking Controls Component
 * Action buttons for managing tracking state (Auto-fill, Reset, Export, etc.)
 */
import {
  HStack,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
} from "@chakra-ui/react";
import { ChevronDownIcon, SettingsIcon, DownloadIcon, DeleteIcon } from "@chakra-ui/icons";
import { PlayerSearchModal } from "~/components/PlayerSearchModal";
import type { PlayerInventoryResponse } from "~/routes/api.player.inventory";
import type { Item } from "~/types/recipes";

interface TrackingControlsProps {
  onAutoFillCompleted: () => void;
  onResetAllTracking: () => void;
  onApplyPlayerInventory: (inventory: PlayerInventoryResponse) => void;
  itemMap: Map<string, Item>;
}

export function TrackingControls({
  onAutoFillCompleted,
  onResetAllTracking,
  onApplyPlayerInventory,
  itemMap,
}: TrackingControlsProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleApplyPlayerInventory = (inventory: PlayerInventoryResponse) => {
    onApplyPlayerInventory(inventory);
  };

  return (
    <>
      <HStack spacing={2} flexWrap="wrap">
        <Menu>
          <MenuButton as={Button} rightIcon={<ChevronDownIcon />} colorScheme="blue" size="sm">
            Manage Tracking
          </MenuButton>
          <MenuList>
            <MenuItem onClick={onAutoFillCompleted}>Add All to Tracking</MenuItem>
            <MenuItem>Mark Section Complete</MenuItem>
            <MenuItem>Import from CSV</MenuItem>
          </MenuList>
        </Menu>
        <Button 
          size="sm" 
          colorScheme="green" 
          leftIcon={<SettingsIcon />}
          onClick={onOpen}
        >
          Auto-fill
        </Button>
        <Button size="sm" colorScheme="blue">
          Tiered
        </Button>
        <Button size="sm">
          Detailed
        </Button>
        <Button size="sm" leftIcon={<DownloadIcon />}>
          Export CSV
        </Button>
        <Button size="sm" colorScheme="red" leftIcon={<DeleteIcon />} onClick={onResetAllTracking}>
          Reset All
        </Button>
      </HStack>

      <PlayerSearchModal
        isOpen={isOpen}
        onClose={onClose}
        onApplyInventory={handleApplyPlayerInventory}
        itemMap={itemMap}
      />
    </>
  );
}
