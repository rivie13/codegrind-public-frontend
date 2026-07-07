import {
  Badge,
  Box,
  Button,
  Code,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useBreakpointValue,
  useDisclosure,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import logger from '../../utils/core/logger';
import ModelSelector from '../common/ModelSelector';

const getStatusTone = (status) =>
  status === 'accepted' ? 'var(--cg-accent-green)' : 'var(--cg-accent-red)';

const getDifficultyTone = (difficulty) => {
  if (difficulty === 'easy') return 'var(--cg-accent-green)';
  if (difficulty === 'medium') return 'var(--cg-accent-amber)';
  if (difficulty === 'hard') return 'var(--cg-accent-red)';
  return 'var(--cg-link)';
};

const getFilterButtonProps = (selected, accent) => ({
  bg: selected
    ? 'linear-gradient(90deg, var(--cg-header-start), var(--cg-header-end))'
    : 'var(--cg-window-face)',
  color: selected ? 'var(--cg-header-text)' : accent,
  border: '2px solid var(--cg-window-shadow)',
  boxShadow: selected ? 'var(--cg-window-inset)' : 'var(--cg-window-outset)',
  _hover: {
    bg: selected
      ? 'linear-gradient(90deg, var(--cg-header-start), var(--cg-header-end))'
      : 'rgba(255,255,255,0.18)',
  },
  _active: {
    boxShadow: 'var(--cg-window-inset)',
  },
  width: { base: '100%', sm: 'auto' },
  whiteSpace: 'normal',
  textAlign: 'left',
});

const renderStatusBadge = (status) => (
  <Badge
    bg="var(--cg-window-face)"
    color={getStatusTone(status)}
    border="1px solid var(--cg-window-shadow)"
    boxShadow="var(--cg-window-outset)"
    fontSize="10px"
    borderRadius="0"
  >
    {String(status || 'unknown').toUpperCase()}
  </Badge>
);

const renderDifficultyBadge = (difficulty) => (
  <Badge
    bg="var(--cg-window-face)"
    color={getDifficultyTone(difficulty)}
    border="1px solid var(--cg-window-shadow)"
    boxShadow="var(--cg-window-outset)"
    fontSize="10px"
    borderRadius="0"
  >
    {String(difficulty || 'unknown').toUpperCase()}
  </Badge>
);

const formatDate = (value) => {
  if (!value) return 'Unknown';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return date.toLocaleDateString();
};

const SubmissionsDashboard = ({ userId }) => {
  const [stats, setStats] = useState(null);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const submissionsPerPage = 10;
  const isMobile = useBreakpointValue({ base: true, md: false });

  const { user } = useAuth();
  const rawTier = (
    user?.membershipTier ||
    localStorage.getItem('membership_tier') ||
    'FREE'
  ).toUpperCase();
  const membershipTier = rawTier === 'PRO' ? 'PREMIUM' : rawTier;
  const canAnalyze = ['PREMIUM', 'UNLIMITED'].includes(membershipTier);

  const [analysisModel, setAnalysisModel] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [analysisUsage, setAnalysisUsage] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleModalClose = useCallback(() => {
    setAnalysisResult(null);
    setAnalysisError(null);
    setShowAnalysis(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!canAnalyze) return;

    api.analysis
      .getUsage()
      .then(setAnalysisUsage)
      .catch((error) => logger.error('[Analysis] Failed to fetch usage:', error));
  }, [canAnalyze]);

  const handleAnalyze = useCallback(async () => {
    if (!selectedSubmission?.id) return;

    setAnalysisLoading(true);
    setAnalysisError(null);
    setShowAnalysis(true);

    try {
      const result = await api.analysis.analyzeSubmission(selectedSubmission.id, analysisModel);
      setAnalysisResult(result);

      if (result.usage) {
        setAnalysisUsage((prev) => ({
          ...prev,
          used: result.usage.used,
          limit: result.usage.limit,
          available: Math.max(0, result.usage.limit - result.usage.used),
        }));
      }
    } catch (error) {
      const message = error?.data?.message || error?.message || 'Analysis failed';
      setAnalysisError(message);
      logger.error('[Analysis] Error:', error);
    } finally {
      setAnalysisLoading(false);
    }
  }, [selectedSubmission, analysisModel]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, submissionsData] = await Promise.all([
          api.submissions.getDashboardStats(userId),
          api.submissions.getDashboardSubmissions(
            userId,
            currentPage,
            submissionsPerPage,
            selectedDifficulty
          ),
        ]);

        setStats(statsData);
        setRecentSubmissions(submissionsData.submissions);
        setTotalPages(submissionsData.totalPages);
      } catch (error) {
        logger.error('Error fetching submission data:', error);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId, currentPage, selectedDifficulty]);

  const handleDifficultyClick = (difficulty) => {
    setSelectedDifficulty(difficulty === selectedDifficulty ? null : difficulty);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleRowClick = (submission) => {
    setSelectedSubmission(submission);
    onOpen();
  };

  return (
    <Stack spacing={8}>
      <Box className="cg-panel-window" overflow="hidden">
        <Box className="cg-titlebar" px={4} py={2}>
          <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
            submission_statistics.log
          </Text>
        </Box>

        <Box p={4} bg="rgba(255,255,255,0.14)">
          <Text color="var(--cg-muted)" fontSize="sm" lineHeight="1.6">
            Review recent runs, inspect stored source, and optionally request AI feedback on
            individual submissions.
          </Text>

          <Flex wrap="wrap" gap={3} mt={4}>
            <Button
              onClick={() => handleDifficultyClick('easy')}
              {...getFilterButtonProps(selectedDifficulty === 'easy', 'var(--cg-accent-green)')}
            >
              Easy Solved: {stats?.easySolved || 0}
            </Button>
            <Button
              onClick={() => handleDifficultyClick('medium')}
              {...getFilterButtonProps(selectedDifficulty === 'medium', 'var(--cg-accent-amber)')}
            >
              Medium Solved: {stats?.mediumSolved || 0}
            </Button>
            <Button
              onClick={() => handleDifficultyClick('hard')}
              {...getFilterButtonProps(selectedDifficulty === 'hard', 'var(--cg-accent-red)')}
            >
              Hard Solved: {stats?.hardSolved || 0}
            </Button>
            <Button
              onClick={() => handleDifficultyClick(null)}
              {...getFilterButtonProps(selectedDifficulty === null, 'var(--cg-link)')}
            >
              Total Solved: {stats?.totalSolved || 0}
            </Button>
          </Flex>

          <Text
            color="var(--cg-muted)"
            fontSize="xs"
            fontFamily="var(--cg-font-retro-display)"
            mt={4}
            textTransform="uppercase"
            letterSpacing="0.06em"
          >
            Total submissions: {stats?.totalSubmissions || 0}
          </Text>
        </Box>
      </Box>

      <Box className="cg-panel-window" overflow="hidden">
        <Box className="cg-titlebar" px={4} py={2}>
          <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
            execution_log.tbl
          </Text>
        </Box>

        <Box bg="rgba(255,255,255,0.14)">
          <Box borderBottom="1px solid var(--cg-window-dark)" bg="rgba(0,0,0,0.08)" px={4} py={2}>
            <Text
              fontSize="xs"
              color="var(--cg-link)"
              fontFamily="var(--cg-font-retro-display)"
              textTransform="uppercase"
            >
              Displaying {recentSubmissions.length} records
            </Text>
          </Box>

          {recentSubmissions.length === 0 ? (
            <Box p={6}>
              <Box
                bg="var(--cg-panel-shell)"
                border="1px dashed var(--cg-window-dark)"
                boxShadow="var(--cg-window-inset)"
                p={5}
              >
                <Text
                  color="var(--cg-muted)"
                  fontSize="sm"
                  fontFamily="var(--cg-font-retro-display)"
                >
                  No submissions found for this filter yet.
                </Text>
              </Box>
            </Box>
          ) : isMobile ? (
            <Stack spacing={3} p={4}>
              {recentSubmissions.map((submission, index) => (
                <Box
                  key={`${submission.id || submission.problemId}-${index}`}
                  p={4}
                  bg="var(--cg-panel-shell)"
                  border="1px solid var(--cg-window-shadow)"
                  boxShadow="var(--cg-window-inset)"
                  borderLeft="4px solid"
                  borderLeftColor={getStatusTone(submission.status)}
                >
                  <Flex justify="space-between" align="center" mb={2} gap={2} flexWrap="wrap">
                    <Text
                      color="var(--cg-text)"
                      fontFamily="var(--cg-font-retro-display)"
                      fontSize="sm"
                      fontWeight="700"
                    >
                      {submission.problemId}
                    </Text>
                    {renderDifficultyBadge(submission.problem_difficulty)}
                  </Flex>

                  <Flex gap={2} flexWrap="wrap" mb={2}>
                    {renderStatusBadge(submission.status)}
                  </Flex>

                  <Text
                    color="var(--cg-muted)"
                    fontSize="xs"
                    fontFamily="var(--cg-font-retro-display)"
                    mb={1}
                  >
                    Date: {formatDate(submission.submission_date)}
                  </Text>
                  <Text
                    color="var(--cg-link)"
                    fontSize="xs"
                    fontFamily="var(--cg-font-retro-display)"
                    mb={1}
                  >
                    Execution Time: {submission.execution_time}ms
                  </Text>
                  <Text
                    color="var(--cg-accent-amber)"
                    fontSize="xs"
                    fontFamily="var(--cg-font-retro-display)"
                    mb={3}
                  >
                    Memory Usage: {submission.memory_used}KB
                  </Text>

                  <Button
                    size="sm"
                    onClick={() => handleRowClick(submission)}
                    color="var(--cg-link)"
                    width="100%"
                  >
                    View Code
                  </Button>
                </Box>
              ))}
            </Stack>
          ) : (
            <Box overflowX="auto">
              <Table variant="unstyled" size="sm">
                <Thead bg="rgba(0,0,0,0.08)">
                  <Tr borderBottom="1px solid var(--cg-window-dark)">
                    <Th
                      color="var(--cg-muted)"
                      fontSize="xs"
                      fontFamily="var(--cg-font-retro-display)"
                    >
                      Problem ID
                    </Th>
                    <Th
                      color="var(--cg-muted)"
                      fontSize="xs"
                      fontFamily="var(--cg-font-retro-display)"
                    >
                      Status
                    </Th>
                    <Th
                      color="var(--cg-muted)"
                      fontSize="xs"
                      fontFamily="var(--cg-font-retro-display)"
                    >
                      Difficulty
                    </Th>
                    <Th
                      color="var(--cg-muted)"
                      fontSize="xs"
                      fontFamily="var(--cg-font-retro-display)"
                    >
                      Timestamp
                    </Th>
                    <Th
                      color="var(--cg-muted)"
                      fontSize="xs"
                      fontFamily="var(--cg-font-retro-display)"
                    >
                      Ex Time
                    </Th>
                    <Th
                      color="var(--cg-muted)"
                      fontSize="xs"
                      fontFamily="var(--cg-font-retro-display)"
                    >
                      Mem Usage
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {recentSubmissions.map((submission, index) => (
                    <Tr
                      key={`${submission.id || submission.problemId}-${index}`}
                      onClick={() => handleRowClick(submission)}
                      cursor="pointer"
                      _hover={{ bg: 'rgba(255,255,255,0.16)' }}
                      borderBottom="1px solid rgba(0,0,0,0.12)"
                      bg={index % 2 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'}
                    >
                      <Td
                        pl={4}
                        borderLeft="4px solid"
                        borderLeftColor={getStatusTone(submission.status)}
                        color="var(--cg-text)"
                        fontFamily="var(--cg-font-retro-display)"
                        fontSize="sm"
                        fontWeight="700"
                      >
                        {submission.problemId}
                      </Td>
                      <Td>{renderStatusBadge(submission.status)}</Td>
                      <Td>{renderDifficultyBadge(submission.problem_difficulty)}</Td>
                      <Td
                        color="var(--cg-muted)"
                        fontSize="xs"
                        fontFamily="var(--cg-font-retro-display)"
                      >
                        {formatDate(submission.submission_date)}
                      </Td>
                      <Td
                        color="var(--cg-link)"
                        fontSize="xs"
                        fontFamily="var(--cg-font-retro-display)"
                      >
                        {submission.execution_time}ms
                      </Td>
                      <Td
                        color="var(--cg-accent-amber)"
                        fontSize="xs"
                        fontFamily="var(--cg-font-retro-display)"
                      >
                        {submission.memory_used}KB
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </Box>
      </Box>

      <Flex justify="center" wrap="wrap" gap={3}>
        <Button onClick={() => handlePageChange(1)} isDisabled={currentPage === 1} size="sm">
          {'<<'} First
        </Button>
        <Button
          onClick={() => handlePageChange(currentPage - 1)}
          isDisabled={currentPage === 1}
          size="sm"
        >
          {'<'} Prev
        </Button>

        <Box
          px={3}
          py={2}
          bg="var(--cg-window-face)"
          border="2px solid var(--cg-window-shadow)"
          boxShadow="var(--cg-window-outset)"
        >
          <Text
            color="var(--cg-text)"
            fontFamily="var(--cg-font-retro-display)"
            fontWeight="700"
            fontSize="sm"
          >
            Page {currentPage}/{totalPages}
          </Text>
        </Box>

        <Button
          onClick={() => handlePageChange(currentPage + 1)}
          isDisabled={currentPage === totalPages}
          size="sm"
        >
          Next {'>'}
        </Button>
        <Button
          onClick={() => handlePageChange(totalPages)}
          isDisabled={currentPage === totalPages}
          size="sm"
        >
          Last {'>>'}
        </Button>
      </Flex>

      <Modal isOpen={isOpen} onClose={handleModalClose} size="3xl" isCentered>
        <ModalOverlay backdropFilter="blur(3px)" bg="rgba(0,0,0,0.7)" />
        <ModalContent
          bg="var(--cg-window-face)"
          border="2px solid var(--cg-window-shadow)"
          boxShadow="var(--cg-window-outset), 18px 18px 0 rgba(0,0,0,0.24)"
          borderRadius="0"
          maxW={{ base: '100vw', md: '3xl' }}
          overflow="hidden"
        >
          <ModalHeader
            bg="linear-gradient(90deg, var(--cg-header-start), var(--cg-header-end))"
            color="var(--cg-header-text)"
            fontFamily="var(--cg-font-retro-display)"
            fontSize="sm"
            textTransform="uppercase"
            letterSpacing="0.08em"
            borderBottom="1px solid var(--cg-window-shadow)"
            py={2}
            px={4}
          >
            <Flex align="center" gap={2}>
              <Text>submission_viewer.exe</Text>
              {selectedSubmission?.problemId && <Text>- {selectedSubmission.problemId}</Text>}
            </Flex>
          </ModalHeader>

          <ModalCloseButton
            color="var(--cg-header-text)"
            border="1px solid rgba(255,255,255,0.35)"
            borderRadius="0"
            boxShadow="var(--cg-window-outset)"
            top={2}
            right={2}
          />

          <ModalBody pb={6} pt={4} bg="rgba(255,255,255,0.14)">
            <Box className="cg-panel-window" overflow="hidden" mb={4}>
              <Box className="cg-titlebar" px={3} py={2}>
                <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
                  source_code.txt
                </Text>
              </Box>

              <Box
                bg="var(--cg-panel-shell)"
                maxHeight={{ base: '40vh', md: '350px' }}
                overflowY="auto"
                sx={{
                  '&::-webkit-scrollbar': {
                    width: '6px',
                    height: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'var(--cg-window-face)',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#9f9a90',
                    borderRadius: '0',
                    '&:hover': {
                      background: '#8c867a',
                    },
                  },
                }}
              >
                <Box
                  px={3}
                  py={2}
                  bg="rgba(255,255,255,0.14)"
                  borderBottom="1px solid var(--cg-window-dark)"
                >
                  <Flex align="center" justify="space-between" flexWrap="wrap" gap={2}>
                    <Text
                      color="var(--cg-link)"
                      fontSize="xs"
                      fontFamily="var(--cg-font-retro-display)"
                      textTransform="uppercase"
                    >
                      Stored source record
                    </Text>
                    <Flex gap={2} flexWrap="wrap">
                      {renderStatusBadge(selectedSubmission?.status)}
                      {renderDifficultyBadge(selectedSubmission?.problem_difficulty)}
                    </Flex>
                  </Flex>
                </Box>

                <Code
                  display="block"
                  whiteSpace={{ base: 'pre-wrap', md: 'pre' }}
                  p={4}
                  bg="transparent"
                  color="var(--cg-text)"
                  fontSize={{ base: 'xs', md: 'sm' }}
                  fontFamily="var(--cg-font-retro-terminal)"
                  lineHeight="1.6"
                  overflowX="auto"
                >
                  {selectedSubmission?.code || 'No code available'}
                </Code>
              </Box>
            </Box>

            <Box className="cg-panel-window" overflow="hidden">
              <Box className="cg-titlebar" px={3} py={2}>
                <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
                  ai_analysis.log
                </Text>
              </Box>

              <Box p={4} bg="rgba(255,255,255,0.14)">
                {canAnalyze ? (
                  <Box>
                    <Flex align="center" justify="space-between" mb={3} flexWrap="wrap" gap={2}>
                      <Flex align="center" gap={2} flexWrap="wrap">
                        <Text
                          fontSize="sm"
                          color="var(--cg-link)"
                          fontFamily="var(--cg-font-retro-display)"
                          fontWeight="700"
                          textTransform="uppercase"
                        >
                          AI Analysis
                        </Text>
                        {analysisUsage && (
                          <Text
                            fontSize="xs"
                            color="var(--cg-muted)"
                            fontFamily="var(--cg-font-retro-display)"
                          >
                            [{analysisUsage.used || 0}/{analysisUsage.limit || 0} today]
                          </Text>
                        )}
                        {analysisResult?.cached && (
                          <Badge
                            fontSize="9px"
                            bg="var(--cg-window-face)"
                            color="var(--cg-accent-amber)"
                          >
                            CACHED
                          </Badge>
                        )}
                      </Flex>

                      <Flex align="center" gap={2} flexWrap="wrap">
                        <ModelSelector
                          feature="analysis"
                          value={analysisModel}
                          onChange={setAnalysisModel}
                          size="xs"
                          compact
                          theme="retro-desktop"
                        />
                        <Tooltip
                          label={
                            analysisUsage?.available === 0
                              ? 'Daily limit reached'
                              : 'Analyze this submission with AI'
                          }
                          hasArrow
                          bg="var(--cg-window-face)"
                          color="var(--cg-text)"
                          border="1px solid var(--cg-window-shadow)"
                          fontSize="xs"
                        >
                          <Button
                            size="sm"
                            isLoading={analysisLoading}
                            loadingText="Analyzing"
                            isDisabled={analysisLoading || analysisUsage?.available === 0}
                            onClick={handleAnalyze}
                            color="var(--cg-link)"
                          >
                            {analysisResult ? 'Re-Analyze' : 'Analyze Code'}
                          </Button>
                        </Tooltip>
                      </Flex>
                    </Flex>

                    {showAnalysis && (
                      <Box>
                        {analysisLoading && (
                          <Flex justify="center" align="center" py={8} direction="column" gap={3}>
                            <Spinner
                              size="lg"
                              color="var(--cg-link)"
                              thickness="3px"
                              speed="0.8s"
                            />
                            <Text
                              fontSize="xs"
                              color="var(--cg-link)"
                              fontFamily="var(--cg-font-retro-display)"
                            >
                              Processing analysis...
                            </Text>
                          </Flex>
                        )}

                        {analysisError && (
                          <Box
                            p={3}
                            border="1px solid var(--cg-window-shadow)"
                            boxShadow="var(--cg-window-inset)"
                            bg="rgba(135, 28, 28, 0.16)"
                          >
                            <Text
                              fontSize="xs"
                              color="var(--cg-accent-red)"
                              fontFamily="var(--cg-font-retro-display)"
                            >
                              ERROR: {analysisError}
                            </Text>
                          </Box>
                        )}

                        {analysisResult && !analysisLoading && (
                          <Box>
                            <Box
                              p={3}
                              border="1px solid var(--cg-window-shadow)"
                              boxShadow="var(--cg-window-inset)"
                              bg="var(--cg-panel-shell)"
                              maxHeight="300px"
                              overflowY="auto"
                              mb={3}
                              sx={{
                                '&::-webkit-scrollbar': {
                                  width: '4px',
                                },
                                '&::-webkit-scrollbar-thumb': {
                                  background: '#9f9a90',
                                  borderRadius: '0',
                                },
                              }}
                            >
                              <Text
                                fontSize="xs"
                                color="var(--cg-link)"
                                fontFamily="var(--cg-font-retro-display)"
                                fontWeight="700"
                                mb={2}
                                textTransform="uppercase"
                              >
                                Analysis Output [{analysisResult.model}]
                              </Text>
                              <Text
                                fontSize="sm"
                                color="var(--cg-text)"
                                fontFamily="var(--cg-font-retro-display)"
                                whiteSpace="pre-wrap"
                                lineHeight="1.7"
                              >
                                {analysisResult.analysis}
                              </Text>
                            </Box>

                            {analysisResult.suggestions?.length > 0 && (
                              <Box>
                                <Text
                                  fontSize="xs"
                                  color="var(--cg-accent-amber)"
                                  fontFamily="var(--cg-font-retro-display)"
                                  fontWeight="700"
                                  mb={2}
                                  textTransform="uppercase"
                                >
                                  Improvement Suggestions [{analysisResult.suggestions.length}]
                                </Text>
                                <Stack spacing={2}>
                                  {analysisResult.suggestions.map((suggestion, index) => (
                                    <Box
                                      key={`${selectedSubmission?.id || 'submission'}-suggestion-${index}`}
                                      p={3}
                                      border="1px solid var(--cg-window-shadow)"
                                      boxShadow="var(--cg-window-inset)"
                                      bg="var(--cg-panel-shell)"
                                      borderLeft="4px solid var(--cg-accent-amber)"
                                      pl={4}
                                    >
                                      {typeof suggestion === 'string' ? (
                                        <Text
                                          fontSize="xs"
                                          color="var(--cg-text)"
                                          fontFamily="var(--cg-font-retro-display)"
                                        >
                                          {suggestion}
                                        </Text>
                                      ) : (
                                        <>
                                          <Text
                                            fontSize="xs"
                                            color="var(--cg-accent-amber)"
                                            fontFamily="var(--cg-font-retro-display)"
                                            fontWeight="700"
                                            textTransform="uppercase"
                                          >
                                            {suggestion.title ||
                                              suggestion.category ||
                                              `Suggestion ${index + 1}`}
                                          </Text>
                                          <Text
                                            fontSize="xs"
                                            color="var(--cg-text)"
                                            fontFamily="var(--cg-font-retro-display)"
                                            mt={1}
                                          >
                                            {suggestion.description ||
                                              suggestion.text ||
                                              JSON.stringify(suggestion)}
                                          </Text>
                                        </>
                                      )}
                                    </Box>
                                  ))}
                                </Stack>
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box
                    p={3}
                    border="1px solid var(--cg-window-shadow)"
                    boxShadow="var(--cg-window-inset)"
                    bg="var(--cg-panel-shell)"
                  >
                    <Flex align="center" gap={2} flexWrap="wrap">
                      <Text
                        fontSize="xs"
                        color="var(--cg-link)"
                        fontFamily="var(--cg-font-retro-display)"
                        fontWeight="700"
                        textTransform="uppercase"
                      >
                        AI Analysis
                      </Text>
                      <Badge
                        fontSize="9px"
                        bg="var(--cg-window-face)"
                        color="var(--cg-accent-amber)"
                      >
                        PREMIUM
                      </Badge>
                    </Flex>
                    <Text
                      fontSize="xs"
                      color="var(--cg-muted)"
                      fontFamily="var(--cg-font-retro-display)"
                      mt={1}
                    >
                      Upgrade to Premium to unlock AI-powered code analysis with improvement
                      suggestions and multiple model choices.
                    </Text>
                  </Box>
                )}
              </Box>
            </Box>
          </ModalBody>

          <ModalFooter borderTop="1px solid var(--cg-window-dark)" bg="rgba(255,255,255,0.08)">
            <Button onClick={handleModalClose} color="var(--cg-link)">
              Close Console
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Stack>
  );
};

export default SubmissionsDashboard;
