import {
  VStack,
  Box,
  Text,
  Checkbox,
  Collapse,
  SimpleGrid,
  Badge,
  HStack,
  Card,
  CardBody,
  Icon,
} from "@chakra-ui/react"
import { useState } from "react"
import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons"
import type { PlayerInventories, Inventory } from "~/types/inventory"
import { InventoryContents } from "~/components/InventoryContents"
import { useTrackedInventories } from "~/hooks/useTrackedInventories"

interface InventoryListProps {
  inventories: PlayerInventories
  viewMode?: "list" | "tier"
}

export function InventoryList({ inventories, viewMode = "list" }: InventoryListProps) {
  const { isTracked, toggleTracking } = useTrackedInventories()
  const [expandedInventories, setExpandedInventories] = useState<Set<string>>(new Set())

  const handleTrackingChange = (inventoryId: string, _checked: boolean) => {
    toggleTracking(inventoryId)
  }

  const handleExpandToggle = (inventoryId: string) => {
    const newExpanded = new Set(expandedInventories)
    if (newExpanded.has(inventoryId)) {
      newExpanded.delete(inventoryId)
    } else {
      newExpanded.add(inventoryId)
    }
    setExpandedInventories(newExpanded)
  }

  const renderInventorySection = (title: string, inventories: Inventory[] | undefined) => {
    if (!inventories || inventories.length === 0) return null

    return (
      <Box>
        <Text fontSize="lg" fontWeight="semibold" mb={4} color="white">
          {title}
        </Text>
        <VStack spacing={4} align="stretch">
          {inventories.map((inventory) => {
            const isExpanded = expandedInventories.has(inventory.id)
            const tracked = isTracked(inventory.id)

            return (
              <Card
                key={inventory.id}
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
                  <HStack justify="space-between" align="center" mb={isExpanded ? 4 : 0}>
                    <HStack spacing={4} flex={1}>
                      <Checkbox
                        isChecked={tracked}
                        onChange={(e) => handleTrackingChange(inventory.id, e.target.checked)}
                        colorScheme="teal"
                        size="lg"
                      />
                      <VStack align="start" spacing={1} flex={1}>
                        <HStack spacing={3} align="center">
                          <Text fontWeight="semibold" fontSize="md" color="white">
                            {inventory.name}
                          </Text>
                          {inventory.claimName && title === "Banks" && (
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
                            bg={inventory.items.length > 0 ? "rgba(45, 212, 191, 0.12)" : "rgba(148, 163, 184, 0.18)"}
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
                          {tracked && (
                            <Badge variant="solid" colorScheme="teal" fontSize="xs">
                              Tracked
                            </Badge>
                          )}
                        </HStack>
                      </VStack>
                    </HStack>

                    <HStack
                      as="button"
                      spacing={2}
                      color="teal.200"
                      fontSize="sm"
                      onClick={() => handleExpandToggle(inventory.id)}
                      _hover={{
                        color: "teal.100",
                        bg: "rgba(45, 212, 191, 0.12)",
                      }}
                      px={3}
                      py={2}
                      borderRadius="md"
                      transition="all 0.2s"
                    >
                      <Text fontWeight="medium">{isExpanded ? "Collapse" : "Expand"}</Text>
                      <Icon as={isExpanded ? ChevronDownIcon : ChevronRightIcon} boxSize={4} />
                    </HStack>
                  </HStack>

                  <Collapse in={isExpanded} animateOpacity>
                    <Box mt={4} pt={4} borderTop="1px solid" borderColor="whiteAlpha.200">
                      <InventoryContents items={inventory.items} viewMode={viewMode} />
                    </Box>
                  </Collapse>
                </CardBody>
              </Card>
            )
          })}
        </VStack>
      </Box>
    )
  }

  const hasAnyInventories = [
    inventories.personal,
    inventories.banks,
    inventories.storage,
    inventories.recovery,
    inventories.housing,
  ].some((section) => section && section.length > 0)

  if (!hasAnyInventories) {
    return (
      <Box
        p={8}
        textAlign="center"
        bg="rgba(24, 35, 60, 0.9)"
        borderRadius={{ base: "2xl", md: "3xl" }}
        border="1px solid rgba(148, 163, 184, 0.35)"
        backdropFilter="blur(12px)"
      >
        <VStack spacing={4}>
          <Text fontSize="3xl" mb={2}>
            🎒
          </Text>
          <Text color="white" fontSize="xl" fontWeight="semibold">
            No Inventories Found
          </Text>
          <Text color="whiteAlpha.800" fontSize="md" maxW="md">
            We couldn't find any inventories for this player. This might happen if:
          </Text>
          <VStack spacing={2} align="start" fontSize="sm" color="whiteAlpha.700">
            <Text>• The player data is still loading</Text>
            <Text>• The player has no accessible inventories</Text>
            <Text>• There's a temporary connection issue</Text>
          </VStack>
          <Text fontSize="sm" color="whiteAlpha.600" mt={4}>
            Try refreshing the page or checking back later.
          </Text>
        </VStack>
      </Box>
    )
  }

  return (
    <VStack spacing={8} align="stretch">
      {renderInventorySection("Personal Inventories", inventories.personal)}
      {renderInventorySection("Storage", inventories.storage)}
      {renderInventorySection("Housing Inventories", inventories.housing)}
      {renderInventorySection("Banks", inventories.banks)}
      {renderInventorySection("Recovery Chests", inventories.recovery)}
    </VStack>
  )
}
