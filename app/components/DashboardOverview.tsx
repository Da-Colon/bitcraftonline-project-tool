import {
  Badge,
  Card,
  CardBody,
  Divider,
  HStack,
  SimpleGrid,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  VStack,
  Button,
  Icon,
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
    <VStack spacing={{ base: 8, md: 10 }} align="stretch">
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5}>
        <Card bg="rgba(29, 42, 72, 0.85)" border="1px solid" borderColor="whiteAlpha.300" borderRadius="xl">
          <CardBody>
            <Stat>
              <StatLabel color="whiteAlpha.900">Tracked Inventories</StatLabel>
              <StatNumber color="white">{trackedInventoriesCount}</StatNumber>
              <StatHelpText color="whiteAlpha.800">
                {trackedInventoriesCount === 0 ? "Nothing synced yet" : "Personal + claim storage"}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="rgba(29, 42, 72, 0.85)" border="1px solid" borderColor="whiteAlpha.300" borderRadius="xl">
          <CardBody>
            <Stat>
              <StatLabel color="whiteAlpha.900">Total Materials</StatLabel>
              <StatNumber color="teal.100">{totalItems.toLocaleString()}</StatNumber>
              <StatHelpText color="whiteAlpha.800">{uniqueItemTypes} unique types</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="rgba(29, 42, 72, 0.85)" border="1px solid" borderColor="whiteAlpha.300" borderRadius="xl">
          <CardBody>
            <Stat>
              <StatLabel color="whiteAlpha.900">Tier 5 Stash</StatLabel>
              <StatNumber color="purple.100">{tierCounts[5]?.toLocaleString() || 0}</StatNumber>
              <StatHelpText color="whiteAlpha.800">
                {highestTierItems.length} high-tier entries
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="rgba(29, 42, 72, 0.85)" border="1px solid" borderColor="whiteAlpha.300" borderRadius="xl">
          <CardBody>
            <Stat>
              <StatLabel color="whiteAlpha.900">Storage Efficiency</StatLabel>
              <StatNumber color="teal.100">
                {trackedInventoriesCount > 0 ? Math.round(totalItems / trackedInventoriesCount) : 0}
              </StatNumber>
              <StatHelpText color="whiteAlpha.800">Avg items per tracked spot</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        <Card bg="rgba(24, 35, 60, 0.9)" border="1px solid" borderColor="whiteAlpha.300" borderRadius="2xl">
          <CardBody>
            <VStack align="stretch" spacing={5}>
              <Text fontSize="lg" fontWeight="bold" color="white">
                Session Planner
              </Text>
              <Text color="whiteAlpha.900" fontSize="sm">
                Line up your next BitCraft play session with quick jumps into the tools you need.
                Follow the loop: track → aggregate → craft.
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
                  Tune Personal Inventories
                </Button>
                <Button
                  as={RemixLink}
                  to="/claim-inventories"
                  leftIcon={<Icon as={ExternalLinkIcon} />}
                  variant="outline"
                  colorScheme="purple"
                  justifyContent="flex-start"
                >
                  Sync Claim Storage
                </Button>
                <Button
                  as={RemixLink}
                  to="/recipes"
                  leftIcon={<Icon as={StarIcon} />}
                  variant="outline"
                  colorScheme="green"
                  justifyContent="flex-start"
                >
                  Launch Recipe Calculator
                </Button>
              </VStack>
            </VStack>
          </CardBody>
        </Card>

        <Card bg="rgba(24, 35, 60, 0.9)" border="1px solid" borderColor="whiteAlpha.300" borderRadius="2xl">
          <CardBody>
            <VStack align="stretch" spacing={5}>
              <Text fontSize="lg" fontWeight="bold" color="white">
                High-Tier Highlights
              </Text>
              {mostValuableItems.length > 0 ? (
                <VStack spacing={4} align="stretch">
                  {mostValuableItems.map((item, index) => (
                    <HStack key={`${item.itemId}-${index}`} justify="space-between" align="flex-start">
                      <VStack align="start" spacing={1} flex={1}>
                        <Text fontSize="sm" fontWeight="medium" color="white">
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
                <Text color="whiteAlpha.700" fontSize="sm" textAlign="center" py={4}>
                  As you gather higher tiers, they will surface here for quick planning.
                </Text>
              )}
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>
    </VStack>
  )
}
