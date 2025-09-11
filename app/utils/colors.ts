// Simple UI color utilities unrelated to Chakra theme

// Helper function to get tier color scheme
export const getTierColorScheme = (tier: number): string => {
  const tierColors = {
    0: "orange", // Raw materials
    1: "blue",   // Basic crafted
    2: "purple", // Advanced crafted
    3: "yellow", // Rare
    4: "red",    // Epic
    5: "teal",   // Legendary
  } as const;

  return (tierColors as Record<number, string>)[tier] ?? "gray";
};

