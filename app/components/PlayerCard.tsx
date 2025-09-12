import { HStack, Text, Badge, Circle, Flex, Icon } from "@chakra-ui/react";
import { ChevronRightIcon } from "@chakra-ui/icons";
import type { Player } from "~/types/player";

type PlayerCardProps = {
  player: Player;
  onSelect: (player: Player) => void;
};

export function PlayerCard({ player, onSelect }: PlayerCardProps) {
  const online = player.signedIn;
  return (
    <Flex
      as="button"
      onClick={() => onSelect(player)}
      w="100%"
      align="center"
      justify="space-between"
      _hover={{ bg: "surface.elevated", transform: "translateY(-1px)" }}
      transition="all 0.15s ease-out"
      p={3}
    >
      <HStack spacing={3} align="center">
        <Circle size="10px" bg={online ? "green.400" : "gray.500"} />
        <Text fontWeight="semibold">{player.username}</Text>
        <Badge variant="status" colorScheme={online ? "green" : "gray"}>
          {online ? "Online" : "Offline"}
        </Badge>
      </HStack>
      <Icon as={ChevronRightIcon} color="text.muted" />
    </Flex>
  );
}
