import { Badge, Box, Button, Container, HStack, Link, Spinner, Text, Tooltip, useToast } from "@chakra-ui/react";
import { useCallback } from "react";
import { useSelectedPlayer } from "~/hooks/useSelectedPlayer";
import { usePlayerDetails } from "~/hooks/usePlayerDetails";

export function PlayerHeader() {
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

  return (
    <Box as="header" borderBottom="1px solid" borderColor="border.primary" py={3} bg="surface.primary">
      <Container maxW="container.xl">
        <HStack justify="space-between" align="center" spacing={4} wrap="wrap">
          <HStack spacing={3} align="center">
            <Link href={`https://bitjita.com/players/${player.entityId}`} isExternal fontWeight="bold">
              {player.username}
            </Link>
            <Tooltip label="Copy player ID" placement="bottom">
              <Button size="sm" variant="outline" onClick={copyId}>Copy ID</Button>
            </Tooltip>
            <Badge variant="status" colorScheme={signedIn ? "green" : "gray"}>
              {signedIn ? "Online" : "Offline"}
            </Badge>
          </HStack>

          <HStack spacing={6} align="center">
            <HStack spacing={2}>
              <Text color="text.muted">Highest:</Text>
              {loading ? (
                <Spinner size="xs" />
              ) : highest ? (
                <Text>{highest.name} Lv {highest.level}</Text>
              ) : error ? (
                <Text color="status.error">Failed</Text>
              ) : (
                <Text>—</Text>
              )}
            </HStack>
            <HStack spacing={2}>
              <Text color="text.muted">Location:</Text>
              {loading ? <Spinner size="xs" /> : <Text>{locationName}</Text>}
            </HStack>
          </HStack>
        </HStack>
      </Container>
    </Box>
  );
}

