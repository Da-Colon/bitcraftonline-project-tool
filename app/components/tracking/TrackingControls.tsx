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
} from "@chakra-ui/react";
import { ChevronDownIcon, SettingsIcon, DownloadIcon, DeleteIcon } from "@chakra-ui/icons";

interface TrackingControlsProps {
  onAutoFillCompleted: () => void;
  onResetAllTracking: () => void;
}

export function TrackingControls({
  onAutoFillCompleted,
  onResetAllTracking,
}: TrackingControlsProps) {
  return (
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
      <Button size="sm" colorScheme="green" leftIcon={<SettingsIcon />}>
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
  );
}
