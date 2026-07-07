import { Box, Button, ListItem, SimpleGrid, Stack, Text, UnorderedList } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import PageTemplate from '../../components/layout/PageTemplate';
import PageSeo from '../../components/seo/PageSeo';
import BottomBannerAd from '../../components/ads/BottomBannerAd';
import SidebarAd from '../../components/ads/SidebarAd';
import TopBannerAd from '../../components/ads/TopBannerAd';
import RetroPageShell, { RetroInset, RetroPanel } from '../../components/retro/RetroPageShell';
import adSlots from '../../config/adSlots';

const RETRO_ACTION_BUTTON_PROPS = {
  bg: 'var(--cg-window-face)',
  border: '1px solid var(--cg-window-shadow)',
  borderRadius: '0',
  boxShadow: 'var(--cg-window-outset)',
  color: 'var(--cg-text)',
  fontFamily: 'var(--cg-font-retro-display)',
  fontWeight: '700',
  letterSpacing: '0.05em',
  minH: '42px',
  px: 4,
  py: 3,
  textTransform: 'uppercase',
  _hover: {
    bg: 'var(--cg-window-face-strong)',
  },
  _active: {
    bg: 'var(--cg-window-face-strong)',
    boxShadow: 'var(--cg-window-inset)',
    transform: 'translate(1px, 1px)',
  },
  _focusVisible: {
    boxShadow: 'var(--cg-window-inset)',
  },
};

const GAME_SURFACES = [
  {
    title: 'Cluster Grid',
    fileLabel: 'cluster-grid.map',
    accent: 'var(--cg-accent-blue)',
    summary:
      'Seventeen algorithm clusters with focused progression across patterns, data structures, and interview tiers.',
    bullets: [
      'Move through beginner, intermediate, and advanced sets with clear boundaries.',
      'Use it as your structured route through the interview problem bank.',
      'Best fit when you want deliberate practice instead of random browsing.',
    ],
    primaryTo: '/games/clusters',
    primaryLabel: 'Open cluster map',
    secondaryTo: '/games/tower-defense',
    secondaryLabel: 'Browse Code Breach problems',
  },
  {
    title: 'Code Breach',
    fileLabel: 'codebreach.exe',
    accent: 'var(--cg-accent-red)',
    summary:
      'A human-in-the-loop coding game where you verify AI-assisted logic under pressure and hold the line through the final wave.',
    bullets: [
      'Pilot Mode turns tower choices into code suggestions you must review.',
      'Architect Mode starts from your code and maps it back into tactical play.',
      'The final wave gets easier only if your solution actually passes.',
    ],
    primaryTo: '/games/tower-defense',
    primaryLabel: 'Launch Code Breach',
    secondaryTo: '/store',
    secondaryLabel: 'Open data packet store',
  },
];

const FLOW_STEPS = [
  {
    id: 'select',
    title: 'Select',
    accent: 'var(--cg-accent-blue)',
    body: 'Pick a real coding problem with concrete constraints and an actual algorithmic decision to make.',
  },
  {
    id: 'verify',
    title: 'Verify',
    accent: 'var(--cg-accent-red)',
    body: 'Use AI as an assistant, but inspect the logic like a reviewer before you accept any step.',
  },
  {
    id: 'pass',
    title: 'Pass',
    accent: 'var(--cg-accent-green)',
    body: 'Run the tests, read failures, repair the gaps, and ship a stronger solution on the next attempt.',
  },
];

function GamesLandingPage() {
  return (
    <PageTemplate showGiphyBackground>
      <PageSeo
        title="Coding Games and Tower Defense Challenges"
        description="Explore CodeGrind coding games, including Code Breach tower defense missions that turn interview-style programming problems into interactive gameplay."
        path="/games"
        keywords="coding games, coding tower defense game, programming games, interview coding game, gamified coding practice"
      />
      <RetroPageShell
        mainMaxW="container.xl"
        heroFileLabel="codebreach.exe"
        heroTitle="CodeBreach"
        heroSubtitle="The games hub for human-in-the-loop coding. Use structured cluster runs when you want disciplined reps, or launch Code Breach when you want to verify AI-assisted logic under game pressure."
        heroMeta="Human-in-the-loop"
        topSlot={
          <Box
            width="100%"
            maxWidth={{ base: '100%', md: '728px' }}
            mx="auto"
            mt={{ base: 4, md: 6 }}
            mb={{ base: 4, md: 6 }}
            px={{ base: 4, md: 0 }}
          >
            <TopBannerAd slotId={adSlots.gamesLanding.top} />
          </Box>
        }
        leftSidebar={<SidebarAd slotId={adSlots.gamesLanding.sidebar} />}
        rightSidebar={<SidebarAd slotId={adSlots.gamesLanding.sidebar} />}
        bottomSlot={
          <Box
            width="100%"
            maxWidth={{ base: '100%', md: '728px' }}
            mx="auto"
            mt={{ base: 1, md: 2 }}
            mb={{ base: 8, md: 10 }}
            px={{ base: 4, md: 0 }}
          >
            <BottomBannerAd slotId={adSlots.gamesLanding.bottom} />
          </Box>
        }
      >
        <RetroPanel
          fileLabel="game-modes.ini"
          title="Choose a Surface"
          subtitle="Both surfaces train the same core habit: AI can help, but you still own the final reasoning."
        >
          <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={{ base: 4, md: 5 }}>
            {GAME_SURFACES.map((surface) => (
              <RetroInset
                key={surface.title}
                p={{ base: 4, md: 5 }}
                display="flex"
                flexDirection="column"
                gap={4}
                h="100%"
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
                  color="var(--cg-text)"
                  fontSize="sm"
                  lineHeight="1.6"
                  ml={4}
                >
                  {surface.bullets.map((item) => (
                    <ListItem key={item}>{item}</ListItem>
                  ))}
                </UnorderedList>

                <Stack direction={{ base: 'column', md: 'row' }} spacing={3} mt="auto">
                  <Button
                    as={RouterLink}
                    to={surface.primaryTo}
                    {...RETRO_ACTION_BUTTON_PROPS}
                    color={surface.accent}
                  >
                    {surface.primaryLabel}
                  </Button>
                  <Button
                    as={RouterLink}
                    to={surface.secondaryTo}
                    {...RETRO_ACTION_BUTTON_PROPS}
                    color="var(--cg-link)"
                  >
                    {surface.secondaryLabel}
                  </Button>
                </Stack>
              </RetroInset>
            ))}
          </SimpleGrid>
        </RetroPanel>

        <RetroPanel
          fileLabel="protocol.txt"
          title="Human-in-the-loop Flow"
          subtitle="The game layer changes the pressure, but the loop stays the same across every authenticated coding surface."
        >
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 4, md: 5 }}>
            {FLOW_STEPS.map((step, index) => (
              <RetroInset key={step.id} p={{ base: 4, md: 5 }}>
                <Text
                  color={step.accent}
                  fontSize="xs"
                  fontWeight="700"
                  letterSpacing="0.08em"
                  textTransform="uppercase"
                >
                  Step {index + 1}
                </Text>
                <Text
                  mt={2}
                  color="var(--cg-text)"
                  fontSize={{ base: 'lg', md: 'xl' }}
                  fontWeight="700"
                  textTransform="uppercase"
                >
                  {step.title}
                </Text>
                <Text mt={3} color="var(--cg-text)" fontSize="sm" lineHeight="1.7">
                  {step.body}
                </Text>
              </RetroInset>
            ))}
          </SimpleGrid>
        </RetroPanel>

        <RetroPanel
          fileLabel="launch.bat"
          title="Quick Launch"
          subtitle="Jump straight into the part of the platform that matches the type of practice you want today."
        >
          <Stack direction={{ base: 'column', md: 'row' }} spacing={{ base: 3, md: 4 }}>
            <Button
              as={RouterLink}
              to="/games/clusters"
              {...RETRO_ACTION_BUTTON_PROPS}
              color="var(--cg-accent-blue)"
            >
              Open cluster map
            </Button>
            <Button
              as={RouterLink}
              to="/games/tower-defense"
              {...RETRO_ACTION_BUTTON_PROPS}
              color="var(--cg-accent-red)"
            >
              Launch Code Breach
            </Button>
            <Button
              as={RouterLink}
              to="/store"
              {...RETRO_ACTION_BUTTON_PROPS}
              color="var(--cg-accent-green)"
            >
              Open data packet store
            </Button>
          </Stack>
        </RetroPanel>
      </RetroPageShell>
    </PageTemplate>
  );
}

export default GamesLandingPage;
