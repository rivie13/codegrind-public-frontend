import { Button, Flex, Text, VStack } from '@chakra-ui/react';
import React from 'react';
import { Link } from 'react-router-dom';

const CallToAction = () => (
  <VStack spacing={{ base: 4, md: 5 }} w="100%">
    <VStack spacing={2} maxW="3xl" textAlign="center" px={{ base: 2, md: 0 }}>
      <Text
        color="var(--cg-text)"
        fontSize={{ base: 'md', md: 'lg' }}
        fontFamily="var(--cg-font-retro-display)"
        lineHeight="1.6"
      >
        Premium/Unlimited removes ads, raises limits, and helps keep all content free for everyone.
      </Text>
      <Text
        color="var(--cg-muted)"
        fontSize={{ base: 'sm', md: 'md' }}
        fontFamily="var(--cg-font-retro-display)"
        lineHeight="1.6"
      >
        A basic learning-path demo is available to everyone now. We’ll use it as the blueprint for
        expanding content, while a limited number of subscribers get early access to the full
        learning system demo.
      </Text>
    </VStack>

    <Flex gap={4} wrap="wrap" justify="center" w="100%">
      <Button
        as={Link}
        to="/updates"
        size="lg"
        color="var(--cg-link)"
        fontFamily="var(--cg-font-retro-display)"
        px={{ base: 6, md: 8 }}
        py={{ base: 5, md: 6 }}
        w={{ base: '100%', sm: 'auto' }}
        minH="44px"
      >
        Check Site Updates
      </Button>

      <Button
        as={Link}
        to="/"
        size="lg"
        color="var(--cg-accent-amber)"
        fontFamily="var(--cg-font-retro-display)"
        px={{ base: 6, md: 8 }}
        py={{ base: 5, md: 6 }}
        w={{ base: '100%', sm: 'auto' }}
        minH="44px"
      >
        Back to Home
      </Button>
    </Flex>
  </VStack>
);

export default CallToAction;
