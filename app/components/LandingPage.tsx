import { Box, Container, Heading, Text, VStack } from "@chakra-ui/react"

export function LandingPage() {
  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
      <Container maxW="4xl">
        <VStack spacing={8} textAlign="center">
          <Heading as="h1" size="3xl" color="gray.500">
            🏗️ BitCraft Project Planner
          </Heading>
          <Text fontSize="lg" color="gray.400">
            Coming soon...
          </Text>
        </VStack>
      </Container>
    </Box>
  )
}
