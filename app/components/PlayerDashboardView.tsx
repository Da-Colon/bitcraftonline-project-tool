import { Box, Container, VStack, Text } from "@chakra-ui/react";
import { PlayerHeader } from "~/components/PlayerHeader";
import { PersonalInventoriesView } from "~/components/PersonalInventoriesView";
import { TrackedInventoryView } from "~/components/TrackedInventoryView";
import { useContentView } from "~/hooks/useContentView";
import type { ContentViewType } from "~/types/inventory";

interface PlayerDashboardViewProps {
  onViewChange?: (view: ContentViewType) => void;
}

export function PlayerDashboardView({ onViewChange }: PlayerDashboardViewProps = {}) {
  const { currentView, setCurrentView } = useContentView();

  const handleViewChange = (view: ContentViewType) => {
    setCurrentView(view);
    onViewChange?.(view);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'personal-inventories':
        return <PersonalInventoriesView />;
      case 'dashboard':
      default:
        return <TrackedInventoryView />;
    }
  };

  return (
    <Box minH="100vh">
      <PlayerHeader onViewChange={handleViewChange} currentView={currentView} />
      <Container maxW="container.xl" py={6}>
        <VStack spacing={6} align="stretch">
          {renderContent()}
        </VStack>
      </Container>
    </Box>
  );
}
