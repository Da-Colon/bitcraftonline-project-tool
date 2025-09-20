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
  return (
    <Card
      bg="rgba(24,35,60,0.9)"
      border="1px solid rgba(148, 163, 184, 0.35)"
      borderRadius="2xl"
      boxShadow="xl"
      backdropFilter="blur(12px)"
    >
      <CardHeader pb={2}>
        <Heading size="md" color="white">
          Item Search
        </Heading>
      </CardHeader>
      <CardBody pt={0}>
        <VStack spacing={3} align="stretch">
          <Input
            placeholder="Search for items..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            variant="filled"
            bg="rgba(15,23,42,0.8)"
            borderColor="whiteAlpha.200"
            _hover={{ bg: "rgba(15,23,42,0.9)" }}
            _focus={{ borderColor: "teal.400", bg: "rgba(15,23,42,1)" }}
            color="white"
            _placeholder={{ color: "whiteAlpha.600" }}
          />

          {searchQuery.length > 2 && searchResults.length > 0 && !selectedItem && (
            <Box
              maxH="300px"
              overflowY="auto"
              border="1px solid rgba(148, 163, 184, 0.2)"
              borderRadius="xl"
              bg="rgba(15,23,42,0.92)"
            >
              {searchResults.map((item: Item) => (
                <Box
                  key={item.id}
                  p={2}
                  borderBottom="1px solid rgba(148, 163, 184, 0.15)"
                  cursor="pointer"
                  _last={{ borderBottom: "none" }}
                  _hover={{ bg: "rgba(45,55,72,0.55)" }}
                  onClick={() => onItemSelect(item)}
                >
                  <HStack spacing={2} align="start">
                    <GameDataIcon iconAssetName={item.iconAssetName} alt={item.name} size="24px" />
                    <VStack align="start" spacing={1} flex={1}>
                      <Text fontWeight="medium" color="white">
                        {item.name}
                      </Text>
                      <HStack>
                        <Badge colorScheme="teal" size="sm" borderRadius="full" px={2}>
                          Tier {item.tier}
                        </Badge>
                        <Badge
                          variant="subtle"
                          colorScheme="purple"
                          size="sm"
                          borderRadius="full"
                          px={2}
                        >
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
