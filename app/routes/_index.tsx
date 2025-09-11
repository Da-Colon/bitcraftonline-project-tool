import { Box, Container, Grid, GridItem, Heading, Input, Text } from "@chakra-ui/react";
import { useState } from "react";
import { usePlayerSearch } from "~/hooks/usePlayerSearch";
import { useSelectedPlayer } from "~/hooks/useSelectedPlayer";
import { PlayerResults } from "~/components/PlayerResults";

export default function Index() {
  const { player, savePlayer } = useSelectedPlayer();
  const [query, setQuery] = useState("");
  const { results, loading, error } = usePlayerSearch(query, { minLength: 3, delay: 300 });

  // Once selected, hide the input flow entirely
  if (player) {
    return <></>;
  }

  return (
    <Container maxW="container.lg" minH="100vh" display="flex" alignItems="center" justifyContent="center">
      <Box w="100%" bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" p={4}>
        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
          <GridItem>
            <Heading size="md" mb={3}>Choose Your Player</Heading>
            <Input
              autoFocus
              placeholder="Start typing a player name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {(!query || query.trim().length < 3) && (
              <Text mt={2} color="gray.500">Type at least 3 characters to search</Text>
            )}
          </GridItem>

          <GridItem>
            <Heading size="sm" mb={3}>Matches</Heading>
            <PlayerResults
              players={results}
              isLoading={loading}
              error={error}
              onSelect={(p) => savePlayer({ entityId: p.entityId, username: p.username })}
            />
          </GridItem>
        </Grid>
      </Box>
    </Container>
  );
}
