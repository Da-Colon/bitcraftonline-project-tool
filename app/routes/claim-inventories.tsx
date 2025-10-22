import { Badge, Box, Button, Flex, Heading, Text, VStack, Wrap, WrapItem } from "@chakra-ui/react";
import { Suspense, lazy } from "react";
import { Link as RemixLink } from "@remix-run/react";
import { PlayerHeader } from "~/components/player/PlayerHeader";
import { ClaimInventoryView } from "~/components/claims/ClaimInventoryView";
import { DashboardLayout } from "~/components/dashboard/DashboardLayout";
import { useSelectedPlayer } from "~/hooks/useSelectedPlayer";
import { PlayerInventoryTrackingProvider } from "~/contexts/PlayerInventoryTrackingContext";

const PlayerSelectionView = lazy(() =>
  import("~/components/player/PlayerSelectionView").then((m) => ({ default: m.PlayerSelectionView }))
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
    <PlayerInventoryTrackingProvider playerId={player.entityId}>
      <Box bg="gray.900" minH="100vh">
        <PlayerHeader />
        <DashboardLayout
          hero={
          <Box px={{ base: 6, md: 10 }} py={{ base: 8, md: 12 }}>
            <Flex direction="column" align="flex-start" maxW="3xl" w="full" gap={{ base: 2, md: 3 }}>
              <Heading
                fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
                lineHeight={{ base: "1.15", md: "1.1" }}
                color="white"
              >
                Line up the storerooms, {player.username}.
              </Heading>
              <Text fontSize={{ base: "md", md: "xl" }} color="whiteAlpha.900" maxW="2xl">
                Track every guild hall cellar, stage claim transfers, and keep rare mats ready for
                the next crafting push.
              </Text>

              <Wrap spacing={{ base: 1, md: 2 }} justify={{ base: "flex-start", sm: "flex-start" }}>
                <WrapItem>
                  <Badge colorScheme="teal" px={2} py={0.5} borderRadius="full" fontSize="xs">
                    Claim buildings synced to dashboard
                  </Badge>
                </WrapItem>
                <WrapItem>
                  <Badge colorScheme="pink" px={2} py={0.5} borderRadius="full" fontSize="xs">
                    Cozy logistics, zero spreadsheeting
                  </Badge>
                </WrapItem>
              </Wrap>
            </Flex>
          </Box>
        }
      >
        <VStack spacing={{ base: 8, md: 10 }} align="stretch" id="claim-management">
          <ClaimInventoryView />
        </VStack>
      </DashboardLayout>
    </Box>
    </PlayerInventoryTrackingProvider>
  );
}
