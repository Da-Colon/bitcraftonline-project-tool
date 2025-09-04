import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  VStack, 
  Button, 
  HStack,
  useColorModeValue 
} from "@chakra-ui/react";
import { Link } from "@remix-run/react";

export default function Index() {
  const bgColor = useColorModeValue("gray.50", "gray.900");
  
  return (
    <Container maxW="container.lg" py={10}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="2xl" mb={4}>BitCraft Helper</Heading>
          <Text fontSize="lg" color="gray.600">
            Track players, claims, and inventories from BitCraft
          </Text>
        </Box>
        
        <HStack spacing={4}>
          <Button as={Link} to="/recipes" colorScheme="blue" size="lg">
            Recipe Calculator
          </Button>
          <Button as={Link} to="/players" colorScheme="green" size="lg">
            Search Players
          </Button>
          <Button as={Link} to="/projects" colorScheme="purple" size="lg">
            My Projects
          </Button>
        </HStack>
        
        <Box p={6} bg={bgColor} borderRadius="lg">
          <Text fontSize="sm" color="gray.500">
            Player data provided by BitJita • Not affiliated with Clockwork Labs
          </Text>
        </Box>
      </VStack>
    </Container>
  );
}
