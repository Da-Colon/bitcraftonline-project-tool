import {
  Box,
  Container,
  Heading,
  Input,
  Text,
  InputGroup,
  InputLeftElement,
  VStack,
  Icon,
  Flex,
  Badge,
} from "@chakra-ui/react"
import { SearchIcon } from "@chakra-ui/icons"
import { useState } from "react"
import { usePlayerSearch } from "~/hooks/usePlayerSearch"
import { useSelectedPlayer } from "~/hooks/useSelectedPlayer"
import { PlayerResults } from "~/components/PlayerResults"

export function PlayerSelectionView() {
  const { savePlayer } = useSelectedPlayer()
  const [query, setQuery] = useState("")
  const { results, loading, error } = usePlayerSearch(query, { minLength: 3, delay: 300 })

  return (
    <Box bg="gradient-to-br from-blue.50 to-purple.50" position="relative" overflow="hidden">
      {/* Background decoration */}
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        height="200px"
        bg="linear-gradient(135deg, blue.500 0%, purple.600 100%)"
        opacity="0.1"
        borderRadius="0 0 50% 50%"
        transform="scale(1.5)"
      />

      <Container
        maxW="container.md"
        display="flex"
        alignItems="center"
        justifyContent="center"
        position="relative"
        zIndex="1"
        py={4}
        px={4}
      >
        <Box w="100%" maxW="500px">
          {/* Search Card */}
          <Box
            w="100%"
            bg="white"
            borderRadius="xl"
            boxShadow="xl"
            border="1px solid"
            borderColor="gray.100"
            overflow="hidden"
          >
            <Box p={4} borderBottom="1px solid" borderColor="gray.100">
              <VStack spacing={3} align="stretch">
                <Flex align="center" justify="space-between">
                  <Heading size="md" color="gray.800">
                    Find Your Player
                  </Heading>
                  {results.length > 0 && (
                    <Badge colorScheme="blue" variant="subtle" fontSize="sm">
                      {results.length} found
                    </Badge>
                  )}
                </Flex>

                <InputGroup size="lg">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={SearchIcon} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    autoFocus
                    placeholder="Enter player name (min 3 characters)..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    bg="gray.50"
                    border="2px solid"
                    borderColor="gray.200"
                    _hover={{ borderColor: "blue.300", bg: "white" }}
                    _focus={{
                      borderColor: "blue.500",
                      bg: "white",
                      boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)",
                    }}
                    borderRadius="lg"
                  />
                </InputGroup>

                {(!query || query.trim().length < 3) && (
                  <Text color="gray.500" fontSize="sm" textAlign="center">
                    Start typing to search for players...
                  </Text>
                )}
              </VStack>
            </Box>

            {/* Results Section */}
            <Box p={4}>
              <PlayerResults
                players={results}
                isLoading={loading}
                error={error}
                onSelect={(p) => savePlayer({ entityId: p.entityId, username: p.username })}
              />
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}
