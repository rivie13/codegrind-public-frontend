import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Select,
  SimpleGrid,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomBannerAd from '../../components/ads/BottomBannerAd';
import SidebarAd from '../../components/ads/SidebarAd';
import TopBannerAd from '../../components/ads/TopBannerAd';
import RetroPageShell, { RetroInset, RetroPanel } from '../../components/retro/RetroPageShell';
import PaginationControls from '../../components/layout/PaginationControls';
import PageTemplate from '../../components/layout/PageTemplate';
import ChallengeModal from '../../components/modals/ChallengeModal';
import adSlots from '../../config/adSlots';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { trackUserContentEvent } from '../../services/userContentEventService';

//import logger from utils
import logger from '../../utils/core/logger';
import { CLASSIC_REFERENCE_SLUG_BY_CYBER_SLUG } from '../../data/classicReferenceSlugByCyberSlug';

const DIFFICULTY_TONES = {
  EASY: {
    color: 'var(--cg-accent-green)',
    bg: 'rgba(36, 106, 42, 0.16)',
  },
  MEDIUM: {
    color: 'var(--cg-accent-amber)',
    bg: 'rgba(118, 81, 0, 0.16)',
  },
  HARD: {
    color: 'var(--cg-accent-red)',
    bg: 'rgba(139, 31, 31, 0.16)',
  },
  DEFAULT: {
    color: 'var(--cg-link)',
    bg: 'rgba(10, 56, 154, 0.12)',
  },
};

const PAGINATION_BUTTON_STYLES = {
  base: {
    bg: 'var(--cg-window)',
    color: 'var(--cg-text)',
    border: '1px solid var(--cg-window-shadow)',
    boxShadow: 'var(--cg-window-outset)',
    size: 'sm',
    fontFamily: 'var(--cg-font-retro-display)',
    fontSize: 'xs',
    _hover: {
      bg: 'var(--cg-panel-shell)',
    },
  },
  active: {
    bg: 'var(--cg-window-face)',
    boxShadow: 'var(--cg-window-inset)',
  },
  disabled: {
    bg: 'var(--cg-window-face)',
    color: 'var(--cg-muted)',
    boxShadow: 'var(--cg-window-inset)',
    opacity: 1,
    cursor: 'not-allowed',
  },
};

function ProblemList() {
  const { isAuthenticated } = useAuth();
  const [difficulty, setDifficulty] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProblems, setTotalProblems] = useState(0);
  const trackedSurfaceKeyRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (trackedSurfaceKeyRef.current === 'problem_list') return;

    trackedSurfaceKeyRef.current = 'problem_list';
    void trackUserContentEvent('user_content_surface_opened', {
      area: 'interview',
      surface: 'problem_list',
      entrySource: 'direct',
    });
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        const response = await api.problems.getAll(difficulty, page, perPage, 'CODEGRIND');
        logger.info('Problems response:');
        setProblems(response.questions || []);
        setTotalPages(response.totalPages || 1);
        setTotalProblems(response.total || 0);
        setError(null);
      } catch (error) {
        logger.error('Error fetching problems:');
        logger.debug(error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, [difficulty, page, perPage]);

  useEffect(() => {
    // Reset to page 1 when perPage or difficulty changes
    setPage(1);
  }, [perPage, difficulty]);

  const handleProblemSelect = (problem, mode, challenges = []) => {
    //use logger only
    // logger.info('Mode:');
    // logger.debug(mode);
    // logger.info('Challenges:');
    // logger.debug(challenges);
    navigate(`/problems/${problem.titleSlug}`, {
      state: {
        problem,
        mode,
        titleSlug: problem.titleSlug,
        challenges,
      },
    });
  };

  const handleChallengeClick = (problem) => {
    setSelectedProblem(problem);
    onOpen();
  };

  const getDifficultyTone = (difficulty) =>
    DIFFICULTY_TONES[String(difficulty || '').toUpperCase()] || DIFFICULTY_TONES.DEFAULT;

  const formatReferenceSlug = (slug) => {
    if (!slug) return null;
    return slug
      .split('-')
      .map((w) => {
        const firstAlpha = w.search(/[a-zA-Z]/);
        if (firstAlpha > 0) {
          return (
            w.slice(0, firstAlpha) + w.charAt(firstAlpha).toUpperCase() + w.slice(firstAlpha + 1)
          );
        }
        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(' ');
  };

  const getClassicReferenceName = (problem) => {
    return (
      problem?.metadata?.referenceName ||
      problem?.metaData?.referenceName ||
      problem?.referenceName ||
      formatReferenceSlug(CLASSIC_REFERENCE_SLUG_BY_CYBER_SLUG[problem?.titleSlug]) ||
      null
    );
  };

  const getDisplayNumber = (problem, index) => {
    const explicitNumber =
      problem?.questionFrontendId ||
      problem?.displayNumber ||
      problem?.questionId ||
      problem?.metadata?.frontendQuestionId ||
      problem?.metaData?.frontendQuestionId;

    if (explicitNumber !== null && explicitNumber !== undefined && String(explicitNumber).trim()) {
      return String(explicitNumber).trim();
    }

    return String((page - 1) * perPage + index + 1);
  };

  const handlePerPageChange = (newPerPage) => {
    setPerPage(newPerPage);
  };

  const shellProps = {
    mainMaxW: 'container.xl',
    heroFileLabel: 'problems.exe',
    heroTitle: 'Interview Problems',
    heroSubtitle:
      'Browse the authenticated interview bank, filter by difficulty, and launch straight into free play, ranked, or challenge mode.',
    topSlot: (
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
    ),
    leftSidebar: <SidebarAd slotId={adSlots.generic.sidebar} />,
    rightSidebar: <SidebarAd slotId={adSlots.generic.sidebar} />,
    bottomSlot: (
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
    ),
  };

  if (loading)
    return (
      <PageTemplate showGiphyBackground>
        <RetroPageShell {...shellProps} heroMeta="Syncing index">
          <RetroPanel
            fileLabel="status.log"
            title="Loading problem index"
            subtitle="Fetching the latest interview problems and pagination data."
          />
        </RetroPageShell>
      </PageTemplate>
    );

  if (error)
    return (
      <PageTemplate showGiphyBackground>
        <RetroPageShell {...shellProps} heroMeta="Load failed">
          <RetroPanel
            fileLabel="status.log"
            title="Problem bank unavailable"
            subtitle="We could not load the interview catalog right now. Refresh the page and try again."
          >
            <Stack spacing={4} align="start">
              <Text color="var(--cg-accent-red)" fontSize="sm">
                {error}
              </Text>
              <Button onClick={() => window.location.reload()} color="var(--cg-accent-red)">
                Try again
              </Button>
            </Stack>
          </RetroPanel>
        </RetroPageShell>
      </PageTemplate>
    );

  return (
    <PageTemplate title="Interview Problems" showGiphyBackground>
      <RetroPageShell {...shellProps} heroMeta={`${totalProblems || problems.length} loaded`}>
        <RetroPanel fileLabel="filters.ini" title="Filter & Display">
          <Flex wrap="wrap" gap={{ base: 4, md: 6 }} align="end" justify="space-between">
            <HStack spacing={3} flexWrap="wrap" align="end">
              <Box>
                <Text
                  color="var(--cg-muted)"
                  fontSize="xs"
                  fontWeight="700"
                  textTransform="uppercase"
                  mb={2}
                >
                  Difficulty
                </Text>
                <Select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  w={{ base: '220px', md: '220px' }}
                >
                  <option value="">All difficulties</option>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </Select>
              </Box>

              <Box>
                <Text
                  color="var(--cg-muted)"
                  fontSize="xs"
                  fontWeight="700"
                  textTransform="uppercase"
                  mb={2}
                >
                  Per page
                </Text>
                <Select
                  value={perPage}
                  onChange={(e) => handlePerPageChange(Number(e.target.value))}
                  w={{ base: '180px', md: '180px' }}
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </Select>
              </Box>
            </HStack>

            <Text color="var(--cg-muted)" fontSize="sm">
              Showing page {page} of {Math.max(totalPages, 1)}.
            </Text>
          </Flex>
        </RetroPanel>

        <RetroPanel
          fileLabel="problem-bank.dat"
          title="Problem Bank"
          subtitle="Launch a practice session, open a ranked attempt, or configure a challenge run from the same catalog."
        >
          {problems.length ? (
            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={{ base: 4, md: 5 }}>
              {problems.map((problem, index) => {
                const classicReferenceName = getClassicReferenceName(problem);
                const displayNumber = getDisplayNumber(problem, index);
                const difficultyTone = getDifficultyTone(problem?.difficulty);
                const difficultyLabel = String(problem?.difficulty || 'Unknown');

                return (
                  <RetroInset
                    key={problem.id}
                    p={{ base: 4, md: 5 }}
                    display="flex"
                    flexDirection="column"
                    gap={3}
                    h="100%"
                    transition="background 120ms ease, transform 120ms ease"
                    _hover={{
                      bg: 'rgba(255,255,255,0.24)',
                      transform: 'translate(-1px, -1px)',
                    }}
                  >
                    <Box>
                      <Text
                        color="var(--cg-muted)"
                        fontSize="xs"
                        textTransform="uppercase"
                        letterSpacing="0.08em"
                      >
                        Problem {displayNumber}
                      </Text>
                      <Text
                        mt={1.5}
                        color="var(--cg-text)"
                        fontSize={{ base: 'md', md: 'lg' }}
                        fontWeight="700"
                        lineHeight="1.35"
                      >
                        {problem.title}
                      </Text>
                      {classicReferenceName ? (
                        <Text mt={1.5} color="var(--cg-link)" fontSize="xs">
                          Reference: {classicReferenceName}
                        </Text>
                      ) : null}
                    </Box>

                    <Badge
                      alignSelf="flex-start"
                      bg={difficultyTone.bg}
                      color={difficultyTone.color}
                    >
                      {difficultyLabel.charAt(0).toUpperCase() +
                        difficultyLabel.slice(1).toLowerCase()}
                    </Badge>

                    <Stack direction={{ base: 'column', sm: 'row' }} spacing={3} mt="auto">
                      <Button
                        flex={1}
                        color="var(--cg-accent-blue)"
                        onClick={() => handleProblemSelect(problem, 'freeplay')}
                      >
                        Free play
                      </Button>
                      <Button
                        flex={1}
                        color="var(--cg-accent-green)"
                        onClick={() => handleProblemSelect(problem, 'ranked')}
                      >
                        Ranked
                      </Button>
                      <Button
                        flex={1}
                        color="var(--cg-accent-red)"
                        onClick={() => handleChallengeClick(problem)}
                      >
                        Challenge
                      </Button>
                    </Stack>
                  </RetroInset>
                );
              })}
            </SimpleGrid>
          ) : (
            <RetroInset p={{ base: 4, md: 5 }}>
              <Text color="var(--cg-text)" fontSize="sm">
                No problems matched the current filters.
              </Text>
            </RetroInset>
          )}

          <Box mt={6}>
            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              onPageSizeChange={handlePerPageChange}
              currentPageSize={perPage}
              pageSizeOptions={[10, 25, 50]}
              buttonStyles={PAGINATION_BUTTON_STYLES}
            />
          </Box>
        </RetroPanel>
      </RetroPageShell>

      <ChallengeModal
        isOpen={isOpen}
        onClose={onClose}
        problem={selectedProblem}
        onConfirm={(challenges) => {
          handleProblemSelect(selectedProblem, 'challenge', challenges);
          onClose();
        }}
      />
    </PageTemplate>
  );
}

export default ProblemList;
