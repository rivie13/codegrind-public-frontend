import { AspectRatio, Box, Button, Card, CardBody, Flex, Heading, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Link as RouterLink } from 'react-router-dom';

const MotionBox = motion(Box);

function ChallengeMapsSpotlight() {
  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      width="100%"
    >
      <Card
        bg="#0f1012"
        borderRadius="lg"
        borderWidth="1px"
        borderColor="#3d3d3d"
        boxShadow="0 0 20px rgba(255, 0, 222, 0.25)"
        position="relative"
        overflow="hidden"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '20px',
          height: '20px',
          borderTop: '1px solid #FF00DE',
          borderLeft: '1px solid #FF00DE',
        }}
        _after={{
          content: '""',
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '20px',
          height: '20px',
          borderBottom: '1px solid #00FF8C',
          borderRight: '1px solid #00FF8C',
        }}
        maxW="1200px"
        mx="auto"
      >
        <CardBody p={0}>
          <Flex direction={{ base: 'column', lg: 'row' }} overflow="hidden">
            <Box width={{ base: '100%', lg: '55%' }} p={{ base: 6, md: 8, xl: 10 }}>
              <Heading
                as="h2"
                fontSize={{ base: 'xl', sm: '2xl', md: '3xl' }}
                mb={{ base: 3, md: 4 }}
                color="#FF00DE"
                fontFamily="'Orbitron', sans-serif"
                textShadow="0 0 5px rgba(255, 0, 222, 0.5)"
              >
                PROBLEM MAP
              </Heading>
              <Text color="white" mb={4} fontSize={{ base: 'sm', md: 'md' }} fontFamily="monospace">
                Explore curated paths through the most important interview patterns. Each node is a
                focused problem that builds intuition and reinforces architectural thinking.
              </Text>
              <Text
                color="white"
                mb={{ base: 5, md: 6 }}
                fontSize={{ base: 'sm', md: 'md' }}
                fontFamily="monospace"
              >
                Work through CodeGrind-curated interview sets, focused pattern collections, and
                progression maps built for deliberate practice.
              </Text>
              <Button
                as={RouterLink}
                to="/games/clusters"
                size="lg"
                bg="transparent"
                color="#FF00DE"
                border="1px solid #FF00DE"
                borderRadius="sm"
                px={{ base: 6, md: 10 }}
                py={{ base: 4, md: 6 }}
                width={{ base: '100%', sm: 'auto' }}
                boxShadow="0 0 12px rgba(255, 0, 222, 0.35)"
                _hover={{
                  bg: 'rgba(255, 0, 222, 0.1)',
                  boxShadow: '0 0 18px rgba(255, 0, 222, 0.6)',
                }}
                fontFamily="monospace"
              >
                OPEN CLUSTER MAP
              </Button>
            </Box>
            <Box
              width={{ base: '100%', lg: '45%' }}
              p={{ base: 5, md: 6, lg: 8 }}
              bg="#0a0a0c"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Box width="100%" maxW={{ base: '360px', md: '420px' }}>
                <AspectRatio ratio={{ base: 4 / 3, sm: 1 }}>
                  <iframe
                    src="https://giphy.com/embed/WqFqAGOStn4AD4ZK8G"
                    title="Challenge Maps Visual"
                    width="100%"
                    height="100%"
                    style={{
                      border: 0,
                      borderRadius: '12px',
                      boxShadow: '0 0 20px rgba(255, 0, 222, 0.35)',
                    }}
                  />
                </AspectRatio>
                <Text
                  as="a"
                  href="https://giphy.com/gifs/vaporwave-chillwave-dreamwave-WqFqAGOStn4AD4ZK8G"
                  target="_blank"
                  rel="noreferrer"
                  fontSize="xs"
                  color="#00FF8C"
                  display="block"
                  textAlign="center"
                  mt={2}
                  fontFamily="monospace"
                >
                  via GIPHY
                </Text>
              </Box>
            </Box>
          </Flex>
        </CardBody>
      </Card>
    </MotionBox>
  );
}

export default ChallengeMapsSpotlight;
