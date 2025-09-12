import { Box, Container, Grid, GridItem, Heading, Input, Text, InputGroup, InputLeftElement } from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { useState } from "react";
import { usePlayerSearch } from "~/hooks/usePlayerSearch";
import { useSelectedPlayer } from "~/hooks/useSelectedPlayer";
import { PlayerResults } from "~/components/PlayerResults";

export function PlayerSelectionView() {
  const { savePlayer } = useSelectedPlayer();
  const [query, setQuery] = useState("");
  const { results, loading, error } = usePlayerSearch(query, { minLength: 3, delay: 300 });

  return (
    <Container maxW="container.lg" minH="100vh" display="flex" alignItems="center" justifyContent="center">
      <Box w="100%">
        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
          <GridItem>
            <Heading size="md" mb={3}>Choose Your Player</Heading>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="text.muted" />
              </InputLeftElement>
              <Input
                autoFocus
                placeholder="Start typing a player name…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </InputGroup>
            {(!query || query.trim().length < 3) && (
              <Text mt={2} color="text.muted">Type at least 3 characters to search</Text>
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
