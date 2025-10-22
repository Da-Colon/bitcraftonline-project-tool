import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons"
import {
  VStack,
  Box,
  Text,
  Checkbox,
  Collapse,
  Badge,
  HStack,
  Card,
  CardBody,
  Icon,
  Button,
} from "@chakra-ui/react"

import { InventoryContents } from "./InventoryContents"
import { getSnapshotAge } from "~/utils/inventory-snapshot"

interface InventoryItem {
  id: string
  name: string
  items: Array<{
    itemId: string
    name?: string
    quantity: number
    category?: string
    tier?: number
  }>
  claimName?: string
  buildingName?: string
}

interface InventoryCardBaseProps {
  inventory: InventoryItem
  tracked: boolean
  snapshot: any
  expanded: boolean
  viewMode: "list" | "tier"
  onTrackingChange: (checked: boolean) => void
  onExpandToggle: () => void
  onViewModeToggle: () => void
  showClaimBadge?: boolean
}

export function InventoryCardBase({
  inventory,
  tracked,
  snapshot,
  expanded,
  viewMode,
  onTrackingChange,
  onExpandToggle,
  onViewModeToggle,
  showClaimBadge = false,
}: InventoryCardBaseProps) {
  const snapshotAge = snapshot ? getSnapshotAge(snapshot) : null

  return (
    <Card
      bg="rgba(24, 35, 60, 0.9)"
      border="1px solid"
      borderColor={tracked ? "teal.300" : "rgba(148, 163, 184, 0.35)"}
      backdropFilter="blur(12px)"
      boxShadow="xl"
      _hover={{
        borderColor: tracked ? "teal.200" : "rgba(148, 163, 184, 0.55)",
        transform: "translateY(-2px)",
      }}
      transition="all 0.2s"
    >
      <CardBody p={4}>
        <HStack justify="space-between" align="center" mb={expanded ? 4 : 0}>
          <HStack spacing={4} flex={1}>
            <Checkbox
              isChecked={tracked}
              onChange={(e) => onTrackingChange(e.target.checked)}
              colorScheme="teal"
              size="lg"
            />
            <VStack align="start" spacing={1} flex={1}>
              <HStack spacing={3} align="center">
                <Text fontWeight="semibold" fontSize="md" color="white">
                  {inventory.name}
                </Text>
                {inventory.claimName && showClaimBadge && (
                  <Badge
                    variant="subtle"
                    colorScheme="teal"
                    fontSize="xs"
                    bg="rgba(45, 212, 191, 0.15)"
                    color="teal.100"
                  >
                    {inventory.claimName}
                  </Badge>
                )}
              </HStack>
              <HStack spacing={2}>
                <Badge
                  variant="subtle"
                  colorScheme={inventory.items.length > 0 ? "teal" : "gray"}
                  fontSize="xs"
                  bg={
                    inventory.items.length > 0
                      ? "rgba(45, 212, 191, 0.12)"
                      : "rgba(148, 163, 184, 0.18)"
                  }
                  color={inventory.items.length > 0 ? "teal.100" : "whiteAlpha.700"}
                >
                  {inventory.items.length} items
                </Badge>
                {inventory.buildingName && (
                  <Badge
                    variant="subtle"
                    colorScheme="purple"
                    fontSize="xs"
                    bg="rgba(192, 132, 252, 0.16)"
                    color="purple.100"
                  >
                    {inventory.buildingName}
                  </Badge>
                )}
                {inventory.claimName && !showClaimBadge && (
                  <Badge
                    variant="subtle"
                    colorScheme="teal"
                    fontSize="xs"
                    bg="rgba(45, 212, 191, 0.12)"
                    color="teal.100"
                  >
                    {inventory.claimName}
                  </Badge>
                )}
                {tracked && (
                  <Badge variant="solid" colorScheme="teal" fontSize="xs">
                    Tracked
                  </Badge>
                )}
                {snapshotAge && (
                  <Badge
                    variant="subtle"
                    colorScheme="blue"
                    fontSize="xs"
                    bg="rgba(59, 130, 246, 0.15)"
                    color="blue.100"
                  >
                    {snapshotAge}
                  </Badge>
                )}
              </HStack>
            </VStack>
          </HStack>

          <HStack spacing={2}>
            <Button
              size="xs"
              variant="ghost"
              colorScheme="teal"
              onClick={onViewModeToggle}
              _hover={{ bg: "rgba(45, 212, 191, 0.12)" }}
            >
              {viewMode === "tier" ? "List" : "Tier"}
            </Button>
            <HStack
              as="button"
              spacing={2}
              color="teal.200"
              fontSize="sm"
              onClick={onExpandToggle}
              _hover={{
                color: "teal.100",
                bg: "rgba(45, 212, 191, 0.12)",
              }}
              px={3}
              py={2}
              borderRadius="md"
              transition="all 0.2s"
            >
              <Text fontWeight="medium">{expanded ? "Collapse" : "Expand"}</Text>
              <Icon as={expanded ? ChevronDownIcon : ChevronRightIcon} boxSize={4} />
            </HStack>
          </HStack>
        </HStack>

        <Collapse in={expanded} animateOpacity>
          <Box mt={4} pt={4} borderTop="1px solid" borderColor="whiteAlpha.200">
            <InventoryContents items={inventory.items} viewMode={viewMode} />
          </Box>
        </Collapse>
      </CardBody>
    </Card>
  )
}
