import { useState } from "react"
import {
  Box,
  VStack,
  HStack,
  Input,
  Text,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Heading,
  useColorModeValue,
} from "@chakra-ui/react"
import type { Item } from "~/types/recipes"
import { GameDataIcon } from "~/components/GameDataIcon"

interface ItemSearchCardProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  searchResults: Item[]
  selectedItem: Item | null
  onItemSelect: (item: Item) => void
}

export function ItemSearchCard({
  searchQuery,
  onSearchChange,
  searchResults,
  selectedItem,
  onItemSelect,
}: ItemSearchCardProps) {
  const borderColor = useColorModeValue("gray.200", "gray.600")
  const hoverColor = useColorModeValue("gray.50", "gray.700")

  return (
    <Card>
      <CardHeader pb={2}>
        <Heading size="md">Item Search</Heading>
      </CardHeader>
      <CardBody pt={0}>
        <VStack spacing={3} align="stretch">
          <Input
            placeholder="Search for items..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />

          {searchQuery.length > 2 && searchResults.length > 0 && !selectedItem && (
            <Box
              maxH="300px"
              overflowY="auto"
              border="1px"
              borderColor={borderColor}
              borderRadius="md"
            >
              {searchResults.map((item: Item) => (
                <Box
                  key={item.id}
                  p={2}
                  borderBottom="1px"
                  borderColor={borderColor}
                  cursor="pointer"
                  _hover={{ bg: hoverColor }}
                  onClick={() => onItemSelect(item)}
                >
                  <HStack spacing={2} align="start">
                    <GameDataIcon iconAssetName={item.iconAssetName} alt={item.name} size="24px" />
                    <VStack align="start" spacing={1} flex={1}>
                      <Text fontWeight="medium">{item.name}</Text>
                      <HStack>
                        <Badge colorScheme="blue" size="sm">
                          Tier {item.tier}
                        </Badge>
                        <Badge variant="outline" size="sm">
                          {item.category}
                        </Badge>
                      </HStack>
                    </VStack>
                  </HStack>
                </Box>
              ))}
            </Box>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}
