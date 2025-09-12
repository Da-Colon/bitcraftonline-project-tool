import { useState } from "react";
import type { ContentViewType } from "~/types/inventory";

export function useContentView() {
  const [currentView, setCurrentView] = useState<ContentViewType>('dashboard');

  return {
    currentView,
    setCurrentView,
  };
}
