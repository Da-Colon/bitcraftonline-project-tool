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
    <Card
      variant="elevated"
      size="lg"
      bg="rgba(24,35,60,0.9)"
      border="1px solid rgba(148, 163, 184, 0.35)"
      borderRadius="2xl"
      boxShadow="xl"
      backdropFilter="blur(12px)"
    >
      <CardHeader pb={3}>
        <HStack justify="space-between" align="center">
          <Heading size="md" color="white">
            Selected Item
          </Heading>
          <Button
            colorScheme="whiteAlpha"
            variant="ghost"
            size="sm"
            onClick={onClear}
            color="whiteAlpha.800"
            _hover={{ bg: "whiteAlpha.200" }}
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
              <Text fontSize="xl" fontWeight="bold" color="white">
                {selectedItem.name}
              </Text>
              <HStack spacing={3}>
                <Badge
                  colorScheme="teal"
                  variant="solid"
                  px={3}
                  py={1}
                  borderRadius="full"
                  fontSize="sm"
                >
                  Tier {selectedItem.tier}
                </Badge>
                <Badge
                  colorScheme="purple"
                  variant="subtle"
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
            <Text fontSize="md" fontWeight="semibold" color="whiteAlpha.900">
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
                bg="rgba(15,23,42,0.8)"
                borderColor="whiteAlpha.200"
                color="white"
                _hover={{ borderColor: "whiteAlpha.300" }}
                _focus={{ borderColor: "teal.400", boxShadow: "0 0 0 1px rgba(56,189,248,0.45)" }}
              >
                <NumberInputField
                  textAlign="center"
                  fontSize="lg"
                  fontWeight="bold"
                  bg="transparent"
                  color="white"
                  _placeholder={{ color: "whiteAlpha.500" }}
                />
                <NumberInputStepper>
                  <NumberIncrementStepper color="white" _active={{ bg: "whiteAlpha.200" }} />
                  <NumberDecrementStepper color="white" _active={{ bg: "whiteAlpha.200" }} />
                </NumberInputStepper>
              </NumberInput>
              <Text color="whiteAlpha.700" fontSize="sm">
                items needed
              </Text>
            </HStack>
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
