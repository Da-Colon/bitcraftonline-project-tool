import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons";
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
  Spinner,
  Progress,
  Divider,
  SimpleGrid,
} from "@chakra-ui/react";
import { useFetcher } from "@remix-run/react";
import React, { useState, useCallback } from "react";

import type { Craft } from "~/types/crafts";

interface PlayerCraftsPanelProps {
  playerId?: string;
}

export function PlayerCraftsPanel({ playerId }: PlayerCraftsPanelProps) {
  const activeFetcher = useFetcher<{ crafts?: Craft[]; totalCount?: number; error?: string }>();
  const completedFetcher = useFetcher<{ crafts?: Craft[]; totalCount?: number; error?: string }>();
  const [isExpanded, setIsExpanded] = useState(false);

  // Load crafts when playerId changes
  const loadCrafts = useCallback(() => {
    if (playerId) {
      activeFetcher.load(`/api/players/${playerId}/crafts?completed=false`);
      completedFetcher.load(`/api/players/${playerId}/crafts?completed=true`);
    }
  }, [playerId, activeFetcher, completedFetcher]);

  React.useEffect(() => {
    loadCrafts();
  }, [loadCrafts]);

  const activeCrafts = activeFetcher.data?.crafts || [];
  const completedCrafts = completedFetcher.data?.crafts || [];
  const isLoading = activeFetcher.state === "loading" || completedFetcher.state === "loading";
  const error = activeFetcher.data?.error || completedFetcher.data?.error;

  const totalCount = activeCrafts.length + completedCrafts.length;

  if (error) {
    return (
      <Card
        bg="rgba(63, 34, 53, 0.85)"
        border="1px solid rgba(248, 180, 217, 0.35)"
        borderRadius="2xl"
      >
        <CardBody p={6}>
          <VStack spacing={3}>
            <Text color="pink.200" textAlign="center" fontWeight="semibold">
              Error loading crafts: {error}
            </Text>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card
        bg="rgba(24, 35, 60, 0.9)"
        border="1px solid rgba(148, 163, 184, 0.35)"
        borderRadius="2xl"
      >
        <CardBody p={6}>
          <VStack spacing={4}>
            <Spinner size="lg" color="teal.300" />
            <Text color="whiteAlpha.800">Loading your crafts...</Text>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card
      bg="rgba(24, 35, 60, 0.9)"
      border="1px solid rgba(148, 163, 184, 0.35)"
      borderRadius="2xl"
    >
      <CardBody p={6}>
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between" align="center">
            <HStack spacing={3}>
              <Text fontSize="2xl">🎯</Text>
              <VStack align="start" spacing={0}>
                <Text color="white" fontSize="lg" fontWeight="semibold">
                  Your Crafts
                </Text>
                <Text color="whiteAlpha.800" fontSize="sm">
                  {totalCount} total crafting task{totalCount !== 1 ? "s" : ""}
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
              {/* Active Crafts Section */}
              <Box>
                <HStack justify="space-between" align="center" mb={3}>
                  <Text color="whiteAlpha.900" fontSize="sm" fontWeight="medium">
                    Active Crafts ({activeCrafts.length})
                  </Text>
                  {activeCrafts.length > 0 && (
                    <Badge
                      colorScheme="orange"
                      variant="subtle"
                      fontSize="xs"
                      bg="rgba(251, 146, 60, 0.12)"
                      color="orange.100"
                    >
                      {activeCrafts.length} active
                    </Badge>
                  )}
                </HStack>

                {activeCrafts.length === 0 ? (
                  <Box
                    p={4}
                    bg="rgba(45, 212, 191, 0.08)"
                    borderRadius="lg"
                    border="1px solid"
                    borderColor="teal.300"
                  >
                    <Text color="whiteAlpha.800" fontSize="sm" textAlign="center">
                      No active crafting tasks. Start a new project to see tasks here.
                    </Text>
                  </Box>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 2 }} spacing={3}>
                    {activeCrafts.map((craft) => (
                      <CraftCard key={craft.entityId} craft={craft} isActive={true} />
                    ))}
                  </SimpleGrid>
                )}
              </Box>

              {/* Completed Crafts Section */}
              {completedCrafts.length > 0 && (
                <>
                  <Divider borderColor="whiteAlpha.200" />
                  <Box>
                    <HStack justify="space-between" align="center" mb={3}>
                      <Text color="whiteAlpha.900" fontSize="sm" fontWeight="medium">
                        Completed Crafts ({completedCrafts.length})
                      </Text>
                      <Badge
                        colorScheme="purple"
                        variant="subtle"
                        fontSize="xs"
                        bg="rgba(192, 132, 252, 0.12)"
                        color="purple.100"
                      >
                        {completedCrafts.length} completed
                      </Badge>
                    </HStack>

                    <SimpleGrid columns={{ base: 1, md: 2, lg: 2 }} spacing={3}>
                      {completedCrafts.slice(0, 5).map((craft) => (
                        <CraftCard key={craft.entityId} craft={craft} isActive={false} />
                      ))}
                    </SimpleGrid>
                    {completedCrafts.length > 5 && (
                      <Text color="whiteAlpha.600" fontSize="xs" textAlign="center" pt={2}>
                        ... and {completedCrafts.length - 5} more completed crafts
                      </Text>
                    )}
                  </Box>
                </>
              )}
            </VStack>
          </Collapse>
        </VStack>
      </CardBody>
    </Card>
  );
}

// Individual craft card component (reused from ActiveTasksView)
function CraftCard({ craft, isActive }: { craft: Craft; isActive: boolean }) {
  return (
    <Box
      p={3}
      bg={isActive ? "rgba(45, 212, 191, 0.25)" : "rgba(192, 132, 252, 0.25)"}
      borderRadius="lg"
      border="2px solid"
      borderColor={isActive ? "teal.400" : "purple.400"}
      backdropFilter="blur(12px)"
      boxShadow="xl"
      _hover={{
        bg: isActive ? "rgba(45, 212, 191, 0.35)" : "rgba(192, 132, 252, 0.35)",
        transform: "translateY(-3px)",
        boxShadow: "2xl"
      }}
      transition="all 0.2s"
    >
      <VStack spacing={1.5} align="stretch">
        <HStack justify="space-between" align="start">
          <VStack align="start" spacing={0.5} flex={1}>
            <Text color="white" fontSize="md" fontWeight="medium">
              {craft.buildingName || "Crafting Station"}
            </Text>
            {craft.buildingName && (
              <Text color="whiteAlpha.700" fontSize="xs">
                🏗️ {craft.buildingName}
              </Text>
            )}
            {craft.claimName && (
              <Text color="whiteAlpha.600" fontSize="xs">
                🏰 {craft.claimName}
              </Text>
            )}
          </VStack>
          <Badge
            colorScheme={isActive ? "orange" : "purple"}
            variant="solid"
            fontSize="xs"
          >
            {isActive ? "Active" : "Completed"}
          </Badge>
        </HStack>
        
        {/* Progress Bar for Active Crafts */}
        {isActive && craft.progress !== undefined && (
          <Box>
            <HStack justify="space-between" mb={1}>
              <Text color="whiteAlpha.700" fontSize="xs">
                Progress
              </Text>
              <Text color="whiteAlpha.700" fontSize="xs">
                {Math.round((craft.progress / craft.totalActionsRequired) * 100)}%
              </Text>
            </HStack>
            <Progress
              value={(craft.progress / craft.totalActionsRequired) * 100}
              size="sm"
              colorScheme="teal"
              bg="whiteAlpha.200"
            />
          </Box>
        )}

        {/* Craft Info - More Compact */}
        <HStack spacing={4} fontSize="xs" color="whiteAlpha.600">
          <Text>📦 {craft.craftCount} items</Text>
          <Text>⚡ {craft.actionsRequiredPerItem} actions each</Text>
        </HStack>

        {/* Output Items - Fixed X1 Bug */}
        {craft.craftedItem && craft.craftedItem.length > 0 && (
          <Box>
            <Text color="whiteAlpha.700" fontSize="xs" fontWeight="medium" mb={1}>
              {isActive ? "Will Produce:" : "Produced:"}
            </Text>
            <HStack spacing={2} flexWrap="wrap">
              {craft.craftedItem.map((item, index) => {
                const totalOutput = item.quantity * craft.craftCount;
                const displayText = totalOutput > 1 
                  ? `${item.name} ×${totalOutput}` 
                  : item.name;
                
                return (
                  <Badge
                    key={index}
                    colorScheme={isActive ? "teal" : "purple"}
                    variant="solid"
                    fontSize="xs"
                  >
                    {displayText}
                  </Badge>
                );
              })}
            </HStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
