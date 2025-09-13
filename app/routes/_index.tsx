import { useSelectedPlayer } from "~/hooks/useSelectedPlayer";
import { Suspense, lazy } from "react";
const PlayerSelectionView = lazy(() =>
  import("~/components/PlayerSelectionView").then((m) => ({ default: m.PlayerSelectionView }))
);
const PlayerDashboardView = lazy(() =>
  import("~/components/PlayerDashboardView").then((m) => ({ default: m.PlayerDashboardView }))
);

export default function Index() {
  const { player } = useSelectedPlayer();

  return (
    <Suspense fallback={null}>
      {player ? <PlayerDashboardView /> : <PlayerSelectionView />}
    </Suspense>
  );
}
