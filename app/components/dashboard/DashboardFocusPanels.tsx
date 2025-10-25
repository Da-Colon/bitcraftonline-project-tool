import { StarIcon } from "@chakra-ui/icons"
import {
  Badge,
  Button,
  Card,
  CardBody,
  Divider,
  Flex,
  HStack,
  Icon,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Link as RemixLink } from "@remix-run/react"

import { useSelectedPlayer } from "~/hooks/useSelectedPlayer"

import { PlayerCraftsPanel } from "./PlayerCraftsPanel"

interface DashboardFocusPanelsProps {
  selectedRecipe: {
    name: string
    quantity: number
    category?: string | null
    tier?: number | null
  } | null
}

export function DashboardFocusPanels({
  selectedRecipe,
}: DashboardFocusPanelsProps) {
  const { player } = useSelectedPlayer();

  return (
    <VStack spacing={6} align="stretch" h="full">
      <Card bg="rgba(24, 35, 60, 0.9)" border="1px solid" borderColor="whiteAlpha.300" borderRadius="2xl">
        <CardBody>
          <Flex direction="column" align="stretch" gap={4}>
            <Flex justify="space-between" align="center">
              <Text fontSize="lg" fontWeight="bold" color="white">
                Crafting Queue
              </Text>
              <Icon as={StarIcon} color="yellow.200" boxSize={4} />
            </Flex>

            {selectedRecipe ? (
              <VStack align="stretch" spacing={2} flex={1}>
                <Text fontSize="md" color="white" fontWeight="semibold">
                  {selectedRecipe.name}
                </Text>
                <HStack spacing={2}>
                  <Badge colorScheme="teal">x{selectedRecipe.quantity}</Badge>
                  {selectedRecipe.tier !== undefined && selectedRecipe.tier !== null && (
                    <Badge colorScheme="purple">T{selectedRecipe.tier}</Badge>
                  )}
                  {selectedRecipe.category && (
                    <Badge colorScheme="blue" variant="subtle">
                      {selectedRecipe.category}
                    </Badge>
                  )}
                </HStack>
                <Text fontSize="sm" color="whiteAlpha.800">
                  Continue the calculation flow to see deficits and gather list tailored to your
                  inventories.
                </Text>
              </VStack>
            ) : (
              <VStack align="stretch" spacing={4} flex={1}>
                <Text color="whiteAlpha.800" fontSize="sm">
                  You haven&apos;t pinned a recipe yet. Pick a project to start planning your next play
                  session.
                </Text>
              </VStack>
            )}

            <Divider borderColor="whiteAlpha.300" />

            <Button
              as={RemixLink}
              to="/recipes"
              size="sm"
              colorScheme="teal"
              bg="teal.400"
              _hover={{ bg: "teal.500" }}
              _active={{ bg: "teal.600" }}
              justifyContent="center"
            >
              Open Recipe Calculator
            </Button>
          </Flex>
        </CardBody>
      </Card>

      {/* Player Crafts Panel */}
      <PlayerCraftsPanel playerId={player?.entityId} />
    </VStack>
  )
}
