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
} from "@chakra-ui/react"
import { ExternalLinkIcon, SettingsIcon, CheckCircleIcon, InfoIcon } from "@chakra-ui/icons"
import { Link as RemixLink } from "@remix-run/react"
import type { InventoryItem, Item, RecipeBreakdownItem } from "~/types/recipes"

interface RecipeOverviewProps {
  combinedInventory: InventoryItem[]
  selectedItem: Item | null
  breakdown: RecipeBreakdownItem[]
  isCalculating: boolean
}

export function RecipeOverview({
  combinedInventory,
  selectedItem,
  breakdown,
  isCalculating,
}: RecipeOverviewProps) {
  // Calculate overview stats
  const totalInventoryItems = combinedInventory.reduce((sum, item) => sum + item.quantity, 0)
  const uniqueInventoryItems = combinedInventory.length

  // Calculate recipe completion stats
  const totalRequiredItems = breakdown.length
  const completedItems = breakdown.filter((item) => item.deficit === 0).length
  const completionRate = totalRequiredItems > 0 ? (completedItems / totalRequiredItems) * 100 : 0

  // Calculate total deficit
  const totalDeficit = breakdown.reduce((sum, item) => sum + item.deficit, 0)

  // Get tier distribution of inventory
  const inventoryTiers = combinedInventory.reduce((acc, item) => {
    // Extract tier from item ID if possible (this might need adjustment based on your data structure)
    const tier = 0 // Default tier - you might need to get this from item data
    acc[tier] = (acc[tier] || 0) + item.quantity
    return acc
  }, {} as Record<number, number>)

  const hasInventoryData = combinedInventory.length > 0
  const hasRecipeData = selectedItem !== null

  return (
    <VStack spacing={6} align="stretch">
      {/* Main Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Available Materials</StatLabel>
              <StatNumber color="green.500">{totalInventoryItems.toLocaleString()}</StatNumber>
              <StatHelpText>{uniqueInventoryItems} unique items</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Recipe Progress</StatLabel>
              <StatNumber color={completionRate === 100 ? "green.500" : "orange.500"}>
                {Math.round(completionRate)}%
              </StatNumber>
              <StatHelpText>
                <Progress
                  value={completionRate}
                  size="sm"
                  colorScheme={completionRate === 100 ? "green" : "orange"}
                  mt={2}
                />
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Items Needed</StatLabel>
              <StatNumber color={totalDeficit === 0 ? "green.500" : "red.500"}>
                {totalDeficit.toLocaleString()}
              </StatNumber>
              <StatHelpText>{totalRequiredItems} recipe components</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Calculator Status</StatLabel>
              <StatNumber color="blue.500">
                {isCalculating ? "Calculating..." : hasRecipeData ? "Ready" : "Waiting"}
              </StatNumber>
              <StatHelpText>
                {hasInventoryData ? "Inventory loaded" : "No inventory data"}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Quick Actions and Status */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        {/* Quick Actions Card */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" fontWeight="bold">
                Quick Actions
              </Text>

              <VStack spacing={3} align="stretch">
                <Button
                  as={RemixLink}
                  to="/inventory"
                  leftIcon={<Icon as={SettingsIcon} />}
                  variant="outline"
                  colorScheme="blue"
                  size="sm"
                  justifyContent="flex-start"
                >
                  Manage Personal Inventories
                </Button>
                <Button
                  as={RemixLink}
                  to="/claim-inventories"
                  leftIcon={<Icon as={ExternalLinkIcon} />}
                  variant="outline"
                  colorScheme="purple"
                  size="sm"
                  justifyContent="flex-start"
                >
                  Manage Claim Inventories
                </Button>
                <Button
                  as={RemixLink}
                  to="/dashboard"
                  leftIcon={<Icon as={CheckCircleIcon} />}
                  variant="outline"
                  colorScheme="green"
                  size="sm"
                  justifyContent="flex-start"
                >
                  View Dashboard
                </Button>
              </VStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Inventory Status Card */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" fontWeight="bold">
                Inventory Integration
              </Text>

              <VStack spacing={3} align="stretch">
                <HStack justify="space-between">
                  <HStack>
                    <Icon
                      as={CheckCircleIcon}
                      color={hasInventoryData ? "green.500" : "gray.400"}
                    />
                    <Text fontSize="sm">Inventory Data</Text>
                  </HStack>
                  <Badge colorScheme={hasInventoryData ? "green" : "gray"}>
                    {hasInventoryData ? "Connected" : "No Data"}
                  </Badge>
                </HStack>

                <HStack justify="space-between">
                  <HStack>
                    <Icon as={InfoIcon} color={hasRecipeData ? "blue.500" : "gray.400"} />
                    <Text fontSize="sm">Recipe Selected</Text>
                  </HStack>
                  <Badge colorScheme={hasRecipeData ? "blue" : "gray"}>
                    {hasRecipeData ? selectedItem?.name : "None"}
                  </Badge>
                </HStack>

                <Divider />

                <Box>
                  <Text fontSize="xs" color="gray.500" mb={2}>
                    How it works:
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    The calculator automatically deducts materials you already have from recipe
                    requirements, showing only what you need to gather.
                  </Text>
                </Box>
              </VStack>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Recipe Status Banner */}
      {hasRecipeData && (
        <Card
          bg={completionRate === 100 ? "green.50" : "orange.50"}
          borderColor={completionRate === 100 ? "green.200" : "orange.200"}
        >
          <CardBody>
            <HStack spacing={4}>
              <Icon
                as={completionRate === 100 ? CheckCircleIcon : InfoIcon}
                color={completionRate === 100 ? "green.500" : "orange.500"}
                boxSize={6}
              />
              <VStack align="start" spacing={1} flex={1}>
                <Text fontWeight="bold" color={completionRate === 100 ? "green.700" : "orange.700"}>
                  {completionRate === 100
                    ? `Ready to craft ${selectedItem?.name}!`
                    : `Recipe for ${selectedItem?.name} - ${completedItems}/${totalRequiredItems} components available`}
                </Text>
                <Text fontSize="sm" color={completionRate === 100 ? "green.600" : "orange.600"}>
                  {completionRate === 100
                    ? "You have all required materials in your tracked inventories."
                    : `You need ${totalDeficit} more items to complete this recipe.`}
                </Text>
              </VStack>
            </HStack>
          </CardBody>
        </Card>
      )}

      {/* No Inventory Warning */}
      {!hasInventoryData && (
        <Card bg="yellow.50" borderColor="yellow.200">
          <CardBody>
            <HStack spacing={4}>
              <Icon as={InfoIcon} color="yellow.500" boxSize={6} />
              <VStack align="start" spacing={1} flex={1}>
                <Text fontWeight="bold" color="yellow.700">
                  No Inventory Data Available
                </Text>
                <Text fontSize="sm" color="yellow.600">
                  Track some inventories to see inventory-aware recipe calculations. The calculator
                  will show exactly what materials you need to gather.
                </Text>
              </VStack>
              <Button
                as={RemixLink}
                to="/inventory"
                colorScheme="yellow"
                variant="outline"
                size="sm"
              >
                Track Inventories
              </Button>
            </HStack>
          </CardBody>
        </Card>
      )}
    </VStack>
  )
}
