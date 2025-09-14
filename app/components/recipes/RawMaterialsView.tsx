import {
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  CardBody,
  SimpleGrid,
} from "@chakra-ui/react";
import type { RecipeBreakdownItem } from "~/types/recipes";

interface RawMaterialsViewProps {
  breakdown: RecipeBreakdownItem[];
}

export function RawMaterialsView({ breakdown }: RawMaterialsViewProps) {
  // Raw materials are items with tier <= 1 or items without recipes
  const rawMaterials = breakdown.filter(item => item.tier <= 1);

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
      {rawMaterials.map((item) => (
        <Card key={item.itemId} variant="outline" size="sm">
          <CardBody p={3}>
            <VStack align="start" spacing={2}>
              <Text fontWeight="bold">{item.name}</Text>
              <HStack>
                <Badge colorScheme="blue" size="sm">T{item.tier}</Badge>
                <Badge variant="outline" size="sm">{item.category}</Badge>
              </HStack>
              <VStack align="start" spacing={1} fontSize="sm" w="full">
                <HStack justify="space-between" w="full">
                  <Text>Required:</Text>
                  <Text fontWeight="bold">{item.recipeRequired.toLocaleString()}</Text>
                </HStack>
                <HStack justify="space-between" w="full">
                  <Text>Available:</Text>
                  <Text color="green.500">{item.currentInventory.toLocaleString()}</Text>
                </HStack>
                <HStack justify="space-between" w="full">
                  <Text>Still Need:</Text>
                  <Text color={item.deficit > 0 ? "red.500" : "green.500"} fontWeight="bold">
                    {item.deficit.toLocaleString()}
                  </Text>
                </HStack>
              </VStack>
            </VStack>
          </CardBody>
        </Card>
      ))}
    </SimpleGrid>
  );
}
