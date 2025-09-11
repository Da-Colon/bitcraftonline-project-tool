import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Box,
  Container,
  VStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
} from "@chakra-ui/react";
import { useState, useEffect, useMemo, useCallback } from "react";
import type { Item, ProjectItem, Recipe } from "~/types/recipes";
import { RECIPE_PROJECTS_KEY } from "~/constants/storage";
import { RecipeCalculator } from "~/services/recipe-calculator.server";
import { AppHeader } from "~/components/AppHeader";
import { ProjectHeader } from "~/components/ProjectHeader";
import { ItemSearch } from "~/components/ItemSearch";
import { ProjectPlanner } from "~/components/ProjectPlanner";
import { RecipeTreeTab } from "~/components/RecipeTreeTab";
import { ResourceSummary } from "~/components/ResourceSummary";

export async function loader({}: LoaderFunctionArgs) {
  const calc = new RecipeCalculator();
  const items = calc.getAllItems();
  const { getAppVersion } = await import("~/utils/version.server");
  const version = await getAppVersion();
  return json({ items, version });
}

type CalcResponse = {
  rawMaterials: Array<[string, number]>;
  intermediates: Array<[string, number]>;
  totalItems: Array<[string, number]>;
  steps: Array<{ itemId: string; quantity: number; tier: number }>;
  items: Record<string, Item>;
  recipes: Record<string, Recipe>;
};

export default function Index() {
  const { items: loaderItems, version } = useLoaderData<typeof loader>();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [projectItems, setProjectItems] = useState<ProjectItem[]>([]);
  const [projectName, setProjectName] = useState("New Project");
  const [calcData, setCalcData] = useState<CalcResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const toast = useToast();

  const itemMap = useMemo(
    () => new Map(loaderItems.map((i: Item) => [i.id, i])),
    [loaderItems]
  );

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search results with debounced query
  const searchResults = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return [];
    const q = debouncedSearchQuery.toLowerCase();
    return loaderItems
      .filter(
        (item: Item) =>
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [debouncedSearchQuery, loaderItems]);

  // Calculate breakdown
  const breakdown = useMemo(() => {
    if (!calcData) return null;
    return {
      rawMaterials: new Map(calcData.rawMaterials),
      intermediates: new Map(calcData.intermediates),
      totalItems: new Map(calcData.totalItems),
    };
  }, [calcData]);

  const addItem = useCallback(
    (item: Item) => {
      const existingIndex = projectItems.findIndex(
        (pi) => pi.itemId === item.id
      );

      if (existingIndex >= 0) {
        const updated = [...projectItems];
        updated[existingIndex].quantity += 1;
        setProjectItems(updated);
      } else {
        const newProjectItem: ProjectItem = {
          itemId: item.id,
          quantity: 1,
        };
        setProjectItems([...projectItems, newProjectItem]);
      }

      setSearchQuery("");
      setDebouncedSearchQuery("");
      toast({
        title: "Item added",
        description: `${item.name} added to project`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    },
    [projectItems, toast]
  );

  const recalc = useCallback(async (items: ProjectItem[]) => {
    if (items.length === 0) {
      setCalcData(null);
      return;
    }
    const res = await fetch("/api/recipes/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    if (res.ok) {
      const data: CalcResponse = await res.json();
      setCalcData(data);
    }
  }, []);

  // Recalculate when projectItems change
  useEffect(() => {
    recalc(projectItems);
    setLastUpdated(new Date());
  }, [projectItems, recalc]);

  const updateItemQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setProjectItems((prev) => prev.filter((item) => item.itemId !== itemId));
      return;
    }

    setProjectItems((prev) =>
      prev.map((item) => (item.itemId === itemId ? { ...item, quantity } : item))
    );
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setProjectItems((prev) => prev.filter((item) => item.itemId !== itemId));
  }, []);

  const saveProject = useCallback(() => {
    const project = {
      id: Date.now().toString(),
      name: projectName,
      items: projectItems,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const savedProjects = JSON.parse(
      localStorage.getItem(RECIPE_PROJECTS_KEY) || "[]"
    );
    savedProjects.push(project);
    localStorage.setItem(RECIPE_PROJECTS_KEY, JSON.stringify(savedProjects));

    toast({
      title: "Project saved",
      description: `${projectName} has been saved`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  }, [projectName, projectItems, toast]);

  const clearProject = useCallback(() => {
    setProjectItems([]);
    setProjectName("New Project");
  }, []);

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <AppHeader version={version} />

        <Tabs colorScheme="gray" variant="enclosed" defaultIndex={2}>
          <Box bg="white" borderRadius="lg" p={5}>
            <ProjectHeader
              projectName={projectName}
              setProjectName={setProjectName}
              projectItems={projectItems}
              lastUpdated={lastUpdated}
              onSaveProject={saveProject}
              onClearProject={clearProject}
            />

            <TabList>
              <Tab>Project Planner</Tab>
              <Tab>Recipe Tree</Tab>
              <Tab>Resource Summary</Tab>
            </TabList>
          </Box>

          <ItemSearch
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
            projectItems={projectItems}
            onAddItem={addItem}
            onRecalculate={() => recalc(projectItems)}
          />

          <TabPanels>
            <TabPanel>
              <ProjectPlanner
                projectItems={projectItems}
                itemMap={itemMap}
                breakdown={breakdown}
                onUpdateItemQuantity={updateItemQuantity}
                onRemoveItem={removeItem}
              />
            </TabPanel>

            <TabPanel>
              <RecipeTreeTab
                projectItems={projectItems}
                calcData={calcData}
                itemMap={itemMap}
              />
            </TabPanel>

            <TabPanel>
              <ResourceSummary
                projectItems={projectItems}
                breakdown={breakdown}
                calcData={calcData}
                itemMap={itemMap}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
}
