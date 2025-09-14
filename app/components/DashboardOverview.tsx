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
  Divider,
} from "@chakra-ui/react"
import { ExternalLinkIcon, SettingsIcon, StarIcon } from "@chakra-ui/icons"
import { Link as RemixLink } from "@remix-run/react"
import type { CombinedInventoryItem } from "~/utils/combineAllTrackedInventories"

interface DashboardOverviewProps {
  trackedInventoriesCount: number
  totalItems: number
  combinedItems: CombinedInventoryItem[]
}

export function DashboardOverview({
  trackedInventoriesCount,
  totalItems,
  combinedItems,
}: DashboardOverviewProps) {
  // Calculate overview stats
  const uniqueItemTypes = combinedItems.length
  const tierCounts = combinedItems.reduce((acc, item) => {
    const tier = item.tier ?? -1
    acc[tier] = (acc[tier] || 0) + item.totalQuantity
    return acc
  }, {} as Record<number, number>)

  const highestTierItems = combinedItems.filter((item) => (item.tier ?? -1) === 5)
  const mostValuableItems = combinedItems
    .filter((item) => (item.tier ?? -1) >= 4)
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 3)

  return (
    <VStack spacing={6} align="stretch">
      {/* Overview Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Tracked Inventories</StatLabel>
              <StatNumber color="blue.500">{trackedInventoriesCount}</StatNumber>
              <StatHelpText>
                {trackedInventoriesCount === 0 ? "No inventories tracked" : "Active tracking"}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Items</StatLabel>
              <StatNumber color="green.500">{totalItems.toLocaleString()}</StatNumber>
              <StatHelpText>{uniqueItemTypes} unique types</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Tier 5 Items</StatLabel>
              <StatNumber color="purple.500">{tierCounts[5]?.toLocaleString() || 0}</StatNumber>
              <StatHelpText>Highest tier materials</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Storage Efficiency</StatLabel>
              <StatNumber color="teal.500">
                {trackedInventoriesCount > 0 ? Math.round(totalItems / trackedInventoriesCount) : 0}
              </StatNumber>
              <StatHelpText>Avg items per inventory</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Quick Actions and Valuable Items */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        {/* Quick Actions Card */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" fontWeight="bold" mb={2}>
                Quick Actions
              </Text>
              <VStack spacing={3} align="stretch">
                <Button
                  as={RemixLink}
                  to="/inventory"
                  leftIcon={<Icon as={SettingsIcon} />}
                  variant="outline"
                  colorScheme="blue"
                  justifyContent="flex-start"
                >
                  Manage Personal Inventories
                </Button>
                <Button
                  as={RemixLink}
                  to="/claim-inventories"
                  leftIcon={<Icon as={ExternalLinkIcon} />}
                  variant="outline"
                  colorScheme="purple"
                  justifyContent="flex-start"
                >
                  Manage Claim Inventories
                </Button>
                <Button
                  as={RemixLink}
                  to="/recipes"
                  leftIcon={<Icon as={StarIcon} />}
                  variant="outline"
                  colorScheme="green"
                  justifyContent="flex-start"
                >
                  Calculate Recipes
                </Button>
              </VStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Most Valuable Items Card */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" fontWeight="bold" mb={2}>
                High-Value Items
              </Text>
              {mostValuableItems.length > 0 ? (
                <VStack spacing={3} align="stretch">
                  {mostValuableItems.map((item, index) => (
                    <HStack key={`${item.itemId}-${index}`} justify="space-between">
                      <VStack align="start" spacing={0} flex={1}>
                        <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                          {item.name || item.itemId}
                        </Text>
                        <HStack spacing={2}>
                          {item.category && (
                            <Badge size="sm" colorScheme="blue" variant="subtle">
                              {item.category}
                            </Badge>
                          )}
                          {item.tier !== undefined && item.tier >= 0 && (
                            <Badge size="sm" colorScheme="purple" variant="subtle">
                              T{item.tier}
                            </Badge>
                          )}
                        </HStack>
                      </VStack>
                      <Badge colorScheme="green" fontSize="sm">
                        {item.totalQuantity.toLocaleString()}
                      </Badge>
                    </HStack>
                  ))}
                </VStack>
              ) : (
                <Text color="gray.500" fontSize="sm" textAlign="center" py={4}>
                  No high-tier items tracked yet
                </Text>
              )}
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Tier Distribution */}
      {Object.keys(tierCounts).length > 0 && (
        <Card>
          <CardBody>
            <Text fontSize="lg" fontWeight="bold" mb={4}>
              Tier Distribution
            </Text>
            <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacing={4}>
              {Object.entries(tierCounts)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([tier, count]) => (
                  <VStack key={tier} spacing={2}>
                    <Badge
                      size="lg"
                      colorScheme={
                        parseInt(tier) >= 4 ? "purple" : parseInt(tier) >= 2 ? "blue" : "gray"
                      }
                      variant="solid"
                      px={3}
                      py={1}
                    >
                      {parseInt(tier) >= 0 ? `Tier ${tier}` : "No Tier"}
                    </Badge>
                    <Text fontSize="sm" fontWeight="bold">
                      {count.toLocaleString()}
                    </Text>
                  </VStack>
                ))}
            </SimpleGrid>
          </CardBody>
        </Card>
      )}
    </VStack>
  )
}
