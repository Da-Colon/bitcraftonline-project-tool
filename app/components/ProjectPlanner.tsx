import {
  Box,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";
import type { Item, ProjectItem } from "~/types/recipes";

interface ProjectPlannerProps {
  projectItems: ProjectItem[];
  itemMap: Map<string, Item>;
  breakdown: {
    rawMaterials: Map<string, number>;
    intermediates: Map<string, number>;
    totalItems: Map<string, number>;
  } | null;
  onUpdateItemQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
}

export function ProjectPlanner({
  projectItems,
  itemMap,
  breakdown,
  onUpdateItemQuantity,
  onRemoveItem,
}: ProjectPlannerProps) {
  if (projectItems.length === 0) {
    return (
      <Box bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200" p={12} textAlign="center">
        <Text fontSize="2xl" mb={2}>📦</Text>
        <Heading size="sm" mb={2}>No items in project</Heading>
        <Text color="gray.500">Use the search above to add items to your crafting project.</Text>
      </Box>
    );
  }

  return (
    <Box bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200" p={4}>
      <Heading size="md" mb={4}>
        Project Items
      </Heading>
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>Item</Th>
            <Th>Category</Th>
            <Th>Quantity</Th>
            <Th>Has Recipe</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {projectItems.map((projectItem) => {
            const item = itemMap.get(projectItem.itemId);
            if (!item) return null;

            return (
              <Tr key={projectItem.itemId}>
                <Td>{item.name}</Td>
                <Td>{item.category}</Td>
                <Td>
                  <NumberInput
                    value={projectItem.quantity}
                    onChange={(_, value) =>
                      onUpdateItemQuantity(projectItem.itemId, value)
                    }
                    min={1}
                    max={1000}
                    w="100px"
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </Td>
                <Td>
                  <Badge
                    colorScheme={
                      breakdown?.intermediates.has(projectItem.itemId)
                        ? "green"
                        : "orange"
                    }
                  >
                    {breakdown?.intermediates.has(projectItem.itemId)
                      ? "Yes"
                      : "Raw Material"}
                  </Badge>
                </Td>
                <Td>
                  <IconButton
                    aria-label="Remove item"
                    icon={<DeleteIcon />}
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => onRemoveItem(projectItem.itemId)}
                  />
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </Box>
  );
}
