import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, VStack, Spinner, Text, HStack, Box
} from "@chakra-ui/react";
import { useCallback } from "react";
import type { PlayerClaim } from "~/types/player";
import { usePlayerClaims } from "~/hooks/usePlayerClaims";
import { useSelectedPlayer } from "~/hooks/useSelectedPlayer";

interface ClaimSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectClaim: (claimId: string, claimName: string) => void;
}

export function ClaimSearchModal({
  isOpen,
  onClose,
  onSelectClaim,
}: ClaimSearchModalProps) {
  const { player } = useSelectedPlayer();
  const { claims, loading: claimsLoading, error: claimsError } = usePlayerClaims(player?.entityId);

  const handleSelectClaim = useCallback((claim: PlayerClaim) => {
    onSelectClaim(claim.entityId, claim.name);
    onClose();
  }, [onSelectClaim, onClose]);


  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay />
      <ModalContent bg="white">
        <ModalHeader>Select Claim Inventories</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {claimsLoading ? (
              <HStack justify="center" p={4}>
                <Spinner size="sm" />
                <Text>Loading your claims...</Text>
              </HStack>
            ) : claimsError ? (
              <Box p={4} bg="red.50" borderRadius="md" border="1px solid" borderColor="red.200">
                <Text color="red.600" textAlign="center">
                  Error loading claims: {claimsError}
                </Text>
              </Box>
            ) : !claims || claims.length === 0 ? (
              <Box p={4} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                <Text color="gray.600" textAlign="center">
                  You are not a member of any claims
                </Text>
              </Box>
            ) : (
              <>
                <Text fontWeight="semibold">Select a claim to manage its inventories:</Text>
                <VStack spacing={2} align="stretch" maxHeight="300px" overflowY="auto">
                  {claims.map((claim) => (
                    <Box
                      key={claim.entityId}
                      p={3}
                      bg="gray.50"
                      borderRadius="md"
                      border="1px solid"
                      borderColor="gray.200"
                      cursor="pointer"
                      _hover={{ bg: "gray.100" }}
                      onClick={() => handleSelectClaim(claim)}
                    >
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium">{claim.name}</Text>
                          <Text fontSize="sm" color="gray.600">
                            Region {claim.regionId} • ({claim.locationX}, {claim.locationZ})
                          </Text>
                        </VStack>
                        <Button 
                          size="sm" 
                          colorScheme="blue" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectClaim(claim);
                          }}
                        >
                          Select
                        </Button>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              </>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter borderTop="1px solid" borderColor="gray.200">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
