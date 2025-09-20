import { Box, Text, VStack, HStack, Divider, Button, useToast, useDisclosure, Heading, Spinner } from "@chakra-ui/react"
import { useState } from "react"
import { useClaimInventories } from "~/hooks/useClaimInventories"
import { useTrackedInventories } from "~/hooks/useTrackedInventories"
import { useSelectedClaim } from "~/hooks/useSelectedClaim"
import { ClaimInventoryList } from "~/components/ClaimInventoryList"
import { ClaimSearchModal } from "~/components/ClaimSearchModal"
import { ClaimOverview } from "~/components/ClaimOverview"

type ClaimInventoryViewMode = "list" | "tier"

export function ClaimInventoryView() {
  const { claim, selectClaim, clearClaim } = useSelectedClaim()
  const { inventories, loading, error } = useClaimInventories(claim?.claimId)
  const { trackedInventories, trackAll, untrackAll } = useTrackedInventories()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [viewMode, setViewMode] = useState<ClaimInventoryViewMode>("list")
  const toast = useToast()

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

  const handleTrackAll = () => {
    if (!inventories) return
    const allIds = inventories.inventories.map((inv) => inv.id)
    trackAll(allIds)
    toast({
      title: "All Buildings Tracked",
      description: `Now tracking ${allIds.length} claim buildings`,
      status: "success",
      duration: 3000,
      isClosable: true,
    })
  }

  const handleUntrackAll = () => {
    untrackAll()
    toast({
      title: "All Tracking Cleared",
      description: "No claim buildings are being tracked",
      status: "info",
      duration: 3000,
      isClosable: true,
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
            Manage storerooms, guild caches, and production outputs from a single cozy panel. Select a
            claim to get started.
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
            <Button colorScheme="teal" size="lg" bg="teal.400" _hover={{ bg: "teal.500" }} onClick={onOpen}>
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
              <Button size="sm" colorScheme="teal" bg="teal.400" _hover={{ bg: "teal.500" }} onClick={onOpen}>
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
              <Button size="sm" colorScheme="teal" bg="teal.400" _hover={{ bg: "teal.500" }} onClick={onOpen}>
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

  const claimTrackedCount = inventories.inventories.filter((inv) => trackedInventories.has(inv.id)).length

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

      <ClaimOverview
        claimData={inventories}
        trackedCount={claimTrackedCount}
        onTrackAll={handleTrackAll}
        onUntrackAll={handleUntrackAll}
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
    </VStack>
  )
}
