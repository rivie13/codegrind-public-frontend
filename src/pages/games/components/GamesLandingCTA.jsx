import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

function GamesLandingCTA() {
  return (
    <Box
      textAlign="center"
      mt={{ base: 8, md: 12 }}
      py={{ base: 6, md: 8 }}
      bg="#0f1012"
      borderRadius="md"
      borderWidth="1px"
      borderColor="#3d3d3d"
      boxShadow="0 0 20px rgba(0, 255, 255, 0.2)"
      position="relative"
      maxW="800px"
      mx="auto"
      px={{ base: 4, md: 8 }}
    >
      <Text
        color="#00ff8c"
        fontFamily="monospace"
        mb={{ base: 6, md: 8 }}
        fontSize={{ base: 'md', sm: 'lg', md: 'xl' }}
        textShadow="0 0 5px rgba(0, 255, 140, 0.3)"
      >
        &gt; HUMAN-IN-THE-LOOP MODE: VERIFY THE AI, SHIP THE SOLUTION._
      </Text>
      <Flex
        justifyContent="center"
        gap={{ base: 4, md: 6 }}
        flexWrap="wrap"
        flexDirection={{ base: 'column', sm: 'row' }}
      >
        <Button
          as={RouterLink}
          to="/games/tower-defense"
          size="lg"
          bg="transparent"
          color="#00FFFF"
          border="1px solid #00FFFF"
          borderRadius="sm"
          py={{ base: 4, md: 6 }}
          px={{ base: 6, md: 10 }}
          width={{ base: '100%', sm: 'auto' }}
          boxShadow="0 0 10px rgba(0, 255, 255, 0.3)"
          _hover={{
            bg: 'rgba(0, 255, 255, 0.1)',
            boxShadow: '0 0 15px rgba(0, 255, 255, 0.5)',
          }}
          fontFamily="monospace"
        >
          EXPLORE CODE BREACH
        </Button>
        <Button
          as={RouterLink}
          to="/games/clusters"
          size="lg"
          bg="transparent"
          color="#00FF8C"
          border="1px solid #00FF8C"
          borderRadius="sm"
          py={{ base: 4, md: 6 }}
          px={{ base: 6, md: 10 }}
          width={{ base: '100%', sm: 'auto' }}
          boxShadow="0 0 10px rgba(0, 255, 140, 0.3)"
          _hover={{
            bg: 'rgba(0, 255, 140, 0.1)',
            boxShadow: '0 0 15px rgba(0, 255, 140, 0.5)',
          }}
          fontFamily="monospace"
        >
          VIEW CLUSTER MAP
        </Button>
        <Button
          as={RouterLink}
          to="/store"
          size="lg"
          bg="transparent"
          color="#F6E05E"
          border="1px solid #F6E05E"
          borderRadius="sm"
          py={{ base: 4, md: 6 }}
          px={{ base: 6, md: 10 }}
          width={{ base: '100%', sm: 'auto' }}
          boxShadow="0 0 10px rgba(246, 224, 94, 0.3)"
          _hover={{
            bg: 'rgba(246, 224, 94, 0.1)',
            boxShadow: '0 0 15px rgba(246, 224, 94, 0.5)',
          }}
          fontFamily="monospace"
        >
          OPEN DATA PACKET STORE
        </Button>
      </Flex>
    </Box>
  );
}

export default GamesLandingCTA;
