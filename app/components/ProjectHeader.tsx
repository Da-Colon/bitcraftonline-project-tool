import {
  Flex,
  HStack,
  Heading,
  Badge,
  Text,
  Input,
  Button,
  Spacer,
} from "@chakra-ui/react";
import { TimeIcon } from "@chakra-ui/icons";
import type { ProjectItem } from "~/types/recipes";

interface ProjectHeaderProps {
  projectName: string;
  setProjectName: (name: string) => void;
  projectItems: ProjectItem[];
  lastUpdated: Date | null;
  onSaveProject: () => void;
  onClearProject: () => void;
}

export function ProjectHeader({
  projectName,
  setProjectName,
  projectItems,
  lastUpdated,
  onSaveProject,
  onClearProject,
}: ProjectHeaderProps) {
  return (
    <Flex align="center" justify="center" gap={4} mb={4}>
      <Heading size="lg">{projectName || "Untitled Project"}</Heading>
      <Badge variant="status">
        {projectItems.length} items
      </Badge>
      <HStack spacing={1} color="text.muted">
        <TimeIcon />
        <Text fontSize="sm">
          {lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString()}` : "Not updated yet"}
        </Text>
      </HStack>
      <Spacer />
      <HStack spacing={2}>
        <Input
          placeholder="Project Name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          maxW="280px"
        />
        <Button onClick={onSaveProject} variant="primary" isDisabled={projectItems.length === 0} px={6}>
          Save Project
        </Button>
        <Button onClick={onClearProject} variant="secondary">Clear</Button>
      </HStack>
    </Flex>
  );
}
