import { CloseIcon } from "@chakra-ui/icons"
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  IconButton,
  Link,
  Spinner,
  Text,
  Tooltip,
  VStack,
  useToast,
} from "@chakra-ui/react"
import { Link as RemixLink, useLocation, useNavigate } from "@remix-run/react"
import { useCallback } from "react"

import { usePlayerDetails } from "~/hooks/usePlayerDetails"
import { useSelectedPlayer } from "~/hooks/useSelectedPlayer"

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
      <Container maxW="container.xl" py={{ base: 3, md: 4 }}>
        <Flex
          direction={{ base: "column", md: "row" }}
          align={{ base: "stretch", md: "flex-end" }}
          justify="space-between"
          gap={{ base: 3, md: 4 }}
          color="whiteAlpha.900"
        >
          {/* Player Info Card */}
          <Box
            bg="rgba(255, 255, 255, 0.05)"
            border="1px solid rgba(255, 255, 255, 0.1)"
            borderRadius="lg"
            px={3}
            py={2}
            minW={0}
            flex="1"
            maxW="280px"
          >
            {/* Row 1: Name and Online Dot */}
            <Flex align="center" justify="space-between" mb={1}>
              <Tooltip label="View on Bitjita" placement="bottom">
                <Link
                  href={`https://bitjita.com/players/${player.entityId}`}
                  isExternal
                  fontWeight="bold"
                  fontSize={{ base: "sm", md: "md" }}
                  color="white"
                  _hover={{ color: "teal.200", textDecoration: "none" }}
                >
                  {player.username}
                </Link>
              </Tooltip>
              <Flex align="center" gap={2}>
                <Box
                  w={2}
                  h={2}
                  borderRadius="full"
                  bg={signedIn ? "teal.400" : "gray.500"}
                  boxShadow={signedIn ? "0 0 8px rgba(45, 212, 191, 0.5)" : "none"}
                />
                <Tooltip label="Change Player" placement="bottom">
                  <IconButton
                    aria-label="Change Player"
                    size="xs"
                    variant="ghost"
                    icon={<CloseIcon />}
                    onClick={handleChangePlayer}
                    color="whiteAlpha.600"
                    _hover={{ bg: "whiteAlpha.200", color: "white" }}
                    w={4}
                    h={4}
                    minW={4}
                  />
                </Tooltip>
              </Flex>
            </Flex>
            
            {/* Row 2: Skill + Location */}
            <Flex align="center" justify="space-between" gap={2}>
              {!loading && highest && (
                <Tooltip label={highest.name} placement="bottom">
                  <Flex align="center" gap={1}>
                    <Box
                      as="img"
                      src={`/assets/Skill/SkillIcon${highest.name}.png`}
                      alt={highest.name}
                      w="14px"
                      h="14px"
                      objectFit="contain"
                    />
                    <Text fontSize="xs" color="whiteAlpha.900">
                      Lv {highest.level}
                    </Text>
                  </Flex>
                </Tooltip>
              )}
              {!loading && (
                <Text fontSize="xs" color="whiteAlpha.600" textAlign="right" flex="1">
                  {locationName}
                </Text>
              )}
            </Flex>

            {loading && (
              <Flex align="center" gap={2} color="whiteAlpha.800" mt={1}>
                <Spinner size="xs" color="teal.200" />
                <Text fontSize="xs">Syncing...</Text>
              </Flex>
            )}
          </Box>

          {/* Navigation */}
          <Flex
            as="nav"
            align="center"
            justify="center"
            gap={{ base: 1, md: 2 }}
            minW={0}
            flex="1"
            maxW="600px"
          >
            {NAV_LINKS.map((link) => {
              const active = isActiveLink(link.to)
              return (
                <Button
                  key={link.to}
                  as={RemixLink}
                  to={link.to}
                  size="md"
                  variant="ghost"
                  px={{ base: 4, md: 6 }}
                  py={2}
                  flexShrink={0}
                  color={active ? "white" : "whiteAlpha.600"}
                  fontWeight={active ? "bold" : "medium"}
                  fontSize={{ base: "sm", md: "md" }}
                  bg={active ? "rgba(45, 212, 191, 0.15)" : "transparent"}
                  borderBottom={active ? "2px solid" : "2px solid transparent"}
                  borderColor={active ? "teal.400" : "transparent"}
                  _hover={{ 
                    bg: "rgba(255, 255, 255, 0.1)", 
                    color: "white",
                    borderColor: "whiteAlpha.300"
                  }}
                  _active={{ bg: "rgba(45, 212, 191, 0.2)" }}
                  aria-current={active ? "page" : undefined}
                  whiteSpace="nowrap"
                  transition="all 0.2s"
                >
                  {link.label}
                </Button>
              )
            })}
          </Flex>
        </Flex>
      </Container>
    </Box>
  )
}
