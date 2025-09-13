import { Box, Container, VStack } from "@chakra-ui/react";
import { PlayerHeader } from "~/components/PlayerHeader";
import { TrackedInventoryView } from "~/components/TrackedInventoryView";

export function PlayerDashboardView() {
  return (
    <Box minH="100vh">
      <PlayerHeader />
      <Container maxW="container.xl" py={6}>
        <VStack spacing={6} align="stretch">
          <TrackedInventoryView />
        </VStack>
      </Container>
    </Box>
  );
}
