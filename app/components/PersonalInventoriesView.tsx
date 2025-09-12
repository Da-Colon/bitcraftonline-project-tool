import { Box, Text, VStack, Spinner, Alert, AlertIcon } from "@chakra-ui/react";
import { useSelectedPlayer } from "~/hooks/useSelectedPlayer";
import { usePlayerInventories } from "~/hooks/usePlayerInventories";
import { InventoryList } from "~/components/InventoryList";

export function PersonalInventoriesView() {
  const { player } = useSelectedPlayer();
  const { inventories, loading, error } = usePlayerInventories(player?.entityId);

  if (loading) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="lg" />
        <Text mt={4} color="text.muted">Loading inventories...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        Failed to load inventories: {error}
      </Alert>
    );
  }

  if (!inventories) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="text.muted">No inventory data available</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Text fontSize="xl" fontWeight="bold" mb={4}>Personal Inventories</Text>
        <Text color="text.muted" mb={6}>
          Select inventories to track. Tracked inventories will be monitored for changes.
        </Text>
      </Box>
      
      <InventoryList inventories={inventories} />
    </VStack>
  );
}
