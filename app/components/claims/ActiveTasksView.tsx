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
} from "@chakra-ui/react";
import { useFetcher } from "@remix-run/react";
import React, { useState } from "react";

import type { ActiveTasksViewProps, Craft } from "~/types/crafts";

export function ActiveTasksView({ claimId, playerId }: ActiveTasksViewProps) {
  const fetcher = useFetcher<{ crafts?: Craft[]; totalCount?: number; error?: string }>();
  const [isExpanded, setIsExpanded] = useState(false);

  // Load crafts when claimId changes
  React.useEffect(() => {
    if (claimId) {
      fetcher.load(`/api/claims/${claimId}/crafts`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimId]);

  const crafts = fetcher.data?.crafts || [];
  const totalCount = fetcher.data?.totalCount || 0;
  const isLoading = fetcher.state === "loading";
  const error = fetcher.data?.error;

  // Separate active and completed crafts
  const activeCrafts = crafts.filter(craft => !craft.completed);
  // Filter completed crafts by player (frontend filtering)
  const completedCrafts = crafts.filter(craft => 
    craft.completed && craft.ownerEntityId === playerId
  );

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
              Error loading active tasks: {error}
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
            <Text color="whiteAlpha.800">Loading active tasks...</Text>
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
              <Text fontSize="2xl">⚡</Text>
              <VStack align="start" spacing={0}>
                <Text color="white" fontSize="lg" fontWeight="semibold">
                  Active Tasks
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
                      No active crafting tasks in this claim. Start a new project to see tasks here.
                    </Text>
                  </Box>
                ) : (
                  <VStack spacing={2} align="stretch">
                    {activeCrafts.map((craft) => (
                      <CraftCard key={craft.entityId} craft={craft} isActive={true} />
                    ))}
                  </VStack>
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

                    <VStack spacing={2} align="stretch">
                      {completedCrafts.map((craft) => (
                        <CraftCard key={craft.entityId} craft={craft} isActive={false} />
                      ))}
                    </VStack>
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

// Individual craft card component
function CraftCard({ craft, isActive }: { craft: Craft; isActive: boolean }) {
  const cardBg = isActive 
    ? "rgba(45, 212, 191, 0.08)" 
    : "rgba(192, 132, 252, 0.08)";
  const cardBorder = isActive 
    ? "teal.300" 
    : "purple.300";
  const statusColor = isActive 
    ? "orange.100" 
    : "purple.100";
  const statusBg = isActive 
    ? "rgba(251, 146, 60, 0.12)" 
    : "rgba(192, 132, 252, 0.12)";

  return (
    <Box
      p={4}
      bg={cardBg}
      borderRadius="lg"
      border="1px solid"
      borderColor={cardBorder}
    >
      <VStack spacing={2} align="stretch">
        <HStack justify="space-between" align="start">
          <VStack align="start" spacing={1} flex={1}>
            <Text color="white" fontSize="md" fontWeight="medium">
              {craft.craftedItem?.[0]?.name || `Craft ${craft.entityId}`}
            </Text>
            {craft.buildingName && (
              <Text color="whiteAlpha.700" fontSize="sm">
                🏗️ {craft.buildingName}
              </Text>
            )}
            <Text color="whiteAlpha.600" fontSize="xs">
              👤 {craft.ownerUsername}
            </Text>
          </VStack>
          <Badge
            colorScheme={isActive ? "orange" : "purple"}
            variant="subtle"
            fontSize="xs"
            bg={statusBg}
            color={statusColor}
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

        {/* Craft Info */}
        <Text color="whiteAlpha.600" fontSize="xs">
          📦 {craft.craftCount} items • {craft.actionsRequiredPerItem} actions each
        </Text>

        {/* Output Items */}
        {craft.craftedItem && craft.craftedItem.length > 0 && (
          <Box>
            <Text color="whiteAlpha.700" fontSize="xs" fontWeight="medium" mb={1}>
              {isActive ? "Will Produce:" : "Produced:"}
            </Text>
            <HStack spacing={2} flexWrap="wrap">
              {craft.craftedItem.map((item, index) => (
                <Badge
                  key={index}
                  colorScheme={isActive ? "teal" : "purple"}
                  variant="subtle"
                  fontSize="xs"
                  bg={isActive ? "rgba(45, 212, 191, 0.12)" : "rgba(192, 132, 252, 0.12)"}
                  color={isActive ? "teal.100" : "purple.100"}
                >
                  {item.name} x{item.quantity}
                </Badge>
              ))}
            </HStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
