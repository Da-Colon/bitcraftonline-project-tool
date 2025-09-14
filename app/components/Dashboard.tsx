import {
  Box,
  Container,
  VStack,
  Text,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react"
import { PlayerHeader } from "~/components/PlayerHeader"
import { TrackedInventoryView } from "~/components/TrackedInventoryView"
import { PlayerSelectionView } from "~/components/PlayerSelectionView"
import { useSelectedPlayer } from "~/hooks/useSelectedPlayer"

export function Dashboard() {
  const { player } = useSelectedPlayer()
  const { isOpen, onOpen, onClose } = useDisclosure()

  if (!player) {
    return (
      <>
        <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
          <Container maxW="md">
            <Box p={6} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
              <VStack spacing={3}>
                <Text color="gray.600" textAlign="center" fontSize="lg" fontWeight="medium">
                  No Player Selected
                </Text>
                <Text color="gray.500" textAlign="center" fontSize="sm">
                  No player inventory is selected. Please select a player to view the dashboard.
                </Text>
                <Button colorScheme="blue" onClick={onOpen}>
                  Select Player
                </Button>
              </VStack>
            </Box>
          </Container>
        </Box>

        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Select Player</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <PlayerSelectionView />
            </ModalBody>
          </ModalContent>
        </Modal>
      </>
    )
  }

  return (
    <Box minH="100vh">
      <PlayerHeader />
      <Container maxW="container.xl" py={6}>
        <VStack spacing={6} align="stretch">
          <TrackedInventoryView />
        </VStack>
      </Container>
    </Box>
  )
}
