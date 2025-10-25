import { CheckCircleIcon } from "@chakra-ui/icons"
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
  // Button,
  Icon,
  Progress,
  Divider,
  Tooltip,
} from "@chakra-ui/react"
// import { Link as RemixLink } from "@remix-run/react"

import type { ClaimInventoriesResponse } from "~/types/inventory"

interface ClaimOverviewProps {
  claimData: ClaimInventoriesResponse
  trackedCount: number
  totalTrackedCount?: number
}

export function ClaimOverview({
  claimData,
  trackedCount,
  totalTrackedCount,
}: ClaimOverviewProps) {
  // Calculate overview stats
  const totalInventories = claimData.inventories.length
  const totalItems = claimData.inventories.reduce((sum, inv) => sum + inv.items.length, 0)
  const totalUniqueItems = new Set(
    claimData.inventories.flatMap((inv) => inv.items.map((item) => item.itemId))
  ).size

  // Calculate building types
  const buildingTypes = new Set(
    claimData.inventories.map((inv) => inv.buildingName).filter(Boolean)
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
        <Card {...glassCardProps} borderColor="rgba(221, 214, 254, 0.35)">
          <CardBody>
            <Stat>
              <StatLabel color="whiteAlpha.700">Total Buildings</StatLabel>
              <StatNumber color="purple.200">{totalInventories}</StatNumber>
              <StatHelpText color="whiteAlpha.600">
                {trackedCount} tracked
                {totalTrackedCount && totalTrackedCount > trackedCount && (
                  <Text as="span" color="teal.200" ml={1}>
                    ({totalTrackedCount} total)
                  </Text>
                )}
              </StatHelpText>
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

        <Card {...glassCardProps} borderColor="rgba(249, 168, 212, 0.35)">
          <CardBody>
            <Stat>
              <StatLabel color="whiteAlpha.700">High Tier Items</StatLabel>
              <StatNumber color="pink.200">{highTierItems.toLocaleString()}</StatNumber>
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
                <Progress
                  value={trackingProgress}
                  size="sm"
                  colorScheme="teal"
                  mt={2}
                  bg="whiteAlpha.200"
                />
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Claim Info */}
      <SimpleGrid columns={{ base: 1, lg: 1 }} spacing={6}>

        {/* Claim Information Card */}
        <Card {...glassCardProps} borderColor="rgba(233, 213, 255, 0.35)">
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" fontWeight="bold" color="white">
                Claim Information
              </Text>

              <VStack spacing={3} align="stretch">
                <Box>
                  <Text fontSize="sm" color="whiteAlpha.600" mb={1}>
                    Claim Name:
                  </Text>
                  <Text fontSize="md" fontWeight="semibold" color="white">
                    {claimData.claimName}
                  </Text>
                </Box>

                <Box>
                  <Text fontSize="sm" color="whiteAlpha.600" mb={1}>
                    Claim ID:
                  </Text>
                  <Tooltip label="Click to copy" placement="top">
                    <Text
                      fontSize="sm"
                      fontFamily="mono"
                      color="teal.200"
                      cursor="pointer"
                      _hover={{ textDecoration: "underline" }}
                      onClick={() => navigator.clipboard.writeText(claimData.claimId)}
                    >
                      {claimData.claimId}
                    </Text>
                  </Tooltip>
                </Box>

                <Divider borderColor="whiteAlpha.200" />

                <HStack justify="space-between">
                  <Text fontSize="sm" color="whiteAlpha.700">
                    Building Types:
                  </Text>
                  <Badge
                    colorScheme="purple"
                    variant="subtle"
                    color="purple.100"
                    bg="rgba(192, 132, 252, 0.16)"
                  >
                    {buildingTypes} types
                  </Badge>
                </HStack>

                <HStack justify="space-between">
                  <Text fontSize="sm" color="whiteAlpha.700">
                    Storage Buildings:
                  </Text>
                  <Badge
                    colorScheme="teal"
                    variant="subtle"
                    color="teal.100"
                    bg="rgba(45, 212, 191, 0.18)"
                  >
                    {totalInventories} buildings
                  </Badge>
                </HStack>

                {mostValuableBuilding && (
                  <>
                    <Divider borderColor="whiteAlpha.200" />
                    <Box>
                      <Text fontSize="xs" color="whiteAlpha.600" mb={1}>
                        Largest Storage:
                      </Text>
                      <Text fontSize="sm" fontWeight="medium" color="white">
                        {mostValuableBuilding.buildingName || "Unknown Building"}
                      </Text>
                      <Text fontSize="xs" color="whiteAlpha.600">
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
        <Card
          {...glassCardProps}
          borderColor="rgba(192, 132, 252, 0.45)"
          bg="rgba(76, 29, 149, 0.58)"
        >
          <CardBody>
            <HStack spacing={4}>
              <Icon as={CheckCircleIcon} color="teal.200" boxSize={6} />
              <VStack align="start" spacing={1} flex={1}>
                <Text fontWeight="bold" color="white">
                  Tracking {trackedCount} of {totalInventories} claim buildings
                </Text>
                <Text fontSize="sm" color="whiteAlpha.800">
                  Tracked buildings will appear in your dashboard and can be used for recipe
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
