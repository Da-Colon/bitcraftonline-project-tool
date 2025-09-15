import {
  HStack,
  VStack,
  Text,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from "@chakra-ui/react"
import type { Item } from "~/types/recipes"
import { GameDataIcon } from "~/components/GameDataIcon"

interface SelectedItemCardProps {
  selectedItem: Item
  targetQuantity: number
  onQuantityChange: (quantity: number) => void
  onClear: () => void
}

export function SelectedItemCard({
  selectedItem,
  targetQuantity,
  onQuantityChange,
  onClear,
}: SelectedItemCardProps) {
  return (
    <Card variant="elevated" size="lg">
      <CardHeader pb={3}>
        <HStack justify="space-between" align="center">
          <Heading size="md" color="gray.700">
            Selected Item
          </Heading>
          <Button
            colorScheme="red"
            variant="ghost"
            size="sm"
            onClick={onClear}
            _hover={{ bg: "red.50" }}
          >
            Clear Selection
          </Button>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        <VStack spacing={6} align="stretch">
          {/* Item Info Section */}
          <HStack spacing={4} align="center">
            <GameDataIcon
              iconAssetName={selectedItem.iconAssetName}
              alt={selectedItem.name}
              size="40px"
            />
            <VStack align="start" spacing={2} flex={1}>
              <Text fontSize="xl" fontWeight="bold" color="gray.800">
                {selectedItem.name}
              </Text>
              <HStack spacing={3}>
                <Badge
                  colorScheme="blue"
                  variant="solid"
                  px={3}
                  py={1}
                  borderRadius="full"
                  fontSize="sm"
                >
                  Tier {selectedItem.tier}
                </Badge>
                <Badge
                  colorScheme="gray"
                  variant="outline"
                  px={3}
                  py={1}
                  borderRadius="full"
                  fontSize="sm"
                >
                  {selectedItem.category}
                </Badge>
              </HStack>
            </VStack>
          </HStack>

          {/* Quantity Section */}
          <VStack spacing={3} align="stretch">
            <Text fontSize="md" fontWeight="semibold" color="gray.700">
              Target Quantity
            </Text>
            <HStack spacing={4} align="center">
              <NumberInput
                value={targetQuantity}
                onChange={(valueString, valueNumber) => {
                  // Handle manual input: if user types a valid number >= 1, use it
                  // If they clear the field or type invalid input, keep current value
                  if (!isNaN(valueNumber) && valueNumber >= 1) {
                    onQuantityChange(valueNumber)
                  } else if (valueString === "" || valueString === "0") {
                    // Allow temporary empty/zero state while typing
                    onQuantityChange(1)
                  }
                }}
                min={1}
                max={999999}
                size="md"
                width="150px"
                allowMouseWheel
              >
                <NumberInputField textAlign="center" fontSize="lg" fontWeight="bold" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <Text color="gray.500" fontSize="sm">
                items needed
              </Text>
            </HStack>
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
