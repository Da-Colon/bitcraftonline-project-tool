import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  Spinner,
  Text,
  HStack,
  Box,
} from "@chakra-ui/react"
import { useCallback } from "react"
import type { PlayerClaim } from "~/types/player"
import { usePlayerClaims } from "~/hooks/usePlayerClaims"
import { useSelectedPlayer } from "~/hooks/useSelectedPlayer"

interface ClaimSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectClaim: (claimId: string, claimName: string) => void;
}

export function ClaimSearchModal({ isOpen, onClose, onSelectClaim }: ClaimSearchModalProps) {
  const { player } = useSelectedPlayer()
  const { claims, loading: claimsLoading, error: claimsError } = usePlayerClaims(player?.entityId)

  const handleSelectClaim = useCallback((claim: PlayerClaim) => {
    onSelectClaim(claim.entityId, claim.name)
    onClose()
  }, [onSelectClaim, onClose])


  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay backdropFilter="blur(6px)" />
      <ModalContent
        bg="rgba(17, 24, 39, 0.96)"
        border="1px solid rgba(148, 163, 184, 0.35)"
        borderRadius={{ base: "2xl", md: "3xl" }}
        color="white"
      >
        <ModalHeader color="white">Select Claim Inventories</ModalHeader>
        <ModalCloseButton color="whiteAlpha.800" />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {claimsLoading ? (
              <HStack justify="center" p={4}>
                <Spinner size="sm" color="teal.300" />
                <Text color="whiteAlpha.800">Loading your claims...</Text>
              </HStack>
            ) : claimsError ? (
              <Box
                p={4}
                bg="rgba(63, 34, 53, 0.85)"
                borderRadius={{ base: "xl", md: "2xl" }}
                border="1px solid rgba(248, 180, 217, 0.35)"
              >
                <Text color="pink.200" textAlign="center">
                  Error loading claims: {claimsError}
                </Text>
              </Box>
            ) : !claims || claims.length === 0 ? (
              <Box
                p={4}
                bg="rgba(24, 35, 60, 0.9)"
                borderRadius={{ base: "xl", md: "2xl" }}
                border="1px solid rgba(148, 163, 184, 0.35)"
              >
                <Text color="whiteAlpha.800" textAlign="center">
                  You are not a member of any claims
                </Text>
              </Box>
            ) : (
              <>
                <Text fontWeight="semibold" color="white">
                  Select a claim to manage its inventories:
                </Text>
                <VStack spacing={2} align="stretch" maxHeight="300px" overflowY="auto">
                  {claims.map((claim) => (
                    <Box
                      key={claim.entityId}
                      p={3}
                      bg="rgba(24, 35, 60, 0.9)"
                      borderRadius="xl"
                      border="1px solid rgba(148, 163, 184, 0.35)"
                      cursor="pointer"
                      _hover={{ bg: "rgba(45, 212, 191, 0.12)", borderColor: "teal.200" }}
                      onClick={() => handleSelectClaim(claim)}
                    >
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium" color="white">
                            {claim.name}
                          </Text>
                          <Text fontSize="sm" color="whiteAlpha.700">
                            Region {claim.regionId} • ({claim.locationX}, {claim.locationZ})
                          </Text>
                        </VStack>
                        <Button 
                          size="sm" 
                          colorScheme="teal"
                          bg="teal.400"
                          _hover={{ bg: "teal.500" }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectClaim(claim)
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
        <ModalFooter borderTop="1px solid" borderColor="whiteAlpha.200">
          <Button variant="ghost" color="whiteAlpha.800" _hover={{ bg: "whiteAlpha.200" }} onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
