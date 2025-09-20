import {
  Box,
  SimpleGrid,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  HStack,
  VStack,
  Text,
  Badge,
  Button,
  Icon,
  Progress,
  Divider,
} from "@chakra-ui/react"
import { ExternalLinkIcon, SettingsIcon, StarIcon, CheckCircleIcon } from "@chakra-ui/icons"
import { Link as RemixLink } from "@remix-run/react"
import type { PlayerInventories } from "~/types/inventory"

interface InventoryOverviewProps {
  inventories: PlayerInventories
  trackedCount: number
  onTrackAll: () => void
  onUntrackAll: () => void
}

export function InventoryOverview({
  inventories,
  trackedCount,
  onTrackAll,
  onUntrackAll,
}: InventoryOverviewProps) {
  // Calculate overview stats
  const allInventories = [
    ...(inventories.personal || []),
    ...(inventories.banks || []),
    ...(inventories.storage || []),
    ...(inventories.recovery || []),
  ]

  const totalInventories = allInventories.length
  const totalItems = allInventories.reduce((sum, inv) => sum + inv.items.length, 0)
  const totalUniqueItems = new Set(
    allInventories.flatMap((inv) => inv.items.map((item) => item.itemId))
  ).size

  // Find most valuable inventory (by item count)
  const mostValuableInventory = allInventories.reduce(
    (max, inv) => (inv.items.length > max.items.length ? inv : max),
    allInventories[0] || { name: "None", items: [] }
  )

  // Calculate tracking progress
  const trackingProgress = totalInventories > 0 ? (trackedCount / totalInventories) * 100 : 0

  // Get tier distribution across all inventories
  const tierCounts = allInventories.reduce((acc, inventory) => {
    inventory.items.forEach((item) => {
      const tier = item.tier ?? -1
      acc[tier] = (acc[tier] || 0) + item.quantity
    })
    return acc
  }, {} as Record<number, number>)

  const highTierItems = (tierCounts[4] || 0) + (tierCounts[5] || 0)

  const glassCardProps = {
    bg: "rgba(24, 35, 60, 0.9)",
    border: "1px solid rgba(148, 163, 184, 0.35)",
    borderRadius: { base: "2xl", md: "3xl" },
    backdropFilter: "blur(12px)",
    boxShadow: "xl",
  } as const

  return (
    <VStack spacing={6} align="stretch">
      {/* Main Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
        <Card {...glassCardProps} borderColor="rgba(94, 234, 212, 0.35)">
          <CardBody>
            <Stat>
              <StatLabel color="whiteAlpha.700">Total Inventories</StatLabel>
              <StatNumber color="teal.200">{totalInventories}</StatNumber>
              <StatHelpText color="whiteAlpha.600">{trackedCount} tracked</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card {...glassCardProps} borderColor="rgba(110, 231, 183, 0.35)">
          <CardBody>
            <Stat>
              <StatLabel color="whiteAlpha.700">Total Items</StatLabel>
              <StatNumber color="green.300">{totalItems.toLocaleString()}</StatNumber>
              <StatHelpText color="whiteAlpha.600">{totalUniqueItems} unique types</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card {...glassCardProps} borderColor="rgba(221, 214, 254, 0.35)">
          <CardBody>
            <Stat>
              <StatLabel color="whiteAlpha.700">High Tier Items</StatLabel>
              <StatNumber color="purple.200">{highTierItems.toLocaleString()}</StatNumber>
              <StatHelpText color="whiteAlpha.600">Tier 4 & 5 materials</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card {...glassCardProps} borderColor="rgba(45, 212, 191, 0.35)">
          <CardBody>
            <Stat>
              <StatLabel color="whiteAlpha.700">Tracking Progress</StatLabel>
              <StatNumber color="teal.200">{Math.round(trackingProgress)}%</StatNumber>
              <StatHelpText color="whiteAlpha.700">
                <Progress value={trackingProgress} size="sm" colorScheme="teal" mt={2} bg="whiteAlpha.200" />
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Quick Actions and Info */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        {/* Quick Actions Card */}
        <Card {...glassCardProps} borderColor="rgba(94, 234, 212, 0.35)">
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" fontWeight="bold" color="white">
                Quick Actions
              </Text>

              <VStack spacing={3} align="stretch">
                <HStack spacing={3}>
                  <Button
                    size="sm"
                    colorScheme="teal"
                    bg="teal.400"
                    _hover={{ bg: "teal.500" }}
                    onClick={onTrackAll}
                    isDisabled={trackedCount === totalInventories}
                    flex={1}
                  >
                    Track All
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    color="whiteAlpha.800"
                    _hover={{ bg: "whiteAlpha.200" }}
                    onClick={onUntrackAll}
                    isDisabled={trackedCount === 0}
                    flex={1}
                  >
                    Untrack All
                  </Button>
                </HStack>

                <Divider borderColor="whiteAlpha.200" />

                <Button
                  as={RemixLink}
                  to="/"
                  leftIcon={<Icon as={SettingsIcon} color="teal.200" />}
                  variant="ghost"
                  color="whiteAlpha.800"
                  _hover={{ bg: "whiteAlpha.200" }}
                  size="sm"
                  justifyContent="flex-start"
                >
                  View Dashboard
                </Button>
                <Button
                  as={RemixLink}
                  to="/recipes"
                  leftIcon={<Icon as={StarIcon} color="purple.200" />}
                  variant="ghost"
                  color="whiteAlpha.800"
                  _hover={{ bg: "whiteAlpha.200" }}
                  size="sm"
                  justifyContent="flex-start"
                >
                  Calculate Recipes
                </Button>
              </VStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Inventory Breakdown Card */}
        <Card {...glassCardProps} borderColor="rgba(233, 213, 255, 0.35)">
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" fontWeight="bold" color="white">
                Inventory Breakdown
              </Text>

              <VStack spacing={3} align="stretch">
                {inventories.personal && inventories.personal.length > 0 && (
                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={CheckCircleIcon} color="teal.200" />
                      <Text fontSize="sm" color="whiteAlpha.800">
                        Personal
                      </Text>
                    </HStack>
                    <Badge colorScheme="teal" variant="subtle" color="teal.100" bg="rgba(45, 212, 191, 0.18)">
                      {inventories.personal.length} inventories
                    </Badge>
                  </HStack>
                )}

                {inventories.banks && inventories.banks.length > 0 && (
                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={ExternalLinkIcon} color="green.200" />
                      <Text fontSize="sm" color="whiteAlpha.800">
                        Banks
                      </Text>
                    </HStack>
                    <Badge colorScheme="green" variant="subtle" color="green.100" bg="rgba(74, 222, 128, 0.16)">
                      {inventories.banks.length} banks
                    </Badge>
                  </HStack>
                )}

                {inventories.storage && inventories.storage.length > 0 && (
                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={SettingsIcon} color="purple.200" />
                      <Text fontSize="sm" color="whiteAlpha.800">
                        Storage
                      </Text>
                    </HStack>
                    <Badge colorScheme="purple" variant="subtle" color="purple.100" bg="rgba(192, 132, 252, 0.16)">
                      {inventories.storage.length} containers
                    </Badge>
                  </HStack>
                )}

                {inventories.recovery && inventories.recovery.length > 0 && (
                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={StarIcon} color="orange.200" />
                      <Text fontSize="sm" color="whiteAlpha.800">
                        Recovery
                      </Text>
                    </HStack>
                    <Badge colorScheme="orange" variant="subtle" color="orange.100" bg="rgba(251, 191, 36, 0.18)">
                      {inventories.recovery.length} chests
                    </Badge>
                  </HStack>
                )}

                {inventories.housing && inventories.housing.length > 0 && (
                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={ExternalLinkIcon} color="teal.200" />
                      <Text fontSize="sm" color="whiteAlpha.800">
                        Housing
                      </Text>
                    </HStack>
                    <Badge colorScheme="teal" variant="subtle" color="teal.100" bg="rgba(45, 212, 191, 0.18)">
                      {inventories.housing.length} containers
                    </Badge>
                  </HStack>
                )}

                {mostValuableInventory && (
                  <>
                    <Divider borderColor="whiteAlpha.200" />
                    <Box>
                      <Text fontSize="xs" color="whiteAlpha.600" mb={1}>
                        Largest Inventory:
                      </Text>
                      <Text fontSize="sm" fontWeight="medium" color="white">
                        {mostValuableInventory.name}
                      </Text>
                      <Text fontSize="xs" color="whiteAlpha.600">
                        {mostValuableInventory.items.length} items
                      </Text>
                    </Box>
                  </>
                )}
              </VStack>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Tracking Status Banner */}
      {trackedCount > 0 && (
        <Card
          {...glassCardProps}
          borderColor="rgba(56, 189, 248, 0.4)"
          bg="rgba(14, 59, 110, 0.82)"
        >
          <CardBody>
            <HStack spacing={4}>
              <Icon as={CheckCircleIcon} color="teal.200" boxSize={6} />
              <VStack align="start" spacing={1} flex={1}>
                <Text fontWeight="bold" color="white">
                  Tracking {trackedCount} of {totalInventories} inventories
                </Text>
                <Text fontSize="sm" color="whiteAlpha.800">
                  Tracked inventories will appear in your dashboard and can be used for recipe
                  calculations.
                </Text>
              </VStack>
            </HStack>
          </CardBody>
        </Card>
      )}
    </VStack>
  )
}
