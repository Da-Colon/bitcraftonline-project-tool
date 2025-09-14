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
  Tooltip,
} from "@chakra-ui/react"
import { ExternalLinkIcon, SettingsIcon, StarIcon, CheckCircleIcon } from "@chakra-ui/icons"
import { Link as RemixLink } from "@remix-run/react"
import type { ClaimInventoriesResponse } from "~/types/inventory"

interface ClaimOverviewProps {
  claimData: ClaimInventoriesResponse
  trackedCount: number
  onTrackAll: () => void
  onUntrackAll: () => void
  onChangeClaim: () => void
}

export function ClaimOverview({
  claimData,
  trackedCount,
  onTrackAll,
  onUntrackAll,
  onChangeClaim,
}: ClaimOverviewProps) {
  // Calculate overview stats
  const totalInventories = claimData.inventories.length
  const totalItems = claimData.inventories.reduce((sum, inv) => sum + inv.items.length, 0)
  const totalUniqueItems = new Set(
    claimData.inventories.flatMap((inv) => inv.items.map((item) => item.itemId))
  ).size

  // Calculate building types
  const buildingTypes = new Set(
    claimData.inventories
      .map(inv => inv.buildingName)
      .filter(Boolean)
  ).size

  // Calculate tracking progress
  const trackingProgress = totalInventories > 0 ? (trackedCount / totalInventories) * 100 : 0

  // Get tier distribution across all inventories
  const tierCounts = claimData.inventories.reduce((acc, inventory) => {
    inventory.items.forEach((item) => {
      const tier = item.tier ?? -1
      acc[tier] = (acc[tier] || 0) + item.quantity
    })
    return acc
  }, {} as Record<number, number>)

  const highTierItems = (tierCounts[4] || 0) + (tierCounts[5] || 0)

  // Find most valuable building (by item count)
  const mostValuableBuilding = claimData.inventories.reduce(
    (max, inv) => (inv.items.length > max.items.length ? inv : max),
    claimData.inventories[0] || { buildingName: "None", items: [] }
  )

  return (
    <VStack spacing={6} align="stretch">
      {/* Main Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Buildings</StatLabel>
              <StatNumber color="purple.500">{totalInventories}</StatNumber>
              <StatHelpText>
                {trackedCount} tracked
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Items</StatLabel>
              <StatNumber color="green.500">{totalItems.toLocaleString()}</StatNumber>
              <StatHelpText>
                {totalUniqueItems} unique types
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>High Tier Items</StatLabel>
              <StatNumber color="orange.500">{highTierItems.toLocaleString()}</StatNumber>
              <StatHelpText>
                Tier 4 & 5 materials
              </StatHelpText>
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

      {/* Quick Actions and Claim Info */}
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
                
                <Button
                  size="sm"
                  colorScheme="purple"
                  variant="outline"
                  onClick={onChangeClaim}
                  leftIcon={<Icon as={ExternalLinkIcon} />}
                >
                  Change Claim
                </Button>
                
                <Divider />
                
                <Button
                  as={RemixLink}
                  to="/dashboard"
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

        {/* Claim Information Card */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" fontWeight="bold">
                Claim Information
              </Text>
              
              <VStack spacing={3} align="stretch">
                <Box>
                  <Text fontSize="sm" color="gray.500" mb={1}>
                    Claim Name:
                  </Text>
                  <Text fontSize="md" fontWeight="semibold">
                    {claimData.claimName}
                  </Text>
                </Box>
                
                <Box>
                  <Text fontSize="sm" color="gray.500" mb={1}>
                    Claim ID:
                  </Text>
                  <Tooltip label="Click to copy" placement="top">
                    <Text 
                      fontSize="sm" 
                      fontFamily="mono" 
                      color="blue.600"
                      cursor="pointer"
                      _hover={{ textDecoration: "underline" }}
                      onClick={() => navigator.clipboard.writeText(claimData.claimId)}
                    >
                      {claimData.claimId}
                    </Text>
                  </Tooltip>
                </Box>

                <Divider />

                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.600">
                    Building Types:
                  </Text>
                  <Badge colorScheme="purple">
                    {buildingTypes} types
                  </Badge>
                </HStack>

                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.600">
                    Storage Buildings:
                  </Text>
                  <Badge colorScheme="blue">
                    {totalInventories} buildings
                  </Badge>
                </HStack>

                {mostValuableBuilding && (
                  <>
                    <Divider />
                    <Box>
                      <Text fontSize="xs" color="gray.500" mb={1}>
                        Largest Storage:
                      </Text>
                      <Text fontSize="sm" fontWeight="medium">
                        {mostValuableBuilding.buildingName || "Unknown Building"}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {mostValuableBuilding.items.length} items
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
        <Card bg="purple.50" borderColor="purple.200">
          <CardBody>
            <HStack spacing={4}>
              <Icon as={CheckCircleIcon} color="purple.500" boxSize={6} />
              <VStack align="start" spacing={1} flex={1}>
                <Text fontWeight="bold" color="purple.700">
                  Tracking {trackedCount} of {totalInventories} claim buildings
                </Text>
                <Text fontSize="sm" color="purple.600">
                  Tracked buildings will appear in your dashboard and can be used for recipe calculations.
                </Text>
              </VStack>
            </HStack>
          </CardBody>
        </Card>
      )}
    </VStack>
  )
}
