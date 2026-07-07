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
  useToast,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChallengeModal from '../../components/modals/ChallengeModal';
import PageTemplate from '../../components/layout/PageTemplate';
import PaginationControls from '../../components/layout/PaginationControls';
import RetroPageShell, { RetroInset, RetroPanel } from '../../components/retro/RetroPageShell';
import api from '../../services/api.js';
import logger from '../../utils/core/logger.js';

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

const AIProblemsView = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();
  const [difficulty, setDifficulty] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [totalProblems, setTotalProblems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [noProblemsFound, setNoProblemsFound] = useState(false);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        setError(null);
        setNoProblemsFound(false);

        // Use the updated API endpoint with pagination parameters
        const response = await api.aiProblems.getAll(difficulty, currentPage, pageSize);
        logger.info('AI Problems response:');

        let problemsData = [];
        // Extract problems data from response
        if (response && response.questions && Array.isArray(response.questions)) {
          problemsData = response.questions;
          setTotalPages(response.totalPages || 1);
          setTotalProblems(response.total || 0);
        } else if (Array.isArray(response)) {
          problemsData = response;
          setTotalPages(Math.ceil(response.length / pageSize));
          setTotalProblems(response.length);
        } else {
          logger.error('Unexpected API response format:', response);
          problemsData = [];
          setTotalPages(1);
          setTotalProblems(0);
        }

        // Check if no problems were found
        if (problemsData.length === 0) {
          setNoProblemsFound(true);
        }

        setProblems(problemsData);
        setError(null);
      } catch (error) {
        logger.error('Error fetching AI problems:');
        logger.debug(error);
        setError(error.message);
        if (typeof toast.isActive !== 'function' || !toast.isActive('ai-problems-load-failed')) {
          toast({
            id: 'ai-problems-load-failed',
            title: 'AI problems unavailable',
            description: 'We could not load AI problems right now. Please try again.',
            status: 'warning',
            duration: 3200,
            isClosable: true,
            position: 'top',
          });
        }
        setProblems([]);
        setTotalPages(1);
        setTotalProblems(0);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, [difficulty, currentPage, pageSize, toast]);

  const handleDifficultyChange = (e) => {
    setDifficulty(e.target.value);
    setCurrentPage(1); // Reset to first page on difficulty change
  };

  const getDifficultyTone = (difficulty) =>
    DIFFICULTY_TONES[String(difficulty || '').toUpperCase()] || DIFFICULTY_TONES.DEFAULT;

  const handleProblemSelect = (problem, mode, challenges = []) => {
    // logger.info('Mode:');
    // logger.debug(mode);
    // logger.info('Challenges:');
    // logger.debug(challenges);
    navigate(`/ai-problems/${problem.titleSlug}`, {
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

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const shellProps = {
    mainMaxW: 'container.xl',
    heroFileLabel: 'ai-problems.exe',
    heroTitle: 'AI-generated Problems',
    heroSubtitle:
      'Browse custom programming challenges generated by AI models and open them directly in the authenticated workspace.',
  };

  if (loading) {
    return (
      <PageTemplate showGiphyBackground>
        <RetroPageShell {...shellProps} heroMeta="Syncing index">
          <RetroPanel
            fileLabel="status.log"
            title="Loading generated problems"
            subtitle="Fetching the latest AI-generated catalog and pagination data."
          />
        </RetroPageShell>
      </PageTemplate>
    );
  }

  if (error) {
    return (
      <PageTemplate showGiphyBackground>
        <RetroPageShell {...shellProps} heroMeta="Load failed">
          <RetroPanel
            fileLabel="status.log"
            title="AI problem index unavailable"
            subtitle="We could not load the AI-generated catalog right now. Refresh and try again."
          >
            <Stack spacing={4} align="start">
              <Text color="var(--cg-accent-red)" fontSize="sm">
                {error}
              </Text>
              <Button onClick={() => window.location.reload()} color="var(--cg-accent-red)">
                Retry
              </Button>
            </Stack>
          </RetroPanel>
        </RetroPageShell>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate showGiphyBackground>
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
                  onChange={handleDifficultyChange}
                  w={{ base: '220px', md: '220px' }}
                >
                  <option value="">All levels</option>
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
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  w={{ base: '180px', md: '180px' }}
                >
                  <option value={6}>6 per page</option>
                  <option value={9}>9 per page</option>
                  <option value={12}>12 per page</option>
                  <option value={24}>24 per page</option>
                </Select>
              </Box>
            </HStack>

            {totalProblems > 0 ? (
              <Text color="var(--cg-muted)" fontSize="sm">
                Showing {Math.min((currentPage - 1) * pageSize + 1, totalProblems)} -{' '}
                {Math.min(currentPage * pageSize, totalProblems)} of {totalProblems} problems.
              </Text>
            ) : null}
          </Flex>
        </RetroPanel>

        <RetroPanel
          fileLabel="generated-bank.dat"
          title="Generated Bank"
          subtitle="Open AI-generated prompts in practice, ranked, or challenge mode from the same library."
        >
          {noProblemsFound ? (
            <RetroInset p={{ base: 4, md: 5 }}>
              <Stack spacing={4} align="start">
                <Text color="var(--cg-text)" fontSize="sm">
                  No AI-generated problems matched the current difficulty filter.
                </Text>
                {difficulty ? (
                  <Button onClick={() => setDifficulty('')} color="var(--cg-accent-red)">
                    Clear filter
                  </Button>
                ) : null}
              </Stack>
            </RetroInset>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={{ base: 4, md: 5 }}>
              {problems.map((problem) => {
                const difficultyTone = getDifficultyTone(problem?.difficulty);
                const difficultyLabel = String(problem?.difficulty || 'Unknown');
                const displayNumber =
                  problem?.displayNumber || problem?.questionFrontendId || problem?.id || 'AI';

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
                    <HStack justify="space-between" align="start" spacing={3}>
                      <Text
                        color="var(--cg-muted)"
                        fontSize="xs"
                        textTransform="uppercase"
                        letterSpacing="0.08em"
                      >
                        Entry {displayNumber}
                      </Text>
                      <Badge bg="rgba(10, 56, 154, 0.12)" color="var(--cg-link)">
                        AI generated
                      </Badge>
                    </HStack>

                    <Text
                      color="var(--cg-text)"
                      fontSize={{ base: 'md', md: 'lg' }}
                      fontWeight="700"
                      lineHeight="1.35"
                    >
                      {problem.title}
                    </Text>

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
                        color="var(--cg-accent-blue)"
                        onClick={() => handleProblemSelect(problem, 'practice')}
                      >
                        Practice
                      </Button>
                      <Button
                        color="var(--cg-accent-green)"
                        onClick={() => handleProblemSelect(problem, 'ranked')}
                      >
                        Ranked
                      </Button>
                      <Button
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
          )}

          {totalPages > 0 && problems.length > 0 ? (
            <Box mt={6}>
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                currentPageSize={pageSize}
                pageSizeOptions={[6, 9, 12, 24]}
                buttonStyles={PAGINATION_BUTTON_STYLES}
              />
            </Box>
          ) : null}
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
};

export default AIProblemsView;
