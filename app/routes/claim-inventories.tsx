import { Badge, Box, Button, HStack, Heading, Text, VStack } from "@chakra-ui/react";
import { Suspense, lazy } from "react";
import { Link as RemixLink } from "@remix-run/react";
import { PlayerHeader } from "~/components/player/PlayerHeader";
import { ClaimInventoryView } from "~/components/claims/ClaimInventoryView";
import { DashboardLayout } from "~/components/dashboard/DashboardLayout";
import { useSelectedPlayer } from "~/hooks/useSelectedPlayer";

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
    <Box bg="gray.900" minH="100vh">
      <PlayerHeader />
      <DashboardLayout
        hero={
          <Box px={{ base: 6, md: 10 }} py={{ base: 8, md: 12 }}>
            <VStack spacing={4} align="flex-start" maxW="3xl">
              <Text textTransform="uppercase" fontSize="sm" letterSpacing="widest" color="whiteAlpha.800">
                Claim Storage Command
              </Text>
              <Heading size="2xl" lineHeight="1.1" color="white">
                Line up the storerooms, {player.username}.
              </Heading>
              <Text fontSize={{ base: "lg", md: "xl" }} color="whiteAlpha.900">
                Track every guild hall cellar, stage claim transfers, and keep rare mats ready for
                the next crafting push.
              </Text>

              <HStack spacing={3} flexWrap="wrap">
                <Badge colorScheme="teal" px={3} py={1} borderRadius="full">
                  Claim buildings synced to dashboard
                </Badge>
                <Badge colorScheme="pink" px={3} py={1} borderRadius="full">
                  Cozy logistics, zero spreadsheeting
                </Badge>
              </HStack>
            </VStack>
          </Box>
        }
      >
        <VStack spacing={{ base: 8, md: 10 }} align="stretch" id="claim-management">
          <ClaimInventoryView />
        </VStack>
      </DashboardLayout>
    </Box>
  );
}
