import {
  Badge,
  Box,
  Button,
  Circle,
  Container,
  Flex,
  HStack,
  IconButton,
  Link,
  Spinner,
  Stack,
  Text,
  Tooltip,
  VStack,
  useToast,
} from "@chakra-ui/react"
import { CopyIcon, ExternalLinkIcon } from "@chakra-ui/icons"
import { useCallback } from "react"
import { Link as RemixLink, useLocation, useNavigate } from "@remix-run/react"
import { useSelectedPlayer } from "~/hooks/useSelectedPlayer"
import { usePlayerDetails } from "~/hooks/usePlayerDetails"

interface PlayerHeaderProps {}

const NAV_LINKS = [
  { label: "Dashboard", to: "/" },
  { label: "Inventory", to: "/inventory" },
  { label: "Claims", to: "/claim-inventories" },
  { label: "Recipes", to: "/recipes" },
] as const

export function PlayerHeader({}: PlayerHeaderProps = {}) {
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
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
  const isActiveLink = (path: string) => {
    if (path === "/") {
      return location.pathname === "/"
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={20}
      bgGradient="linear(to-r, rgba(15, 23, 42, 0.94), rgba(17, 24, 39, 0.88))"
      borderBottom="1px solid rgba(148, 163, 184, 0.4)"
      boxShadow="0 18px 34px rgba(10, 16, 30, 0.55)"
      backdropFilter="blur(18px)"
    >
      <Container maxW="container.xl" py={{ base: 4, md: 5 }}>
        <VStack spacing={{ base: 6, md: 7 }} align="stretch" color="whiteAlpha.900">
          <Flex
            direction={{ base: "column", lg: "row" }}
            align={{ base: "flex-start", lg: "center" }}
            justify="space-between"
            gap={{ base: 4, lg: 6 }}
            wrap={{ base: "wrap", lg: "nowrap" }}
          >
            <Flex direction="column" gap={{ base: 3, md: 4 }} minW={0} flex="1">
              <Flex align={{ base: "flex-start", md: "center" }} wrap="wrap" columnGap={{ base: 4, md: 5 }} rowGap={3}>
                <Flex align={{ base: "flex-start", sm: "center" }} gap={3} minW={0} flexShrink={0}>
                  <Circle size="12px" bg={signedIn ? "teal.400" : "gray.500"} mt={{ base: 1, sm: 0 }} />
                  <Flex direction="column" minW={0}>
                    <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" color="whiteAlpha.700">
                      Player focus
                    </Text>
                    <Flex align="center" wrap="wrap" columnGap={3} rowGap={2}>
                      <Link
                        href={`https://bitjita.com/players/${player.entityId}`}
                        isExternal
                        fontWeight="semibold"
                        fontSize={{ base: "lg", md: "xl" }}
                        color="white"
                        _hover={{ color: "teal.200", textDecoration: "none" }}
                      >
                        {player.username}
                      </Link>
                      <Tooltip label="Copy player ID" placement="bottom">
                        <IconButton
                          aria-label="Copy player ID"
                          size="xs"
                          variant="ghost"
                          icon={<CopyIcon />}
                          onClick={copyId}
                          color="whiteAlpha.900"
                          _hover={{ bg: "whiteAlpha.200", color: "white" }}
                        />
                      </Tooltip>
                    </Flex>
                  </Flex>
                </Flex>

                <Flex align="center" wrap="wrap" columnGap={3} rowGap={2}>
                  <Badge
                    variant="subtle"
                    colorScheme={signedIn ? "teal" : "purple"}
                    bg={signedIn ? "rgba(45, 212, 191, 0.28)" : "rgba(192, 132, 252, 0.28)"}
                    color="white"
                    borderRadius="full"
                    px={3}
                    py={1}
                    textTransform="capitalize"
                  >
                    {signedIn ? "online" : "offline"}
                  </Badge>
                  {!loading && highest && (
                    <Badge
                      colorScheme="teal"
                      variant="solid"
                      bg="rgba(20, 184, 166, 0.32)"
                      borderRadius="full"
                      px={4}
                      py={1}
                      color="white"
                      boxShadow="inset 0 0 0 1px rgba(45, 212, 191, 0.4)"
                    >
                      {`${highest.name} Lv ${highest.level}`}
                    </Badge>
                  )}
                  {!loading && (
                    <Badge
                      colorScheme="purple"
                      variant="subtle"
                      bg="rgba(139, 92, 246, 0.26)"
                      borderRadius="full"
                      px={4}
                      py={1}
                      color="white"
                      boxShadow="inset 0 0 0 1px rgba(192, 132, 252, 0.35)"
                    >
                      {locationName}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    borderColor="whiteAlpha.400"
                    color="whiteAlpha.800"
                    borderRadius="full"
                    px={4}
                    py={1}
                    fontWeight="medium"
                  >
                    ID: {player.entityId}
                  </Badge>
                </Flex>
              </Flex>

              {loading && (
                <Flex align="center" gap={2} color="whiteAlpha.800">
                  <Spinner size="sm" color="teal.200" />
                  <Text fontSize="sm">Syncing player data…</Text>
                </Flex>
              )}
            </Flex>

            <Button
              size="sm"
              colorScheme="teal"
              bg="teal.400"
              _hover={{ bg: "teal.500" }}
              _active={{ bg: "teal.600" }}
              borderRadius="full"
              px={5}
              onClick={handleChangePlayer}
              boxShadow="0 10px 24px rgba(13, 148, 136, 0.45)"
              w={{ base: "full", lg: "auto" }}
            >
              Change Player
            </Button>
          </Flex>

          <Flex
            as="nav"
            align="center"
            justify={{ base: "flex-start", md: "center" }}
            gap={{ base: 2, md: 3 }}
            bg="rgba(255, 255, 255, 0.06)"
            border="1px solid rgba(148, 163, 184, 0.25)"
            borderRadius="full"
            px={{ base: 3, md: 4 }}
            py={{ base: 1, md: 1.5 }}
            boxShadow="0 12px 30px rgba(15, 23, 42, 0.35)"
            overflowX="auto"
            minW={0}
            w="full"
            maxW={{ base: "full", md: "min(100%, 580px)" }}
            mx="auto"
            sx={{
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": {
                display: "none",
              },
            }}
          >
            {NAV_LINKS.map((link) => {
              const active = isActiveLink(link.to)
              return (
                <Button
                  key={link.to}
                  as={RemixLink}
                  to={link.to}
                  size="sm"
                  variant="ghost"
                  borderRadius="full"
                  px={{ base: 3, md: 4 }}
                  flexShrink={0}
                  color={active ? "white" : "whiteAlpha.800"}
                  fontWeight={active ? "semibold" : "medium"}
                  bg={active ? "rgba(45, 212, 191, 0.24)" : "transparent"}
                  boxShadow={active ? "0 0 0 1px rgba(45, 212, 191, 0.35)" : "none"}
                  _hover={{ bg: "whiteAlpha.200", color: "white" }}
                  _active={{ bg: "teal.500", color: "gray.900" }}
                  aria-current={active ? "page" : undefined}
                  whiteSpace="nowrap"
                >
                  {link.label}
                </Button>
              )
            })}
          </Flex>
        </VStack>
      </Container>
    </Box>
  )
}
