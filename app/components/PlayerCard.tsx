import { Box, HStack, Text, Badge, Circle } from "@chakra-ui/react";
import type { Player } from "~/types/player";

type PlayerCardProps = {
  player: Player;
  onSelect: (player: Player) => void;
};

export function PlayerCard({ player, onSelect }: PlayerCardProps) {
  const online = player.signedIn;
  return (
    <Box
      as="button"
      onClick={() => onSelect(player)}
      w="100%"
      textAlign="left"
      variant="card"
      _hover={{ bg: "surface.elevated" }}
      transition="background 0.2s"
    >
      <HStack spacing={3} align="center">
        <Circle size="10px" bg={online ? "green.400" : "gray.500"} />
        <Text fontWeight="semibold">{player.username}</Text>
        <Badge variant="status" colorScheme={online ? "green" : "gray"}>
          {online ? "Online" : "Offline"}
        </Badge>
      </HStack>
    </Box>
  );
}

