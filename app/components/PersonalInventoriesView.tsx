import { Box, Text, VStack, Spinner, Alert, AlertIcon, HStack, Button } from "@chakra-ui/react";
import { useState } from "react";
import { useSelectedPlayer } from "~/hooks/useSelectedPlayer";
import { usePlayerInventories } from "~/hooks/usePlayerInventories";
import { InventoryList } from "~/components/InventoryList";

type InventoryViewType = 'list' | 'tier';

export function PersonalInventoriesView() {
  const { player } = useSelectedPlayer();
  const { inventories, loading, error } = usePlayerInventories(player?.entityId);
  const [viewType, setViewType] = useState<InventoryViewType>('list');

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
        <HStack justify="space-between" align="center" mb={4}>
          <Text fontSize="xl" fontWeight="bold">Personal Inventories</Text>
          <HStack spacing={2}>
            <Button
              size="sm"
              variant={viewType === 'list' ? 'solid' : 'outline'}
              onClick={() => setViewType('list')}
            >
              List View
            </Button>
            <Button
              size="sm"
              variant={viewType === 'tier' ? 'solid' : 'outline'}
              onClick={() => setViewType('tier')}
            >
              Tier View
            </Button>
          </HStack>
        </HStack>
        <Text color="text.muted" mb={6}>
          {viewType === 'list' 
            ? 'Select inventories to track. Tracked inventories will be monitored for changes.'
            : 'Items grouped by category and tier within each inventory.'
          }
        </Text>
      </Box>
      
      <InventoryList inventories={inventories} viewMode={viewType} />
    </VStack>
  );
}
