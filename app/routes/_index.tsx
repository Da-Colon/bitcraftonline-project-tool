import { useSelectedPlayer } from "~/hooks/useSelectedPlayer";
import { PlayerSelectionView } from "~/components/PlayerSelectionView";
import { PlayerDashboardView } from "~/components/PlayerDashboardView";

export default function Index() {
  const { player } = useSelectedPlayer();

  if (player) {
    return <PlayerDashboardView />;
  }

  return <PlayerSelectionView />;
}
