export const RECIPE_PROJECTS_KEY = "recipeProjects" as const;
export const SELECTED_PLAYER_KEY = "selectedPlayer" as const;

export type LocalRecipeProject = {
  id: string;
  name: string;
  items: Array<{ itemId: string; quantity: number }>;
  createdAt: string; // ISO string in localStorage
  updatedAt: string; // ISO string in localStorage
};

export type SelectedPlayer = {
  entityId: string;
  username: string;
};
