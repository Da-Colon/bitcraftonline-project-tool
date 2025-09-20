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
  trackedCount: number
  totalInventories: number
}

export function DashboardFocusPanels({
  claim,
  combinedItems,
  selectedRecipe,
  trackedCount,
  totalInventories,
}: DashboardFocusPanelsProps) {
  const highTierItem = combinedItems
    .filter((item) => (item.tier ?? -1) >= 4)
    .sort((a, b) => b.totalQuantity - a.totalQuantity)[0]

  const coveragePercent = totalInventories > 0 ? Math.round((trackedCount / totalInventories) * 100) : 0

  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
      <Card bg="rgba(24, 35, 60, 0.9)" border="1px solid" borderColor="whiteAlpha.300" borderRadius="2xl" h="full">
        <CardBody>
          <VStack align="stretch" spacing={4} h="full">
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="bold" color="white">
                Claim Status
              </Text>
              <Icon as={InfoOutlineIcon} color="whiteAlpha.700" boxSize={4} />
            </HStack>

            {claim ? (
              <VStack align="stretch" spacing={3} flex={1}>
                <Text color="whiteAlpha.900" fontSize="sm">
                  You are syncing building storage from:
                </Text>
                <Badge alignSelf="flex-start" colorScheme="purple" px={4} py={1} borderRadius="full">
                  {claim.claimName}
                </Badge>
                <Text color="whiteAlpha.800" fontSize="sm">
                  Keep this claim synchronized to feed your recipe calculations and communal goals.
                </Text>
              </VStack>
            ) : (
              <VStack align="stretch" spacing={4} flex={1}>
                <Text color="whiteAlpha.800" fontSize="sm">
                  No claim selected. Choose a settlement to pull in building inventories and communal
                  resources.
                </Text>
                <Button
                  as={RemixLink}
                  to="/claim-inventories"
                  colorScheme="purple"
                  variant="outline"
                  size="sm"
                  leftIcon={<Icon as={ExternalLinkIcon} />}
                  alignSelf="flex-start"
                >
                  Select Claim
                </Button>
              </VStack>
            )}

            <Divider borderColor="whiteAlpha.300" />

            <Button
              as={RemixLink}
              to="/claim-inventories"
              size="sm"
              variant="ghost"
              colorScheme="whiteAlpha"
              rightIcon={<Icon as={ExternalLinkIcon} />}
              justifyContent="flex-start"
            >
              Manage Claim Inventories
            </Button>
          </VStack>
        </CardBody>
      </Card>

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
                  You haven’t pinned a recipe yet. Pick a project to start planning your next play
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
              variant="solid"
              justifyContent="flex-start"
            >
              Open Recipe Calculator
            </Button>
          </VStack>
        </CardBody>
      </Card>

      <Card bg="rgba(24, 35, 60, 0.9)" border="1px solid" borderColor="whiteAlpha.300" borderRadius="2xl" h="full">
        <CardBody>
          <VStack align="stretch" spacing={4} h="full">
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="bold" color="white">
                Inventory Coverage
              </Text>
              <Icon as={InfoOutlineIcon} color="whiteAlpha.700" boxSize={4} />
            </HStack>

            <VStack align="stretch" spacing={3} flex={1}>
              <Text color="whiteAlpha.900" fontSize="sm">
                {totalInventories > 0
                  ? `Tracking ${trackedCount} of ${totalInventories} known inventories.`
                  : "Once inventories load in, you can decide which ones to follow."}
              </Text>

              {totalInventories > 0 && (
                <VStack align="stretch" spacing={2}>
                  <Progress value={coveragePercent} colorScheme="teal" size="sm" borderRadius="full" />
                  <HStack justify="space-between">
                    <Badge colorScheme="teal" variant="subtle">
                      {coveragePercent}% coverage
                    </Badge>
                    {highTierItem && (
                      <Badge colorScheme="purple" variant="subtle">
                        Highlight: {highTierItem.name || highTierItem.itemId}
                      </Badge>
                    )}
                  </HStack>
                </VStack>
              )}
            </VStack>

            <Divider borderColor="whiteAlpha.300" />

            <Button
              as={RemixLink}
              to="/inventory"
              size="sm"
              variant="ghost"
              colorScheme="whiteAlpha"
              justifyContent="flex-start"
            >
              Manage Personal Inventories
            </Button>
          </VStack>
        </CardBody>
      </Card>
    </SimpleGrid>
  )
}
