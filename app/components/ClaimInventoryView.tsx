import { 
  Box, 
  Text, 
  VStack, 
  Badge, 
  HStack, 
  Divider, 
  Button, 
  useToast, 
  useDisclosure,
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel, 
  Select,
  Heading
} from "@chakra-ui/react";
import { useClaimInventories } from "~/hooks/useClaimInventories";
import { useTrackedInventories } from "~/hooks/useTrackedInventories";
import { useSelectedClaim } from "~/hooks/useSelectedClaim";
import { ClaimInventoryList } from "~/components/ClaimInventoryList";
import { ClaimSearchModal } from "~/components/ClaimSearchModal";
import { ClaimOverview } from "~/components/ClaimOverview";
import { useState } from "react";

export function ClaimInventoryView() {
  const { claim, selectClaim, clearClaim } = useSelectedClaim();
  const { inventories, loading, error } = useClaimInventories(claim?.claimId);
  const { trackedInventories, clearAll, trackAll, untrackAll } = useTrackedInventories();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [viewMode, setViewMode] = useState<'list' | 'tier'>('list');
  const toast = useToast();


  const handleSelectClaim = (claimId: string, claimName: string) => {
    selectClaim(claimId, claimName);
    toast({
      title: "Claim Selected",
      description: `Now viewing inventories for ${claimName}`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleClearClaim = () => {
    clearClaim();
    toast({
      title: "Claim Cleared",
      description: "No claim selected",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleClearAllTracking = () => {
    clearAll();
    toast({
      title: "Tracking Cleared",
      description: "All inventory tracking has been removed",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleTrackAll = () => {
    if (!inventories) return;
    const allIds = inventories.inventories.map(inv => inv.id);
    trackAll(allIds);
    toast({
      title: "All Buildings Tracked",
      description: `Now tracking ${allIds.length} claim buildings`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleUntrackAll = () => {
    untrackAll();
    toast({
      title: "All Tracking Cleared",
      description: "No claim buildings are being tracked",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  if (!claim) {
    return (
      <VStack spacing={8} align="stretch">
        {/* Page Header */}
        <Box>
          <Heading size="lg" mb={2}>
            Claim Inventories
          </Heading>
          <Text color="gray.600">
            Manage and track inventories from your claim buildings and storage containers.
            Select a claim to get started.
          </Text>
        </Box>

        {/* No Claim Selected State */}
        <Box p={8} textAlign="center" bg="gray.50" borderRadius="lg" border="1px solid" borderColor="gray.200">
          <VStack spacing={4}>
            <Text fontSize="3xl" mb={2}>🏰</Text>
            <Text color="gray.600" fontSize="xl" fontWeight="semibold">
              No Claim Selected
            </Text>
            <Text color="gray.500" fontSize="md" maxW="md">
              Select a claim to view and manage its building inventories. You can track storage 
              containers, production buildings, and other structures.
            </Text>
            <Button colorScheme="purple" size="lg" onClick={onOpen}>
              Select Claim
            </Button>
          </VStack>
        </Box>

        <ClaimSearchModal
          isOpen={isOpen}
          onClose={onClose}
          onSelectClaim={handleSelectClaim}
        />
      </VStack>
    );
  }

  if (loading) {
    return (
      <Box p={6} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
        <Text color="gray.600" textAlign="center">
          Loading claim inventories...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <>
        <Box p={6} bg="red.50" borderRadius="md" border="1px solid" borderColor="red.200">
          <VStack spacing={3}>
            <Text color="red.600" textAlign="center">
              Error loading claim inventories: {error}
            </Text>
            <HStack>
              <Button size="sm" onClick={onOpen}>
                Select Different Claim
              </Button>
              <Button size="sm" variant="outline" onClick={handleClearClaim}>
                Clear Selection
              </Button>
            </HStack>
          </VStack>
        </Box>
        <ClaimSearchModal
          isOpen={isOpen}
          onClose={onClose}
          onSelectClaim={handleSelectClaim}
        />
      </>
    );
  }

  if (!inventories || inventories.inventories.length === 0) {
    return (
      <>
        <Box p={6} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
          <VStack spacing={3}>
            <Text color="gray.600" textAlign="center" fontSize="lg" fontWeight="medium">
              No Inventories Found
            </Text>
            <Text color="gray.500" textAlign="center" fontSize="sm">
              This claim has no accessible inventories.
            </Text>
            <HStack>
              <Button size="sm" onClick={onOpen}>
                Select Different Claim
              </Button>
              <Button size="sm" variant="outline" onClick={handleClearClaim}>
                Clear Selection
              </Button>
            </HStack>
          </VStack>
        </Box>
        <ClaimSearchModal
          isOpen={isOpen}
          onClose={onClose}
          onSelectClaim={handleSelectClaim}
        />
      </>
    );
  }

  const claimTrackedCount = inventories.inventories.filter(inv => trackedInventories.has(inv.id)).length;

  return (
    <VStack spacing={8} align="stretch">
      {/* Page Header */}
      <Box>
        <Heading size="lg" mb={2}>
          Claim Inventories
        </Heading>
        <Text color="gray.600">
          Manage and track inventories from your claim buildings and storage containers.
          Tracked buildings appear in your dashboard and can be used for recipe calculations.
        </Text>
      </Box>

      {/* Claim Overview */}
      <ClaimOverview
        claimData={inventories}
        trackedCount={claimTrackedCount}
        onTrackAll={handleTrackAll}
        onUntrackAll={handleUntrackAll}
        onChangeClaim={onOpen}
      />

      {/* Divider */}
      <Divider />

      {/* Building Management Section */}
      <Box>
        <HStack justify="space-between" align="center" mb={4}>
          <Text fontSize="xl" fontWeight="bold">
            Building Management
          </Text>
          <HStack spacing={2}>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'solid' : 'outline'}
              onClick={() => setViewMode('list')}
            >
              List View
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'tier' ? 'solid' : 'outline'}
              onClick={() => setViewMode('tier')}
            >
              Tier View
            </Button>
          </HStack>
        </HStack>
        <Text color="gray.600" mb={6}>
          {viewMode === 'list' 
            ? 'Select buildings to track. Use the checkboxes to add or remove buildings from tracking.'
            : 'View items grouped by category and tier within each building for better organization.'
          }
        </Text>
      </Box>
      
      <ClaimInventoryList inventories={inventories.inventories} viewMode={viewMode} />

      <ClaimSearchModal
        isOpen={isOpen}
        onClose={onClose}
        onSelectClaim={handleSelectClaim}
      />
    </VStack>
  );
}
