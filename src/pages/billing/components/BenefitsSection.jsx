import { Box, Flex, Heading, List, ListIcon, ListItem, VStack } from '@chakra-ui/react';
import React from 'react';
import { FaBrain, FaCheckCircle, FaRocket, FaShieldAlt } from 'react-icons/fa';

const BenefitsSection = () => (
  <VStack spacing={{ base: 5, md: 6 }} w="100%">
    <Heading
      fontSize={{ base: 'xl', md: '2xl' }}
      color="var(--cg-text)"
      fontFamily="var(--cg-font-retro-display)"
      textAlign="center"
      textTransform="uppercase"
      letterSpacing="0.06em"
    >
      Premium/Unlimited benefits today
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
            <FaRocket style={{ color: 'var(--cg-link)', fontSize: '24px' }} />
            <Heading size="md" color="var(--cg-link)" fontFamily="var(--cg-font-retro-display)">
              Multi-Model AI Access
            </Heading>
          </Flex>
          <List spacing={2}>
            <ListItem
              color="var(--cg-text)"
              fontSize="sm"
              fontFamily="var(--cg-font-retro-display)"
            >
              <ListIcon as={FaCheckCircle} color="var(--cg-link)" />
              Choose from a growing range of premium AI models including Gemini 3.1, Command R+, Command R, Gemma 4, and more
            </ListItem>
            <ListItem
              color="var(--cg-text)"
              fontSize="sm"
              fontFamily="var(--cg-font-retro-display)"
            >
              <ListIcon as={FaCheckCircle} color="var(--cg-link)" />
              Higher daily limits for AI chat, code generation, and problem creation
            </ListItem>
            <ListItem
              color="var(--cg-text)"
              fontSize="sm"
              fontFamily="var(--cg-font-retro-display)"
            >
              <ListIcon as={FaCheckCircle} color="var(--cg-link)" />
              Premium models available exclusively for paid tiers
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
            <FaBrain style={{ color: 'var(--cg-accent-amber)', fontSize: '24px' }} />
            <Heading
              size="md"
              color="var(--cg-accent-amber)"
              fontFamily="var(--cg-font-retro-display)"
            >
              AI Code Analysis
            </Heading>
          </Flex>
          <List spacing={2}>
            <ListItem
              color="var(--cg-text)"
              fontSize="sm"
              fontFamily="var(--cg-font-retro-display)"
            >
              <ListIcon as={FaCheckCircle} color="var(--cg-accent-amber)" />
              Get AI-powered feedback on your submissions
            </ListItem>
            <ListItem
              color="var(--cg-text)"
              fontSize="sm"
              fontFamily="var(--cg-font-retro-display)"
            >
              <ListIcon as={FaCheckCircle} color="var(--cg-accent-amber)" />
              Actionable suggestions to improve your code
            </ListItem>
            <ListItem
              color="var(--cg-text)"
              fontSize="sm"
              fontFamily="var(--cg-font-retro-display)"
            >
              <ListIcon as={FaCheckCircle} color="var(--cg-accent-amber)" />
              Up to 30 analyses per day (Unlimited tier)
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
            <FaShieldAlt style={{ color: 'var(--cg-accent-green)', fontSize: '24px' }} />
            <Heading
              size="md"
              color="var(--cg-accent-green)"
              fontFamily="var(--cg-font-retro-display)"
            >
              Ad-free experience
            </Heading>
          </Flex>
          <List spacing={2}>
            <ListItem
              color="var(--cg-text)"
              fontSize="sm"
              fontFamily="var(--cg-font-retro-display)"
            >
              <ListIcon as={FaCheckCircle} color="var(--cg-accent-green)" />
              Remove or heavily reduce all sponsored content
            </ListItem>
            <ListItem
              color="var(--cg-text)"
              fontSize="sm"
              fontFamily="var(--cg-font-retro-display)"
            >
              <ListIcon as={FaCheckCircle} color="var(--cg-accent-green)" />
              Cleaner, distraction-free UI
            </ListItem>
            <ListItem
              color="var(--cg-text)"
              fontSize="sm"
              fontFamily="var(--cg-font-retro-display)"
            >
              <ListIcon as={FaCheckCircle} color="var(--cg-accent-green)" />
              Faster page loading times
            </ListItem>
          </List>
        </VStack>
      </Box>
    </Flex>
  </VStack>
);

export default BenefitsSection;
