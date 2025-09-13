import { HStack, Text, Badge, Circle, Flex, Icon, Box } from "@chakra-ui/react";
import { ChevronRightIcon } from "@chakra-ui/icons";
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
      bg="white"
      border="2px solid"
      borderColor="gray.100"
      borderRadius="lg"
      p={4}
      transition="all 0.2s ease-out"
      _hover={{ 
        borderColor: "blue.300", 
        transform: "translateY(-2px)", 
        boxShadow: "lg",
        bg: "blue.50"
      }}
      _active={{
        transform: "translateY(0px)",
        boxShadow: "md"
      }}
      cursor="pointer"
    >
      <Flex align="center" justify="space-between">
        <HStack spacing={4} align="center">
          <Box position="relative">
            <Circle 
              size="12px" 
              bg={online ? "green.400" : "gray.400"} 
              border="2px solid white"
              boxShadow="sm"
            />
            {online && (
              <Circle 
                size="12px" 
                bg="green.400" 
                position="absolute"
                top="0"
                left="0"
                animation="ping 2s cubic-bezier(0, 0, 0.2, 1) infinite"
              />
            )}
          </Box>
          <Box textAlign="left">
            <Text fontWeight="bold" fontSize="md" color="gray.800">
              {player.username}
            </Text>
          </Box>
          <Badge 
            variant="subtle" 
            colorScheme={online ? "green" : "gray"}
            fontSize="xs"
            px={2}
            py={1}
            borderRadius="full"
          >
            {online ? "Online" : "Offline"}
          </Badge>
        </HStack>
        <Icon 
          as={ChevronRightIcon} 
          color="gray.400" 
          boxSize={5}
          transition="transform 0.2s"
          _groupHover={{ transform: "translateX(2px)" }}
        />
      </Flex>
    </Box>
  );
}
