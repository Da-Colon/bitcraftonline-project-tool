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

  return (
    <VStack spacing={6} align="stretch">
      {/* Main Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Inventories</StatLabel>
              <StatNumber color="blue.500">{totalInventories}</StatNumber>
              <StatHelpText>{trackedCount} tracked</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Items</StatLabel>
              <StatNumber color="green.500">{totalItems.toLocaleString()}</StatNumber>
              <StatHelpText>{totalUniqueItems} unique types</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>High Tier Items</StatLabel>
              <StatNumber color="purple.500">{highTierItems.toLocaleString()}</StatNumber>
              <StatHelpText>Tier 4 & 5 materials</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Tracking Progress</StatLabel>
              <StatNumber color="teal.500">{Math.round(trackingProgress)}%</StatNumber>
              <StatHelpText>
                <Progress value={trackingProgress} size="sm" colorScheme="teal" mt={2} />
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Quick Actions and Info */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        {/* Quick Actions Card */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" fontWeight="bold">
                Quick Actions
              </Text>

              <VStack spacing={3} align="stretch">
                <HStack spacing={3}>
                  <Button
                    size="sm"
                    colorScheme="green"
                    variant="outline"
                    onClick={onTrackAll}
                    isDisabled={trackedCount === totalInventories}
                    flex={1}
                  >
                    Track All
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="red"
                    variant="outline"
                    onClick={onUntrackAll}
                    isDisabled={trackedCount === 0}
                    flex={1}
                  >
                    Untrack All
                  </Button>
                </HStack>

                <Divider />

                <Button
                  as={RemixLink}
                  to="/"
                  leftIcon={<Icon as={SettingsIcon} />}
                  variant="outline"
                  colorScheme="blue"
                  size="sm"
                  justifyContent="flex-start"
                >
                  View Dashboard
                </Button>
                <Button
                  as={RemixLink}
                  to="/recipes"
                  leftIcon={<Icon as={StarIcon} />}
                  variant="outline"
                  colorScheme="green"
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
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" fontWeight="bold">
                Inventory Breakdown
              </Text>

              <VStack spacing={3} align="stretch">
                {inventories.personal && inventories.personal.length > 0 && (
                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={CheckCircleIcon} color="blue.500" />
                      <Text fontSize="sm">Personal</Text>
                    </HStack>
                    <Badge colorScheme="blue">{inventories.personal.length} inventories</Badge>
                  </HStack>
                )}

                {inventories.banks && inventories.banks.length > 0 && (
                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={ExternalLinkIcon} color="green.500" />
                      <Text fontSize="sm">Banks</Text>
                    </HStack>
                    <Badge colorScheme="green">{inventories.banks.length} banks</Badge>
                  </HStack>
                )}

                {inventories.storage && inventories.storage.length > 0 && (
                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={SettingsIcon} color="purple.500" />
                      <Text fontSize="sm">Storage</Text>
                    </HStack>
                    <Badge colorScheme="purple">{inventories.storage.length} containers</Badge>
                  </HStack>
                )}

                {inventories.recovery && inventories.recovery.length > 0 && (
                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={StarIcon} color="orange.500" />
                      <Text fontSize="sm">Recovery</Text>
                    </HStack>
                    <Badge colorScheme="orange">{inventories.recovery.length} chests</Badge>
                  </HStack>
                )}

                {mostValuableInventory && (
                  <>
                    <Divider />
                    <Box>
                      <Text fontSize="xs" color="gray.500" mb={1}>
                        Largest Inventory:
                      </Text>
                      <Text fontSize="sm" fontWeight="medium">
                        {mostValuableInventory.name}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
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
        <Card bg="blue.50" borderColor="blue.200">
          <CardBody>
            <HStack spacing={4}>
              <Icon as={CheckCircleIcon} color="blue.500" boxSize={6} />
              <VStack align="start" spacing={1} flex={1}>
                <Text fontWeight="bold" color="blue.700">
                  Tracking {trackedCount} of {totalInventories} inventories
                </Text>
                <Text fontSize="sm" color="blue.600">
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
