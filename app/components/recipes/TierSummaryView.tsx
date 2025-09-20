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

  const cardStyles = {
    bg: "rgba(24,35,60,0.9)",
    border: "1px solid rgba(148, 163, 184, 0.35)",
    borderRadius: "2xl",
    boxShadow: "xl",
    backdropFilter: "blur(12px)",
  } as const;

  return (
    <VStack spacing={3} align="stretch">
      {sortedTiers.map((tier) => (
        <Card key={tier} {...cardStyles}>
          <CardHeader pb={1}>
            <HStack justify="space-between">
              <Heading size="sm" color="white">
                Tier {tier}
              </Heading>
              <Badge colorScheme="teal" size="sm" borderRadius="full" px={2}>
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
                  border="1px solid rgba(148, 163, 184, 0.2)"
                  borderRadius="xl"
                  bg={
                    item.deficit > 0
                      ? "rgba(190, 24, 93, 0.18)"
                      : "rgba(45, 212, 191, 0.18)"
                  }
                >
                  <Text fontWeight="medium" fontSize="sm" color="white">
                    {item.name}
                  </Text>
                  <HStack justify="space-between" mt={1}>
                    <Text fontSize="xs" color="whiteAlpha.800">
                      Need: {item.deficit.toLocaleString()}
                    </Text>
                    <Text fontSize="xs" color="whiteAlpha.800">
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
