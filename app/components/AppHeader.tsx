import {
  Box,
  Flex,
  HStack,
  Heading,
  Text,
  Badge,
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Avatar,
  Spacer,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";

interface AppHeaderProps {
  version: string;
}

export function AppHeader({ version }: AppHeaderProps) {
  return (
    <Box bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200" p={4}>
      <Flex align="center">
        <HStack spacing={3}>
          <Avatar size="sm" name="BC" />
          <Box>
            <HStack spacing={2}>
              <Heading size="md">BitCraft Project Planner</Heading>
              <Badge variant="subtle">
                {`v${version}`}
              </Badge>
            </HStack>
            <Text fontSize="sm" color="gray.500">
              Plan a single project and its resources
            </Text>
          </Box>
        </HStack>

        <Spacer />

        <Menu>
          <MenuButton as={Button} size="sm" rightIcon={<ChevronDownIcon />}>
            Switch Project
          </MenuButton>
          <MenuList>
            <MenuItem>New Project</MenuItem>
            <MenuItem>Demo Project A</MenuItem>
            <MenuItem>Demo Project B</MenuItem>
          </MenuList>
        </Menu>
      </Flex>
    </Box>
  );
}
