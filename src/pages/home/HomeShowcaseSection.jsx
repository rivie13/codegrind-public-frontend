import {
  AspectRatio,
  Box,
  Button,
  Flex,
  HStack,
  Image,
  Link as ChakraLink,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import getAssetUrl from '../../utils/assets/assetUrl';
import { restoreFullscreenFromIntent } from '../../utils/mobile/fullscreenState';
import useGuestFunnel from '../../hooks/guest/useGuestFunnel';

const learningDemoGif = getAssetUrl('/images/Learning_Demo_GIF_Edited.gif');
const towerDefenseGif = getAssetUrl('/images/TowerDefense_V2_Gameplay_Clip_GIF_Edited.gif');
const blogFaqGif = getAssetUrl('/images/Blog_FAQ_Upgrades_GIF_Edited.gif');
const WINDOW_OUTSET =
  'inset 1px 1px 0 var(--home-retro-border-light), inset 2px 2px 0 var(--home-retro-border-lighter), inset -1px -1px 0 var(--home-retro-border-dark), inset -2px -2px 0 var(--home-retro-border-mid)';
const WINDOW_INSET =
  'inset 1px 1px 0 var(--home-retro-border-dark), inset 2px 2px 0 var(--home-retro-border-mid), inset -1px -1px 0 var(--home-retro-border-light), inset -2px -2px 0 var(--home-retro-border-lighter)';
const ACTIVE_TITLE_BAR =
  'linear-gradient(90deg, var(--home-retro-title-start) 0%, var(--home-retro-title-end) 100%)';
const BEGIN_DEMO_PATH = '/city?scene=apartment-room-01&entry=path-choice&apartmentState=intro';

const RetroButton = ({ children, ...props }) => (
  <Button
    size="lg"
    bg="var(--home-retro-surface)"
    color="var(--home-retro-text)"
    borderRadius="0"
    fontWeight="700"
    fontFamily="var(--cg-font-retro-display)"
    letterSpacing="0.04em"
    width={{ base: '100%', sm: 'auto' }}
    maxW={{ base: '360px', sm: 'none' }}
    boxShadow={WINDOW_OUTSET}
    _hover={{ bg: 'var(--home-retro-surface-shell)' }}
    _active={{
      bg: 'var(--home-retro-surface-muted)',
      boxShadow: WINDOW_INSET,
      transform: 'translate(1px, 1px)',
    }}
    transition="background 0.15s ease, transform 0.05s ease"
    {...props}
  >
    {children}
  </Button>
);

/**
 * Lazy-loads an image only when it comes within 200px of the viewport.
 * Keeps the <img> `src` empty during Lighthouse's audit window — zero network
 * activity for showcase GIFs until the user actually scrolls near them.
 */
const LazyGifImage = ({ src, alt, ...imgProps }) => {
  const ref = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoaded(true);
          observer.unobserve(el);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Box ref={ref} width="100%" height="100%">
      <Image
        src={loaded ? src : undefined}
        alt={alt}
        width="100%"
        height="100%"
        objectFit="cover"
        loading="lazy"
        decoding="async"
        fetchpriority="low"
        {...imgProps}
      />
    </Box>
  );
};

const HomeShowcaseSection = () => {
  const navigate = useNavigate();
  const funnel = useGuestFunnel();

  const handleBeginDemoClick = useCallback(
    async (event) => {
      event.preventDefault();
      funnel.beginDemoClicked({ source: 'footer_cta' });
      await restoreFullscreenFromIntent();
      navigate(BEGIN_DEMO_PATH);
    },
    [funnel, navigate]
  );

  const sections = [
    {
      title: 'Code Breach: Tower Defense Meets Coding',
      eyebrow: 'THE FLAGSHIP GAME',
      body: 'Solve real coding problems by defending your solution as you build it through the waves. Your algorithm becomes your tower strategy, constraints become tradeoffs, and the code you write is validated against real test cases before the final wave plays out.',
      mediaType: 'image',
      mediaSrc: towerDefenseGif,
      mediaAlt: 'Tower Defense V2 gameplay preview',
      cta: { label: 'EXPLORE CODE BREACH', to: '/games/tower-defense' },
      accent: 'var(--home-retro-title-start)',
      direction: 'left',
      mediaRatio: 4 / 3,
    },
    {
      title: 'Learning Paths: Zero to Confident',
      eyebrow: 'BEGINNER? START HERE',
      body: 'Never written a line of code? Pick a language and learn from scratch. Master the concepts, use AI to accelerate, and learn to verify what it gives you. Guided lessons, a real code editor, an AI assistant you control, and games that make practice feel like play. Python, JavaScript and Java.',
      mediaType: 'image',
      mediaSrc: learningDemoGif,
      mediaAlt: 'Learning path demo preview',
      cta: { label: 'START LEARNING FREE', to: '/learning' },
      accent: 'var(--home-retro-accent-green)',
      direction: 'right',
      mediaRatio: 16 / 9,
    },
    {
      title: 'CodeGrind Interview Sets',
      eyebrow: 'DSA & INTERVIEW READY',
      body: 'Stop grinding randomly. Work through CodeGrind-curated interview challenge sets grouped by difficulty and topic like Arrays & Hashing, Two Pointers, Sliding Window, Trees, Graphs, and more. Progress through clusters in order or free-play any problem. Use AI for hints, verify the logic yourself, and build the judgment interviews demand. Game mode or classic editor, your call.',
      mediaType: 'image',
      mediaSrc: towerDefenseGif,
      mediaAlt: 'CodeGrind interview set preview',
      cta: { label: 'EXPLORE CLUSTERS', to: '/games/clusters' },
      accent: 'var(--home-retro-accent-red)',
      direction: 'bottom',
      mediaRatio: 4 / 3,
    },
    {
      title: 'Community, Blog & Premium',
      eyebrow: 'GROW WITH US',
      body: 'Join the Discord for dev notes, tournaments, and AI chatbot help. Read the blog for strategy guides. All site content is free, including AI-generated problems. Go premium for an ad-free experience, higher rate limits, and priority features as we scale.',
      mediaType: 'image',
      mediaSrc: blogFaqGif,
      mediaAlt: 'Blog, FAQ, and subscription updates preview',
      cta: { label: 'VIEW PRICING', to: '/pricing' },
      accent: 'var(--home-retro-accent-amber)',
      direction: 'right',
      mediaRatio: 16 / 9,
    },
  ];

  return (
    <Box px={{ base: 5, md: 8 }} py={{ base: 8, md: 12 }} bg="transparent">
      <VStack spacing={{ base: 10, md: 16 }}>
        {sections.map((section, index) => {
          const isReversed = index % 2 === 1;

          return (
            <Box key={section.title} w="100%" maxW="1200px">
              <Flex
                direction={{ base: 'column', lg: isReversed ? 'row-reverse' : 'row' }}
                gap={{ base: 6, lg: 10 }}
                align="center"
              >
                <VStack
                  align={{ base: 'center', lg: 'flex-start' }}
                  spacing={4}
                  flex="1"
                  bg="var(--home-retro-surface)"
                  borderRadius="0"
                  p={{ base: 5, md: 7 }}
                  boxShadow={WINDOW_OUTSET}
                  textAlign={{ base: 'center', lg: 'left' }}
                  overflow="hidden"
                >
                  <HStack
                    width="calc(100% + 56px)"
                    ml={{ base: '-20px', md: '-28px' }}
                    mt={{ base: '-20px', md: '-28px' }}
                    mb={{ base: 2, md: 3 }}
                    px={{ base: 4, md: 5 }}
                    py={{ base: 2.5, md: 3 }}
                    justify="space-between"
                    bg={ACTIVE_TITLE_BAR}
                  >
                    <Text
                      fontSize="xs"
                      fontFamily="var(--cg-font-retro-display)"
                      color="white"
                      fontWeight="700"
                      letterSpacing="0.04em"
                      textTransform="uppercase"
                    >
                      feature-{String(index + 1).padStart(2, '0')}.exe
                    </Text>
                    <Text
                      fontSize={{ base: 'xs', md: 'sm' }}
                      fontFamily="var(--cg-font-retro-display)"
                      color="rgba(255, 255, 255, 0.92)"
                      lineHeight="1"
                      letterSpacing="0.03em"
                      textTransform="uppercase"
                    >
                      preview ready
                    </Text>
                  </HStack>
                  <Box px={3} py={2} bg="var(--home-retro-surface-shell)" boxShadow={WINDOW_INSET}>
                    <Text
                      fontSize={{ base: '2xs', md: 'xs' }}
                      fontFamily="var(--cg-font-retro-display)"
                      color={section.accent}
                      fontWeight="700"
                      letterSpacing="0.06em"
                      textTransform="uppercase"
                    >
                      {section.eyebrow}
                    </Text>
                  </Box>
                  <Text
                    fontSize={{ base: 'xl', md: '3xl' }}
                    fontWeight="bold"
                    color="var(--home-retro-text)"
                    fontFamily="var(--cg-font-retro-display)"
                    letterSpacing="0.01em"
                  >
                    {section.title}
                  </Text>
                  <Text
                    color="var(--home-retro-text-muted)"
                    fontSize={{ base: 'sm', md: 'lg' }}
                    fontFamily="var(--cg-font-retro-terminal)"
                    lineHeight="1.7"
                  >
                    {section.body}
                  </Text>

                  {section.cta &&
                    (section.cta.external ? (
                      <RetroButton
                        as="a"
                        href={section.cta.to}
                        target="_blank"
                        rel="noopener noreferrer"
                        px={{ base: 6, md: 8 }}
                        py={{ base: 5, md: 6 }}
                      >
                        {section.cta.label}
                      </RetroButton>
                    ) : (
                      <Link to={section.cta.to} style={{ width: '100%' }}>
                        <RetroButton px={{ base: 6, md: 8 }} py={{ base: 5, md: 6 }}>
                          {section.cta.label}
                        </RetroButton>
                      </Link>
                    ))}
                </VStack>

                <Box flex="1" w="100%">
                  <Box
                    borderRadius="0"
                    overflow="hidden"
                    bg="var(--home-retro-surface)"
                    boxShadow={WINDOW_OUTSET}
                  >
                    <HStack
                      justify="space-between"
                      px={{ base: 4, md: 5 }}
                      py={{ base: 2.5, md: 3 }}
                      bg={ACTIVE_TITLE_BAR}
                    >
                      <Text
                        fontSize="xs"
                        fontFamily="var(--cg-font-retro-display)"
                        color="white"
                        fontWeight="700"
                        letterSpacing="0.04em"
                        textTransform="uppercase"
                      >
                        preview://{section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                      </Text>
                      <Text
                        fontSize={{ base: 'xs', md: 'sm' }}
                        fontFamily="var(--cg-font-retro-display)"
                        color="rgba(255, 255, 255, 0.92)"
                        lineHeight="1"
                        textTransform="uppercase"
                      >
                        live capture
                      </Text>
                    </HStack>
                    <AspectRatio ratio={section.mediaRatio}>
                      <Box bg="var(--home-retro-surface-shell)" p={2}>
                        {section.mediaType === 'giphy' ? (
                          <iframe
                            title="Discord community gif"
                            src={section.mediaSrc}
                            width="100%"
                            height="100%"
                            style={{ position: 'absolute', inset: 0 }}
                            frameBorder="0"
                          />
                        ) : (
                          <LazyGifImage src={section.mediaSrc} alt={section.mediaAlt} />
                        )}
                      </Box>
                    </AspectRatio>
                  </Box>
                  {section.mediaAttribution && (
                    <Text fontSize="xs" color="gray.400" mt={2} textAlign="right">
                      <ChakraLink href={section.mediaAttribution} isExternal color={section.accent}>
                        via GIPHY
                      </ChakraLink>
                    </Text>
                  )}
                </Box>
              </Flex>
            </Box>
          );
        })}
      </VStack>

      <VStack spacing={6} textAlign="center" mt={{ base: 12, md: 16 }}>
        <Box
          bg="var(--home-retro-surface)"
          borderRadius="0"
          p={{ base: 0, md: 0 }}
          maxW="900px"
          w="100%"
          overflow="hidden"
          boxShadow={WINDOW_OUTSET}
        >
          <HStack
            justify="space-between"
            px={{ base: 4, md: 5 }}
            py={{ base: 2.5, md: 3 }}
            bg={ACTIVE_TITLE_BAR}
          >
            <Text
              fontSize="xs"
              fontFamily="var(--cg-font-retro-display)"
              color="white"
              fontWeight="700"
              letterSpacing="0.04em"
              textTransform="uppercase"
            >
              begin-demo.exe
            </Text>
            <Text
              fontSize={{ base: 'xs', md: 'sm' }}
              fontFamily="var(--cg-font-retro-display)"
              color="rgba(255, 255, 255, 0.92)"
              lineHeight="1"
              textTransform="uppercase"
            >
              apartment intro
            </Text>
          </HStack>

          <Box p={{ base: 6, md: 8 }} bg="var(--home-retro-surface-strong)">
            <Text
              fontSize={{ base: 'lg', md: '2xl' }}
              fontWeight="bold"
              color="var(--home-retro-text)"
              mb={4}
              fontFamily="var(--cg-font-retro-display)"
            >
              Ready to Start the Demo?
            </Text>
            <Text
              color="var(--home-retro-text-muted)"
              fontSize={{ base: 'sm', md: 'lg' }}
              fontFamily="var(--cg-font-retro-terminal)"
              mb={6}
              lineHeight="1.7"
            >
              Start in the apartment safehouse, chase down codegrind.exe, and let it hand you into
              the home-page breach. Clear that first defense, then pick where you want to go next.
            </Text>

            <Stack spacing={4} justify="center" align="center">
              <Link
                to={BEGIN_DEMO_PATH}
                onClick={handleBeginDemoClick}
                style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
              >
                <RetroButton
                  px={{ base: 6, md: 8 }}
                  py={{ base: 5, md: 6 }}
                  fontSize={{ base: 'sm', md: 'lg' }}
                  width={{ base: '100%', md: 'auto' }}
                  maxW={{ base: '360px', md: 'none' }}
                >
                  BEGIN DEMO
                </RetroButton>
              </Link>
            </Stack>
          </Box>
        </Box>
      </VStack>

      <Box h={16} />
    </Box>
  );
};

export default HomeShowcaseSection;
