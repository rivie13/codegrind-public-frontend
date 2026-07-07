import {
  Badge,
  Box,
  Button,
  HStack,
  ListItem,
  SimpleGrid,
  Stack,
  Text,
  UnorderedList,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import PageTemplate from '../../components/layout/PageTemplate';
import PageSeo from '../../components/seo/PageSeo';
import BottomBannerAd from '../../components/ads/BottomBannerAd';
import TopBannerAd from '../../components/ads/TopBannerAd';
import RetroPageShell, { RetroInset, RetroPanel } from '../../components/retro/RetroPageShell';
import adSlots from '../../config/adSlots';
import { useAuth } from '../../contexts/AuthContext';
import { useGuestProgressCtx } from '../../contexts/GuestProgressProvider';

const LANGUAGE_CARDS = [
  {
    label: 'Python',
    accent: 'var(--cg-accent-green)',
    badgeBg: 'rgba(36, 106, 42, 0.14)',
    badgeColor: 'var(--cg-accent-green)',
    hoverBg: 'rgba(36, 106, 42, 0.12)',
    pathId: 'python-path',
    path: '/learning/python-path',
    desc: 'The most beginner-friendly language. Great first pick if you have zero coding experience.',
    isBeta: false,
  },
  {
    label: 'JavaScript',
    accent: 'var(--cg-accent-amber)',
    badgeBg: 'rgba(118, 81, 0, 0.14)',
    badgeColor: 'var(--cg-accent-amber)',
    hoverBg: 'rgba(118, 81, 0, 0.12)',
    pathId: 'javascript-path',
    path: '/learning/javascript-path',
    desc: 'The language of the web. Every interactive site you have used runs on JavaScript.',
    isBeta: true,
  },
  {
    label: 'Java',
    accent: 'var(--cg-accent-red)',
    badgeBg: 'rgba(139, 31, 31, 0.14)',
    badgeColor: 'var(--cg-accent-red)',
    hoverBg: 'rgba(139, 31, 31, 0.12)',
    pathId: 'java-path',
    path: '/learning/java-path',
    desc: 'Widely used in enterprise, Android, and CS courses. Strict types teach good habits early.',
    isBeta: true,
  },
];

function LearningLandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const guest = useGuestProgressCtx();
  const selectedTrialTrack = guest?.selectedTrialTrack || guest?.progress?.pathChoice || null;
  const selectedTrialLearningPath =
    guest?.selectedTrialLearningPath || guest?.progress?.trialLearningPath || null;

  const handleStartLearning = (card) => {
    if (isAuthenticated) {
      navigate(card.path);
      return;
    }

    if (selectedTrialTrack === 'pro') {
      navigate('/games/clusters');
      return;
    }

    if (selectedTrialLearningPath && selectedTrialLearningPath !== card.pathId) {
      navigate(`/learning/${selectedTrialLearningPath}`);
      return;
    }

    guest?.recordPathChoice?.('beginner');
    guest?.recordTrialLearningPath?.(card.pathId);
    navigate(card.path);
  };

  return (
    <PageTemplate showGiphyBackground>
      <PageSeo
        title="Learn to Code with Interactive Learning Paths"
        description="Start learning to code with CodeGrind's interactive learning paths for Python, JavaScript and Java: short lessons, real coding exercises, an AI assistant you control, and games that reinforce every concept."
        path="/learning"
        keywords="learn to code, coding learning path, python for beginners, javascript beginner, java beginner, gamified coding, coding game for beginners"
      />
      <RetroPageShell
        mainMaxW="container.lg"
        heroFileLabel="learning.exe"
        heroTitle="Choose Your Language"
        heroSubtitle="A fast learning loop: pick a language, work through short lessons, solve real problems in the editor, and use AI as a tool you verify instead of a black box. Module 0 stays open to guests so you can start immediately."
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
          fileLabel="paths.ini"
          title="Learning Path Catalog"
          subtitle="Guest trials lock onto the first language you choose, while signed-in users can move freely between paths."
        >
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 4, md: 5 }}>
            {LANGUAGE_CARDS.map((card) => {
              const isGuestLanguageLocked =
                !isAuthenticated &&
                Boolean(selectedTrialLearningPath) &&
                selectedTrialLearningPath !== card.pathId;
              const isGuestLanguageSelected =
                !isAuthenticated && selectedTrialLearningPath === card.pathId;
              let ctaLabel = 'Start learning';
              if (isGuestLanguageLocked) ctaLabel = 'Locked in guest trial';
              if (isGuestLanguageSelected) ctaLabel = 'Continue trial';

              return (
                <RetroInset
                  key={card.label}
                  p={{ base: 4, md: 5 }}
                  display="flex"
                  flexDirection="column"
                  gap={4}
                  minH="100%"
                  opacity={isGuestLanguageLocked ? 0.64 : 1}
                  transition="background 120ms ease, transform 120ms ease"
                  _hover={
                    isGuestLanguageLocked
                      ? undefined
                      : {
                          bg: card.hoverBg,
                          transform: 'translate(-1px, -1px)',
                        }
                  }
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
                    {isGuestLanguageSelected ? (
                      <Badge bg={card.badgeBg} color={card.badgeColor}>
                        Guest trial
                      </Badge>
                    ) : card.isBeta ? (
                      <Badge bg={card.badgeBg} color={card.badgeColor}>
                        Beta
                      </Badge>
                    ) : null}
                  </HStack>

                  <Text color="var(--cg-text)" fontSize="sm" lineHeight="1.7" flex="1">
                    {card.desc}
                  </Text>

                  <Button
                    alignSelf="flex-start"
                    color={card.accent}
                    onClick={() => handleStartLearning(card)}
                  >
                    {ctaLabel}
                  </Button>
                </RetroInset>
              );
            })}
          </SimpleGrid>
        </RetroPanel>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 6, md: 8 }}>
          <RetroPanel fileLabel="overview.txt" title="What You'll Experience">
            <UnorderedList spacing={3} color="var(--cg-text)" fontSize="sm" lineHeight="1.7" ml={4}>
              <ListItem>
                Quick lessons that explain one idea at a time without wasting motion.
              </ListItem>
              <ListItem>Micro-challenges in a real code editor with immediate feedback.</ListItem>
              <ListItem>
                AI help you can interrogate, test, and verify instead of blindly trust.
              </ListItem>
              <ListItem>Games and side activities that reinforce the exact same concepts.</ListItem>
              <ListItem>
                Capstone checkpoints that prove the skill transfers to real problems.
              </ListItem>
            </UnorderedList>
          </RetroPanel>

          <RetroPanel fileLabel="progress.log" title="Progress That Feels Real">
            <UnorderedList spacing={3} color="var(--cg-text)" fontSize="sm" lineHeight="1.7" ml={4}>
              <ListItem>Branch paths stay visible so you always know what is next.</ListItem>
              <ListItem>Finish all branch tracks to unlock the checkpoints behind them.</ListItem>
              <ListItem>Clear the final module to open the capstone challenge.</ListItem>
            </UnorderedList>
          </RetroPanel>
        </SimpleGrid>

        <RetroPanel
          fileLabel="next-steps.bat"
          title="Keep Moving"
          subtitle="Pick up data packets, return to the games hub, or go straight to the interview-style problem bank."
        >
          <Stack direction={{ base: 'column', md: 'row' }} spacing={{ base: 3, md: 4 }}>
            <Button as={RouterLink} to="/store" color="var(--cg-accent-green)">
              Open data packet store
            </Button>
            <Button as={RouterLink} to="/games" color="var(--cg-accent-blue)">
              Back to games
            </Button>
            <Button as={RouterLink} to="/problems" color="var(--cg-accent-red)">
              Go to problem list
            </Button>
          </Stack>
        </RetroPanel>

        <RetroPanel
          fileLabel="advanced-users.txt"
          title="Already Have CS / DSA Experience?"
          subtitle="If you already know the fundamentals, the interview problem bank is the faster starting point. The learning path is tuned for people building their first solid foundation."
        >
          <Button as={RouterLink} to="/problems" color="var(--cg-accent-red)">
            Go to problem list
          </Button>
        </RetroPanel>
      </RetroPageShell>
    </PageTemplate>
  );
}

export default LearningLandingPage;
