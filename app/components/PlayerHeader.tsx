import {
  Badge,
  Box,
  Container,
  HStack,
  Link,
  Spinner,
  Tooltip,
  useToast,
  IconButton,
  Tag,
  TagLabel,
  Circle,
  Button,
  Text,
  VStack,
  Flex,
} from "@chakra-ui/react"
import { CopyIcon, ExternalLinkIcon } from "@chakra-ui/icons"
import { useCallback } from "react"
import { useNavigate } from "@remix-run/react"
import { useSelectedPlayer } from "~/hooks/useSelectedPlayer"
import { usePlayerDetails } from "~/hooks/usePlayerDetails"

interface PlayerHeaderProps {}

export function PlayerHeader({}: PlayerHeaderProps = {}) {
  const toast = useToast()
  const navigate = useNavigate()
  const { player, clearPlayer } = useSelectedPlayer()
  const { detail, loading, derived } = usePlayerDetails(player?.entityId)

  const copyId = useCallback(async () => {
    if (!player?.entityId) return
    try {
      await navigator.clipboard.writeText(player.entityId)
      toast({
        title: "Copied",
        description: "Player ID copied to clipboard",
        status: "success",
        duration: 1500,
        isClosable: true,
      })
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy player ID",
        status: "error",
        duration: 2000,
        isClosable: true,
      })
    }
  }, [player?.entityId, toast])

  const handleChangePlayer = useCallback(() => {
    clearPlayer()
    navigate("/")
    toast({
      title: "Player Cleared",
      description: "Redirected to home page",
      status: "info",
      duration: 2000,
      isClosable: true,
    })
  }, [clearPlayer, navigate, toast])

  if (!player) return null

  const signedIn = detail?.player?.signedIn ?? false
  const locationName = derived?.locationName || "Unknown Location"
  const highest = derived?.highestSkill

  return (
    <Box
      as="header"
      borderBottom="2px solid"
      borderColor="gray.100"
      py={4}
      bg="white"
      boxShadow="sm"
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Container maxW="container.xl">
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          {/* Player Info Section */}
          <Flex align="center" gap={4}>
            <HStack spacing={3} align="center">
              <Circle size="12px" bg={signedIn ? "green.400" : "gray.400"} />
              <VStack spacing={0} align="start">
                <HStack spacing={2} align="center">
                  <Link
                    href={`https://bitjita.com/players/${player.entityId}`}
                    isExternal
                    fontWeight="bold"
                    fontSize="lg"
                    color="gray.800"
                    _hover={{ color: "blue.600", textDecoration: "none" }}
                  >
                    {player.username}
                  </Link>
                  <ExternalLinkIcon boxSize={3} color="gray.500" />
                  <Tooltip label="Copy player ID" placement="bottom">
                    <IconButton
                      aria-label="Copy player ID"
                      size="xs"
                      variant="ghost"
                      icon={<CopyIcon />}
                      onClick={copyId}
                      color="gray.500"
                      _hover={{ color: "blue.600", bg: "gray.50" }}
                    />
                  </Tooltip>
                </HStack>
                <Text fontSize="xs" color="gray.600">
                  {player.entityId}
                </Text>
              </VStack>
            </HStack>

            <Badge
              variant="subtle"
              colorScheme={signedIn ? "green" : "gray"}
              px={3}
              py={1}
              borderRadius="full"
            >
              {signedIn ? "Online" : "Offline"}
            </Badge>
          </Flex>

          {/* Player Stats & Actions */}
          <HStack spacing={4} align="center">
            {loading ? (
              <HStack spacing={2}>
                <Spinner size="sm" color="blue.500" />
                <Text fontSize="sm" color="gray.600">
                  Loading...
                </Text>
              </HStack>
            ) : (
              <HStack spacing={3}>
                <Tag size="lg" variant="subtle" colorScheme="purple" borderRadius="full">
                  <TagLabel fontWeight="medium">
                    {highest ? `${highest.name} Lv ${highest.level}` : "No Skills"}
                  </TagLabel>
                </Tag>
                <Tag size="lg" variant="subtle" colorScheme="blue" borderRadius="full">
                  <TagLabel fontWeight="medium">{locationName}</TagLabel>
                </Tag>
              </HStack>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={handleChangePlayer}
              colorScheme="gray"
              borderRadius="full"
              px={4}
            >
              Change Player
            </Button>
          </HStack>
        </Flex>
      </Container>
    </Box>
  )
}
