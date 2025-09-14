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
} from "@chakra-ui/react";
import type { Item } from "~/types/recipes";

interface SelectedItemCardProps {
  selectedItem: Item;
  targetQuantity: number;
  onQuantityChange: (quantity: number) => void;
  onClear: () => void;
}

export function SelectedItemCard({
  selectedItem,
  targetQuantity,
  onQuantityChange,
  onClear,
}: SelectedItemCardProps) {
  return (
    <Card>
      <CardHeader pb={2}>
        <Heading size="md">Selected Item</Heading>
      </CardHeader>
      <CardBody pt={0}>
        <HStack spacing={4} align="center">
          <VStack align="start" spacing={1}>
            <Text fontSize="lg" fontWeight="bold">{selectedItem.name}</Text>
            <HStack>
              <Badge colorScheme="blue" size="sm">Tier {selectedItem.tier}</Badge>
              <Badge variant="outline" size="sm">{selectedItem.category}</Badge>
            </HStack>
          </VStack>
          
          <HStack spacing={2}>
            <Text>Quantity:</Text>
            <Button
              size="sm"
              onClick={() => onQuantityChange(Math.max(1, targetQuantity - 1))}
              disabled={targetQuantity <= 1}
            >
              -
            </Button>
            <Text minW="40px" textAlign="center" fontWeight="bold">
              {targetQuantity}
            </Text>
            <Button
              size="sm"
              onClick={() => onQuantityChange(targetQuantity + 1)}
            >
              +
            </Button>
          </HStack>
          
          <Button
            colorScheme="red"
            variant="outline"
            size="sm"
            onClick={onClear}
          >
            Clear
          </Button>
        </HStack>
      </CardBody>
    </Card>
  );
}
