import {
  VStack,
  HStack,
  Box,
  Text,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Heading,
  SimpleGrid,
} from "@chakra-ui/react";
import type { RecipeBreakdownItem } from "~/types/recipes";

interface TierSummaryViewProps {
  breakdown: RecipeBreakdownItem[];
}

export function TierSummaryView({ breakdown }: TierSummaryViewProps) {
  const tierGroups = breakdown.reduce((acc, item) => {
    if (!acc[item.tier]) acc[item.tier] = [];
    acc[item.tier].push(item);
    return acc;
  }, {} as Record<number, RecipeBreakdownItem[]>);

  const sortedTiers = Object.keys(tierGroups)
    .map(Number)
    .sort((a, b) => b - a); // Highest tier first

  return (
    <VStack spacing={3} align="stretch">
      {sortedTiers.map((tier) => (
        <Card key={tier} variant="outline">
          <CardHeader pb={1}>
            <HStack justify="space-between">
              <Heading size="sm">Tier {tier}</Heading>
              <Badge colorScheme="blue" size="sm">
                {tierGroups[tier].length} items
              </Badge>
            </HStack>
          </CardHeader>
          <CardBody pt={0}>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={2}>
              {tierGroups[tier].map((item) => (
                <Box
                  key={item.itemId}
                  p={2}
                  border="1px"
                  borderColor="gray.200"
                  borderRadius="md"
                  bg={item.deficit > 0 ? "red.50" : "green.50"}
                >
                  <Text fontWeight="medium" fontSize="sm">{item.name}</Text>
                  <HStack justify="space-between" mt={1}>
                    <Text fontSize="xs" color="gray.600">
                      Need: {item.deficit.toLocaleString()}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      Have: {item.currentInventory.toLocaleString()}
                    </Text>
                  </HStack>
                </Box>
              ))}
            </SimpleGrid>
          </CardBody>
        </Card>
      ))}
    </VStack>
  );
}
