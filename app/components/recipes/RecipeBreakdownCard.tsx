import {
  HStack,
  Checkbox,
  Spinner,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from "@chakra-ui/react"
import type { RecipeBreakdownItem } from "~/types/recipes"
import { RecipeBreakdownTable } from "./RecipeBreakdownTable"
import { TierSummaryView } from "./TierSummaryView"
import { RawMaterialsView } from "./RawMaterialsView"
import { TrackedInventoryView } from "~/components/inventory/TrackedInventoryView"

interface RecipeBreakdownCardProps {
  breakdown: RecipeBreakdownItem[]
  filteredBreakdown: RecipeBreakdownItem[]
  hideCompleted: boolean
  onHideCompletedChange: (checked: boolean) => void
  isLoading: boolean
  onClearSelection: () => void
}

export function RecipeBreakdownCard({
  breakdown,
  filteredBreakdown,
  hideCompleted,
  onHideCompletedChange,
  isLoading,
  onClearSelection,
}: RecipeBreakdownCardProps) {
  // Calculate if recipe is complete
  const isRecipeComplete = breakdown.length > 0 && breakdown.every((item) => item.deficit === 0)
  return (
    <Card
      bg="rgba(24,35,60,0.9)"
      border="1px solid rgba(148, 163, 184, 0.35)"
      borderRadius="2xl"
      boxShadow="xl"
      backdropFilter="blur(12px)"
    >
      <CardHeader pb={2}>
        <HStack justify="space-between" align="center">
          <Heading size="md" color="white">
            Recipe Breakdown
          </Heading>
          <HStack spacing={4}>
            <Checkbox
              isChecked={hideCompleted}
              onChange={(e) => onHideCompletedChange(e.target.checked)}
              colorScheme="teal"
              color="whiteAlpha.900"
            >
              Hide completed items
            </Checkbox>
            {isLoading && <Spinner size="sm" color="teal.300" />}
          </HStack>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        {breakdown.length > 0 ? (
          <Tabs variant="soft-rounded" colorScheme="teal">
            <TabList borderBottom="1px solid rgba(148, 163, 184, 0.2)" pb={2}>
              <Tab color="whiteAlpha.800" _selected={{ bg: "teal.500", color: "gray.900" }}>
                Detailed Breakdown
              </Tab>
              <Tab color="whiteAlpha.800" _selected={{ bg: "teal.500", color: "gray.900" }}>
                Summary by Tier
              </Tab>
              <Tab color="whiteAlpha.800" _selected={{ bg: "teal.500", color: "gray.900" }}>
                Raw Materials Only
              </Tab>
              <Tab color="whiteAlpha.800" _selected={{ bg: "teal.500", color: "gray.900" }}>
                Tracked Inventory
              </Tab>
            </TabList>

            <TabPanels>
              <TabPanel px={0}>
                <RecipeBreakdownTable
                  breakdown={filteredBreakdown}
                  isRecipeComplete={isRecipeComplete}
                  onClearSelection={onClearSelection}
                />
              </TabPanel>

              <TabPanel px={0}>
                <TierSummaryView
                  breakdown={filteredBreakdown}
                  isRecipeComplete={isRecipeComplete}
                  onClearSelection={onClearSelection}
                />
              </TabPanel>

              <TabPanel px={0}>
                <RawMaterialsView
                  breakdown={filteredBreakdown}
                  isRecipeComplete={isRecipeComplete}
                  onClearSelection={onClearSelection}
                />
              </TabPanel>

              <TabPanel px={0}>
                <TrackedInventoryView />
              </TabPanel>
            </TabPanels>
          </Tabs>
        ) : !isLoading ? (
          <Alert
            status="info"
            bg="rgba(59, 130, 246, 0.12)"
            borderRadius="xl"
            border="1px solid rgba(59, 130, 246, 0.3)"
            color="whiteAlpha.900"
          >
            <AlertIcon />
            Select an item and quantity to see the recipe breakdown.
          </Alert>
        ) : null}
      </CardBody>
    </Card>
  )
}
