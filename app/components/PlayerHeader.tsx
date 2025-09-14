import {
  Badge,
  Box,
  Container,
  HStack,
  Link,
  Spinner,
  Text,
  Tooltip,
  useToast,
  IconButton,
  Tag,
  TagLabel,
  TagLeftIcon,
  Circle,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
} from "@chakra-ui/react"
import { CopyIcon, ExternalLinkIcon, ChevronDownIcon } from "@chakra-ui/icons"
import { useCallback } from "react"
import { Link as RemixLink, useLocation, useNavigate } from "@remix-run/react"
import { useSelectedPlayer } from "~/hooks/useSelectedPlayer"
import { usePlayerDetails } from "~/hooks/usePlayerDetails"

interface PlayerHeaderProps {}

export function PlayerHeader({}: PlayerHeaderProps = {}) {
  const toast = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const { player, clearPlayer } = useSelectedPlayer()
  const { detail, loading, derived } = usePlayerDetails(player?.entityId)

  const copyId = useCallback(async () => {
    if (!player?.entityId) return
    try {
      await navigator.clipboard.writeText(player.entityId)
      toast({
        title: "Copied",
        description: "Player ID copied",
        status: "success",
        duration: 1500,
        isClosable: true,
      })
    } catch {
      toast({ title: "Copy failed", status: "error", duration: 2000, isClosable: true })
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
  const locationName = derived?.locationName || "Unknown"
  const highest = derived?.highestSkill

  const getCurrentPageName = () => {
    switch (location.pathname) {
      case "/":
        return "Home"
      case "/dashboard":
        return "Dashboard"
      case "/inventory":
        return "Manage Personal Inventories"
      case "/claim-inventories":
        return "Manage Claim Inventories"
      case "/recipes":
        return "Recipe Calculator"
      default:
        return "Dashboard"
    }
  }

  return (
    <Box
      as="header"
      borderBottom="1px solid"
      borderColor="gray.200"
      py={3}
      bg="gray.50"
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Container maxW="container.xl">
        <HStack justify="space-between" align="center" spacing={4} wrap="wrap">
          <HStack spacing={3} align="center">
            <Circle size="10px" bg={signedIn ? "green.400" : "gray.500"} />
            <Link
              href={`https://bitjita.com/players/${player.entityId}`}
              isExternal
              fontWeight="bold"
            >
              {player.username}
              <ExternalLinkIcon ml={2} />
            </Link>
            <Tooltip label="Copy player ID" placement="bottom">
              <IconButton
                aria-label="Copy ID"
                size="sm"
                variant="outline"
                icon={<CopyIcon />}
                onClick={copyId}
              />
            </Tooltip>
            <Badge variant="status" colorScheme={signedIn ? "green" : "gray"}>
              {signedIn ? "Online" : "Offline"}
            </Badge>
            <Button size="sm" variant="outline" onClick={handleChangePlayer}>
              Change Player
            </Button>
          </HStack>

          <HStack spacing={3} align="center">
            <Menu>
              <MenuButton as={Button} rightIcon={<ChevronDownIcon />} variant="outline" size="sm">
                {getCurrentPageName()}
              </MenuButton>
              <MenuList>
                <MenuItem as={RemixLink} to="/">
                  Home
                </MenuItem>
                <MenuItem as={RemixLink} to="/dashboard">
                  Dashboard
                </MenuItem>
                <MenuItem as={RemixLink} to="/recipes">
                  Recipe Calculator
                </MenuItem>
                <MenuItem as={RemixLink} to="/inventory">
                  Manage Personal Inventories
                </MenuItem>
                <MenuItem as={RemixLink} to="/claim-inventories">
                  Manage Claim Inventories
                </MenuItem>
              </MenuList>
            </Menu>

            {loading ? (
              <Spinner size="sm" />
            ) : (
              <>
                <Tag size="md" variant="subtle" colorScheme="purple">
                  <TagLabel>
                    {highest ? `${highest.name} Lv ${highest.level}` : "No skills"}
                  </TagLabel>
                </Tag>
                <Tag size="md" variant="subtle" colorScheme="blue">
                  <TagLabel>{locationName || "Unknown"}</TagLabel>
                </Tag>
              </>
            )}
          </HStack>
        </HStack>
      </Container>
    </Box>
  )
}
