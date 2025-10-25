/**
 * Inventory Review Modal Component
 * Displays the fetched player inventory for review before applying it to tracking.
 */
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
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
} from "@chakra-ui/react";

import type { PlayerInventoryResponse } from "~/routes/api.inventory.player";
import type { Item } from "~/types/recipes";

interface InventoryReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryData: PlayerInventoryResponse | null;
  itemMap: Map<string, Item>;
  onApply: (inventory: PlayerInventoryResponse) => void;
}

export function InventoryReviewModal({ isOpen, onClose, inventoryData, itemMap, onApply }: InventoryReviewModalProps) {
  if (!inventoryData) return null;

  const allItems = [
    ...(inventoryData.inventories.house_inventory ?? []),
    ...(inventoryData.inventories.personal_banks ?? []),
    ...(inventoryData.inventories.personal_storages ?? []),
  ];

  const aggregatedItems = new Map<string, { item: Item; quantity: number; sources: Set<string> }>();

  for (const invItem of allItems) {
    const item = itemMap.get(invItem.itemId);
    if (!item) continue;

    if (!aggregatedItems.has(item.id)) {
      aggregatedItems.set(item.id, { item, quantity: 0, sources: new Set() });
    }

    const entry = aggregatedItems.get(item.id);
    if (!entry) continue;
    entry.quantity += invItem.quantity;
    entry.sources.add(invItem.location);
  }

  const sortedItems = Array.from(aggregatedItems.values()).sort((a, b) => {
    if (a.item.tier !== b.item.tier) {
      return b.item.tier - a.item.tier;
    }
    return a.item.name.localeCompare(b.item.name);
  });

  const handleApply = () => {
    onApply(inventoryData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg="white">
        <ModalHeader>Review Player Inventory</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Text>Found {sortedItems.length} unique item(s) in {inventoryData.playerName}&apos;s inventory. Review the items below before applying them to your tracking list.</Text>
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Item</Th>
                    <Th isNumeric>Quantity</Th>
                    <Th>Sources</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {sortedItems.map(({ item, quantity, sources }) => (
                    <Tr key={item.id}>
                      <Td>{item.name} (T{item.tier})</Td>
                      <Td isNumeric>{quantity}</Td>
                      <Td>
                        {[...sources].map(source => (
                          <Badge key={source} mr={1} colorScheme="blue">{source.replace(/_/g, ' ')}</Badge>
                        ))}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleApply}>
            Apply to Tracking
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
