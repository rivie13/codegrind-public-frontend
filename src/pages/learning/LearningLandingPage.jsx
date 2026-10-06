import {
  Box,
  Button,
  HStack,
  Input,
  ListItem,
  SimpleGrid,
  Text,
  UnorderedList,
} from '@chakra-ui/react';
import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import PageTemplate from '../../components/layout/PageTemplate';
import PageSeo from '../../components/seo/PageSeo';
import BottomBannerAd from '../../components/ads/BottomBannerAd';
import TopBannerAd from '../../components/ads/TopBannerAd';
import RetroPageShell, { RetroInset, RetroPanel } from '../../components/retro/RetroPageShell';
import adSlots from '../../config/adSlots';

const LANGUAGE_CARDS = [
  {
    label: 'Python',
    accent: 'var(--cg-accent-green)',
    hoverBg: 'rgba(36, 106, 42, 0.12)',
    pathId: 'python-beginner',
    path: '/learning/python-beginner',
    desc: '[INSERT TEXT HERE — Python card description]',
  },
  {
    label: 'JavaScript',
    accent: 'var(--cg-accent-amber)',
    hoverBg: 'rgba(118, 81, 0, 0.12)',
    pathId: 'javascript-beginner',
    path: '/learning/javascript-beginner',
    desc: 'The language of the web. Every interactive site you have used runs on JavaScript.',
    // Unlinked from the catalog for now; the route stays live and the data stays.
    isHidden: true,
  },
  {
    label: 'Java',
    accent: 'var(--cg-accent-red)',
    hoverBg: 'rgba(139, 31, 31, 0.12)',
    pathId: 'java-beginner',
    path: '/learning/java-beginner',
    desc: 'Widely used in enterprise, Android, and CS courses. Strict types teach good habits early.',
    // Unlinked from the catalog for now; the route stays live and the data stays.
    isHidden: true,
  },
];

// Catalog entries that live outside learning paths (plain links, no trial logic).
const LINK_CARDS = [
  {
    label: 'DSA Interview Prep',
    accent: 'var(--cg-accent-red)',
    hoverBg: 'rgba(139, 31, 31, 0.12)',
    path: '/problems',
    desc: '[INSERT TEXT HERE — DSA card description]',
  },
];

function LearningLandingPage() {
  const navigate = useNavigate();
  const [catalogQuery, setCatalogQuery] = useState('');

  const handleStartLearning = (card) => {
    navigate(card.path);
  };

  const query = catalogQuery.trim().toLowerCase();
  const matchesQuery = (label, desc) =>
    query.length === 0 || label.toLowerCase().includes(query) || desc.toLowerCase().includes(query);
  // Hidden cards stay out of the catalog; their routes and data are untouched.
  const visibleLanguageCards = LANGUAGE_CARDS.filter(
    (card) => !card.isHidden && matchesQuery(card.label, card.desc)
  );
  const visibleLinkCards = LINK_CARDS.filter((card) => matchesQuery(card.label, card.desc));

  return (
    <PageTemplate showGiphyBackground>
      <PageSeo
        title="All Ops: Interactive Coding Courses"
        description="Browse CodeGrind ops: Intro Python for absolute beginners, the DSA interview prep bank, and AI-forged sim challenges. Short lessons, real coding exercises, and games that reinforce every concept."
        path="/learning"
        keywords="learn to code, coding courses, python for beginners, dsa interview prep, gamified coding, coding game for beginners"
      />
      <RetroPageShell
        mainMaxW="container.lg"
        hideHero
        heroFileLabel="ops-catalog.exe"
        heroTitle="All Ops"
        heroSubtitle="A fast learning loop: pick an op, work through short lessons, solve real problems in the editor, and use AI as a tool you verify instead of a black box. Module 0 stays open to guests so you can start immediately."
        heroMeta="Module 0 open"
        topSlot={
          <Box
            width="100%"
            maxWidth={{ base: '100%', md: '728px' }}
            mx="auto"
            mt={{ base: 3, md: 4 }}
            mb={{ base: 5, md: 6 }}
            px={{ base: 4, md: 0 }}
          >
            <TopBannerAd slotId={adSlots.generic.top} />
          </Box>
        }
        bottomSlot={
          <Box
            width="100%"
            maxWidth={{ base: '100%', md: '728px' }}
            mx="auto"
            mt={{ base: 1, md: 2 }}
            mb={{ base: 8, md: 10 }}
            px={{ base: 4, md: 0 }}
          >
            <BottomBannerAd slotId={adSlots.generic.bottom} />
          </Box>
        }
      >
        <RetroPanel
          fileLabel="ops.ini"
          title="Op Catalog"
          subtitle="Check out the different courses to see what you can learn on CodeGrind."
        >
          <Box mb={5} maxW="420px">
            <Input
              value={catalogQuery}
              onChange={(event) => setCatalogQuery(event.target.value)}
              placeholder="Search ops..."
              aria-label="Search ops"
              bg="var(--cg-panel-shell)"
              border="2px solid var(--cg-window-shadow)"
              borderRadius="0"
              color="var(--cg-text)"
              fontFamily="var(--cg-font-retro-display)"
              _placeholder={{ color: 'var(--cg-muted)' }}
              _focus={{ borderColor: 'var(--cg-link)', boxShadow: 'var(--cg-window-inset)' }}
            />
          </Box>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 4, md: 5 }}>
            {visibleLanguageCards.map((card) => {
              return (
                <RetroInset
                  key={card.label}
                  p={{ base: 4, md: 5 }}
                  display="flex"
                  flexDirection="column"
                  gap={4}
                  minH="100%"
                  transition="background 120ms ease, transform 120ms ease"
                  _hover={{
                    bg: card.hoverBg,
                    transform: 'translate(-1px, -1px)',
                  }}
                >
                  <HStack justify="space-between" align="start" spacing={3}>
                    <Box>
                      <Text
                        color={card.accent}
                        fontSize={{ base: 'lg', md: 'xl' }}
                        fontWeight="700"
                        textTransform="uppercase"
                        letterSpacing="0.08em"
                      >
                        {card.label}
                      </Text>
                      <Text color="var(--cg-muted)" fontSize="sm">
                        Path ID: {card.pathId}
                      </Text>
                    </Box>
                  </HStack>

                  <Text color="var(--cg-text)" fontSize="sm" lineHeight="1.7" flex="1">
                    {card.desc}
                  </Text>

                  <Button
                    alignSelf="flex-start"
                    color={card.accent}
                    onClick={() => handleStartLearning(card)}
                  >
                    Start learning
                  </Button>
                </RetroInset>
              );
            })}
            {visibleLinkCards.map((card) => (
              <RetroInset
                key={card.label}
                p={{ base: 4, md: 5 }}
                display="flex"
                flexDirection="column"
                gap={4}
                minH="100%"
                transition="background 120ms ease, transform 120ms ease"
                _hover={{
                  bg: card.hoverBg,
                  transform: 'translate(-1px, -1px)',
                }}
              >
                <HStack justify="space-between" align="start" spacing={3}>
                  <Box>
                    <Text
                      color={card.accent}
                      fontSize={{ base: 'lg', md: 'xl' }}
                      fontWeight="700"
                      textTransform="uppercase"
                      letterSpacing="0.08em"
                    >
                      {card.label}
                    </Text>
                  </Box>
                </HStack>

                <Text color="var(--cg-text)" fontSize="sm" lineHeight="1.7" flex="1">
                  {card.desc}
                </Text>

                <Button as={RouterLink} to={card.path} alignSelf="flex-start" color={card.accent}>
                  Open
                </Button>
              </RetroInset>
            ))}
            {visibleLanguageCards.length === 0 && visibleLinkCards.length === 0 ? (
              <Text color="var(--cg-muted)" fontSize="sm" fontFamily="var(--cg-font-retro-display)">
                No ops match that search. Clear the search to see everything.
              </Text>
            ) : null}
          </SimpleGrid>
        </RetroPanel>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 6, md: 8 }}>
          <RetroPanel fileLabel="overview.txt" title="[REWRITE: panel heading]">
            <UnorderedList spacing={3} color="var(--cg-text)" fontSize="sm" lineHeight="1.7" ml={4}>
              <ListItem>[INSERT TEXT HERE — bullet 1]</ListItem>
              <ListItem>[INSERT TEXT HERE — bullet 2]</ListItem>
              <ListItem>[INSERT TEXT HERE — bullet 3]</ListItem>
              <ListItem>[INSERT TEXT HERE — bullet 4]</ListItem>
              <ListItem>[INSERT TEXT HERE — bullet 5]</ListItem>
            </UnorderedList>
          </RetroPanel>

          <RetroPanel fileLabel="progress.log" title="[REWRITE: panel heading]">
            <UnorderedList spacing={3} color="var(--cg-text)" fontSize="sm" lineHeight="1.7" ml={4}>
              <ListItem>[INSERT TEXT HERE — bullet 1]</ListItem>
              <ListItem>[INSERT TEXT HERE — bullet 2]</ListItem>
              <ListItem>[INSERT TEXT HERE — bullet 3]</ListItem>
            </UnorderedList>
          </RetroPanel>
        </SimpleGrid>
      </RetroPageShell>
    </PageTemplate>
  );
}

export default LearningLandingPage;
