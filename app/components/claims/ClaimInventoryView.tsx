import {
  Box,
  Text,
  VStack,
  HStack,
  Divider,
  Button,
  useToast,
  useDisclosure,
  Heading,
  Spinner,
  Card,
  CardBody,
  Icon,
  Badge,
} from "@chakra-ui/react"
import { useState, useEffect } from "react"
import { ExternalLinkIcon } from "@chakra-ui/icons"
import { useClaimInventories } from "~/hooks/useClaimInventories"
import { usePlayerInventoryTracking } from "~/hooks/usePlayerInventoryTracking"
import { useSelectedPlayer } from "~/hooks/useSelectedPlayer"
import { useSelectedClaim } from "~/hooks/useSelectedClaim"
import { ClaimInventoryList } from "./ClaimInventoryList"
import { ClaimSearchModal } from "./ClaimSearchModal"
import { ClaimOverview } from "./ClaimOverview"
import { TrackedInventorySummary } from "~/components/inventory/TrackedInventorySummary"
import { useConfirmationDialog } from "~/components/ConfirmationDialog"

type ClaimInventoryViewMode = "list" | "tier"

export function ClaimInventoryView() {
  const { player } = useSelectedPlayer()
  const { claim, selectClaim, clearClaim } = useSelectedClaim()
  const { inventories, loading, error } = useClaimInventories(claim?.claimId)
  const {
    snapshots,
    trackInventories,
    untrackByClaim,
    getSnapshotsByClaim,
    getTrackingSummary,
    isLoading,
  } = usePlayerInventoryTracking(player?.entityId || null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [viewMode, setViewMode] = useState<ClaimInventoryViewMode>("list")
  const [totalTrackedCount, setTotalTrackedCount] = useState(0)
  const toast = useToast()
  const { confirm, ConfirmationDialog } = useConfirmationDialog()

  // Load total tracked count
  useEffect(() => {
    const loadTotalCount = async () => {
      if (player?.entityId) {
        try {
          const summary = await getTrackingSummary()
          setTotalTrackedCount(summary.total)
        } catch (error) {
          console.error("Failed to load tracking summary:", error)
        }
      }
    }
    loadTotalCount()
  }, [player?.entityId, getTrackingSummary])

  const handleSelectClaim = (claimId: string, claimName: string) => {
    selectClaim(claimId, claimName)
    toast({
      title: "Claim Selected",
      description: `Now viewing inventories for ${claimName}`,
      status: "success",
      duration: 3000,
      isClosable: true,
    })
  }

  const handleClearClaim = () => {
    clearClaim()
    toast({
      title: "Claim Cleared",
      description: "No claim selected",
      status: "info",
      duration: 3000,
      isClosable: true,
    })
  }

  const handleTrackAll = async () => {
    if (!inventories) return
    try {
      await trackInventories(inventories.inventories, "claim")
      toast({
        title: "All Buildings Tracked",
        description: `Now tracking ${inventories.inventories.length} claim buildings`,
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: "Error Tracking Buildings",
        description: "Failed to track some buildings",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleUntrackAll = async () => {
    if (!claim?.claimId) return

    try {
      await untrackByClaim(claim.claimId)
      // Refresh total count
      const summary = await getTrackingSummary()
      setTotalTrackedCount(summary.total)

      toast({
        title: "Claim Tracking Cleared",
        description: `No buildings from ${claim.claimName} are being tracked`,
        status: "info",
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: "Error Clearing Tracking",
        description: "Failed to clear claim tracking",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleUntrackAllWithConfirmation = () => {
    if (!claim?.claimId) return

    const currentClaimTrackedCount = getSnapshotsByClaim(claim.claimId).length

    confirm({
      title: "Untrack This Claim's Inventories",
      message: `This will untrack ${currentClaimTrackedCount} building${
        currentClaimTrackedCount !== 1 ? "s" : ""
      } from ${claim.claimName}. Your personal and other claim inventories will not be affected.`,
      confirmText: "Untrack This Claim",
      severity: "warning",
      onConfirm: handleUntrackAll,
    })
  }

  if (!claim) {
    return (
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg" mb={2} color="white">
            Claim Inventories
          </Heading>
          <Text color="whiteAlpha.800">
            Manage storerooms, guild caches, and production outputs from a single cozy panel. Select
            a claim to get started.
          </Text>
        </Box>

        <Box
          p={8}
          textAlign="center"
          bg="rgba(24, 35, 60, 0.9)"
          borderRadius={{ base: "2xl", md: "3xl" }}
          border="1px solid rgba(148, 163, 184, 0.35)"
        >
          <VStack spacing={4}>
            <Text fontSize="3xl" mb={2}>
              🏰
            </Text>
            <Text color="white" fontSize="xl" fontWeight="semibold">
              No Claim Selected
            </Text>
            <Text color="whiteAlpha.800" fontSize="md" maxW="md">
              Select a claim to view and manage its building inventories. You can track storage
              containers, production buildings, and other structures.
            </Text>
            <Button
              colorScheme="teal"
              size="lg"
              bg="teal.400"
              _hover={{ bg: "teal.500" }}
              onClick={onOpen}
            >
              Select Claim
            </Button>
          </VStack>
        </Box>

        <ClaimSearchModal isOpen={isOpen} onClose={onClose} onSelectClaim={handleSelectClaim} />
      </VStack>
    )
  }

  if (loading) {
    return (
      <Box
        textAlign="center"
        bg="rgba(24, 35, 60, 0.9)"
        border="1px solid rgba(148, 163, 184, 0.35)"
        borderRadius={{ base: "2xl", md: "3xl" }}
        px={{ base: 6, md: 8 }}
        py={{ base: 8, md: 10 }}
      >
        <Spinner size="lg" color="teal.300" />
        <Text mt={4} color="whiteAlpha.800">
          Loading claim inventories...
        </Text>
      </Box>
    )
  }

  if (error) {
    return (
      <>
        <Box
          p={{ base: 6, md: 8 }}
          bg="rgba(63, 34, 53, 0.85)"
          borderRadius={{ base: "2xl", md: "3xl" }}
          border="1px solid rgba(248, 180, 217, 0.35)"
        >
          <VStack spacing={3}>
            <Text color="pink.200" textAlign="center" fontWeight="semibold">
              Error loading claim inventories: {error}
            </Text>
            <HStack spacing={3}>
              <Button
                size="sm"
                colorScheme="teal"
                bg="teal.400"
                _hover={{ bg: "teal.500" }}
                onClick={onOpen}
              >
                Select Different Claim
              </Button>
              <Button
                size="sm"
                variant="ghost"
                color="whiteAlpha.800"
                _hover={{ bg: "whiteAlpha.200" }}
                onClick={handleClearClaim}
              >
                Clear Selection
              </Button>
            </HStack>
          </VStack>
        </Box>
        <ClaimSearchModal isOpen={isOpen} onClose={onClose} onSelectClaim={handleSelectClaim} />
      </>
    )
  }

  if (!inventories || inventories.inventories.length === 0) {
    return (
      <>
        <Box
          p={{ base: 6, md: 8 }}
          bg="rgba(24, 35, 60, 0.9)"
          borderRadius={{ base: "2xl", md: "3xl" }}
          border="1px solid rgba(148, 163, 184, 0.35)"
        >
          <VStack spacing={3}>
            <Text color="white" textAlign="center" fontSize="lg" fontWeight="medium">
              No Inventories Found
            </Text>
            <Text color="whiteAlpha.800" textAlign="center" fontSize="sm">
              This claim has no accessible inventories.
            </Text>
            <HStack spacing={3}>
              <Button
                size="sm"
                colorScheme="teal"
                bg="teal.400"
                _hover={{ bg: "teal.500" }}
                onClick={onOpen}
              >
                Select Different Claim
              </Button>
              <Button
                size="sm"
                variant="ghost"
                color="whiteAlpha.800"
                _hover={{ bg: "whiteAlpha.200" }}
                onClick={handleClearClaim}
              >
                Clear Selection
              </Button>
            </HStack>
          </VStack>
        </Box>
        <ClaimSearchModal isOpen={isOpen} onClose={onClose} onSelectClaim={handleSelectClaim} />
      </>
    )
  }

  const claimTrackedCount = claim?.claimId ? getSnapshotsByClaim(claim.claimId).length : 0

  return (
    <VStack spacing={8} align="stretch">
      <Box>
        <Heading size="lg" mb={2} color="white">
          Claim Inventories
        </Heading>
        <Text color="whiteAlpha.800">
          Manage and track inventories from your claim buildings and storage containers. Tracked
          buildings appear in your dashboard and can be used for recipe calculations.
        </Text>
      </Box>

      {/* Prominent Claim Selector Card */}
      <Card
        bg="rgba(24, 35, 60, 0.9)"
        border="1px solid"
        borderColor="teal.300"
        borderRadius="2xl"
        backdropFilter="blur(12px)"
        boxShadow="xl"
      >
        <CardBody p={6}>
          <HStack justify="space-between" align="center">
            <HStack spacing={4}>
              <Text fontSize="3xl">🏰</Text>
              <VStack align="start" spacing={1}>
                <Text color="white" fontSize="xl" fontWeight="bold">
                  {claim?.claimName || "No Claim Selected"}
                </Text>
                <HStack spacing={4}>
                  <Badge
                    colorScheme="teal"
                    variant="subtle"
                    bg="rgba(45, 212, 191, 0.12)"
                    color="teal.100"
                  >
                    {inventories?.inventories.length || 0} buildings
                  </Badge>
                  <Badge
                    colorScheme="purple"
                    variant="subtle"
                    bg="rgba(192, 132, 252, 0.12)"
                    color="purple.100"
                  >
                    {claimTrackedCount} tracked
                  </Badge>
                  <Badge
                    colorScheme="blue"
                    variant="subtle"
                    bg="rgba(59, 130, 246, 0.12)"
                    color="blue.100"
                  >
                    {inventories?.inventories.reduce((sum, inv) => sum + inv.items.length, 0) || 0}{" "}
                    items
                  </Badge>
                </HStack>
              </VStack>
            </HStack>
            <Button
              size="lg"
              colorScheme="teal"
              bg="teal.400"
              _hover={{ bg: "teal.500" }}
              onClick={onOpen}
              rightIcon={<Icon as={ExternalLinkIcon} />}
            >
              Change Claim
            </Button>
          </HStack>
        </CardBody>
      </Card>

      {/* Tracking Summary */}
      <TrackedInventorySummary
        currentClaimId={claim?.claimId}
        currentClaimName={claim?.claimName}
      />

      <ClaimOverview
        claimData={inventories}
        trackedCount={claimTrackedCount}
        totalTrackedCount={totalTrackedCount}
        onTrackAll={handleTrackAll}
        onUntrackAll={handleUntrackAllWithConfirmation}
        onChangeClaim={onOpen}
      />

      <Divider borderColor="whiteAlpha.200" />

      <Box>
        <HStack justify="space-between" align="center" mb={4}>
          <Text fontSize="xl" fontWeight="bold" color="white">
            Building Management
          </Text>
          <HStack spacing={2}>
            <Button
              size="sm"
              colorScheme="teal"
              bg={viewMode === "list" ? "teal.400" : "transparent"}
              variant={viewMode === "list" ? "solid" : "ghost"}
              color={viewMode === "list" ? "white" : "whiteAlpha.800"}
              _hover={viewMode === "list" ? { bg: "teal.500" } : { bg: "whiteAlpha.200" }}
              onClick={() => setViewMode("list")}
            >
              List View
            </Button>
            <Button
              size="sm"
              colorScheme="teal"
              bg={viewMode === "tier" ? "teal.400" : "transparent"}
              variant={viewMode === "tier" ? "solid" : "ghost"}
              color={viewMode === "tier" ? "white" : "whiteAlpha.800"}
              _hover={viewMode === "tier" ? { bg: "teal.500" } : { bg: "whiteAlpha.200" }}
              onClick={() => setViewMode("tier")}
            >
              Tier View
            </Button>
          </HStack>
        </HStack>
        <Text color="whiteAlpha.800" mb={6}>
          {viewMode === "list"
            ? "Select buildings to track. Use the checkboxes to add or remove buildings from tracking."
            : "View items grouped by category and tier within each building for better organization."}
        </Text>
      </Box>

      <ClaimInventoryList inventories={inventories.inventories} viewMode={viewMode} />

      <ClaimSearchModal isOpen={isOpen} onClose={onClose} onSelectClaim={handleSelectClaim} />
      {ConfirmationDialog}
    </VStack>
  )
}
