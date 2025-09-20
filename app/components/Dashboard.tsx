import {
  Badge,
  Box,
  Button,
  Divider,
  HStack,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react"
import { Link as RemixLink } from "@remix-run/react"
import { PlayerHeader } from "~/components/PlayerHeader"
import { TrackedInventoryView } from "~/components/TrackedInventoryView"
import { DashboardOverview } from "~/components/DashboardOverview"
import { PlayerSelectionView } from "~/components/PlayerSelectionView"
import { DashboardLayout } from "~/components/DashboardLayout"
import { DashboardFocusPanels } from "~/components/DashboardFocusPanels"
import { useTrackedInventorySummary } from "~/hooks/useTrackedInventorySummary"
import { useRecipeSelection } from "~/hooks/useRecipeSelection"

export function Dashboard() {
  const {
    player,
    claim,
    combinedItems,
    trackedCount,
    totalQuantity,
    allInventories,
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

  const totalInventories = allInventories.length

  const tierFiveCount = combinedItems.reduce((sum, item) => {
    return sum + ((item.tier ?? -1) === 5 ? item.totalQuantity : 0)
  }, 0)

  const hero = (
    <Box px={{ base: 6, md: 10 }} py={{ base: 12, md: 20 }}>
      <VStack spacing={6} align="flex-start" maxW="3xl">
        <Text textTransform="uppercase" fontSize="sm" letterSpacing="widest" color="whiteAlpha.800">
          BitCraft Project Planner
        </Text>
        <Heading size="2xl" lineHeight="1.1" color="white">
          {player ? `Welcome back, ${player.username}.` : "Shape your legacy in the single shared world."}
        </Heading>
        <Text fontSize={{ base: "lg", md: "xl" }} color="whiteAlpha.900">
          Track every stash, sync your claims, and line up the perfect crafting session. Slow-burn
          progression, clear goals, and cozy vibes—all in one place.
        </Text>

        <HStack spacing={3} flexWrap="wrap">
          <Badge colorScheme="blue" px={3} py={1} borderRadius="full">
            {trackedCount} tracked inventories
          </Badge>
          <Badge colorScheme="green" px={3} py={1} borderRadius="full">
            {totalQuantity.toLocaleString()} items on hand
          </Badge>
          {player && claim && (
            <Badge colorScheme="purple" px={3} py={1} borderRadius="full">
              Claim: {claim.claimName}
            </Badge>
          )}
          {player && tierFiveCount > 0 && (
            <Badge colorScheme="pink" px={3} py={1} borderRadius="full">
              {tierFiveCount.toLocaleString()} Tier 5 mats
            </Badge>
          )}
        </HStack>

        <HStack spacing={3}>
          {player ? (
            <Button as={RemixLink} to="/recipes" colorScheme="teal" size="lg">
              Plan Tonight's Crafting
            </Button>
          ) : (
            <Button colorScheme="teal" size="lg" onClick={onOpen}>
              Select Player to Begin
            </Button>
          )}
          <Button as={RemixLink} to="/about" variant="ghost" colorScheme="whiteAlpha" size="lg">
            Learn the vision
          </Button>
        </HStack>
      </VStack>
    </Box>
  )

  return (
    <Box bg="gray.900" minH="100vh">
      <PlayerHeader />
      <DashboardLayout hero={hero}>
        {player ? (
          <VStack spacing={{ base: 10, md: 12 }} align="stretch">
            <DashboardOverview
              trackedInventoriesCount={trackedCount}
              totalItems={totalQuantity}
              combinedItems={combinedItems}
            />
            <DashboardFocusPanels
              claim={claim}
              combinedItems={combinedItems}
              selectedRecipe={selectedRecipe}
              trackedCount={trackedCount}
              totalInventories={totalInventories}
            />
            <Divider borderColor="whiteAlpha.200" />
          </VStack>
        ) : (
          <VStack spacing={6} align="center" textAlign="center">
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
          </VStack>
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
