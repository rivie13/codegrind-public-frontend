import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Progress,
  Select,
  SimpleGrid,
  Spinner,
  Text,
  Tooltip,
  VStack,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  useDisclosure,
} from '@chakra-ui/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChallengeModal from '../../components/modals/ChallengeModal';
import PageTemplate from '../../components/layout/PageTemplate';
import BottomBannerAd from '../../components/ads/BottomBannerAd';
import SidebarAd from '../../components/ads/SidebarAd';
import TopBannerAd from '../../components/ads/TopBannerAd';
import adSlots from '../../config/adSlots';
import { useAuth } from '../../contexts/AuthContext';
import INTERVIEW_CHALLENGE_SETS, { DEFAULT_SET_ID } from '../../data/interviewChallengeSets';
import { api } from '../../services/api';
import { normalizeProblemDifficulty } from '../../utils/problems/difficultyConfig';
import logger from '../../utils/core/logger';

const NODE_SIZE = 48;
const MAP_COLUMNS = 6;
const MAP_COL_WIDTH = 140;
const MAP_ROW_HEIGHT = 120;
const CHALLENGE_BG_GIF = 'https://media.giphy.com/media/dVcGWrQfYO3K6UYKF0/giphy.gif';
const UI_FONT_FAMILY = "'Tahoma', 'MS Sans Serif', sans-serif";

const RETRO_PANEL_PROPS = {
  bg: '#d4d0c8',
  borderRadius: '0',
  border: '1px solid #7f7f7f',
  boxShadow: 'var(--cg-window-outset)',
};

const RETRO_FIELD_PROPS = {
  bg: '#ffffff',
  border: '2px solid #7f7f7f',
  borderRadius: '0',
  color: '#1f2430',
  fontFamily: UI_FONT_FAMILY,
  boxShadow: 'var(--cg-window-inset)',
  _hover: { borderColor: '#5d636e' },
  _focusVisible: {
    borderColor: '#0a2c9a',
    boxShadow: 'var(--cg-window-inset)',
  },
};

const createRetroButtonProps = (toneColor) => ({
  bg: '#d4d0c8',
  color: toneColor,
  border: '1px solid #7f7f7f',
  borderRadius: '0',
  boxShadow: 'var(--cg-window-outset)',
  fontFamily: UI_FONT_FAMILY,
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  _hover: { bg: '#efebe7', color: toneColor },
  _active: {
    boxShadow: 'var(--cg-window-inset)',
    transform: 'translateY(1px)',
  },
});

const formatTime = (timeSeconds) => {
  if (!timeSeconds || Number.isNaN(timeSeconds)) return '—';
  const minutes = Math.floor(timeSeconds / 60);
  const seconds = Math.floor(timeSeconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const getProblemId = (problem) => {
  const id = parseInt(
    problem?.displayNumber || problem?.questionId || problem?.questionFrontendId || problem?.id,
    10
  );
  return Number.isNaN(id) ? null : id;
};

const getScoreLookupId = (problem) => {
  const isAIProblem = problem?.source === 'AI' || problem?.isAIProblem;
  const rawId = isAIProblem
    ? problem?.displayNumber || problem?.questionId || problem?.questionFrontendId || problem?.id
    : problem?.questionId || problem?.questionFrontendId || problem?.displayNumber || problem?.id;
  const id = parseInt(rawId, 10);
  return Number.isNaN(id) ? null : id;
};

const chunkArray = (items, size) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const getDifficultyColor = (difficulty) => {
  const normalized = normalizeProblemDifficulty(difficulty);
  if (normalized === 'EASY') return '#00FF8C';
  if (normalized === 'MEDIUM') return '#FFCC00';
  return '#FF4D4D';
};

const ChallengeMap = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const popoverPortalRef = useRef(null);
  const [selectedSetId, setSelectedSetId] = useState(DEFAULT_SET_ID);
  const [setStatus, setSetStatus] = useState({});
  const [problems, setProblems] = useState([]);
  const [missingCount, setMissingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState({});
  const [towerDefenseScores, setTowerDefenseScores] = useState({});
  const [selectedProblem, setSelectedProblem] = useState(null);
  const towerDefenseDifficulty = 'EASY';
  const [mapPage, setMapPage] = useState(1);
  const [mapPageSize, setMapPageSize] = useState(60);
  const [mapTotalPages, setMapTotalPages] = useState(1);
  const [mapTotalCount, setMapTotalCount] = useState(0);

  const availableSets = useMemo(
    () => INTERVIEW_CHALLENGE_SETS.filter((set) => set.enabled !== false),
    []
  );

  const selectedSet = useMemo(
    () => availableSets.find((set) => set.id === selectedSetId) || availableSets[0],
    [availableSets, selectedSetId]
  );

  useEffect(() => {
    if (typeof document !== 'undefined') {
      popoverPortalRef.current = document.body;
    }
  }, []);

  useEffect(() => {
    const checkSetAvailability = async () => {
      const statusMap = {};
      for (const set of availableSets) {
        if (set.type === 'top-n') {
          statusMap[set.id] = { available: true, missingCount: 0 };
          continue;
        }

        if (!set.slugs?.length) {
          statusMap[set.id] = { available: false, missingCount: 0 };
          continue;
        }

        try {
          const response = await api.problems.lookupBySlugs(set.slugs);
          statusMap[set.id] = {
            available: (response.missing || []).length === 0,
            missingCount: (response.missing || []).length,
          };
        } catch (error) {
          logger.error('Failed to verify challenge set availability:');
          logger.debug(error.stack);
          statusMap[set.id] = { available: false, missingCount: set.slugs.length };
        }
      }
      setSetStatus(statusMap);
    };

    checkSetAvailability();
  }, [availableSets]);

  useEffect(() => {
    setMapPage(1);
  }, [selectedSetId]);

  useEffect(() => {
    const fetchProblems = async () => {
      if (!selectedSet) return;
      setLoading(true);
      setMissingCount(0);
      setProblems([]);

      try {
        if (selectedSet.type === 'top-n') {
          const isAiSet = selectedSet.source === 'AI';
          const response = isAiSet
            ? await api.aiProblems.getAll('', mapPage, mapPageSize)
            : await api.problems.getAll('', mapPage, mapPageSize);
          const sorted = (response.questions || []).sort((a, b) => {
            if (isAiSet) {
              const aId = a.displayNumber ?? a.id ?? 0;
              const bId = b.displayNumber ?? b.id ?? 0;
              return aId - bId;
            }

            const aId = parseInt(a.questionId, 10);
            const bId = parseInt(b.questionId, 10);
            if (Number.isNaN(aId) || Number.isNaN(bId)) {
              return a.title.localeCompare(b.title);
            }
            return aId - bId;
          });

          const limit = selectedSet.limit || response.total || sorted.length;
          const cappedTotal = Math.min(response.total || 0, limit);
          const totalPages = Math.max(1, Math.ceil(cappedTotal / mapPageSize));

          setProblems(sorted);
          setMapTotalPages(totalPages);
          setMapTotalCount(cappedTotal);
          if (mapPage > totalPages) {
            setMapPage(totalPages);
          }
        } else {
          const response = await api.problems.lookupBySlugs(selectedSet.slugs);
          const problemMap = new Map(
            (response.problems || []).map((problem) => [problem.titleSlug, problem])
          );
          const ordered = selectedSet.slugs.map((slug) => problemMap.get(slug)).filter(Boolean);

          setMissingCount((response.missing || []).length);
          setProblems(ordered);
          setMapTotalPages(1);
          setMapTotalCount(ordered.length);
        }
      } catch (error) {
        logger.error('Failed to load challenge set problems:');
        logger.debug(error.stack);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, [selectedSet, mapPage, mapPageSize]);

  useEffect(() => {
    const fetchScores = async () => {
      if (!user?.id || problems.length === 0) return;

      const problemType = selectedSet?.source === 'AI' ? 'AI' : 'CODEGRIND';

      const ids = problems.map(getScoreLookupId).filter((id) => id !== null);

      if (ids.length === 0) return;

      try {
        const scoreChunks = chunkArray(ids, 200);
        const allScores = {};
        const allTdScores = {};

        for (const chunk of scoreChunks) {
          const [regularResponse, tdResponse] = await Promise.all([
            api.scores.getBulk(user.id, chunk, problemType),
            api.towerDefense.getScoresBulk(user.id, chunk, problemType),
          ]);

          Object.assign(allScores, regularResponse?.scores || {});
          Object.assign(allTdScores, tdResponse?.scores || {});
        }

        setScores(allScores);
        setTowerDefenseScores(allTdScores);
      } catch (error) {
        logger.error('Failed to load challenge map scores:');
        logger.debug(error.stack);
      }
    };

    fetchScores();
  }, [user?.id, problems, selectedSet?.source]);

  const nodes = useMemo(() => {
    return problems.map((problem, index) => {
      const row = Math.floor(index / MAP_COLUMNS);
      const colIndex = index % MAP_COLUMNS;
      const col = row % 2 === 0 ? colIndex : MAP_COLUMNS - 1 - colIndex;
      const x = col * MAP_COL_WIDTH;
      const y = row * MAP_ROW_HEIGHT;
      const scoreLookupId = getScoreLookupId(problem);
      const regularScore = scoreLookupId ? scores[scoreLookupId] : null;
      const tdScore = scoreLookupId ? towerDefenseScores[scoreLookupId] : null;
      const completed = (regularScore?.highScore || 0) > 0 || (tdScore?.score || 0) > 0;

      return {
        problem,
        x,
        y,
        completed,
        regularScore,
        tdScore,
      };
    });
  }, [problems, scores, towerDefenseScores]);

  const mapSize = useMemo(() => {
    const rows = Math.ceil(nodes.length / MAP_COLUMNS) || 1;
    return {
      width: MAP_COLUMNS * MAP_COL_WIDTH,
      height: rows * MAP_ROW_HEIGHT,
    };
  }, [nodes.length]);

  const completedCount = useMemo(() => nodes.filter((node) => node.completed).length, [nodes]);

  const totalNodeCount = useMemo(() => {
    if (selectedSet?.type === 'top-n') {
      return mapTotalCount || nodes.length;
    }
    return nodes.length;
  }, [mapTotalCount, nodes.length, selectedSet?.type]);

  const handleNavigate = (problem, mode, challenges = []) => {
    navigate(`/problems/${problem.titleSlug}`, {
      state: {
        problem,
        mode,
        titleSlug: problem.titleSlug,
        challenges,
      },
    });
  };

  const handleTowerDefenseNavigate = (problem) => {
    navigate(`/games/tower-defense/${problem.titleSlug}`, {
      state: {
        towerDefenseDifficulty: towerDefenseDifficulty,
      },
    });
  };

  return (
    <PageTemplate showGiphyBackground>
      <Box width="100%" maxWidth="728px" mx="auto" mt={4} mb={6}>
        <TopBannerAd slotId={adSlots.gamesLanding.top} />
      </Box>

      <Box
        width="100%"
        display="flex"
        flexDirection={{ base: 'column', lg: 'row' }}
        position="relative"
        _before={{
          content: '""',
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at top, rgba(0, 255, 255, 0.12), transparent 55%), radial-gradient(circle at 30% 40%, rgba(255, 0, 222, 0.08), transparent 60%)',
          pointerEvents: 'none',
        }}
      >
        <Box
          width={{ base: '100%', lg: '250px' }}
          mr={{ base: 0, lg: 6 }}
          mb={{ base: 6, lg: 0 }}
          display={{ base: 'none', lg: 'block' }}
        >
          <SidebarAd slotId={adSlots.gamesLanding.sidebar} />
        </Box>

        <Box flex="1">
          <Container maxW="container.xl" pb={8}>
            <VStack spacing={8} align="stretch">
              <Box textAlign="center">
                <Heading
                  size="2xl"
                  bgGradient="linear(to-r, #00ff8c, #00FFFF)"
                  bgClip="text"
                  fontFamily="'Orbitron', sans-serif"
                  textShadow="0 0 10px rgba(0, 255, 255, 0.3)"
                >
                  PROBLEM MAP
                </Heading>
                <Text color="gray.300" mt={3} fontFamily="monospace">
                  Plot your route through curated problem sets. Track progress, chase highscores,
                  and breach every node.
                </Text>
              </Box>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <Box p={5} {...RETRO_PANEL_PROPS}>
                  <Text color="#0a2c9a" fontFamily={UI_FONT_FAMILY} mb={3} fontWeight="700">
                    ACTIVE SET
                  </Text>
                  <Select
                    value={selectedSetId}
                    onChange={(e) => setSelectedSetId(e.target.value)}
                    {...RETRO_FIELD_PROPS}
                    sx={{
                      option: {
                        background: '#ffffff',
                        color: '#1f2430',
                      },
                    }}
                  >
                    {availableSets.map((set) => {
                      const status = setStatus[set.id];
                      const isUnavailable = status && status.available === false;
                      return (
                        <option key={set.id} value={set.id} disabled={isUnavailable}>
                          {set.name}
                          {isUnavailable ? ' (missing data)' : ''}
                        </option>
                      );
                    })}
                  </Select>
                  {selectedSet?.description && (
                    <Text color="#4f5665" fontSize="sm" mt={3} fontFamily={UI_FONT_FAMILY}>
                      {selectedSet.description}
                    </Text>
                  )}
                  {missingCount > 0 && (
                    <Text color="#7d1d1d" fontSize="sm" mt={2} fontFamily={UI_FONT_FAMILY}>
                      Missing {missingCount} problems from this set.
                    </Text>
                  )}
                </Box>

                <Box
                  p={5}
                  bg="#0f1012"
                  borderRadius="lg"
                  border="1px solid #2b2b2b"
                  boxShadow="0 0 20px rgba(0, 255, 140, 0.2)"
                >
                  <Text color="#00FF8C" fontFamily="monospace" mb={3}>
                    PROGRESS
                  </Text>
                  <Text color="white" fontSize="sm" mb={2} fontFamily="monospace">
                    {completedCount} / {totalNodeCount} nodes breached
                  </Text>
                  <Progress
                    value={totalNodeCount ? (completedCount / totalNodeCount) * 100 : 0}
                    size="sm"
                    borderRadius="full"
                    bg="rgba(0, 255, 140, 0.1)"
                    colorScheme="green"
                  />
                </Box>
              </SimpleGrid>

              <Box
                bg="#0b0d10"
                borderRadius="lg"
                border="1px solid #1d1f24"
                boxShadow="inset 0 0 40px rgba(0, 255, 255, 0.08)"
                overflow="auto"
                position="relative"
                minH="300px"
                p={6}
                _before={{
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  opacity: 0.22,
                  backgroundImage: `linear-gradient(180deg, rgba(3, 3, 8, 0.6), rgba(3, 3, 8, 0.92)), url("${CHALLENGE_BG_GIF}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  pointerEvents: 'none',
                }}
              >
                {loading ? (
                  <Flex align="center" justify="center" minH="240px" direction="column" gap={3}>
                    <Spinner color="#00FFFF" />
                    <Text color="gray.400" fontFamily="monospace">
                      Loading challenge map...
                    </Text>
                  </Flex>
                ) : (
                  <Box position="relative" width={mapSize.width} height={mapSize.height}>
                    <Box
                      as="svg"
                      position="absolute"
                      top={0}
                      left={0}
                      width={mapSize.width}
                      height={mapSize.height}
                      pointerEvents="none"
                    >
                      {nodes.map((node, index) => {
                        if (index === 0) return null;
                        const prev = nodes[index - 1];
                        const x1 = prev.x + NODE_SIZE / 2;
                        const y1 = prev.y + NODE_SIZE / 2;
                        const x2 = node.x + NODE_SIZE / 2;
                        const y2 = node.y + NODE_SIZE / 2;
                        return (
                          <line
                            key={`link-${index}`}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="rgba(0, 255, 255, 0.3)"
                            strokeWidth="2"
                          />
                        );
                      })}
                    </Box>

                    {nodes.map((node, index) => {
                      const difficultyColor = getDifficultyColor(node.problem.difficulty);
                      const problemId = getProblemId(node.problem);
                      const regularScore = node.regularScore || {};
                      const tdScore = node.tdScore || {};
                      const nodeLabel = problemId ? `#${problemId}` : `N${index + 1}`;

                      return (
                        <Popover
                          key={node.problem.titleSlug}
                          trigger="hover"
                          placement="top"
                          openDelay={200}
                          strategy="fixed"
                          portalProps={{ containerRef: popoverPortalRef }}
                        >
                          <PopoverTrigger>
                            <Box
                              position="absolute"
                              top={node.y}
                              left={node.x}
                              width={`${NODE_SIZE}px`}
                              height={`${NODE_SIZE}px`}
                              borderRadius="full"
                              border={`2px solid ${difficultyColor}`}
                              bg={node.completed ? 'rgba(0, 255, 140, 0.2)' : 'rgba(10,10,12,0.8)'}
                              boxShadow={`0 0 12px ${node.completed ? 'rgba(0,255,140,0.6)' : 'rgba(0,255,255,0.2)'}`}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              fontFamily="monospace"
                              color={difficultyColor}
                              cursor="pointer"
                            >
                              <Text fontSize="xs">{nodeLabel}</Text>
                            </Box>
                          </PopoverTrigger>
                          <PopoverContent
                            bg="#0f1012"
                            borderColor="#2b2b2b"
                            color="white"
                            w="300px"
                            zIndex="tooltip"
                          >
                            <PopoverArrow bg="#0f1012" />
                            <PopoverHeader borderColor="#1f1f1f">
                              <HStack justify="space-between">
                                <Text fontFamily="'Orbitron', sans-serif" fontSize="sm">
                                  {node.problem.title}
                                </Text>
                                <Badge bg={difficultyColor} color="#0a0a0c" fontSize="0.6rem">
                                  {normalizeProblemDifficulty(node.problem.difficulty)}
                                </Badge>
                              </HStack>
                            </PopoverHeader>
                            <PopoverBody>
                              <VStack align="stretch" spacing={3}>
                                <Box>
                                  <Text fontSize="xs" color="gray.400" fontFamily="monospace">
                                    Regular Workspace
                                  </Text>
                                  <Text fontSize="sm" fontFamily="monospace">
                                    High Score: {regularScore.highScore ?? 0} · Best Time:{' '}
                                    {formatTime(regularScore.bestTime)}
                                  </Text>
                                </Box>
                                <Box>
                                  <Text fontSize="xs" color="gray.400" fontFamily="monospace">
                                    Tower Defense
                                  </Text>
                                  <Text fontSize="sm" fontFamily="monospace">
                                    High Score: {tdScore.score ?? 0} · Best Time:{' '}
                                    {formatTime(tdScore.bestTime)}
                                  </Text>
                                </Box>
                                <HStack spacing={2}>
                                  <Tooltip label="Practice mode">
                                    <Button
                                      size="xs"
                                      colorScheme="cyan"
                                      variant="outline"
                                      onClick={() => handleNavigate(node.problem, 'freeplay')}
                                    >
                                      Practice
                                    </Button>
                                  </Tooltip>
                                  <Tooltip label="Ranked mode">
                                    <Button
                                      size="xs"
                                      colorScheme="green"
                                      variant="outline"
                                      onClick={() => handleNavigate(node.problem, 'ranked')}
                                    >
                                      Ranked
                                    </Button>
                                  </Tooltip>
                                  <Tooltip label="Challenge mode">
                                    <Button
                                      size="xs"
                                      colorScheme="pink"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedProblem(node.problem);
                                        onOpen();
                                      }}
                                    >
                                      Challenge
                                    </Button>
                                  </Tooltip>
                                </HStack>
                                <Button
                                  size="xs"
                                  colorScheme="purple"
                                  variant="solid"
                                  onClick={() => handleTowerDefenseNavigate(node.problem)}
                                >
                                  Tower Defense
                                </Button>
                              </VStack>
                            </PopoverBody>
                          </PopoverContent>
                        </Popover>
                      );
                    })}
                  </Box>
                )}
              </Box>
              {selectedSet?.type === 'top-n' && (
                <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
                  <Text color="#4f5665" fontFamily={UI_FONT_FAMILY} fontSize="sm">
                    Page {mapPage} of {mapTotalPages} · {mapTotalCount} total nodes
                  </Text>
                  <HStack spacing={3}>
                    <Button
                      size="sm"
                      {...createRetroButtonProps('#0a2c9a')}
                      isDisabled={mapPage <= 1}
                      onClick={() => setMapPage((prev) => Math.max(1, prev - 1))}
                    >
                      Prev
                    </Button>
                    <Select
                      value={mapPageSize}
                      onChange={(e) => setMapPageSize(Number(e.target.value))}
                      {...RETRO_FIELD_PROPS}
                      w="120px"
                      sx={{
                        option: {
                          background: '#ffffff',
                          color: '#1f2430',
                        },
                      }}
                    >
                      <option value={30}>30 nodes</option>
                      <option value={60}>60 nodes</option>
                      <option value={90}>90 nodes</option>
                    </Select>
                    <Button
                      size="sm"
                      {...createRetroButtonProps('#0a2c9a')}
                      isDisabled={mapPage >= mapTotalPages}
                      onClick={() => setMapPage((prev) => Math.min(mapTotalPages, prev + 1))}
                    >
                      Next
                    </Button>
                  </HStack>
                </Flex>
              )}
            </VStack>
          </Container>
        </Box>

        <Box
          width={{ base: '100%', lg: '250px' }}
          ml={{ base: 0, lg: 6 }}
          mt={{ base: 6, lg: 0 }}
          display={{ base: 'none', lg: 'block' }}
        >
          <SidebarAd slotId={adSlots.gamesLanding.sidebar} />
        </Box>
      </Box>

      <Box width="100%" maxWidth="728px" mx="auto" mt={6} mb={10} pb={10}>
        <BottomBannerAd slotId={adSlots.gamesLanding.bottom} />
      </Box>

      <ChallengeModal
        isOpen={isOpen}
        onClose={onClose}
        problem={selectedProblem}
        onConfirm={(challenges) => {
          if (!selectedProblem) return;
          handleNavigate(selectedProblem, 'challenge', challenges);
          onClose();
        }}
      />
    </PageTemplate>
  );
};

export default ChallengeMap;
