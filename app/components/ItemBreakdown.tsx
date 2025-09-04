import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Collapse,
  IconButton,
  Flex,
  Spacer,
  useDisclosure,
} from "@chakra-ui/react";
import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { useState } from "react";
import type { Item, Recipe } from "../types/recipes";
import { RecipeCalculator } from "../services/recipe-calculator";

interface ItemBreakdownProps {
  itemId: string;
  quantity: number;
  calculator: RecipeCalculator;
  level?: number;
  maxLevel?: number;
}

export function ItemBreakdown({ 
  itemId, 
  quantity, 
  calculator, 
  level = 0, 
  maxLevel = 5 
}: ItemBreakdownProps) {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: level < 2 });
  const item = calculator.getItem(itemId);
  const recipe = calculator.getRecipe(itemId);

  if (!item) {
    return (
      <Text color="red.500" fontSize="sm">
        Unknown item: {itemId}
      </Text>
    );
  }

  const hasRecipe = recipe && level < maxLevel;
  const indent = level * 20;

  return (
    <Box>
      <Flex
        pl={`${indent}px`}
        py={2}
        px={3}
        bg={level % 2 === 0 ? "gray.50" : "white"}
        borderLeft={level > 0 ? "2px solid" : "none"}
        borderLeftColor="gray.200"
        _hover={{ bg: "blue.50" }}
      >
        <HStack spacing={2} flex={1}>
          {hasRecipe && (
            <IconButton
              aria-label="Toggle recipe"
              icon={isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
              size="xs"
              variant="ghost"
              onClick={onToggle}
            />
          )}
          
          {!hasRecipe && <Box w="24px" />}
          
          <Text fontWeight={level === 0 ? "bold" : "medium"}>
            {item.name}
          </Text>
          
          <Badge 
            colorScheme={item.tier === 0 ? "orange" : item.tier === 1 ? "blue" : "purple"}
            size="sm"
          >
            Tier {item.tier}
          </Badge>
          
          <Text fontSize="sm" color="gray.600">
            ({item.category})
          </Text>
        </HStack>
        
        <Spacer />
        
        <VStack spacing={0} align="end">
          <Text fontWeight="bold" color="blue.600">
            {quantity}x
          </Text>
          {recipe && (
            <Text fontSize="xs" color="gray.500">
              {Math.ceil(quantity / recipe.outputQuantity)} batches
            </Text>
          )}
        </VStack>
      </Flex>

      {hasRecipe && (
        <Collapse in={isOpen} animateOpacity>
          <VStack spacing={1} align="stretch">
            {recipe.inputs.map((input) => {
              const batchesNeeded = Math.ceil(quantity / recipe.outputQuantity);
              const inputQuantityNeeded = input.quantity * batchesNeeded;
              
              return (
                <ItemBreakdown
                  key={input.itemId}
                  itemId={input.itemId}
                  quantity={inputQuantityNeeded}
                  calculator={calculator}
                  level={level + 1}
                  maxLevel={maxLevel}
                />
              );
            })}
          </VStack>
        </Collapse>
      )}
    </Box>
  );
}

interface RecipeTreeProps {
  itemId: string;
  quantity: number;
  calculator: RecipeCalculator;
}

export function RecipeTree({ itemId, quantity, calculator }: RecipeTreeProps) {
  const item = calculator.getItem(itemId);

  if (!item) {
    return (
      <Box p={4} border="1px" borderColor="red.200" borderRadius="md">
        <Text color="red.500">Item not found: {itemId}</Text>
      </Box>
    );
  }

  return (
    <Box border="1px" borderColor="gray.200" borderRadius="md" overflow="hidden">
      <Box bg="blue.500" color="white" p={3}>
        <Text fontWeight="bold" fontSize="lg">
          Recipe Tree: {item.name}
        </Text>
        <Text fontSize="sm" opacity={0.9}>
          Showing breakdown for {quantity} units
        </Text>
      </Box>
      
      <Box>
        <ItemBreakdown
          itemId={itemId}
          quantity={quantity}
          calculator={calculator}
        />
      </Box>
    </Box>
  );
}
