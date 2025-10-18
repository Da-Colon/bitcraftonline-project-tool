import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  VStack,
  HStack,
  Icon,
  useDisclosure,
} from "@chakra-ui/react"
import { WarningIcon } from "@chakra-ui/icons"
import { useState } from "react"

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  severity?: "warning" | "danger" | "info"
  isLoading?: boolean
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  severity = "warning",
  isLoading = false,
}: ConfirmationDialogProps) {
  const [isExecuting, setIsExecuting] = useState(false)

  const handleConfirm = async () => {
    setIsExecuting(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error("Confirmation action failed:", error)
    } finally {
      setIsExecuting(false)
    }
  }

  const getColorScheme = () => {
    switch (severity) {
      case "danger":
        return "red"
      case "warning":
        return "orange"
      case "info":
        return "blue"
      default:
        return "orange"
    }
  }

  const getIcon = () => {
    switch (severity) {
      case "danger":
        return WarningIcon
      case "warning":
        return WarningIcon
      case "info":
        return WarningIcon
      default:
        return WarningIcon
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <ModalContent
        bg="rgba(24, 35, 60, 0.95)"
        border="1px solid"
        borderColor="whiteAlpha.200"
        borderRadius="2xl"
        backdropFilter="blur(12px)"
        mx={4}
      >
        <ModalHeader>
          <HStack spacing={3}>
            <Icon as={getIcon()} color={`${getColorScheme()}.400`} boxSize={5} />
            <Text color="white" fontSize="lg" fontWeight="semibold">
              {title}
            </Text>
          </HStack>
        </ModalHeader>

        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text color="whiteAlpha.900" fontSize="md">
              {message}
            </Text>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button
              variant="ghost"
              color="whiteAlpha.800"
              _hover={{ bg: "whiteAlpha.200" }}
              onClick={onClose}
              isDisabled={isExecuting || isLoading}
            >
              {cancelText}
            </Button>
            <Button
              colorScheme={getColorScheme()}
              bg={`${getColorScheme()}.400`}
              _hover={{ bg: `${getColorScheme()}.500` }}
              onClick={handleConfirm}
              isLoading={isExecuting || isLoading}
              loadingText="Processing..."
            >
              {confirmText}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

// Hook for easy usage
export function useConfirmationDialog() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [config, setConfig] = useState<Omit<ConfirmationDialogProps, "isOpen" | "onClose"> | null>(
    null
  )

  const confirm = (dialogConfig: Omit<ConfirmationDialogProps, "isOpen" | "onClose">) => {
    setConfig(dialogConfig)
    onOpen()
  }

  const ConfirmationDialogComponent = config ? (
    <ConfirmationDialog isOpen={isOpen} onClose={onClose} {...config} />
  ) : null

  return {
    confirm,
    ConfirmationDialog: ConfirmationDialogComponent,
  }
}
