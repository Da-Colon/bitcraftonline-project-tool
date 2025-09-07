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

interface TrackingControlsProps {
  onAutoFillCompleted: () => void;
  onResetAllTracking: () => void;
  onApplyPlayerInventory?: (playerName: string, selectedInventories: string[]) => Promise<void>;
}

export function TrackingControls({
  onAutoFillCompleted,
  onResetAllTracking,
  onApplyPlayerInventory,
}: TrackingControlsProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleApplyPlayerInventory = async (playerName: string, selectedInventories: string[]) => {
    if (onApplyPlayerInventory) {
      await onApplyPlayerInventory(playerName, selectedInventories);
    }
  };

  return (
    <>
      <HStack spacing={2} flexWrap="wrap">
        <Menu>
          <MenuButton as={Button} rightIcon={<ChevronDownIcon />} colorScheme="blue" size="sm">
            Manage Tracking
          </MenuButton>
          <MenuList>
            <MenuItem onClick={onAutoFillCompleted}>Auto-fill All Complete</MenuItem>
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
      />
    </>
  );
}
