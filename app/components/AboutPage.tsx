import { SettingsIcon, StarIcon, InfoIcon, CheckCircleIcon } from "@chakra-ui/icons"
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Icon,
  Button,
  Divider,
  useColorModeValue,
} from "@chakra-ui/react"
import { useNavigate } from "@remix-run/react"

export function AboutPage() {
  const bgGradient = useColorModeValue(
    "linear(to-br, blue.50, purple.50)",
    "linear(to-br, gray.900, purple.900)"
  )

  const navigate = useNavigate()

  return (
    <Box minH="100vh" bgGradient={bgGradient}>
      {/* Hero Section */}
      <Container maxW="7xl" pt={20} pb={16}>
        <VStack spacing={8} textAlign="center">
          <VStack spacing={4}>
            <Heading
              as="h1"
              size="3xl"
              bgGradient="linear(to-r, blue.400, purple.500)"
              bgClip="text"
              fontWeight="bold"
            >
              🏗️ BitCraft Project Planner
            </Heading>
            <Heading as="h2" size="xl" color="gray.600">
              & Recipe Calculator
            </Heading>
          </VStack>

          <Text fontSize="xl" maxW="2xl" color="gray.600">
            The ultimate companion app for BitCraft Online builders, crafters, and empire
            architects. Stop alt-tabbing to spreadsheets. Start building your BitCraft empire with
            data-driven precision.
          </Text>

          <HStack spacing={4}>
            <Button
              colorScheme="blue"
              size="lg"
              leftIcon={<StarIcon />}
              onClick={() => navigate("/")}
            >
              Get Started
            </Button>
          </HStack>
        </VStack>
      </Container>

      {/* How It Works Section */}
      <Box bg={useColorModeValue("gray.50", "gray.800")} py={16}>
        <Container maxW="7xl">
          <VStack spacing={12}>
            <VStack spacing={4} textAlign="center">
              <Heading as="h2" size="2xl">
                🎮 How It Works
              </Heading>
              <Text fontSize="lg" color="gray.600" maxW="2xl">
                Powered by sophisticated algorithms and real-time data integration
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={12} w="full">
              <VStack align="start" spacing={6}>
                <Heading as="h3" size="lg">
                  Recipe Calculation Engine
                </Heading>
                <Text>The heart of the app is a sophisticated recipe calculator that:</Text>
                <VStack align="start" spacing={2} pl={4}>
                  <Text>
                    1. <strong>Recursively breaks down</strong> complex recipes into base materials
                  </Text>
                  <Text>
                    2. <strong>Cross-references</strong> your combined inventory (personal + claims)
                  </Text>
                  <Text>
                    3. <strong>Calculates exact deficits</strong> showing what you need to gather
                  </Text>
                  <Text>
                    4. <strong>Optimizes by tier</strong> for efficient resource gathering
                  </Text>
                </VStack>
              </VStack>

              <VStack align="start" spacing={6}>
                <Heading as="h3" size="lg">
                  Inventory Aggregation
                </Heading>
                <Text>The system intelligently combines inventories from multiple sources:</Text>
                <VStack align="start" spacing={2} pl={4}>
                  <Text>• Personal pockets and bags</Text>
                  <Text>• Bank vaults</Text>
                  <Text>• Storage containers</Text>
                  <Text>• Recovery stashes</Text>
                  <Text>• All buildings in your selected claim</Text>
                </VStack>
              </VStack>
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Tech Stack Section */}
      <Container maxW="7xl" py={16}>
        <VStack spacing={12}>
          <VStack spacing={4} textAlign="center">
            <Heading as="h2" size="2xl">
              🏗️ Built With Modern Tech
            </Heading>
            <Text fontSize="lg" color="gray.600" maxW="2xl">
              Leveraging the best tools for performance, reliability, and developer experience
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={8} w="full">
            <VStack spacing={3}>
              <Icon as={SettingsIcon} boxSize={8} color="blue.500" />
              <Text fontWeight="bold">React 18</Text>
              <Text fontSize="sm" color="gray.600" textAlign="center">
                Latest React with Concurrent Features
              </Text>
            </VStack>
            <VStack spacing={3}>
              <Icon as={InfoIcon} boxSize={8} color="purple.500" />
              <Text fontWeight="bold">Remix</Text>
              <Text fontSize="sm" color="gray.600" textAlign="center">
                Full-stack web framework with SSR
              </Text>
            </VStack>
            <VStack spacing={3}>
              <Icon as={StarIcon} boxSize={8} color="teal.500" />
              <Text fontWeight="bold">Chakra UI</Text>
              <Text fontSize="sm" color="gray.600" textAlign="center">
                Modular and accessible components
              </Text>
            </VStack>
            <VStack spacing={3}>
              <Icon as={CheckCircleIcon} boxSize={8} color="green.500" />
              <Text fontWeight="bold">TypeScript</Text>
              <Text fontSize="sm" color="gray.600" textAlign="center">
                Type-safe development experience
              </Text>
            </VStack>
          </SimpleGrid>
        </VStack>
      </Container>

      {/* Footer */}
      <Box bg={useColorModeValue("gray.100", "gray.900")} py={8}>
        <Container maxW="7xl">
          <VStack spacing={4}>
            <Divider />
            <HStack spacing={8} flexWrap="wrap" justify="center">
              <Text fontSize="sm" color="gray.600">
                Made with ❤️ for the BitCraft community
              </Text>
            </HStack>
            <Text fontSize="xs" color="gray.500" textAlign="center">
              BitCraft Online and all related trademarks belong to Clockwork Labs, Inc. This app
              uses game assets for non-commercial informational purposes under fair use.
            </Text>
          </VStack>
        </Container>
      </Box>
    </Box>
  )
}
