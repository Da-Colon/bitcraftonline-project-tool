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
} from "@chakra-ui/react"
import type { RecipeBreakdownItem } from "~/types/recipes"
import { GameDataIcon } from "~/components/GameDataIcon"

interface RecipeBreakdownTableProps {
  breakdown: RecipeBreakdownItem[]
}

export function RecipeBreakdownTable({ breakdown }: RecipeBreakdownTableProps) {
  return (
    <TableContainer>
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>Item</Th>
            <Th>Tier</Th>
            <Th>Category</Th>
            <Th isNumeric>Recipe Required</Th>
            <Th isNumeric>Current Inventory</Th>
            <Th isNumeric>Actual Required</Th>
            <Th isNumeric>Deficit</Th>
          </Tr>
        </Thead>
        <Tbody>
          {breakdown.map((item) => (
            <Tr key={item.itemId}>
              <Td>
                <HStack spacing={2}>
                  <GameDataIcon iconAssetName={item.iconAssetName} alt={item.name} size="16px" />
                  <Text fontWeight="medium">{item.name}</Text>
                </HStack>
              </Td>
              <Td>
                <Badge colorScheme="blue" size="sm">
                  T{item.tier}
                </Badge>
              </Td>
              <Td>
                <Badge variant="outline" size="sm">
                  {item.category}
                </Badge>
              </Td>
              <Td isNumeric>{item.recipeRequired.toLocaleString()}</Td>
              <Td isNumeric>
                <Text color={item.currentInventory > 0 ? "green.500" : "gray.500"}>
                  {(item.currentInventory || 0).toLocaleString()}
                </Text>
              </Td>
              <Td isNumeric>{item.actualRequired.toLocaleString()}</Td>
              <Td isNumeric>
                <Text color={item.deficit > 0 ? "red.500" : "green.500"} fontWeight="bold">
                  {item.deficit.toLocaleString()}
                </Text>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  )
}
