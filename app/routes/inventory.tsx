import { Badge, Box, Button, Flex, Heading, Text, VStack, Wrap, WrapItem } from "@chakra-ui/react";
import { Suspense, lazy } from "react";
import { Link as RemixLink } from "@remix-run/react";
import { PlayerHeader } from "~/components/player/PlayerHeader";
import { PersonalInventoriesView } from "~/components/inventory/PersonalInventoriesView";
import { DashboardLayout } from "~/components/dashboard/DashboardLayout";
import { useSelectedPlayer } from "~/hooks/useSelectedPlayer";
import { PlayerInventoryTrackingProvider } from "~/contexts/PlayerInventoryTrackingContext";

const PlayerSelectionView = lazy(() =>
  import("~/components/player/PlayerSelectionView").then((m) => ({ default: m.PlayerSelectionView }))
);

export default function InventoryRoute() {
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
                Keep it tidy, {player.username}.
              </Heading>
              <Text fontSize={{ base: "md", md: "xl" }} color="whiteAlpha.900" maxW="2xl">
                Review every stash, choose what stays tracked, and sync with claim stores before your
                next BitCraft session.
              </Text>

              <Wrap spacing={{ base: 1, md: 2 }} justify={{ base: "flex-start", sm: "flex-start" }}>
                <WrapItem>
                  <Badge colorScheme="teal" px={2} py={0.5} borderRadius="full" fontSize="xs">
                    Personal caches ready to sync
                  </Badge>
                </WrapItem>
                <WrapItem>
                  <Badge colorScheme="purple" px={2} py={0.5} borderRadius="full" fontSize="xs">
                    Track + plan without leaving
                  </Badge>
                </WrapItem>
              </Wrap>
            </Flex>
          </Box>
        }
      >
        <VStack spacing={{ base: 8, md: 10 }} align="stretch">
          <PersonalInventoriesView />
        </VStack>
      </DashboardLayout>
    </Box>
    </PlayerInventoryTrackingProvider>
  );
}
