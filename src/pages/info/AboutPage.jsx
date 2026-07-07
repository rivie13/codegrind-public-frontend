import {
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Grid,
  Heading,
  Icon,
  Image,
  Link,
  ListItem,
  Text,
  UnorderedList,
  VStack,
} from '@chakra-ui/react';
import {
  FaBolt,
  FaBrain,
  FaChartLine,
  FaCode,
  FaDiscord,
  FaGraduationCap,
  FaMagic,
  FaRobot,
  FaShieldAlt,
  FaTrophy,
} from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import BottomBannerAd from '../../components/ads/BottomBannerAd';
import SidebarAd from '../../components/ads/SidebarAd';
import TopBannerAd from '../../components/ads/TopBannerAd';
import BugReportButton from '../../components/feedback/BugReportButton';
import PageTemplate from '../../components/layout/PageTemplate';
import PageSeo from '../../components/seo/PageSeo';
import adSlots from '../../config/adSlots';
import {
  PORT_MERIDIAN_CREDIT_REGISTRY,
  PORT_MERIDIAN_CREDIT_SCOPE,
  PORT_MERIDIAN_CREDIT_STATUS,
  PORT_MERIDIAN_CREDIT_SUMMARY,
} from '../../data/portMeridianCredits';
import getAssetUrl from '../../utils/assets/assetUrl';

const DISCORD_INVITE_URL = 'https://discord.gg/6NvX2Q8raT';

const learningDemoGif = getAssetUrl('/images/Learning_Demo_GIF_Edited.gif');
const problemWorkspaceImage = getAssetUrl('/images/ProblemWorkspace.png');
const aiProblemGenerationGif = getAssetUrl('/images/AI_Problem_Generation_GIF_Edited.gif');
const towerDefenseGif = getAssetUrl('/images/TowerDefense_V2_GIF_Edited.gif');
const towerDefenseGameplayGif = getAssetUrl('/images/TowerDefense_V2_Gameplay_Clip_GIF_Edited.gif');

const bodyTextProps = {
  color: 'var(--cg-text)',
  fontFamily: 'var(--cg-font-retro-display)',
  fontSize: { base: 'sm', md: 'md' },
  lineHeight: '1.75',
};

const mutedTextProps = {
  color: 'var(--cg-muted)',
  fontFamily: 'var(--cg-font-retro-display)',
  fontSize: { base: 'sm', md: 'md' },
  lineHeight: '1.75',
};

const listProps = (accent) => ({
  spacing: 2,
  pl: 5,
  mb: 4,
  color: 'var(--cg-text)',
  fontFamily: 'var(--cg-font-retro-display)',
  fontSize: { base: 'sm', md: 'md' },
  sx: { '& li::marker': { color: accent } },
});

const getActionButtonProps = (accent) => ({
  bg: 'var(--cg-window-face)',
  color: accent,
  border: '2px solid var(--cg-window-shadow)',
  boxShadow: 'var(--cg-window-outset)',
  _hover: {
    bg: 'rgba(255,255,255,0.18)',
  },
  _active: {
    boxShadow: 'var(--cg-window-inset)',
  },
  size: 'md',
  width: { base: '100%', sm: 'auto' },
  minH: '44px',
  fontSize: { base: 'sm', md: 'md' },
  px: { base: 5, md: 6 },
});

const CreditStatusChip = ({ status }) => {
  const statusMeta = PORT_MERIDIAN_CREDIT_STATUS[status] || { label: status };
  const isActive = status === 'active';

  return (
    <Box
      as="span"
      px={2}
      py={1}
      bg={isActive ? 'var(--cg-accent-green)' : 'var(--cg-window-face)'}
      color={isActive ? '#05190d' : 'var(--cg-link)'}
      border="1px solid var(--cg-window-shadow)"
      boxShadow="var(--cg-window-outset)"
      fontFamily="var(--cg-font-retro-display)"
      fontSize="10px"
      fontWeight="700"
      letterSpacing="0.06em"
      lineHeight="1"
      textTransform="uppercase"
    >
      {statusMeta.label}
    </Box>
  );
};

const PortMeridianCreditCard = ({ entry }) => (
  <Box
    p={{ base: 4, md: 5 }}
    bg="var(--cg-panel-shell)"
    border="1px solid var(--cg-window-shadow)"
    boxShadow="var(--cg-window-inset)"
    h="100%"
  >
    <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={3} mb={3}>
      <Box>
        <Heading
          as="h3"
          size="sm"
          color="var(--cg-text)"
          fontFamily="var(--cg-font-retro-display)"
          fontSize={{ base: 'md', md: 'lg' }}
          mb={1}
        >
          {entry.creator}
        </Heading>
        {entry.creatorUrl ? (
          <Link
            href={entry.creatorUrl}
            isExternal
            color="var(--cg-link)"
            fontFamily="var(--cg-font-retro-display)"
            fontSize="xs"
            _hover={{ textDecoration: 'underline' }}
          >
            Creator page
          </Link>
        ) : null}
      </Box>

      <Text
        color="var(--cg-muted)"
        fontFamily="var(--cg-font-retro-display)"
        fontSize="xs"
        textTransform="uppercase"
        whiteSpace="nowrap"
      >
        {entry.items.length} source{entry.items.length === 1 ? '' : 's'}
      </Text>
    </Flex>

    <VStack align="stretch" spacing={3}>
      {entry.items.map((item) => (
        <Box
          key={`${entry.id}-${item.title}`}
          p={3}
          bg="rgba(255,255,255,0.14)"
          border="1px solid var(--cg-window-shadow)"
          boxShadow="var(--cg-window-inset)"
        >
          <Flex justify="space-between" align="flex-start" gap={3} mb={2}>
            {item.url ? (
              <Link
                href={item.url}
                isExternal
                color="var(--cg-text)"
                fontFamily="var(--cg-font-retro-display)"
                fontSize="sm"
                fontWeight="700"
                lineHeight="1.5"
                _hover={{ color: 'var(--cg-link)', textDecoration: 'underline' }}
              >
                {item.title}
              </Link>
            ) : (
              <Text
                color="var(--cg-text)"
                fontFamily="var(--cg-font-retro-display)"
                fontSize="sm"
                fontWeight="700"
                lineHeight="1.5"
              >
                {item.title}
              </Text>
            )}
            <CreditStatusChip status={item.status} />
          </Flex>
          <Text {...mutedTextProps} fontSize="xs" mb={0}>
            {item.usage}
          </Text>
          {item.details?.length ? (
            <Text {...mutedTextProps} fontSize="xs" mt={2}>
              <b>Items used:</b> {item.details.join(', ')}
            </Text>
          ) : null}
        </Box>
      ))}
    </VStack>
  </Box>
);

const SectionWindow = ({ title, accent = 'var(--cg-link)', icon, children }) => (
  <Box className="cg-panel-window" overflow="hidden">
    <Box className="cg-titlebar" px={4} py={2}>
      <Flex align="center" gap={2}>
        {icon ? <Icon as={icon} boxSize={4} /> : null}
        <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase">
          {title}
        </Text>
      </Flex>
    </Box>

    <Box p={{ base: 4, md: 5 }} bg="rgba(255,255,255,0.14)" borderLeft={`4px solid ${accent}`}>
      {children}
    </Box>
  </Box>
);

const FeatureCard = ({ icon, title, description, accent }) => (
  <Box
    p={{ base: 4, md: 5 }}
    bg="var(--cg-panel-shell)"
    border="1px solid var(--cg-window-shadow)"
    boxShadow="var(--cg-window-inset)"
    borderLeft={`4px solid ${accent}`}
    h="100%"
  >
    <Icon as={icon} w={8} h={8} mb={4} color={accent} />
    <Heading
      size="md"
      mb={2}
      color={accent}
      fontFamily="var(--cg-font-retro-display)"
      fontSize={{ base: 'lg', md: 'xl' }}
    >
      {title}
    </Heading>
    <Text {...mutedTextProps}>{description}</Text>
  </Box>
);

const MediaFrame = ({ src, alt }) => (
  <Box
    bg="var(--cg-panel-shell)"
    border="2px solid var(--cg-window-shadow)"
    boxShadow="var(--cg-window-inset)"
    overflow="hidden"
    my={6}
  >
    <Image src={src} alt={alt} width="100%" height="100%" objectFit="cover" />
  </Box>
);

const AboutPage = () => {
  const features = [
    {
      icon: FaCode,
      title: 'Free Play Mode',
      accent: 'var(--cg-link)',
      description:
        'Solve coding problems at your own pace with no pressure. Perfect for learning concepts, experimenting with solutions, and practicing without affecting your stats.',
    },
    {
      icon: FaTrophy,
      title: 'Ranked Mode',
      accent: 'var(--cg-accent-green)',
      description:
        'Compete for high scores on the global leaderboard. Your score is calculated based on speed, memory usage, submissions, and AI assistance. Aim for the perfect 1000!',
    },
    {
      icon: FaBolt,
      title: 'Challenge Mode',
      accent: 'var(--cg-accent-amber)',
      description:
        'Push your limits with modifiers like Time Attack, Matrix Bomb effects, random character insertions, and AI restrictions. Earn bonus points for completing challenges!',
    },
    {
      icon: FaShieldAlt,
      title: 'Code Breach (Tower Defense)',
      accent: 'var(--cg-accent-red)',
      description:
        'A unique coding game where programming concepts become towers. Place Function, Object, Loop, and other code-based towers to defend against waves of digital threats!',
    },
    {
      icon: FaGraduationCap,
      title: 'Learning Paths',
      accent: 'var(--cg-accent-green)',
      description:
        'Structured, beginner-friendly courses that combine lessons, coding exercises, AI you can lean on or challenge yourself without, and games for reinforcement. Learn concepts, apply them with AI, and verify the results. Start with Python and progress at your own pace.',
    },
    {
      icon: FaMagic,
      title: 'AI Problem Generation',
      accent: 'var(--cg-link)',
      description:
        "Generate custom coding challenges using AI. Choose problem type, difficulty (1-10), language, and even a 'wackiness' level for creative twists on standard problems.",
    },
    {
      icon: FaRobot,
      title: 'AI Assistant',
      accent: 'var(--cg-accent-amber)',
      description:
        "Get hints, explanations, and guidance from our AI-powered chat assistant, then verify what it gives you. Learn to leverage AI effectively and catch its mistakes. Use as much or as little as you want. You're building real skills either way.",
    },
    {
      icon: FaChartLine,
      title: 'XP & Leveling System',
      accent: 'var(--cg-accent-green)',
      description:
        'Earn XP for solving problems, completing learning paths, and playing tower defense. Level up through ranks from Greenhorn to CodeGrind Champ!',
    },
    {
      icon: FaBrain,
      title: 'Achievements & Stats',
      accent: 'var(--cg-link)',
      description:
        'Track your progress with detailed submission history, success rates, coding streaks, best times, and unlock achievements for various milestones.',
    },
    {
      icon: FaDiscord,
      title: 'Discord Community',
      accent: 'var(--cg-accent-blue)',
      description:
        'Join our Discord server for daily challenges, tournaments, leaderboard announcements, and to connect with other coders. Link your account for exclusive perks!',
    },
  ];

  return (
    <PageTemplate title="What is CodeGrind?">
      <PageSeo
        title="About CodeGrind: The Platform Behind Code Breach"
        description="Learn what CodeGrind is: a coding platform where beginners build real programming skills, use AI with verification, and grow into DSA and interview prep through Code Breach, learning paths, and practice modes."
        path="/about"
        keywords="codegrind, code breach, tower defense coding game, learn coding with games, coding interview prep platform, coding tower defense, interview practice, gamified programming"
      />

      <Box width="100%" maxWidth="728px" mx="auto" mt={4} mb={6}>
        <TopBannerAd slotId={adSlots.generic.top} />
      </Box>

      <Box width="100%" display="flex" flexDirection={{ base: 'column', lg: 'row' }}>
        <Box
          width={{ base: '100%', lg: '250px' }}
          mr={{ base: 0, lg: 6 }}
          mb={{ base: 6, lg: 0 }}
          display={{ base: 'none', lg: 'block' }}
        >
          <SidebarAd slotId={adSlots.generic.sidebar} />
        </Box>

        <Box flex="1">
          <Container maxW="container.xl" px={{ base: 4, md: 6 }}>
            <VStack spacing={{ base: 8, md: 10 }} align="stretch">
              <Box className="cg-panel-window" overflow="hidden">
                <Box className="cg-titlebar" px={4} py={2}>
                  <Text
                    fontSize="xs"
                    fontWeight="700"
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                  >
                    about_codegrind.txt
                  </Text>
                </Box>

                <Box p={{ base: 4, md: 5 }} bg="rgba(255,255,255,0.14)">
                  <Flex
                    justify="space-between"
                    align={{ base: 'stretch', md: 'center' }}
                    gap={3}
                    flexDirection={{ base: 'column', md: 'row' }}
                    mb={4}
                  >
                    <Heading
                      as="h1"
                      fontFamily="var(--cg-font-retro-display)"
                      fontSize={{ base: '2xl', md: '3xl' }}
                      fontWeight="700"
                      color="var(--cg-text)"
                    >
                      What Is CodeGrind?
                    </Heading>
                    <BugReportButton
                      pageType="about"
                      pageContext={{ pageTitle: 'About CodeGrind' }}
                      buttonProps={{
                        size: 'sm',
                        bg: 'var(--cg-window-face)',
                        color: 'var(--cg-link)',
                        border: '2px solid var(--cg-window-shadow)',
                        boxShadow: 'var(--cg-window-outset)',
                        _hover: { bg: 'rgba(255,255,255,0.18)' },
                      }}
                    />
                  </Flex>

                  <Divider borderColor="var(--cg-window-dark)" mb={4} />

                  <Box
                    p={{ base: 4, md: 5 }}
                    bg="var(--cg-panel-shell)"
                    border="1px solid var(--cg-window-shadow)"
                    boxShadow="var(--cg-window-inset)"
                    mb={6}
                  >
                    <Text {...bodyTextProps} mb={4}>
                      CodeGrind is a coding platform built for the AI era. Learn the fundamentals,
                      use AI to build on what you know, and verify that it actually works. Whether
                      you're learning from scratch or prepping for interviews, you grow in both
                      coding ability and AI fluency. The two skills that matter most.
                    </Text>
                    <Text {...mutedTextProps}>
                      Solve original interview-style coding challenges in Free Play, Ranked, or
                      Challenge modes. Generate unlimited custom problems with AI. Play Code Breach,
                      a tower defense game where programming concepts become your weapons. Follow
                      structured Learning Paths to build skills from the ground up. Earn XP, level
                      up, unlock achievements, and connect with our Discord community for daily
                      challenges and tournaments.
                    </Text>
                  </Box>

                  <Flex
                    justify="center"
                    gap={{ base: 3, md: 4 }}
                    flexWrap="wrap"
                    direction={{ base: 'column', sm: 'row' }}
                    align="stretch"
                  >
                    <Button
                      as={RouterLink}
                      to="/problems"
                      {...getActionButtonProps('var(--cg-link)')}
                    >
                      Browse Problems
                    </Button>
                    <Button
                      as={RouterLink}
                      to="/games"
                      {...getActionButtonProps('var(--cg-accent-green)')}
                    >
                      Play Code Breach
                    </Button>
                    <Button
                      as={RouterLink}
                      to="/learning/python-path"
                      {...getActionButtonProps('var(--cg-accent-amber)')}
                    >
                      Start Learning
                    </Button>
                    <Button
                      as={Link}
                      href={DISCORD_INVITE_URL}
                      isExternal
                      leftIcon={<Icon as={FaDiscord} />}
                      {...getActionButtonProps('var(--cg-accent-blue)')}
                    >
                      Join Discord
                    </Button>
                  </Flex>
                </Box>
              </Box>

              <SectionWindow title="key_features.sys" accent="var(--cg-link)" icon={FaBolt}>
                <Grid
                  templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
                  gap={{ base: 4, md: 6 }}
                >
                  {features.map((feature) => (
                    <FeatureCard
                      key={feature.title}
                      icon={feature.icon}
                      title={feature.title}
                      description={feature.description}
                      accent={feature.accent}
                    />
                  ))}
                </Grid>
              </SectionWindow>

              <SectionWindow title="problem_workspace.txt" accent="var(--cg-link)" icon={FaCode}>
                <Text {...bodyTextProps} mb={4}>
                  The Problem Workspace is your coding environment. It features a three-panel layout
                  with the problem description, a syntax-highlighted code editor supporting Python,
                  JavaScript and Java, and an AI chat assistant.
                </Text>
                <Text {...mutedTextProps} mb={4}>
                  <b>Three Game Modes:</b>
                </Text>
                <UnorderedList {...listProps('var(--cg-link)')}>
                  <ListItem>
                    <b>Free Play:</b> Practice at your own pace with no scoring pressure. Perfect
                    for learning new concepts.
                  </ListItem>
                  <ListItem>
                    <b>Ranked:</b> Compete for high scores on the global leaderboard. Score is based
                    on speed, efficiency, and minimal AI usage.
                  </ListItem>
                  <ListItem>
                    <b>Challenge:</b> Enable modifiers like Time Attack, Matrix Bomb, random
                    character insertions, and AI restrictions for bonus points.
                  </ListItem>
                </UnorderedList>
                <MediaFrame src={problemWorkspaceImage} alt="Problem Workspace" />
              </SectionWindow>

              <SectionWindow
                title="scoring_system.cfg"
                accent="var(--cg-accent-green)"
                icon={FaTrophy}
              >
                <Text {...bodyTextProps} mb={4}>
                  In Ranked and Challenge modes, you start with a maximum score of{' '}
                  <b>1000 points</b> per problem. Your final score is calculated based on multiple
                  performance factors:
                </Text>
                <UnorderedList {...listProps('var(--cg-accent-green)')}>
                  <ListItem>
                    <b>Time Taken:</b> Faster solutions score higher. The timer for execution resets
                    if you fail a test case but not the one tracking your time to solve.
                  </ListItem>
                  <ListItem>
                    <b>Memory Usage:</b> More efficient memory usage means better scores.
                  </ListItem>
                  <ListItem>
                    <b>Submission Count:</b> Each failed submission reduces your score.
                  </ListItem>
                  <ListItem>
                    <b>Runtime Performance:</b> Optimized code execution earns bonus points.
                  </ListItem>
                  <ListItem>
                    <b>AI Assistance:</b> Using the AI chat reduces your score. The more you use it,
                    the bigger the deduction.
                  </ListItem>
                </UnorderedList>
                <Text {...mutedTextProps}>
                  <b>Challenge Mode Bonuses:</b> Enable modifiers like Time Attack, Matrix Bomb
                  effects, or No AI restrictions to earn bonus points on top of your base score.
                </Text>
              </SectionWindow>

              <SectionWindow
                title="code_breach_overview.map"
                accent="var(--cg-link)"
                icon={FaShieldAlt}
              >
                <Text {...bodyTextProps} mb={4}>
                  Code Breach is a tower defense game where programming concepts become your
                  weapons. Place towers representing Functions, Objects, Loops, Variables, and more
                  to defend against waves of digital threats.
                </Text>
                <Text {...mutedTextProps} mb={4}>
                  <b>How It Works:</b>
                </Text>
                <UnorderedList {...listProps('var(--cg-link)')}>
                  <ListItem>
                    <b>Place Towers:</b> Start by placing Function and Object towers to generate
                    your starter code.
                  </ListItem>
                  <ListItem>
                    <b>Code Synchronization:</b> Each tower you place generates corresponding code
                    in the editor or you can write code to generate tower suggestions that you can
                    buy. Bi-directional code synchronization.
                  </ListItem>
                  <ListItem>
                    <b>Defend Multiple Waves:</b> Survive increasingly difficult waves of enemies
                    (Basic, Fast, Tank, Boss types).
                  </ListItem>
                  <ListItem>
                    <b>Upgrade System:</b> Upgrade towers for increased damage, range, and special
                    abilities.
                  </ListItem>
                  <ListItem>
                    <b>Deployables:</b> Use special deployable items to turn the tide of battle in
                    your favor.
                  </ListItem>
                  <ListItem>
                    <b>Code Verification:</b> Before the final wave, solve a coding problem. Success
                    makes it easier, failure triggers endless nightmare mode.
                  </ListItem>
                  <ListItem>
                    <b>Endless Mode:</b> After the final wave, continue in endless mode to see how
                    long you can survive.
                  </ListItem>
                </UnorderedList>
                <Text {...mutedTextProps} mb={4}>
                  <b>Tower Types:</b> Function, Object, ForLoop, WhileLoop, IfCondition, Variable,
                  Return, TryCatch, Switch, Non-Code Generation towers, AI-Assist, each with unique
                  abilities.
                </Text>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6} my={2}>
                  <MediaFrame src={towerDefenseGameplayGif} alt="Tower Defense V2 gameplay" />
                  <MediaFrame src={towerDefenseGif} alt="Tower Defense V2 overview" />
                </Grid>
              </SectionWindow>

              <SectionWindow
                title="learning_paths.idx"
                accent="var(--cg-accent-green)"
                icon={FaGraduationCap}
              >
                <Text {...bodyTextProps} mb={4}>
                  Learning Paths are structured, beginner-friendly courses that guide you from zero
                  to confident coder. Each path combines interactive lessons, coding exercises, an
                  AI assistant to help or challenge yourself without, and tower defense missions for
                  hands-on reinforcement. You learn the concept, apply it with AI, and verify the
                  result. You grow in both coding ability and AI fluency.
                </Text>
                <Text {...mutedTextProps} mb={4}>
                  <b>Currently Available: Python Beginner Crash Course</b>
                </Text>
                <UnorderedList {...listProps('var(--cg-accent-green)')}>
                  <ListItem>
                    <b>Module Structure:</b> Each module has Tower → Learn → Final activities
                    (game-first!)
                  </ListItem>
                  <ListItem>
                    <b>Tower Nodes:</b> Tower defense missions that introduce the concept through
                    gameplay
                  </ListItem>
                  <ListItem>
                    <b>Learn Nodes:</b> Lessons explaining concepts with code examples and visuals
                  </ListItem>
                  <ListItem>
                    <b>Final Nodes:</b> Harder challenges that test your mastery
                  </ListItem>
                  <ListItem>
                    <b>Capstone:</b> A final tower defense mission solving a harder problem that
                    combines everything you've learned
                  </ListItem>
                </UnorderedList>
                <Text {...mutedTextProps} mb={4}>
                  <b>Modules:</b> Hello World → Variables → If/Else → For Loops → Lists/Arrays →
                  Returns → Capstone
                </Text>
                <MediaFrame src={learningDemoGif} alt="Learning Path demo" />
              </SectionWindow>

              <SectionWindow
                title="ai_problem_generation.exe"
                accent="var(--cg-link)"
                icon={FaMagic}
              >
                <Text {...bodyTextProps} mb={4}>
                  Never run out of problems to solve. Our AI-powered problem generator creates
                  unique coding challenges on demand, complete with test cases, examples,
                  constraints, and solutions.
                </Text>
                <Text {...mutedTextProps} mb={4}>
                  <b>Customization Options:</b>
                </Text>
                <UnorderedList {...listProps('var(--cg-link)')}>
                  <ListItem>
                    <b>Problem Type:</b> String manipulation, arrays, combinatorics, math, trees,
                    graphs, and more
                  </ListItem>
                  <ListItem>
                    <b>Difficulty:</b> Scale from 1 (beginner) to 10 (expert/graduate level)
                  </ListItem>
                  <ListItem>
                    <b>Language:</b> Python, JavaScript, and Java
                  </ListItem>
                  <ListItem>
                    <b>Wackiness:</b> From straightforward (1) to creative/quirky (10) problem
                    themes
                  </ListItem>
                  <ListItem>
                    <b>Additional Info:</b> Add custom requirements or constraints
                  </ListItem>
                </UnorderedList>
                <Text {...mutedTextProps} mb={4}>
                  Generated problems include complete test cases, expected outputs, starter code
                  templates, and a verified solution. You can save problems to your collection or
                  share them with others.
                </Text>
                <MediaFrame src={aiProblemGenerationGif} alt="AI problem generation" />
              </SectionWindow>

              <SectionWindow
                title="xp_and_leveling.dat"
                accent="var(--cg-accent-green)"
                icon={FaChartLine}
              >
                <Text {...bodyTextProps} mb={4}>
                  Earn XP for everything you do on CodeGrind. Solving problems, completing learning
                  path nodes, playing tower defense, and creating AI problems. Level up to unlock
                  new ranks and Discord roles.
                </Text>
                <Text {...mutedTextProps} mb={4}>
                  <b>XP Rewards:</b>
                </Text>
                <UnorderedList {...listProps('var(--cg-accent-green)')}>
                  <ListItem>
                    <b>Problem Solving:</b> 50 XP (Easy), 80 XP (Medium), 120 XP (Hard)
                  </ListItem>
                  <ListItem>
                    <b>Tower Defense:</b> 70 XP base per game
                  </ListItem>
                  <ListItem>
                    <b>AI Problem Creation:</b> 20 XP per problem
                  </ListItem>
                  <ListItem>
                    <b>Bonus XP:</b> First solve of the day, learning path milestones, and more
                  </ListItem>
                </UnorderedList>
                <Text {...mutedTextProps} mb={4}>
                  <b>Ranks (Discord Roles):</b>
                </Text>
                <UnorderedList {...listProps('var(--cg-accent-green)')}>
                  <ListItem>Level 0-2: Greenhorn</ListItem>
                  <ListItem>Level 3-7: Script Kiddie</ListItem>
                  <ListItem>Level 8-14: Debugger</ListItem>
                  <ListItem>Level 15-24: Stack Whisperer</ListItem>
                  <ListItem>Level 25-34: Code Alchemist</ListItem>
                  <ListItem>Level 35-49: Refactor Mage</ListItem>
                  <ListItem>Level 50-69: System Architect</ListItem>
                  <ListItem>Level 70+: CodeGrind Champ</ListItem>
                </UnorderedList>
              </SectionWindow>

              <SectionWindow
                title="discord_community.net"
                accent="var(--cg-accent-blue)"
                icon={FaDiscord}
              >
                <Text {...bodyTextProps} mb={4}>
                  Connect with the CodeGrind community on Discord. Link your account to sync your
                  level and rank, participate in daily challenges and tournaments, and get
                  announcements for new features.
                </Text>
                <Text {...mutedTextProps} mb={4}>
                  <b>Discord Features:</b>
                </Text>
                <UnorderedList {...listProps('var(--cg-accent-blue)')} mb={6}>
                  <ListItem>
                    <b>Account Linking:</b> Link your CodeGrind account to sync XP and get your rank
                    role
                  </ListItem>
                  <ListItem>
                    <b>Daily Challenges:</b> Get notified of daily coding challenges with special
                    rewards
                  </ListItem>
                  <ListItem>
                    <b>Tournaments:</b> Create and join tournaments with friends via Discord
                    commands
                  </ListItem>
                  <ListItem>
                    <b>Leaderboard Announcements:</b> Celebrate when you climb the ranks
                  </ListItem>
                  <ListItem>
                    <b>Community Support:</b> Get help, share solutions, and connect with other
                    coders
                  </ListItem>
                </UnorderedList>

                <Flex justify="center">
                  <Button
                    as={Link}
                    href={DISCORD_INVITE_URL}
                    isExternal
                    leftIcon={<Icon as={FaDiscord} />}
                    {...getActionButtonProps('var(--cg-accent-blue)')}
                  >
                    Join the CodeGrind Discord
                  </Button>
                </Flex>
              </SectionWindow>

              <SectionWindow
                title="system_status.sys"
                accent="var(--cg-accent-amber)"
                icon={FaBolt}
              >
                <Text {...bodyTextProps} mb={4}>
                  Want to check if all CodeGrind services are running smoothly? We provide a live,
                  real-time status page powered by UptimeRobot that monitors the frontend shell,
                  backend API gateway, database availability, and AI services.
                </Text>
                <Flex justify="center">
                  <Button
                    as={Link}
                    href="https://stats.uptimerobot.com/MYXleQpuCX"
                    isExternal
                    leftIcon={<Icon as={FaBolt} />}
                    {...getActionButtonProps('var(--cg-accent-amber)')}
                  >
                    View Live System Status
                  </Button>
                </Flex>
              </SectionWindow>

              <SectionWindow title="credits_registry.md" accent="var(--cg-link)" icon={FaBrain}>
                <Text {...bodyTextProps} mb={4}>
                  The Port Meridian city build and apartment terminal overhaul now use a shared
                  attribution registry so creator credit stays visible both here and inside the
                  apartment terminal in city mode.
                </Text>
                <Text {...mutedTextProps} mb={4}>
                  {PORT_MERIDIAN_CREDIT_SCOPE}
                </Text>

                <Grid templateColumns={{ base: '1fr', xl: 'repeat(2, 1fr)' }} gap={4} mb={6}>
                  {PORT_MERIDIAN_CREDIT_REGISTRY.map((entry) => (
                    <PortMeridianCreditCard key={entry.id} entry={entry} />
                  ))}
                </Grid>

                <Divider borderColor="var(--cg-window-dark)" mb={6} />

                <Heading
                  as="h3"
                  size="md"
                  mb={2}
                  color="var(--cg-accent-green)"
                  fontFamily="var(--cg-font-retro-display)"
                >
                  Existing platform audio attribution
                </Heading>
                <Text {...bodyTextProps} mb={4}>
                  We use high-quality sound effects and music to enhance the gaming experience. All
                  audio assets are either under Creative Commons 0 license, properly attributed as
                  required, or were generated using AI.
                </Text>

                <Heading
                  as="h3"
                  size="md"
                  mb={2}
                  color="var(--cg-accent-green)"
                  fontFamily="var(--cg-font-retro-display)"
                >
                  Sound Effects
                </Heading>
                <UnorderedList {...listProps('var(--cg-accent-green)')} mb={6}>
                  <ListItem>
                    <b>Wave Start:</b> Interface Blip by Breviceps
                  </ListItem>
                  <ListItem>
                    <b>All other sound effects:</b> AI generated using an mcp server created to
                    interact with the open source project BFXR
                  </ListItem>
                </UnorderedList>

                <Heading
                  as="h3"
                  size="md"
                  mb={2}
                  color="var(--cg-accent-green)"
                  fontFamily="var(--cg-font-retro-display)"
                >
                  Background Music
                </Heading>
                <UnorderedList {...listProps('var(--cg-accent-green)')} mb={4}>
                  <ListItem mt={3} fontWeight="bold" color="var(--cg-link)">
                    White Bat Audio by Karl Casey:
                  </ListItem>
                  <ListItem pl={4}>
                    <b>Dragged Across Concrete</b> - Karl Casey @ White Bat Audio
                  </ListItem>
                  <ListItem pl={4}>
                    <b>Sanctum</b> - Karl Casey @ White Bat Audio
                  </ListItem>
                  <ListItem pl={4}>
                    <b>Radiation Sickness</b> - Karl Casey @ White Bat Audio
                  </ListItem>
                  <ListItem pl={4}>
                    <b>Whistler</b> - Karl Casey @ White Bat Audio
                  </ListItem>
                  <ListItem pl={4}>
                    <b>Kryptos</b> - Karl Casey @ White Bat Audio
                  </ListItem>
                  <ListItem pl={4}>
                    <b>Dissent</b> - Karl Casey @ White Bat Audio
                  </ListItem>
                  <ListItem pl={4}>
                    <b>Additional Karl Casey tracks</b> - See Audio Attribution document
                  </ListItem>
                </UnorderedList>

                <Text
                  color="var(--cg-link)"
                  fontSize="sm"
                  mb={2}
                  fontFamily="var(--cg-font-retro-display)"
                  fontWeight="600"
                >
                  All music by Karl Casey is copyright safe to use with proper attribution to "Karl
                  Casey @ White Bat Audio"
                </Text>

                <Divider borderColor="var(--cg-window-dark)" my={6} />

                <Heading
                  as="h3"
                  size="md"
                  mb={2}
                  color="var(--cg-accent-green)"
                  fontFamily="var(--cg-font-retro-display)"
                >
                  Open Source Code Execution Engine Attribution
                </Heading>
                <Text {...bodyTextProps} mb={4}>
                  To enable local, secure, and completely free in-browser code execution for our user base, 
                  CodeGrind relies on the following incredible open-source projects:
                </Text>
                <UnorderedList {...listProps('var(--cg-accent-green)')} mb={6}>
                  <ListItem>
                    <b>Pyodide (Python):</b> Powered by WebAssembly (WASM), Pyodide brings a full Python 
                    scientific stack to the browser. Attributions and deep gratitude go to the Pyodide team 
                    and contributors for enabling client-side Python execution. Visit the{' '}
                    <Link href="https://pyodide.org" isExternal color="var(--cg-link)" _hover={{ textDecoration: 'underline' }}>
                      Pyodide Official Site
                    </Link>.
                  </ListItem>
                  <ListItem>
                    <b>CheerpJ (Java):</b> CheerpJ by Leaning Technologies is an execution engine for Java in the browser, 
                    allowing us to run the JVM and compile Java code locally using WebAssembly. Attributions and 
                    credits go to the Leaning Technologies team for their groundbreaking JVM virtualization. Learn more at the{' '}
                    <Link href="https://leaningtech.com/cheerpj/" isExternal color="var(--cg-link)" _hover={{ textDecoration: 'underline' }}>
                      CheerpJ Website
                    </Link>.
                  </ListItem>
                </UnorderedList>

                <Text {...bodyTextProps} fontSize="sm" mt={4}>
                  For complete attribution details, including links to original sources and license
                  information, please see our
                  <Text
                    as="a"
                    href="/audio/AUDIO_ATTRIBUTION.md"
                    target="_blank"
                    color="var(--cg-link)"
                    ml={1}
                    _hover={{ textDecoration: 'underline' }}
                  >
                    Audio Attribution
                  </Text>{' '}
                  document.
                </Text>
              </SectionWindow>
            </VStack>
          </Container>
        </Box>

        <Box
          width={{ base: '100%', lg: '250px' }}
          ml={{ base: 0, lg: 6 }}
          mt={{ base: 6, lg: 0 }}
          display={{ base: 'none', lg: 'block' }}
        >
          <SidebarAd slotId={adSlots.generic.sidebar} />
        </Box>
      </Box>

      <Box width="100%" maxWidth="728px" mx="auto" mt={6} mb={4} pb={12}>
        <BottomBannerAd slotId={adSlots.generic.bottom} />
      </Box>
    </PageTemplate>
  );
};

export default AboutPage;
