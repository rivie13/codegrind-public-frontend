import { Box, Button, Card, CardBody, Flex, Heading, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Link as RouterLink } from 'react-router-dom';

const MotionBox = motion(Box);

/**
 * ClusterGridSpotlight — Cyberspace-themed CTA card for the LeetCode Clusters page.
 * Matches the visual style of TowerDefenseCard and ChallengeMapsSpotlight.
 */
function ClusterGridSpotlight() {
  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      width="100%"
    >
      <Card
        bg="#0f1012"
        borderRadius="lg"
        borderWidth="1px"
        borderColor="#3d3d3d"
        boxShadow="0 0 20px rgba(0, 255, 255, 0.2)"
        position="relative"
        overflow="hidden"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '20px',
          height: '20px',
          borderTop: '1px solid #00FFFF',
          borderLeft: '1px solid #00FFFF',
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
            {/* Left — text content */}
            <Box width={{ base: '100%', lg: '55%' }} p={{ base: 6, md: 8, xl: 10 }}>
              <Heading
                as="h2"
                fontSize={{ base: 'xl', sm: '2xl', md: '3xl' }}
                mb={{ base: 3, md: 4 }}
                color="#00FFFF"
                fontFamily="'Orbitron', sans-serif"
                textShadow="0 0 5px rgba(0, 255, 255, 0.5)"
              >
                CLUSTER GRID
              </Heading>
              <Text color="white" mb={4} fontSize={{ base: 'sm', md: 'md' }} fontFamily="monospace">
                17 algorithm clusters spanning 150+ problems — arrays, graphs, dynamic programming,
                and everything in between. Each cluster is a focused module of related patterns.
              </Text>
              <Text
                color="white"
                mb={{ base: 5, md: 6 }}
                fontSize={{ base: 'sm', md: 'md' }}
                fontFamily="monospace"
              >
                Work through Beginner → Intermediate → Advanced tiers. Track your progress with
                voltage-bar indicators as you master each data structure and algorithm pattern.
              </Text>
              <Button
                as={RouterLink}
                to="/games/clusters"
                size="lg"
                bg="transparent"
                color="#00FFFF"
                border="1px solid #00FFFF"
                borderRadius="sm"
                px={{ base: 6, md: 10 }}
                py={{ base: 4, md: 6 }}
                width={{ base: '100%', sm: 'auto' }}
                boxShadow="0 0 12px rgba(0, 255, 255, 0.35)"
                _hover={{
                  bg: 'rgba(0, 255, 255, 0.1)',
                  boxShadow: '0 0 18px rgba(0, 255, 255, 0.6)',
                }}
                fontFamily="monospace"
              >
                ENTER CLUSTER GRID
              </Button>
            </Box>

            {/* Right — animated pixel-art visual */}
            <Box
              width={{ base: '100%', lg: '45%' }}
              p={{ base: 5, md: 6, lg: 8 }}
              bg="#07080a"
              display="flex"
              alignItems="center"
              justifyContent="center"
              position="relative"
              overflow="hidden"
              minH={{ base: '220px', md: '280px' }}
            >
              {/* Dithered background grid */}
              <Box
                position="absolute"
                inset="0"
                opacity={0.06}
                backgroundImage="linear-gradient(#00FFFF 1px, transparent 1px), linear-gradient(90deg, #00FFFF 1px, transparent 1px)"
                backgroundSize="24px 24px"
                pointerEvents="none"
              />

              {/* Animated pixel cluster visual using CSS */}
              <Flex
                direction="column"
                align="center"
                justify="center"
                gap={4}
                position="relative"
                zIndex={1}
              >
                {/* CPU chip icon (pixel art via CSS) */}
                <Box position="relative">
                  <Box
                    w="80px"
                    h="80px"
                    bg="#0c0e12"
                    border="2px solid"
                    borderColor="#00FFFF"
                    position="relative"
                    boxShadow="0 0 20px rgba(0, 255, 255, 0.25), inset 0 0 12px rgba(0, 255, 255, 0.08)"
                    sx={{
                      imageRendering: 'pixelated',
                      animation: 'chipPulse 3s ease-in-out infinite',
                      '@keyframes chipPulse': {
                        '0%, 100%': {
                          boxShadow:
                            '0 0 20px rgba(0, 255, 255, 0.25), inset 0 0 12px rgba(0, 255, 255, 0.08)',
                        },
                        '50%': {
                          boxShadow:
                            '0 0 30px rgba(0, 255, 255, 0.45), inset 0 0 20px rgba(0, 255, 255, 0.15)',
                        },
                      },
                    }}
                  >
                    {/* Pin stubs — top */}
                    {[12, 24, 36, 48, 60].map((offset) => (
                      <Box
                        key={`t${offset}`}
                        position="absolute"
                        top="-8px"
                        left={`${offset - 2}px`}
                        w="4px"
                        h="8px"
                        bg="#00FFFF"
                        opacity={0.4}
                      />
                    ))}
                    {/* Pin stubs — bottom */}
                    {[12, 24, 36, 48, 60].map((offset) => (
                      <Box
                        key={`b${offset}`}
                        position="absolute"
                        bottom="-8px"
                        left={`${offset - 2}px`}
                        w="4px"
                        h="8px"
                        bg="#00FFFF"
                        opacity={0.4}
                      />
                    ))}
                    {/* Pin stubs — left */}
                    {[12, 24, 36, 48, 60].map((offset) => (
                      <Box
                        key={`l${offset}`}
                        position="absolute"
                        left="-8px"
                        top={`${offset - 2}px`}
                        w="8px"
                        h="4px"
                        bg="#00FFFF"
                        opacity={0.4}
                      />
                    ))}
                    {/* Pin stubs — right */}
                    {[12, 24, 36, 48, 60].map((offset) => (
                      <Box
                        key={`r${offset}`}
                        position="absolute"
                        right="-8px"
                        top={`${offset - 2}px`}
                        w="8px"
                        h="4px"
                        bg="#00FFFF"
                        opacity={0.4}
                      />
                    ))}

                    {/* Inner glow face */}
                    <Flex position="absolute" inset="6px" align="center" justify="center">
                      <Text
                        fontSize="2xl"
                        fontFamily="monospace"
                        fontWeight="bold"
                        color="#00FFFF"
                        textShadow="0 0 8px #00FFFF"
                        sx={{
                          animation: 'glitchFlicker 4s steps(2) infinite',
                          '@keyframes glitchFlicker': {
                            '0%, 90%, 100%': { opacity: 1 },
                            '92%': { opacity: 0.4 },
                            '94%': { opacity: 1 },
                            '96%': { opacity: 0.6 },
                          },
                        }}
                      >
                        ⬡
                      </Text>
                    </Flex>
                  </Box>

                  {/* Orbiting pixel particles */}
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <Box
                      key={`p${i}`}
                      position="absolute"
                      w="4px"
                      h="4px"
                      bg={i % 2 === 0 ? '#00FFFF' : '#00FF8C'}
                      top="50%"
                      left="50%"
                      sx={{
                        animation: `orbit${i} ${2.5 + i * 0.3}s linear infinite`,
                        [`@keyframes orbit${i}`]: {
                          '0%': {
                            transform: `rotate(${i * 60}deg) translateX(${52 + i * 4}px) rotate(-${i * 60}deg)`,
                            opacity: 0.8,
                          },
                          '50%': {
                            opacity: 0.3,
                          },
                          '100%': {
                            transform: `rotate(${i * 60 + 360}deg) translateX(${52 + i * 4}px) rotate(-${i * 60 + 360}deg)`,
                            opacity: 0.8,
                          },
                        },
                      }}
                    />
                  ))}
                </Box>

                {/* Tier labels */}
                <Flex gap={3} fontFamily="monospace" fontSize="10px" letterSpacing="wider">
                  <Text color="#00FF8C" textShadow="0 0 4px rgba(0,255,140,0.5)">
                    BEGINNER
                  </Text>
                  <Text color="#666">→</Text>
                  <Text color="#FFCC00" textShadow="0 0 4px rgba(255,204,0,0.5)">
                    INTERMEDIATE
                  </Text>
                  <Text color="#666">→</Text>
                  <Text color="#FF4D4D" textShadow="0 0 4px rgba(255,77,77,0.5)">
                    ADVANCED
                  </Text>
                </Flex>

                {/* Stats line */}
                <Text color="#555" fontSize="10px" fontFamily="monospace" letterSpacing="wide">
                  2 COLLECTIONS // 60+ PROBLEMS // 3 TIERS
                </Text>
              </Flex>

              {/* Scanline overlay */}
              <Box
                position="absolute"
                inset="0"
                pointerEvents="none"
                opacity={0.04}
                backgroundImage="repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 3px)"
              />
            </Box>
          </Flex>
        </CardBody>
      </Card>
    </MotionBox>
  );
}

export default ClusterGridSpotlight;
