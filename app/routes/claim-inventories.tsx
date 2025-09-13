import { Box, Container, VStack } from "@chakra-ui/react";
import { PlayerHeader } from "~/components/PlayerHeader";
import { ClaimInventoryView } from "~/components/ClaimInventoryView";
import { useSelectedPlayer } from "~/hooks/useSelectedPlayer";
import { PlayerSelectionView } from "~/components/PlayerSelectionView";

export default function ClaimInventoriesRoute() {
  const { player } = useSelectedPlayer();

  if (!player) {
    return <PlayerSelectionView />;
  }

  return (
    <Box minH="100vh">
      <PlayerHeader />
      <Container maxW="container.xl" py={6}>
        <VStack spacing={6} align="stretch">
          <ClaimInventoryView />
        </VStack>
      </Container>
    </Box>
  );
}
