import { VStack, Text, Box, Spinner, Flex, Icon, Center } from "@chakra-ui/react";
import { SearchIcon, WarningIcon } from "@chakra-ui/icons";
import type { Player } from "~/types/player";
import { PlayerCard } from "./PlayerCard";

type PlayerResultsProps = {
  players: Player[];
  onSelect: (player: Player) => void;
  isLoading?: boolean;
  error?: string | null;
};

export function PlayerResults({ players, onSelect, isLoading, error }: PlayerResultsProps) {
  if (isLoading) {
    return (
      <Center py={4}>
        <VStack spacing={2}>
          <Spinner size="md" color="blue.500" thickness="3px" />
          <Text color="gray.600" fontSize="sm">Searching for players...</Text>
        </VStack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center py={4}>
        <VStack spacing={2}>
          <Icon as={WarningIcon} boxSize={6} color="red.400" />
          <Text color="red.600" textAlign="center" fontSize="sm">
            {error}
          </Text>
        </VStack>
      </Center>
    );
  }

  if (!players?.length) {
    return (
      <Center py={4}>
        <VStack spacing={2}>
          <Icon as={SearchIcon} boxSize={6} color="gray.300" />
          <Text color="gray.500" textAlign="center" fontSize="sm">
            No players found matching your search
          </Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box>
      <VStack align="stretch" spacing={3} maxH="400px" overflowY="auto" pr={2}>
        {players.map((p) => (
          <PlayerCard key={p.entityId} player={p} onSelect={onSelect} />
        ))}
      </VStack>
      {players.length > 5 && (
        <Text mt={3} fontSize="xs" color="gray.500" textAlign="center">
          Showing {players.length} results • Scroll to see more
        </Text>
      )}
    </Box>
  );
}
