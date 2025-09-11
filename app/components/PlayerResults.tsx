import { VStack, Text } from "@chakra-ui/react";
import type { Player } from "~/types/player";
import { PlayerCard } from "./PlayerCard";

type PlayerResultsProps = {
  players: Player[];
  onSelect: (player: Player) => void;
  isLoading?: boolean;
  error?: string | null;
};

export function PlayerResults({ players, onSelect, isLoading, error }: PlayerResultsProps) {
  if (isLoading) return <Text color="text.muted">Searching…</Text>;
  if (error) return <Text color="status.error">{error}</Text>;
  if (!players?.length) return <Text color="text.muted">No matches</Text>;

  return (
    <VStack align="stretch" spacing={2} maxH="60vh" overflowY="auto">
      {players.map((p) => (
        <PlayerCard key={p.entityId} player={p} onSelect={onSelect} />)
      )}
    </VStack>
  );
}

