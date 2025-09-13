import { Box, Container, VStack } from "@chakra-ui/react";
import { Suspense, lazy } from "react";
import { PlayerHeader } from "~/components/PlayerHeader";
import { ClaimInventoryView } from "~/components/ClaimInventoryView";
import { useSelectedPlayer } from "~/hooks/useSelectedPlayer";

const PlayerSelectionView = lazy(() =>
  import("~/components/PlayerSelectionView").then((m) => ({ default: m.PlayerSelectionView }))
);

export default function ClaimInventoriesRoute() {
  const { player } = useSelectedPlayer();

  if (!player) {
    return (
      <Suspense fallback={null}>
        <PlayerSelectionView />
      </Suspense>
    );
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
