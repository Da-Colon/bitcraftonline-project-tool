/**
 * Progress Tracking Tab Component
 * Displays comprehensive tracking interface with stats, controls, and profession progress table
 */
import {
  VStack,
  HStack,
  Box,
  Heading,
  Text,
  Badge,
  Button,
  Spacer,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Collapse,
  useDisclosure,
} from "@chakra-ui/react";
import type { ProfessionProgress, TrackingStats } from "~/types/tracking";
import { TrackingControls } from "~/components/tracking/TrackingControls";
import type { PlayerInventoryResponse } from "~/routes/api.player.inventory";
import type { Item } from "~/types/recipes";
import { ProfessionProgressTable } from "~/components/tracking/ProfessionProgressTable";

interface ProgressTrackingTabProps {
  professionProgress: ProfessionProgress[];
  overallStats: TrackingStats;
  onAutoFillCompleted: () => void;
  onResetAllTracking: () => void;
  onApplyPlayerInventory: (inventory: PlayerInventoryResponse) => void;
  itemMap: Map<string, Item>;
}

export function ProgressTrackingTab({
  professionProgress,
  overallStats,
  onAutoFillCompleted,
  onResetAllTracking,
  onApplyPlayerInventory,
  itemMap,
}: ProgressTrackingTabProps) {
  const { isOpen: filtersOpen, onToggle: toggleFilters } = useDisclosure();

  return (
    <VStack spacing={4} align="stretch">
      {/* Progress Tracking Header */}
      <Box bg="surface.primary" borderRadius="md" p={4} border="1px solid" borderColor="border.primary">
        <VStack spacing={3}>
          <HStack w="full">
            <Heading size="md" color="orange.400">Progress Tracking</Heading>
            <Badge bg="orange.400" color="white" px={2} py={1} borderRadius="md">Alpha</Badge>
            <Spacer />
            <Text fontSize="sm" color="text.muted">{professionProgress.length} professions</Text>
            <Button size="sm" variant="ghost" onClick={toggleFilters}>
              Hide Profession
            </Button>
            <Button size="sm" variant="ghost">
              Show Completed
            </Button>
            <Badge variant="outline">Required</Badge>
            <Badge bg="orange.400" color="white">Remaining</Badge>
          </HStack>
          
          {/* Stats Row */}
          <StatGroup w="full">
            <Stat textAlign="center">
              <StatNumber fontSize="2xl" color="green.400">{overallStats.completedItems}</StatNumber>
              <StatLabel>Complete</StatLabel>
            </Stat>
            <Stat textAlign="center">
              <StatNumber fontSize="2xl" color="yellow.400">{overallStats.inProgressItems}</StatNumber>
              <StatLabel>In Progress</StatLabel>
            </Stat>
            <Stat textAlign="center">
              <StatNumber fontSize="2xl" color="gray.400">{overallStats.notStartedItems}</StatNumber>
              <StatLabel>Not Started</StatLabel>
            </Stat>
            <Stat textAlign="center">
              <StatNumber fontSize="2xl">{overallStats.totalItems}</StatNumber>
              <StatLabel>Total</StatLabel>
            </Stat>
          </StatGroup>
        </VStack>
      </Box>

      {/* Global Filters */}
      <Collapse in={filtersOpen}>
        <Box bg="surface.primary" borderRadius="md" p={3} border="1px solid" borderColor="border.primary">
          <HStack>
            <Text fontWeight="medium">Global Filters</Text>
            <Badge>Affects all tabs</Badge>
            <Spacer />
            <Button size="sm" variant="ghost">Show</Button>
          </HStack>
        </Box>
      </Collapse>

      {/* Action Controls */}
      <TrackingControls
        onAutoFillCompleted={onAutoFillCompleted}
        onResetAllTracking={onResetAllTracking}
        onApplyPlayerInventory={onApplyPlayerInventory}
        itemMap={itemMap}
      />

      {/* Progress Table */}
      <ProfessionProgressTable professionProgress={professionProgress} />
    </VStack>
  );
}
