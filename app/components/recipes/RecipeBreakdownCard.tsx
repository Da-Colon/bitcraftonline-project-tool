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
} from "@chakra-ui/react";
import type { RecipeBreakdownItem } from "~/types/recipes";
import { RecipeBreakdownTable } from "./RecipeBreakdownTable";
import { TierSummaryView } from "./TierSummaryView";
import { RawMaterialsView } from "./RawMaterialsView";

interface RecipeBreakdownCardProps {
  breakdown: RecipeBreakdownItem[];
  filteredBreakdown: RecipeBreakdownItem[];
  hideCompleted: boolean;
  onHideCompletedChange: (checked: boolean) => void;
  isLoading: boolean;
}

export function RecipeBreakdownCard({
  breakdown,
  filteredBreakdown,
  hideCompleted,
  onHideCompletedChange,
  isLoading,
}: RecipeBreakdownCardProps) {
  return (
    <Card>
      <CardHeader pb={2}>
        <HStack justify="space-between" align="center">
          <Heading size="md">Recipe Breakdown</Heading>
          <HStack spacing={4}>
            <Checkbox 
              isChecked={hideCompleted}
              onChange={(e) => onHideCompletedChange(e.target.checked)}
            >
              Hide completed items
            </Checkbox>
            {isLoading && <Spinner size="sm" />}
          </HStack>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        {breakdown.length > 0 ? (
          <Tabs variant="enclosed">
            <TabList>
              <Tab>Detailed Breakdown</Tab>
              <Tab>Summary by Tier</Tab>
              <Tab>Raw Materials Only</Tab>
            </TabList>
            
            <TabPanels>
              <TabPanel px={0}>
                <RecipeBreakdownTable breakdown={filteredBreakdown} />
              </TabPanel>
              
              <TabPanel px={0}>
                <TierSummaryView breakdown={filteredBreakdown} />
              </TabPanel>
              
              <TabPanel px={0}>
                <RawMaterialsView breakdown={filteredBreakdown} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        ) : !isLoading ? (
          <Alert status="info">
            <AlertIcon />
            Select an item and quantity to see the recipe breakdown.
          </Alert>
        ) : null}
      </CardBody>
    </Card>
  );
}
