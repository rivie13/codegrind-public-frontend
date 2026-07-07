import { Box, Button, ListItem, SimpleGrid, Text, UnorderedList } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import BottomBannerAd from '../../components/ads/BottomBannerAd';
import SidebarAd from '../../components/ads/SidebarAd';
import TopBannerAd from '../../components/ads/TopBannerAd';
import PageTemplate from '../../components/layout/PageTemplate';
import RetroPageShell, { RetroInset, RetroPanel } from '../../components/retro/RetroPageShell';
import adSlots from '../../config/adSlots';

const AI_SURFACES = [
  {
    title: 'Browse AI Problems',
    fileLabel: 'generated-bank.dat',
    accent: 'var(--cg-accent-blue)',
    summary:
      'Open the shared AI-generated catalog and jump into practice, ranked, or challenge mode.',
    bullets: [
      'Filter by difficulty and page through generated prompts.',
      'Use it when you want quick variation without reconfiguring the generator.',
      'Best fit for replayable practice with already-saved drafts.',
    ],
    actionLabel: 'Browse problems',
    action: '/ai-problems/browse',
  },
  {
    title: 'Create Your Own',
    fileLabel: 'ai-generator.exe',
    accent: 'var(--cg-accent-green)',
    summary:
      'Configure a prompt, generate a new draft, test the solution, and save only after verification.',
    bullets: [
      'Control topic, difficulty, wackiness, language, and model.',
      'Review every generated section before you keep it.',
      'Use it when you need a custom problem instead of a catalog entry.',
    ],
    actionLabel: 'Create problem',
    action: '/ai-problems/create',
  },
];

const FEATURE_LIST = [
  'Customizable problem types spanning beginner through advanced structures and patterns.',
  'Difficulty and wackiness controls for more realistic or more experimental prompts.',
  'AI-assisted generation with editable examples, constraints, and solutions.',
  'Solution verification before save so the generated draft stays usable in the workspace.',
];

const AIProblems = () => {
  const navigate = useNavigate();

  return (
    <PageTemplate title="AI Generated Problems" showGiphyBackground>
      <RetroPageShell
        mainMaxW="container.xl"
        heroFileLabel="ai-problems.exe"
        heroTitle="AI Problem Tools"
        heroSubtitle="Open the shared AI-generated bank or build a new custom problem from scratch, then verify the result before you keep it."
        heroMeta="Authenticated tools"
        topSlot={
          <Box
            width="100%"
            maxWidth={{ base: '100%', md: '728px' }}
            mx="auto"
            mt={{ base: 4, md: 6 }}
            mb={{ base: 4, md: 6 }}
            px={{ base: 4, md: 0 }}
          >
            <TopBannerAd slotId={adSlots.generic.top} />
          </Box>
        }
        leftSidebar={<SidebarAd slotId={adSlots.generic.sidebar} />}
        rightSidebar={<SidebarAd slotId={adSlots.generic.sidebar} />}
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
          fileLabel="surfaces.ini"
          title="Choose a Surface"
          subtitle="Use the catalog when you want speed. Use the generator when you need a tailored problem."
        >
          <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={{ base: 4, md: 5 }}>
            {AI_SURFACES.map((surface) => (
              <RetroInset
                key={surface.title}
                p={{ base: 4, md: 5 }}
                display="flex"
                flexDirection="column"
                gap={4}
              >
                <Box>
                  <Text
                    color={surface.accent}
                    fontSize={{ base: 'lg', md: 'xl' }}
                    fontWeight="700"
                    textTransform="uppercase"
                    letterSpacing="0.08em"
                  >
                    {surface.title}
                  </Text>
                  <Text color="var(--cg-muted)" fontSize="sm">
                    {surface.fileLabel}
                  </Text>
                </Box>

                <Text color="var(--cg-text)" fontSize="sm" lineHeight="1.7">
                  {surface.summary}
                </Text>

                <UnorderedList
                  spacing={2.5}
                  ml={4}
                  color="var(--cg-text)"
                  fontSize="sm"
                  lineHeight="1.6"
                >
                  {surface.bullets.map((item) => (
                    <ListItem key={item}>{item}</ListItem>
                  ))}
                </UnorderedList>

                <Button mt="auto" color={surface.accent} onClick={() => navigate(surface.action)}>
                  {surface.actionLabel}
                </Button>
              </RetroInset>
            ))}
          </SimpleGrid>
        </RetroPanel>

        <RetroPanel
          fileLabel="capabilities.txt"
          title="Available Features"
          subtitle="The AI flow supports generation, editing, verification, and save-ready handoff into the workspace."
        >
          <RetroInset p={{ base: 4, md: 5 }}>
            <UnorderedList spacing={3} ml={4} color="var(--cg-text)" fontSize="sm" lineHeight="1.7">
              {FEATURE_LIST.map((item) => (
                <ListItem key={item}>{item}</ListItem>
              ))}
            </UnorderedList>
          </RetroInset>
        </RetroPanel>
      </RetroPageShell>
    </PageTemplate>
  );
};

export default AIProblems;
