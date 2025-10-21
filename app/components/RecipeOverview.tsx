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

  const hasInventoryData = combinedInventory.length > 0
  const hasRecipeData = selectedItem !== null

  const glassCardStyles = {
    bg: "rgba(24,35,60,0.9)",
    border: "1px solid rgba(148, 163, 184, 0.35)",
    borderRadius: "2xl",
    boxShadow: "xl",
    backdropFilter: "blur(12px)",
  } as const

  return (
    <VStack spacing={6} align="stretch">
      {/* Main Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
        <Card {...glassCardStyles}>
          <CardBody>
            <Stat>
              <StatLabel color="whiteAlpha.700">Available Materials</StatLabel>
              <StatNumber color="teal.300">{totalInventoryItems.toLocaleString()}</StatNumber>
              <StatHelpText color="whiteAlpha.600">{uniqueInventoryItems} unique items</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card {...glassCardStyles}>
          <CardBody>
            <Stat>
              <StatLabel color="whiteAlpha.700">Recipe Progress</StatLabel>
              <StatNumber color={completionRate === 100 ? "teal.300" : "purple.300"}>
                {Math.round(completionRate)}%
              </StatNumber>
              <StatHelpText>
                <Progress
                  value={completionRate}
                  size="sm"
                  colorScheme={completionRate === 100 ? "teal" : "purple"}
                  mt={2}
                />
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card {...glassCardStyles}>
          <CardBody>
            <Stat>
              <StatLabel color="whiteAlpha.700">Items Needed</StatLabel>
              <StatNumber color={totalDeficit === 0 ? "teal.300" : "pink.300"}>
                {totalDeficit.toLocaleString()}
              </StatNumber>
              <StatHelpText color="whiteAlpha.600">{totalRequiredItems} recipe components</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

      </SimpleGrid>

      {/* Inventory Status */}
      <SimpleGrid columns={{ base: 1, lg: 1 }} spacing={6}>

        {/* Inventory Status Card */}
        <Card {...glassCardStyles}>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" fontWeight="bold" color="white">
                Inventory Integration
              </Text>

              <VStack spacing={3} align="stretch">
                <HStack justify="space-between">
                  <HStack>
                    <Icon
                      as={CheckCircleIcon}
                      color={hasInventoryData ? "teal.300" : "whiteAlpha.400"}
                    />
                    <Text fontSize="sm" color="whiteAlpha.800">
                      Inventory Data
                    </Text>
                  </HStack>
                  <Badge colorScheme={hasInventoryData ? "teal" : "gray"} borderRadius="full">
                    {hasInventoryData ? "Connected" : "No Data"}
                  </Badge>
                </HStack>

                <HStack justify="space-between">
                  <HStack>
                    <Icon as={InfoIcon} color={hasRecipeData ? "purple.300" : "whiteAlpha.400"} />
                    <Text fontSize="sm" color="whiteAlpha.800">
                      Recipe Selected
                    </Text>
                  </HStack>
                  <Badge colorScheme={hasRecipeData ? "purple" : "gray"} borderRadius="full">
                    {hasRecipeData ? selectedItem?.name : "None"}
                  </Badge>
                </HStack>

                <Divider borderColor="whiteAlpha.200" />

                <Box>
                  <Text fontSize="xs" color="whiteAlpha.600" mb={2}>
                    How it works:
                  </Text>
                  <Text fontSize="sm" color="whiteAlpha.800">
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
          bg={completionRate === 100 ? "rgba(45, 212, 191, 0.18)" : "rgba(129, 140, 248, 0.18)"}
          borderColor={completionRate === 100 ? "rgba(45, 212, 191, 0.35)" : "rgba(129, 140, 248, 0.35)"}
          borderWidth={1}
          borderRadius="2xl"
          boxShadow="xl"
        >
          <CardBody>
            <HStack spacing={4}>
              <Icon
                as={completionRate === 100 ? CheckCircleIcon : InfoIcon}
                color={completionRate === 100 ? "teal.200" : "purple.200"}
                boxSize={6}
              />
              <VStack align="start" spacing={1} flex={1}>
                <Text fontWeight="bold" color="white">
                  {completionRate === 100
                    ? `Ready to craft ${selectedItem?.name}!`
                    : `Recipe for ${selectedItem?.name} - ${completedItems}/${totalRequiredItems} components available`}
                </Text>
                <Text fontSize="sm" color="whiteAlpha.800">
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
        <Card
          bg="rgba(251, 191, 36, 0.16)"
          borderColor="rgba(251, 191, 36, 0.35)"
          borderWidth={1}
          borderRadius="2xl"
          boxShadow="xl"
        >
          <CardBody>
            <HStack spacing={4}>
              <Icon as={InfoIcon} color="yellow.300" boxSize={6} />
              <VStack align="start" spacing={1} flex={1}>
                <Text fontWeight="bold" color="white">
                  No Inventory Data Available
                </Text>
                <Text fontSize="sm" color="whiteAlpha.800">
                  Track some inventories to see inventory-aware recipe calculations. The calculator
                  will show exactly what materials you need to gather.
                </Text>
              </VStack>
              <Button
                as={RemixLink}
                to="/inventory"
                colorScheme="teal"
                size="sm"
                bg="teal.500"
                color="gray.900"
                _hover={{ bg: "teal.400" }}
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
