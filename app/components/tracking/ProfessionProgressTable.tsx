/**
 * Profession Progress Table Component
 * Displays progress by profession with tier breakdowns (T1-T9)
 */
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  HStack,
  VStack,
  Text,
  Badge,
  Progress,
} from "@chakra-ui/react";
import type { ProfessionProgress } from "~/types/tracking";

interface ProfessionProgressTableProps {
  professionProgress: ProfessionProgress[];
}

export function ProfessionProgressTable({ professionProgress }: ProfessionProgressTableProps) {
  return (
    <Box bg="white" borderRadius="md" border="1px solid" borderColor="gray.200" overflow="hidden">
      <Table variant="simple" size="sm">
        <Thead bg="gray.50">
          <Tr>
            <Th>Profession</Th>
            <Th>Category</Th>
            <Th>Progress</Th>
            <Th>T1</Th>
            <Th>T2</Th>
            <Th>T3</Th>
            <Th>T4</Th>
            <Th>T5</Th>
            <Th>T6</Th>
            <Th>T7</Th>
            <Th>T8</Th>
            <Th>T9</Th>
          </Tr>
        </Thead>
        <Tbody>
          {professionProgress.map((prof) => (
            <Tr key={prof.profession} _hover={{ bg: "gray.50" }}>
              <Td>
                <HStack>
                  <Text fontWeight="medium">{prof.profession}</Text>
                  <Badge variant="outline" fontSize="xs">
                    {((prof.completedItems / prof.totalItems) * 100).toFixed(1)}%
                  </Badge>
                </HStack>
              </Td>
              <Td>{prof.category}</Td>
              <Td>
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" fontWeight="bold">{prof.progress}%</Text>
                  <Progress 
                    value={prof.progress} 
                    size="sm" 
                    w="60px" 
                    colorScheme={prof.progress === 100 ? "green" : prof.progress > 0 ? "yellow" : "gray"}
                  />
                </VStack>
              </Td>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(tier => {
                const tierData = prof.tierQuantities[tier];
                if (!tierData || tierData.total === 0) {
                  return <Td key={tier}>-</Td>;
                }
                return (
                  <Td key={tier} isNumeric>
                    <VStack spacing={0}>
                      <Text fontSize="xs" fontWeight="bold">
                        {tierData.completed}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {tierData.total}
                      </Text>
                    </VStack>
                  </Td>
                );
              })}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
