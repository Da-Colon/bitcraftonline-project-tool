import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  Wrap,
  WrapItem,
  useDisclosure,
} from "@chakra-ui/react"

import { DashboardFocusPanels } from "./DashboardFocusPanels"
import { DashboardLayout } from "./DashboardLayout"
import { DashboardOverview } from "./DashboardOverview"

import { PlayerHeader } from "~/components/player/PlayerHeader"
import { PlayerSelectionView } from "~/components/player/PlayerSelectionView"
import { useRecipeSelection } from "~/hooks/useRecipeSelection"
import { useTrackedInventorySummary } from "~/hooks/useTrackedInventorySummary"

export function Dashboard() {
  const {
    player,
    claim,
    combinedItems,
    trackedCount,
    totalQuantity,
  } = useTrackedInventorySummary()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { selectedItem, targetQuantity } = useRecipeSelection()

  const selectedRecipe = selectedItem
    ? {
        name: selectedItem.name,
        quantity: targetQuantity,
        category: selectedItem.category,
        tier: selectedItem.tier,
      }
    : null


  const tierFiveCount = combinedItems.reduce((sum, item) => {
    return sum + ((item.tier ?? -1) === 5 ? item.totalQuantity : 0)
  }, 0)

  const hero = (
    <Box px={{ base: 6, md: 10 }} py={{ base: 8, md: 12 }}>
      <Flex direction="column" align="flex-start" w="full" gap={{ base: 2, md: 3 }}>
        <Heading
          fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
          lineHeight={{ base: "1.15", md: "1.1" }}
          color="white"
        >
          {player ? `Welcome back, ${player.username}.` : "Shape your legacy in the single shared world."}
        </Heading>
        <Text fontSize={{ base: "md", md: "xl" }} color="whiteAlpha.900" maxW="2xl">
          Track every stash, sync your claims, and line up the perfect crafting session. Slow-burn
          progression, clear goals, and cozy vibes—all in one place.
        </Text>

        <Wrap spacing={{ base: 1, md: 2 }} justify={{ base: "flex-start", sm: "flex-start" }}>
          <WrapItem>
            <Badge colorScheme="blue" px={2} py={0.5} borderRadius="full" fontSize="xs">
              {trackedCount} tracked inventories
            </Badge>
          </WrapItem>
          <WrapItem>
            <Badge colorScheme="green" px={2} py={0.5} borderRadius="full" fontSize="xs">
              {totalQuantity.toLocaleString()} items on hand
            </Badge>
          </WrapItem>
          {player && claim && (
            <WrapItem>
              <Badge colorScheme="purple" px={2} py={0.5} borderRadius="full" fontSize="xs">
                Claim: {claim.claimName}
              </Badge>
            </WrapItem>
          )}
          {player && tierFiveCount > 0 && (
            <WrapItem>
              <Badge colorScheme="pink" px={2} py={0.5} borderRadius="full" fontSize="xs">
                {tierFiveCount.toLocaleString()} Tier 5 mats
              </Badge>
            </WrapItem>
          )}
        </Wrap>

        {!player && (
          <Button colorScheme="teal" size="lg" onClick={onOpen} w={{ base: "full", sm: "auto" }}>
            Select Player to Begin
          </Button>
        )}
      </Flex>
    </Box>
  )

  return (
    <Box bg="gray.900" minH="100vh">
      <PlayerHeader />
      <DashboardLayout hero={hero}>
        {player ? (
          <Flex direction="column" gap={{ base: 4, md: 6 }} align="stretch">
            <DashboardOverview
              trackedInventoriesCount={trackedCount}
              totalItems={totalQuantity}
              combinedItems={combinedItems}
            />
            <DashboardFocusPanels
              selectedRecipe={selectedRecipe}
            />
            <Divider borderColor="whiteAlpha.200" />
          </Flex>
        ) : (
          <Flex direction="column" gap={6} align="center" textAlign="center">
            <Heading size="lg" color="white">
              Choose a traveler to see their world
            </Heading>
            <Text color="gray.300" maxW="lg">
              Pick your BitCraft character to pull in personal pockets, claim storage, and shared
              inventories. Once selected, your data stays pinned for the next session.
            </Text>
            <Button colorScheme="teal" size="lg" onClick={onOpen}>
              Select Player
            </Button>
          </Flex>
        )}
      </DashboardLayout>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Select Player</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <PlayerSelectionView />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}
