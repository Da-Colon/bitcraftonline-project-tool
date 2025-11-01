import {
  VStack,
  HStack,
  Box,
  Text,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Heading,
  SimpleGrid,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
} from "@chakra-ui/react"

import type { RecipeBreakdownItem } from "~/types/recipes"
import { groupBy, sumBy } from "~/utils/aggregation"

interface TierSummaryViewProps {
  breakdown: RecipeBreakdownItem[]
  isRecipeComplete: boolean
  onClearSelection: () => void
}

export function TierSummaryView({
  breakdown,
  isRecipeComplete,
  onClearSelection,
}: TierSummaryViewProps) {
  const tierGroups = groupBy(breakdown, item => item.tier)

  // Calculate effort per tier
  const tierEffort = sumBy(breakdown, item => item.tier, item => item.effortAfterInventory || 0)

  const sortedTiers = Object.keys(tierGroups)
    .map(Number)
    .sort((a, b) => b - a) // Highest tier first

  const cardStyles = {
    bg: "rgba(24,35,60,0.9)",
    border: "1px solid rgba(148, 163, 184, 0.35)",
    borderRadius: "2xl",
    boxShadow: "xl",
    backdropFilter: "blur(12px)",
  } as const

  return (
    <VStack spacing={4} align="stretch">
      {isRecipeComplete && (
        <Alert
          status="success"
          bg="rgba(45, 212, 191, 0.18)"
          border="1px solid rgba(45, 212, 191, 0.35)"
          borderRadius="xl"
          color="white"
        >
          <AlertIcon color="teal.200" />
          <AlertTitle mr={2} color="white">
            Recipe Complete!
          </AlertTitle>
          <AlertDescription flex={1} color="whiteAlpha.900">
            You have all materials needed to craft this item.
          </AlertDescription>
          <Button
            colorScheme="teal"
            size="sm"
            onClick={onClearSelection}
            bg="teal.500"
            color="gray.900"
            _hover={{ bg: "teal.400" }}
          >
            Clear Selection
          </Button>
        </Alert>
      )}
      {sortedTiers.map((tier) => (
        <Card key={tier} {...cardStyles}>
          <CardHeader pb={1}>
            <HStack justify="space-between">
              <Heading size="sm" color="white">
                Tier {tier}
              </Heading>
              <HStack spacing={2}>
                <Badge colorScheme="teal" size="sm" borderRadius="full" px={2}>
                  {tierGroups[tier].length} items
                </Badge>
                {(tierEffort[tier] || 0) > 0 && (
                  <Badge colorScheme="pink" size="sm" borderRadius="full" px={2}>
                    🔥 {(tierEffort[tier] || 0).toLocaleString()}
                  </Badge>
                )}
              </HStack>
            </HStack>
          </CardHeader>
          <CardBody pt={0}>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={2}>
              {tierGroups[tier].map((item) => (
                <Box
                  key={item.itemId}
                  p={2}
                  border="1px solid rgba(148, 163, 184, 0.2)"
                  borderRadius="xl"
                  bg={item.actualRequired > 0 ? "rgba(190, 24, 93, 0.18)" : "rgba(45, 212, 191, 0.18)"}
                >
                  <Text fontWeight="medium" fontSize="sm" color="white">
                    {item.name}
                  </Text>
                  <HStack justify="space-between" mt={1}>
                    <Text fontSize="xs" color="whiteAlpha.800">
                      Need: {item.actualRequired.toLocaleString()}
                    </Text>
                    <Text fontSize="xs" color="whiteAlpha.800">
                      Have: {item.currentInventory.toLocaleString()}
                    </Text>
                  </HStack>
                  {(item.effortAfterInventory || 0) > 0 && (
                    <Text fontSize="xs" color="teal.200" mt={1}>
                      🔥 {(item.effortAfterInventory || 0).toLocaleString()} effort
                    </Text>
                  )}
                </Box>
              ))}
            </SimpleGrid>
          </CardBody>
        </Card>
      ))}
    </VStack>
  )
}
