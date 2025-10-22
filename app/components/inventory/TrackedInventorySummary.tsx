import {
  Box,
  Text,
  VStack,
  HStack,
  Badge,
  Collapse,
  Button,
  Card,
  CardBody,
  Icon,
  Link as ChakraLink,
} from "@chakra-ui/react"
import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons"
import { Link as RemixLink } from "@remix-run/react"
import { useState } from "react"
import { useSharedPlayerInventoryTracking } from "~/contexts/PlayerInventoryTrackingContext"
import type { InventorySource, TrackedInventorySnapshot } from "~/types/inventory-tracking"

interface TrackedInventorySummaryProps {
  currentClaimId?: string
  currentClaimName?: string
}

const SOURCE_LABELS: Record<InventorySource, string> = {
  personal: "Personal Inventories",
  bank: "Bank Inventories",
  storage: "Storage Containers",
  recovery: "Recovery Chests",
  housing: "Housing Inventories",
  claim: "Claim Inventories",
}

const SOURCE_ICONS: Record<InventorySource, string> = {
  personal: "👤",
  bank: "🏦",
  storage: "📦",
  recovery: "🔄",
  housing: "🏠",
  claim: "🏰",
}

export function TrackedInventorySummary({
  currentClaimId,
  currentClaimName,
}: TrackedInventorySummaryProps) {
  const { snapshots, getSnapshotsByClaim } = useSharedPlayerInventoryTracking()
  const [isExpanded, setIsExpanded] = useState(false)

  // Calculate summary from snapshots
  const summary = {
    total: snapshots.length,
    bySource: snapshots.reduce((acc, snapshot) => {
      acc[snapshot.source] = (acc[snapshot.source] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    byClaim: snapshots
      .filter(s => s.source === 'claim' && s.claimId)
      .reduce((acc, snapshot) => {
        acc[snapshot.claimId!] = (acc[snapshot.claimId!] || 0) + 1
        return acc
      }, {} as Record<string, number>)
  }

  const currentClaimCount = currentClaimId ? getSnapshotsByClaim(currentClaimId).length : 0
  const claimInventoriesCount = summary.bySource.claim || 0

  if (summary.total === 0) {
    return (
      <Card
        bg="rgba(24, 35, 60, 0.9)"
        border="1px solid"
        borderColor="whiteAlpha.200"
        borderRadius="2xl"
      >
        <CardBody p={6}>
          <VStack spacing={4}>
            <Text fontSize="2xl">📊</Text>
            <Text color="white" fontSize="lg" fontWeight="semibold">
              No Inventories Tracked
            </Text>
            <Text color="whiteAlpha.800" textAlign="center" fontSize="sm">
              Start tracking inventories to see them here. Track personal inventories, claim
              buildings, and more.
            </Text>
            <HStack spacing={3}>
              <Button
                as={RemixLink}
                to="/inventory"
                size="sm"
                colorScheme="teal"
                bg="teal.400"
                _hover={{ bg: "teal.500" }}
              >
                Track Personal Inventories
              </Button>
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card
      bg="rgba(24, 35, 60, 0.9)"
      border="1px solid"
      borderColor="whiteAlpha.200"
      borderRadius="2xl"
    >
      <CardBody p={6}>
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between" align="center">
            <HStack spacing={3}>
              <Text fontSize="2xl">📊</Text>
              <VStack align="start" spacing={0}>
                <Text color="white" fontSize="lg" fontWeight="semibold">
                  Your Tracking Summary
                </Text>
                <Text color="whiteAlpha.800" fontSize="sm">
                  {summary.total} total tracked inventories
                </Text>
              </VStack>
            </HStack>
            <Button
              size="sm"
              variant="ghost"
              color="teal.200"
              _hover={{ bg: "rgba(45, 212, 191, 0.12)" }}
              onClick={() => setIsExpanded(!isExpanded)}
              rightIcon={<Icon as={isExpanded ? ChevronDownIcon : ChevronRightIcon} />}
            >
              {isExpanded ? "Hide Details" : "Show Details"}
            </Button>
          </HStack>

          <Collapse in={isExpanded} animateOpacity>
            <VStack spacing={4} align="stretch" pt={2}>
              {/* Current Claim Status */}
              {currentClaimId && (
                <Box
                  p={4}
                  bg="rgba(45, 212, 191, 0.08)"
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="teal.300"
                >
                  <VStack spacing={2} align="stretch">
                    <HStack justify="space-between">
                      <Text color="teal.100" fontSize="sm" fontWeight="medium">
                        Current Claim: {currentClaimName || `Claim ${currentClaimId}`}
                      </Text>
                      <Badge colorScheme="teal" variant="solid" fontSize="xs">
                        {currentClaimCount} tracked
                      </Badge>
                    </HStack>
                  </VStack>
                </Box>
              )}

              {/* Source Breakdown */}
              <VStack spacing={3} align="stretch">
                <Text color="whiteAlpha.900" fontSize="sm" fontWeight="medium">
                  Breakdown by Source:
                </Text>
                <VStack spacing={2} align="stretch">
                  {Object.entries(summary.bySource).map(([source, count]) => (
                    <HStack key={source} justify="space-between" align="center">
                      <HStack spacing={2}>
                        <Text fontSize="sm">{SOURCE_ICONS[source as InventorySource]}</Text>
                        <Text color="whiteAlpha.900" fontSize="sm">
                          {SOURCE_LABELS[source as InventorySource]}
                        </Text>
                      </HStack>
                      <Badge
                        variant="subtle"
                        colorScheme="teal"
                        fontSize="xs"
                        bg="rgba(45, 212, 191, 0.12)"
                        color="teal.100"
                      >
                        {count}
                      </Badge>
                    </HStack>
                  ))}
                </VStack>
              </VStack>

              {/* Claim Breakdown (if any claim inventories) */}
              {claimInventoriesCount > 0 && Object.keys(summary.byClaim).length > 0 && (
                <VStack spacing={3} align="stretch">
                  <Text color="whiteAlpha.900" fontSize="sm" fontWeight="medium">
                    Claim Inventories:
                  </Text>
                  <VStack spacing={2} align="stretch">
                    {Object.entries(summary.byClaim).map(([claimId, count]) => (
                      <HStack key={claimId} justify="space-between" align="center">
                        <HStack spacing={2}>
                          <Text fontSize="sm">🏰</Text>
                          <Text color="whiteAlpha.900" fontSize="sm">
                            {claimId === currentClaimId ? (
                              <Text as="span" color="teal.200" fontWeight="medium">
                                {currentClaimName || `Claim ${claimId}`} (current)
                              </Text>
                            ) : (
                              `Claim ${claimId}`
                            )}
                          </Text>
                        </HStack>
                        <Badge
                          variant="subtle"
                          colorScheme={claimId === currentClaimId ? "teal" : "gray"}
                          fontSize="xs"
                          bg={
                            claimId === currentClaimId
                              ? "rgba(45, 212, 191, 0.12)"
                              : "rgba(148, 163, 184, 0.12)"
                          }
                          color={claimId === currentClaimId ? "teal.100" : "whiteAlpha.700"}
                        >
                          {count}
                        </Badge>
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              )}

              {/* Quick Actions */}
              <HStack spacing={3} pt={2}>
                <Button
                  as={RemixLink}
                  to="/inventory"
                  size="sm"
                  variant="ghost"
                  color="teal.200"
                  _hover={{ bg: "rgba(45, 212, 191, 0.12)" }}
                >
                  Manage Personal
                </Button>
                <Button
                  as={RemixLink}
                  to="/recipes"
                  size="sm"
                  variant="ghost"
                  color="teal.200"
                  _hover={{ bg: "rgba(45, 212, 191, 0.12)" }}
                >
                  View Recipes
                </Button>
              </HStack>
            </VStack>
          </Collapse>
        </VStack>
      </CardBody>
    </Card>
  )
}
