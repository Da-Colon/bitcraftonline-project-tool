import { Badge, Box, Container, HStack, Link, Spinner, Text, Tooltip, useToast, IconButton, Tag, TagLabel, TagLeftIcon, Circle, Menu, MenuButton, MenuList, MenuItem, Button } from "@chakra-ui/react";
import { CopyIcon, ExternalLinkIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { useCallback } from "react";
import { useSelectedPlayer } from "~/hooks/useSelectedPlayer";
import { usePlayerDetails } from "~/hooks/usePlayerDetails";
import type { ContentViewType } from "~/types/inventory";

interface PlayerHeaderProps {
  onViewChange?: (view: ContentViewType) => void;
  currentView?: ContentViewType;
}

export function PlayerHeader({ onViewChange, currentView }: PlayerHeaderProps) {
  const toast = useToast();
  const { player } = useSelectedPlayer();
  const { detail, loading, error, derived } = usePlayerDetails(player?.entityId);

  const copyId = useCallback(async () => {
    if (!player?.entityId) return;
    try {
      await navigator.clipboard.writeText(player.entityId);
      toast({ title: "Copied", description: "Player ID copied", status: "success", duration: 1500, isClosable: true });
    } catch {
      toast({ title: "Copy failed", status: "error", duration: 2000, isClosable: true });
    }
  }, [player?.entityId, toast]);

  if (!player) return null;

  const signedIn = detail?.player?.signedIn ?? false;
  const locationName = derived?.locationName || "Unknown";
  const highest = derived?.highestSkill;

  const getViewDisplayName = (view: ContentViewType) => {
    switch (view) {
      case 'dashboard':
        return 'Dashboard';
      case 'personal-inventories':
        return 'Manage Inventories';
      default:
        return 'Dashboard';
    }
  };

  return (
    <Box as="header" borderBottom="1px solid" borderColor="gray.200" py={3} bg="gray.50" position="sticky" top={0} zIndex={10}>
      <Container maxW="container.xl">
        <HStack justify="space-between" align="center" spacing={4} wrap="wrap">
          <HStack spacing={3} align="center">
            <Circle size="10px" bg={signedIn ? "green.400" : "gray.500"} />
            <Link href={`https://bitjita.com/players/${player.entityId}`} isExternal fontWeight="bold">
              {player.username}
              <ExternalLinkIcon ml={2} />
            </Link>
            <Tooltip label="Copy player ID" placement="bottom">
              <IconButton aria-label="Copy ID" size="sm" variant="outline" icon={<CopyIcon />} onClick={copyId} />
            </Tooltip>
            <Badge variant="status" colorScheme={signedIn ? "green" : "gray"}>
              {signedIn ? "Online" : "Offline"}
            </Badge>
          </HStack>

          <HStack spacing={3} align="center">
            <Menu>
              <MenuButton as={Button} rightIcon={<ChevronDownIcon />} variant="outline" size="sm">
                {getViewDisplayName(currentView || 'dashboard')}
              </MenuButton>
              <MenuList>
                <MenuItem onClick={() => onViewChange?.('dashboard')}>
                  Dashboard
                </MenuItem>
                <MenuItem onClick={() => onViewChange?.('personal-inventories')}>
                  Manage Personal Inventories
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
  );
}
