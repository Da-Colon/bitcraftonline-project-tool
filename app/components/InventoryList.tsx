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
  useColorModeValue,
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
  const cardBg = useColorModeValue("white", "gray.800")
  const hoverBg = useColorModeValue("gray.50", "gray.700")

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
        <Text fontSize="lg" fontWeight="semibold" mb={4} color="gray.700">
          {title}
        </Text>
        <VStack spacing={4} align="stretch">
          {inventories.map((inventory) => {
            const isExpanded = expandedInventories.has(inventory.id)
            const tracked = isTracked(inventory.id)

            return (
              <Card
                key={inventory.id}
                bg={cardBg}
                shadow="sm"
                border="1px solid"
                borderColor={tracked ? "blue.200" : "gray.200"}
                _hover={{
                  shadow: "md",
                  borderColor: tracked ? "blue.300" : "gray.300",
                }}
                transition="all 0.2s"
              >
                <CardBody p={4}>
                  <HStack justify="space-between" align="center" mb={isExpanded ? 4 : 0}>
                    <HStack spacing={4} flex={1}>
                      <Checkbox
                        isChecked={tracked}
                        onChange={(e) => handleTrackingChange(inventory.id, e.target.checked)}
                        colorScheme="blue"
                        size="lg"
                      />
                      <VStack align="start" spacing={1} flex={1}>
                        <HStack spacing={3} align="center">
                          <Text fontWeight="semibold" fontSize="md">
                            {inventory.name}
                          </Text>
                          {inventory.claimName && title === "Banks" && (
                            <Badge variant="subtle" colorScheme="green" fontSize="xs">
                              {inventory.claimName}
                            </Badge>
                          )}
                        </HStack>
                        <HStack spacing={2}>
                          <Badge
                            variant="subtle"
                            colorScheme={inventory.items.length > 0 ? "blue" : "gray"}
                            fontSize="xs"
                          >
                            {inventory.items.length} items
                          </Badge>
                          {inventory.buildingName && (
                            <Badge variant="subtle" colorScheme="purple" fontSize="xs">
                              {inventory.buildingName}
                            </Badge>
                          )}
                          {tracked && (
                            <Badge variant="solid" colorScheme="blue" fontSize="xs">
                              Tracked
                            </Badge>
                          )}
                        </HStack>
                      </VStack>
                    </HStack>

                    <HStack
                      as="button"
                      spacing={2}
                      color="blue.500"
                      fontSize="sm"
                      onClick={() => handleExpandToggle(inventory.id)}
                      _hover={{
                        color: "blue.600",
                        bg: hoverBg,
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
                    <Box mt={4} pt={4} borderTop="1px solid" borderColor="gray.200">
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
        bg="gray.50"
        borderRadius="lg"
        border="1px solid"
        borderColor="gray.200"
      >
        <VStack spacing={4}>
          <Text fontSize="3xl" mb={2}>
            🎒
          </Text>
          <Text color="gray.600" fontSize="xl" fontWeight="semibold">
            No Inventories Found
          </Text>
          <Text color="gray.500" fontSize="md" maxW="md">
            We couldn't find any inventories for this player. This might happen if:
          </Text>
          <VStack spacing={2} align="start" fontSize="sm" color="gray.500">
            <Text>• The player data is still loading</Text>
            <Text>• The player has no accessible inventories</Text>
            <Text>• There's a temporary connection issue</Text>
          </VStack>
          <Text fontSize="sm" color="gray.400" mt={4}>
            Try refreshing the page or checking back later.
          </Text>
        </VStack>
      </Box>
    )
  }

  return (
    <VStack spacing={8} align="stretch">
      {renderInventorySection("Personal Inventories", inventories.personal)}
      {renderInventorySection("Banks", inventories.banks)}
      {renderInventorySection("Storage", inventories.storage)}
      {renderInventorySection("Recovery Chests", inventories.recovery)}
      {renderInventorySection("Housing Inventories", inventories.housing)}
    </VStack>
  )
}
