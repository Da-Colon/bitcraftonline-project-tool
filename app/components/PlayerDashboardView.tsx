import { Box, Container, VStack, Text } from "@chakra-ui/react";
import { PlayerHeader } from "~/components/PlayerHeader";

export function PlayerDashboardView() {
  return (
    <Box minH="100vh">
      <PlayerHeader />
      <Container maxW="container.xl" py={6}>
        <VStack spacing={6} align="stretch">
          {/* Placeholder content - this will be expanded with player-specific features */}
          <Box p={6} bg="surface.secondary" borderRadius="md" border="1px solid" borderColor="border.primary">
            <Text color="text.muted" textAlign="center">
              Player dashboard content will be added here
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
