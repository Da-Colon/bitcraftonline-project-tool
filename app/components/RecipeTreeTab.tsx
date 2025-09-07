import {
  VStack,
  Heading,
  Text,
} from "@chakra-ui/react";
import type { Item, ProjectItem, Recipe } from "~/types/recipes";
import { RecipeTree } from "~/components/ItemBreakdown";

interface RecipeTreeTabProps {
  projectItems: ProjectItem[];
  calcData: {
    items: Record<string, Item>;
    recipes: Record<string, Recipe>;
  } | null;
  itemMap: Map<string, Item>;
}

export function RecipeTreeTab({
  projectItems,
  calcData,
  itemMap,
}: RecipeTreeTabProps) {
  if (projectItems.length === 0) {
    return <Text color="text.muted">Add items to view the recipe tree.</Text>;
  }

  const lookup = {
    getItem: (id: string) => calcData?.items[id] || itemMap.get(id),
    getRecipe: (id: string) => (calcData?.recipes || {})[id],
  };

  return (
    <VStack spacing={4} align="stretch">
      <Heading size="md">Recipe Tree</Heading>
      {projectItems.map((projectItem) => (
        <RecipeTree
          key={projectItem.itemId}
          itemId={projectItem.itemId}
          quantity={projectItem.quantity}
          lookup={lookup}
        />
      ))}
    </VStack>
  );
}
