import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Text,
  HStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  VStack,
} from "@chakra-ui/react"

import { GameDataIcon } from "~/components/GameDataIcon"
import type { RecipeBreakdownItem } from "~/types/recipes"

interface RecipeBreakdownTableProps {
  breakdown: RecipeBreakdownItem[]
  isRecipeComplete: boolean
  onClearSelection: () => void
}

export function RecipeBreakdownTable({
  breakdown,
  isRecipeComplete,
  onClearSelection,
}: RecipeBreakdownTableProps) {
  return (
    <VStack spacing={4} align="stretch">
      {isRecipeComplete && (
        <Alert
          status="success"
          bg="rgba(45, 212, 191, 0.18)"
          border="1px solid rgba(45, 212, 191, 0.35)"
          borderRadius="xl"
          color="white"
        >
          <AlertIcon color="teal.200" />
          <AlertTitle mr={2} color="white">
            Recipe Complete!
          </AlertTitle>
          <AlertDescription flex={1} color="whiteAlpha.900">
            You have all materials needed to craft this item.
          </AlertDescription>
          <Button
            colorScheme="teal"
            size="sm"
            onClick={onClearSelection}
            bg="teal.500"
            color="gray.900"
            _hover={{ bg: "teal.400" }}
          >
            Clear Selection
          </Button>
        </Alert>
      )}
      <TableContainer
        bg="rgba(15,23,42,0.85)"
        border="1px solid rgba(148, 163, 184, 0.2)"
        borderRadius="2xl"
        boxShadow="xl"
        backdropFilter="blur(12px)"
        overflow="hidden"
      >
        <Table
          variant="simple"
          size="sm"
          sx={{
            th: {
              color: "whiteAlpha.700",
              textTransform: "uppercase",
              letterSpacing: "wider",
              fontSize: "xs",
              bg: "rgba(15,23,42,0.9)",
              borderBottomColor: "rgba(148, 163, 184, 0.2)",
            },
            td: {
              color: "whiteAlpha.900",
              borderBottomColor: "rgba(148, 163, 184, 0.15)",
            },
            "tbody tr:hover td": {
              bg: "rgba(45, 64, 98, 0.55)",
            },
          }}
        >
          <Thead>
            <Tr>
              <Th>Item</Th>
              <Th>Tier</Th>
              <Th>Category</Th>
              <Th isNumeric>Recipe Required</Th>
              <Th isNumeric>Current Inventory</Th>
              <Th isNumeric>Actual Required</Th>
              <Th isNumeric>Deficit</Th>
              <Th isNumeric>Effort</Th>
            </Tr>
          </Thead>
          <Tbody>
            {breakdown.map((item) => (
              <Tr key={item.itemId}>
                <Td>
                  <HStack spacing={2}>
                    <GameDataIcon iconAssetName={item.iconAssetName} alt={item.name} size="16px" />
                    <Text fontWeight="medium" color="white">
                      {item.name}
                    </Text>
                  </HStack>
                </Td>
                <Td>
                  <Badge colorScheme="teal" size="sm" borderRadius="full" px={2}>
                    T{item.tier}
                  </Badge>
                </Td>
                <Td>
                  <Badge variant="subtle" colorScheme="purple" size="sm" borderRadius="full" px={2}>
                    {item.category}
                  </Badge>
                </Td>
                <Td isNumeric>{item.recipeRequired.toLocaleString()}</Td>
                <Td isNumeric>
                  <Text color={item.currentInventory > 0 ? "teal.200" : "whiteAlpha.500"}>
                    {(item.currentInventory || 0).toLocaleString()}
                  </Text>
                </Td>
                <Td isNumeric>{item.actualRequired.toLocaleString()}</Td>
                <Td isNumeric>
                  <Text color={item.deficit > 0 ? "pink.300" : "teal.200"} fontWeight="bold">
                    {item.deficit.toLocaleString()}
                  </Text>
                </Td>
                <Td isNumeric>
                  <Text color="teal.200" fontSize="sm">
                    🔥 {(item.effortAfterInventory || 0).toLocaleString()}
                  </Text>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </VStack>
  )
}
