import {
  Badge,
  Button,
  Card,
  CardBody,
  Divider,
  HStack,
  Icon,
  Progress,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react"
import { ExternalLinkIcon, InfoOutlineIcon, StarIcon } from "@chakra-ui/icons"
import { Link as RemixLink } from "@remix-run/react"
import type { CombinedInventoryItem } from "~/utils/combineAllTrackedInventories"
import type { SelectedClaim } from "~/hooks/useSelectedClaim"

interface DashboardFocusPanelsProps {
  claim: SelectedClaim | null
  combinedItems: CombinedInventoryItem[]
  selectedRecipe: {
    name: string
    quantity: number
    category?: string | null
    tier?: number | null
  } | null
}

export function DashboardFocusPanels({
  claim,
  combinedItems,
  selectedRecipe,
}: DashboardFocusPanelsProps) {
  const highTierItem = combinedItems
    .filter((item) => (item.tier ?? -1) >= 4)
    .sort((a, b) => b.totalQuantity - a.totalQuantity)[0]

  return (
    <Card bg="rgba(24, 35, 60, 0.9)" border="1px solid" borderColor="whiteAlpha.300" borderRadius="2xl" h="full">
      <CardBody>
        <VStack align="stretch" spacing={4} h="full">
          <HStack justify="space-between">
            <Text fontSize="lg" fontWeight="bold" color="white">
              Crafting Queue
            </Text>
            <Icon as={StarIcon} color="yellow.200" boxSize={4} />
          </HStack>

          {selectedRecipe ? (
            <VStack align="stretch" spacing={2} flex={1}>
              <Text fontSize="md" color="white" fontWeight="semibold">
                {selectedRecipe.name}
              </Text>
              <HStack spacing={2}>
                <Badge colorScheme="teal">x{selectedRecipe.quantity}</Badge>
                {selectedRecipe.tier !== undefined && selectedRecipe.tier !== null && (
                  <Badge colorScheme="purple">T{selectedRecipe.tier}</Badge>
                )}
                {selectedRecipe.category && (
                  <Badge colorScheme="blue" variant="subtle">
                    {selectedRecipe.category}
                  </Badge>
                )}
              </HStack>
              <Text fontSize="sm" color="whiteAlpha.800">
                Continue the calculation flow to see deficits and gather list tailored to your
                inventories.
              </Text>
            </VStack>
          ) : (
            <VStack align="stretch" spacing={4} flex={1}>
              <Text color="whiteAlpha.800" fontSize="sm">
                You haven't pinned a recipe yet. Pick a project to start planning your next play
                session.
              </Text>
            </VStack>
          )}

          <Divider borderColor="whiteAlpha.300" />

          <Button
            as={RemixLink}
            to="/recipes"
            size="sm"
            colorScheme="teal"
            bg="teal.400"
            _hover={{ bg: "teal.500" }}
            _active={{ bg: "teal.600" }}
            justifyContent="center"
          >
            Open Recipe Calculator
          </Button>
        </VStack>
      </CardBody>
    </Card>
  )
}
