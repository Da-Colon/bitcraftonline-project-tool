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
} from "@chakra-ui/react"
import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons"
import type { Item, Recipe } from "~/types/recipes"
import { getTierColorScheme } from "~/utils/colors"
import { GameDataIcon } from "~/components/GameDataIcon"

export interface RecipeLookup {
  getItem: (id: string) => Item | undefined
  getRecipe: (id: string) => Recipe | undefined
}

interface ItemBreakdownProps {
  itemId: string
  quantity: number
  lookup: RecipeLookup
  level?: number
  maxLevel?: number
}

export function ItemBreakdown({
  itemId,
  quantity,
  lookup,
  level = 0,
  maxLevel = 5,
}: ItemBreakdownProps) {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: level < 2 })
  const item = lookup.getItem(itemId)
  const recipe = lookup.getRecipe(itemId)

  if (!item) {
    return (
      <Text color="red.500" fontSize="sm">
        Unknown item: {itemId}
      </Text>
    )
  }

  const hasRecipe = recipe && level < maxLevel
  const indent = level * 20

  return (
    <Box>
      <Flex
        pl={`${indent}px`}
        py={2}
        px={3}
        bg={level % 2 === 0 ? "white" : "gray.50"}
        borderLeft={level > 0 ? "2px solid" : "none"}
        borderLeftColor="gray.200"
        _hover={{ bg: "gray.50" }}
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

          <GameDataIcon iconAssetName={item.iconAssetName} alt={item.name} size="16px" />

          <Text fontWeight={level === 0 ? "bold" : "medium"}>{item.name}</Text>

          <Badge colorScheme={getTierColorScheme(item.tier)} size="sm">
            Tier {item.tier}
          </Badge>

          <Text fontSize="sm" color="gray.500">
            ({item.category})
          </Text>
        </HStack>

        <Spacer />

        <VStack spacing={0} align="end">
          <Text fontWeight="bold" color="blue.500">
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
              const batchesNeeded = Math.ceil(quantity / recipe.outputQuantity)
              const inputQuantityNeeded = input.quantity * batchesNeeded

              return (
                <ItemBreakdown
                  key={input.itemId}
                  itemId={input.itemId}
                  quantity={inputQuantityNeeded}
                  lookup={lookup}
                  level={level + 1}
                  maxLevel={maxLevel}
                />
              )
            })}
          </VStack>
        </Collapse>
      )}
    </Box>
  )
}

interface RecipeTreeProps {
  itemId: string
  quantity: number
  lookup: RecipeLookup
}

export function RecipeTree({ itemId, quantity, lookup }: RecipeTreeProps) {
  const item = lookup.getItem(itemId)

  if (!item) {
    return (
      <Box p={4} border="1px" borderColor="red.200" borderRadius="md">
        <Text color="red.500">Item not found: {itemId}</Text>
      </Box>
    )
  }

  return (
    <Box border="1px" borderColor="gray.200" borderRadius="md" overflow="hidden">
      <Box bg="blue.500" color="white" p={3}>
        <Text fontWeight="bold" fontSize="lg">
          Recipe Tree: {item.name}
        </Text>
        <Text fontSize="sm" color="whiteAlpha.800">
          Showing breakdown for {quantity} units
        </Text>
      </Box>

      <Box>
        <ItemBreakdown itemId={itemId} quantity={quantity} lookup={lookup} />
      </Box>
    </Box>
  )
}
