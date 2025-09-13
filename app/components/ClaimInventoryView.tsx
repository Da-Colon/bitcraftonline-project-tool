import { 
  Box, Text, VStack, Badge, HStack, Divider, Button, useToast, useDisclosure,
  Tabs, TabList, TabPanels, Tab, TabPanel, Select
} from "@chakra-ui/react";
import { useClaimInventories } from "~/hooks/useClaimInventories";
import { useTrackedInventories } from "~/hooks/useTrackedInventories";
import { useSelectedClaim } from "~/hooks/useSelectedClaim";
import { ClaimInventoryList } from "~/components/ClaimInventoryList";
import { ClaimSearchModal } from "~/components/ClaimSearchModal";
import { useState } from "react";

export function ClaimInventoryView() {
  const { claim, selectClaim, clearClaim } = useSelectedClaim();
  const { inventories, loading, error } = useClaimInventories(claim?.claimId);
  const { trackedInventories, clearAll } = useTrackedInventories();
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

  if (!claim) {
    return (
      <>
        <Box p={6} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
          <VStack spacing={4}>
            <Text color="gray.600" textAlign="center" fontSize="lg" fontWeight="medium">
              No Claim Selected
            </Text>
            <Text color="gray.500" textAlign="center" fontSize="sm">
              Select a claim to view and manage its inventories.
            </Text>
            <Button colorScheme="blue" onClick={onOpen}>
              Select Claim
            </Button>
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
    <>
      <Box>
        <VStack spacing={6} align="stretch">
          <Box>
            <HStack justify="space-between" align="center" mb={4}>
              <VStack align="start" spacing={1}>
                <Text fontSize="xl" fontWeight="bold">
                  {inventories.claimName}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Claim ID: {inventories.claimId}
                </Text>
              </VStack>
              <HStack spacing={3}>
                <Badge colorScheme="purple" variant="subtle" fontSize="sm">
                  {inventories.inventories.length} inventories
                </Badge>
                <Badge colorScheme="green" variant="subtle" fontSize="sm">
                  {claimTrackedCount} tracked
                </Badge>
                <Button size="sm" onClick={onOpen}>
                  Change Claim
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="red"
                  onClick={handleClearAllTracking}
                  isDisabled={trackedInventories.size === 0}
                >
                  Clear All Tracking
                </Button>
              </HStack>
            </HStack>
            <Divider />
          </Box>

          <Tabs>
            <TabList>
              <Tab>Inventories</Tab>
            </TabList>
            <TabPanels>
              <TabPanel px={0}>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <Text fontSize="md" fontWeight="medium">
                      Select inventories to track in your dashboard
                    </Text>
                    <Select
                      value={viewMode}
                      onChange={(e) => setViewMode(e.target.value as 'list' | 'tier')}
                      width="auto"
                      size="sm"
                    >
                      <option value="list">List View</option>
                      <option value="tier">Tier View</option>
                    </Select>
                  </HStack>
                  <ClaimInventoryList inventories={inventories.inventories} viewMode={viewMode} />
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
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
