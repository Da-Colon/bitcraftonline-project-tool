import {
  Box,
  Flex,
  Heading,
  Input,
  Button,
  Text,
  Badge,
  Spacer,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import type { Item, ProjectItem } from "~/types/recipes";
import { getTierColorScheme } from "~/theme";

interface ItemSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Item[];
  projectItems: ProjectItem[];
  onAddItem: (item: Item) => void;
  onRecalculate: () => void;
}

export function ItemSearch({
  searchQuery,
  setSearchQuery,
  searchResults,
  projectItems,
  onAddItem,
  onRecalculate,
}: ItemSearchProps) {
  return (
    <Box bg="surface.primary" borderRadius="lg" border="1px solid" borderColor="border.primary" p={5}>
      <Flex align="center" mb={3}>
        <Heading size="md">Add Items to Project</Heading>
        <Spacer />
        <Button
          leftIcon={<SearchIcon />}
          onClick={onRecalculate}
          isDisabled={projectItems.length === 0}
          variant="outline"
        >
          Calculate Complete Project Resources
        </Button>
      </Flex>
      <Input
        placeholder="Search items to add to project..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {searchResults.length > 0 && (
        <Box
          mt={3}
          maxH="220px"
          overflowY="auto"
          border="1px"
          borderColor="border.secondary"
          borderRadius="md"
        >
          {searchResults.map((item) => (
            <Flex
              key={item.id}
              p={3}
              borderBottom="1px"
              borderColor="border.primary"
              cursor="pointer"
              _hover={{ bg: "surface.secondary" }}
              onClick={() => onAddItem(item)}
            >
              <Box>
                <Text fontWeight="medium">{item.name}</Text>
                <Text fontSize="sm" color="text.muted">
                  {item.category}
                </Text>
              </Box>
              <Spacer />
              <Badge colorScheme={getTierColorScheme(item.tier)}>Tier {item.tier}</Badge>
            </Flex>
          ))}
        </Box>
      )}
    </Box>
  );
}
