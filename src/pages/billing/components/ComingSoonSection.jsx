import { Box, Flex, Heading, List, ListIcon, ListItem, VStack } from '@chakra-ui/react';
import React from 'react';
import { FaBolt, FaCheckCircle, FaCode } from 'react-icons/fa';

const ComingSoonSection = () => (
  <VStack spacing={{ base: 5, md: 6 }} w="100%">
    <Heading
      fontSize={{ base: 'xl', md: '2xl' }}
      color="var(--cg-text)"
      fontFamily="var(--cg-font-retro-display)"
      textAlign="center"
      textTransform="uppercase"
      letterSpacing="0.06em"
    >
      Coming soon for Premium/Unlimited
    </Heading>

    <Flex
      wrap="wrap"
      gap={{ base: 4, md: 6 }}
      justify="center"
      w="100%"
      direction={{ base: 'column', md: 'row' }}
    >
      <Box
        className="cg-panel-window"
        p={{ base: 5, md: 6 }}
        flex="1"
        minW={{ base: '100%', md: '280px' }}
        maxW={{ base: '100%', md: '400px' }}
      >
        <VStack spacing={4} align="start">
          <Flex align="center" gap={3}>
            <FaCode style={{ color: 'var(--cg-link)', fontSize: '24px' }} />
            <Heading size="md" color="var(--cg-link)" fontFamily="var(--cg-font-retro-display)">
              Advanced learning paths
            </Heading>
          </Flex>
          <List spacing={2}>
            <ListItem
              color="var(--cg-text)"
              fontSize="sm"
              fontFamily="var(--cg-font-retro-display)"
            >
              <ListIcon as={FaCheckCircle} color="var(--cg-link)" />
              AI-curated problem sets based on your weaknesses
            </ListItem>
            <ListItem
              color="var(--cg-text)"
              fontSize="sm"
              fontFamily="var(--cg-font-retro-display)"
            >
              <ListIcon as={FaCheckCircle} color="var(--cg-link)" />
              Personalized study plans with progress tracking
            </ListItem>
          </List>
        </VStack>
      </Box>

      <Box
        className="cg-panel-window"
        p={{ base: 5, md: 6 }}
        flex="1"
        minW={{ base: '100%', md: '280px' }}
        maxW={{ base: '100%', md: '400px' }}
      >
        <VStack spacing={4} align="start">
          <Flex align="center" gap={3}>
            <FaBolt style={{ color: 'var(--cg-accent-amber)', fontSize: '24px' }} />
            <Heading
              size="md"
              color="var(--cg-accent-amber)"
              fontFamily="var(--cg-font-retro-display)"
            >
              Early access program
            </Heading>
          </Flex>
          <List spacing={2}>
            <ListItem
              color="var(--cg-text)"
              fontSize="sm"
              fontFamily="var(--cg-font-retro-display)"
            >
              <ListIcon as={FaCheckCircle} color="var(--cg-accent-amber)" />
              Early access to new features
            </ListItem>
            <ListItem
              color="var(--cg-text)"
              fontSize="sm"
              fontFamily="var(--cg-font-retro-display)"
            >
              <ListIcon as={FaCheckCircle} color="var(--cg-accent-amber)" />
              Exclusive beta challenges
            </ListItem>
            <ListItem
              color="var(--cg-text)"
              fontSize="sm"
              fontFamily="var(--cg-font-retro-display)"
            >
              <ListIcon as={FaCheckCircle} color="var(--cg-accent-amber)" />
              Direct feedback channel with the team
            </ListItem>
            <ListItem
              color="var(--cg-text)"
              fontSize="sm"
              fontFamily="var(--cg-font-retro-display)"
            >
              <ListIcon as={FaCheckCircle} color="var(--cg-accent-amber)" />
              Limited community early access to the learning system demo beyond the site demo
            </ListItem>
          </List>
        </VStack>
      </Box>
    </Flex>
  </VStack>
);

export default ComingSoonSection;
