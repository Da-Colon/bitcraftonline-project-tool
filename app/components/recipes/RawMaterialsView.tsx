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

  const cardStyles = {
    bg: "rgba(24,35,60,0.9)",
    border: "1px solid rgba(148, 163, 184, 0.35)",
    borderRadius: "2xl",
    boxShadow: "xl",
    backdropFilter: "blur(12px)",
  } as const;

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
      {rawMaterials.map((item) => (
        <Card key={item.itemId} size="sm" {...cardStyles}>
          <CardBody p={3}>
            <VStack align="start" spacing={2}>
              <Text fontWeight="bold" color="white">
                {item.name}
              </Text>
              <HStack>
                <Badge colorScheme="teal" size="sm" borderRadius="full" px={2}>
                  T{item.tier}
                </Badge>
                <Badge
                  variant="subtle"
                  colorScheme="purple"
                  size="sm"
                  borderRadius="full"
                  px={2}
                >
                  {item.category}
                </Badge>
              </HStack>
              <VStack align="start" spacing={1} fontSize="sm" w="full">
                <HStack justify="space-between" w="full">
                  <Text color="whiteAlpha.800">Required:</Text>
                  <Text fontWeight="bold" color="white">
                    {item.recipeRequired.toLocaleString()}
                  </Text>
                </HStack>
                <HStack justify="space-between" w="full">
                  <Text color="whiteAlpha.800">Available:</Text>
                  <Text color="teal.200">{item.currentInventory.toLocaleString()}</Text>
                </HStack>
                <HStack justify="space-between" w="full">
                  <Text color="whiteAlpha.800">Still Need:</Text>
                  <Text color={item.deficit > 0 ? "pink.300" : "teal.200"} fontWeight="bold">
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
