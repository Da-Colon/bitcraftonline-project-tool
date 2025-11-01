import {
  Card,
  CardBody,
  Flex,
  SimpleGrid,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
} from "@chakra-ui/react"

import { sumBy } from "~/utils/aggregation"
import type { CombinedInventoryItem } from "~/utils/combineAllTrackedInventories"

interface DashboardOverviewProps {
  trackedInventoriesCount: number
  totalItems: number
  combinedItems: CombinedInventoryItem[]
}

export function DashboardOverview({
  trackedInventoriesCount,
  totalItems,
  combinedItems,
}: DashboardOverviewProps) {
  const uniqueItemTypes = combinedItems.length
  const tierCounts = sumBy(combinedItems, item => item.tier ?? -1, item => item.totalQuantity)

  const highestTierItems = combinedItems.filter((item) => (item.tier ?? -1) === 5)


  return (
    <Flex direction="column">
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5}>
        <Card bg="rgba(29, 42, 72, 0.85)" border="1px solid" borderColor="whiteAlpha.300" borderRadius="xl">
          <CardBody>
            <Stat>
              <StatLabel color="whiteAlpha.900">Tracked Inventories</StatLabel>
              <StatNumber color="white">{trackedInventoriesCount}</StatNumber>
              <StatHelpText color="whiteAlpha.800">
                {trackedInventoriesCount === 0 ? "Nothing synced yet" : "Personal + claim storage"}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="rgba(29, 42, 72, 0.85)" border="1px solid" borderColor="whiteAlpha.300" borderRadius="xl">
          <CardBody>
            <Stat>
              <StatLabel color="whiteAlpha.900">Total Materials</StatLabel>
              <StatNumber color="teal.100">{totalItems.toLocaleString()}</StatNumber>
              <StatHelpText color="whiteAlpha.800">{uniqueItemTypes} unique types</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="rgba(29, 42, 72, 0.85)" border="1px solid" borderColor="whiteAlpha.300" borderRadius="xl">
          <CardBody>
            <Stat>
              <StatLabel color="whiteAlpha.900">Tier 5 Stash</StatLabel>
              <StatNumber color="purple.100">{tierCounts[5]?.toLocaleString() || 0}</StatNumber>
              <StatHelpText color="whiteAlpha.800">
                {highestTierItems.length} high-tier entries
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="rgba(29, 42, 72, 0.85)" border="1px solid" borderColor="whiteAlpha.300" borderRadius="xl">
          <CardBody>
            <Stat>
              <StatLabel color="whiteAlpha.900">Storage Efficiency</StatLabel>
              <StatNumber color="teal.100">
                {trackedInventoriesCount > 0 ? Math.round(totalItems / trackedInventoriesCount) : 0}
              </StatNumber>
              <StatHelpText color="whiteAlpha.800">Avg items per tracked spot</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>
    </Flex>
  )
}
