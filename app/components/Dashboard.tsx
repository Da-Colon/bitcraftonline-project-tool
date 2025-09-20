import {
  Badge,
  Box,
  Button,
  Divider,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  VStack,
  Wrap,
  WrapItem,
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
      <VStack spacing={{ base: 6, md: 8 }} align="flex-start" maxW="3xl" w="full">
        <Text textTransform="uppercase" fontSize="sm" letterSpacing="widest" color="whiteAlpha.800">
          BitCraft Project Planner
        </Text>
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

        <Wrap spacing={{ base: 2, md: 3 }} justify={{ base: "flex-start", sm: "flex-start" }}>
          <WrapItem>
            <Badge colorScheme="blue" px={3} py={1} borderRadius="full">
              {trackedCount} tracked inventories
            </Badge>
          </WrapItem>
          <WrapItem>
            <Badge colorScheme="green" px={3} py={1} borderRadius="full">
              {totalQuantity.toLocaleString()} items on hand
            </Badge>
          </WrapItem>
          {player && claim && (
            <WrapItem>
              <Badge colorScheme="purple" px={3} py={1} borderRadius="full">
                Claim: {claim.claimName}
              </Badge>
            </WrapItem>
          )}
          {player && tierFiveCount > 0 && (
            <WrapItem>
              <Badge colorScheme="pink" px={3} py={1} borderRadius="full">
                {tierFiveCount.toLocaleString()} Tier 5 mats
              </Badge>
            </WrapItem>
          )}
        </Wrap>

        <Stack
          direction={{ base: "column", sm: "row" }}
          spacing={{ base: 3, md: 4 }}
          align={{ base: "stretch", sm: "center" }}
          w="full"
        >
          {player ? (
            <Button
              as={RemixLink}
              to="/recipes"
              colorScheme="teal"
              size="lg"
              w={{ base: "full", sm: "auto" }}
            >
              Plan Tonight's Crafting
            </Button>
          ) : (
            <Button colorScheme="teal" size="lg" onClick={onOpen} w={{ base: "full", sm: "auto" }}>
              Select Player to Begin
            </Button>
          )}
          <Button
            as={RemixLink}
            to="/about"
            variant="outline"
            borderColor="whiteAlpha.400"
            colorScheme="whiteAlpha"
            size="lg"
            w={{ base: "full", sm: "auto" }}
            _hover={{ bg: "whiteAlpha.200" }}
          >
            Learn the vision
          </Button>
        </Stack>
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
