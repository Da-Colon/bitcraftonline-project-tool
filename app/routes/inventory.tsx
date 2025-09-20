import { Badge, Box, Button, HStack, Heading, Text, VStack } from "@chakra-ui/react";
import { Suspense, lazy } from "react";
import { Link as RemixLink } from "@remix-run/react";
import { PlayerHeader } from "~/components/PlayerHeader";
import { PersonalInventoriesView } from "~/components/PersonalInventoriesView";
import { DashboardLayout } from "~/components/DashboardLayout";
import { useSelectedPlayer } from "~/hooks/useSelectedPlayer";

const PlayerSelectionView = lazy(() =>
  import("~/components/PlayerSelectionView").then((m) => ({ default: m.PlayerSelectionView }))
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
    <Box bg="gray.900" minH="100vh">
      <PlayerHeader />
      <DashboardLayout
        hero={
          <Box px={{ base: 6, md: 10 }} py={{ base: 12, md: 20 }}>
            <VStack spacing={6} align="flex-start" maxW="3xl">
              <Text textTransform="uppercase" fontSize="sm" letterSpacing="widest" color="whiteAlpha.800">
                Personal Inventory Command
              </Text>
              <Heading size="2xl" lineHeight="1.1" color="white">
                Keep it tidy, {player.username}.
              </Heading>
              <Text fontSize={{ base: "lg", md: "xl" }} color="whiteAlpha.900">
                Review every stash, choose what stays tracked, and sync with claim stores before your
                next BitCraft session.
              </Text>

              <HStack spacing={3} flexWrap="wrap">
                <Badge colorScheme="teal" px={3} py={1} borderRadius="full">
                  Personal caches ready to sync
                </Badge>
                <Badge colorScheme="purple" px={3} py={1} borderRadius="full">
                  Track + plan without leaving
                </Badge>
              </HStack>

              <HStack spacing={3} flexWrap="wrap">
                <Button
                  as={RemixLink}
                  to="/claim-inventories"
                  colorScheme="teal"
                  size="lg"
                  bg="teal.400"
                  _hover={{ bg: "teal.500" }}
                >
                  Claim Inventories
                </Button>
                <Button
                  as={RemixLink}
                  to="/recipes"
                  size="lg"
                  variant="ghost"
                  color="whiteAlpha.900"
                  _hover={{ bg: "whiteAlpha.200" }}
                >
                  Jump to Recipes
                </Button>
              </HStack>
            </VStack>
          </Box>
        }
      >
        <VStack spacing={{ base: 8, md: 10 }} align="stretch">
          <PersonalInventoriesView />
        </VStack>
      </DashboardLayout>
    </Box>
  );
}
