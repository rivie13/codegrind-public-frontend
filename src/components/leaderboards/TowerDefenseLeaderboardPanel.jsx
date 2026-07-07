import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

const MotionBox = motion(Box);
const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

const surfaceProps = {
  bg: 'var(--cg-window-face)',
  borderRadius: 0,
  border: '2px solid var(--cg-window-shadow)',
  boxShadow: 'var(--cg-window-outset), 10px 10px 0 rgba(0,0,0,0.12)',
};

const fieldProps = {
  bg: 'var(--cg-panel-shell)',
  color: 'var(--cg-text)',
  fontFamily: 'var(--cg-font-retro-display)',
  borderColor: 'var(--cg-window-shadow)',
  borderRadius: 0,
  boxShadow: 'var(--cg-window-inset)',
  _hover: { borderColor: 'var(--cg-window-shadow)' },
  _focus: {
    borderColor: 'var(--cg-header-start)',
    boxShadow: '0 0 0 1px var(--cg-header-start), var(--cg-window-inset)',
  },
};

const headerCellProps = {
  color: 'var(--cg-text)',
  textTransform: 'uppercase',
  fontFamily: 'var(--cg-font-retro-display)',
  fontSize: 'xs',
  fontWeight: 'bold',
  letterSpacing: '0.06em',
};

const createModeButtonProps = (isActive, toneColor) => ({
  bg: 'var(--cg-window)',
  color: toneColor,
  border: '1px solid var(--cg-window-shadow)',
  borderRadius: 0,
  boxShadow: isActive ? 'var(--cg-window-inset)' : 'var(--cg-window-outset)',
  fontFamily: 'var(--cg-font-retro-display)',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  _hover: { bg: 'var(--cg-window-face)', color: toneColor },
  _active: {
    boxShadow: 'var(--cg-window-inset)',
    transform: 'translateY(1px)',
  },
});

function TowerDefenseLeaderboardPanel({
  selectedTdSource,
  setSelectedTdSource,
  tdSearchQuery,
  setTdSearchQuery,
  getSelectedTdProblem,
  setSelectedTdProblem,
  getCurrentTdProblemsList,
  tdMode,
  setTdMode,
  towerDefenseLeaderboardData,
  selectedTdProblemData,
  getCurrentTdPageData,
  tdCurrentPage,
  setTdCurrentPage,
  tdTotalPages,
  entriesPerPage,
  formatSeconds,
}) {
  const selectedProblemKey = getSelectedTdProblem();
  const selectedLeaderboard = selectedProblemKey
    ? towerDefenseLeaderboardData[selectedProblemKey]
    : null;

  return (
    <VStack spacing={4} align="stretch">
      <Box {...surfaceProps} overflow="hidden">
        <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
          <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
            BREACH FILTERS
          </Text>
        </Box>

        <Stack spacing={3} direction={{ base: 'column', md: 'row' }} align="stretch">
          <Box p={{ base: 3, md: 4 }} bg="rgba(255,255,255,0.14)" width="100%">
            <Stack spacing={3} direction={{ base: 'column', md: 'row' }} align="stretch">
              <Select
                value={selectedTdSource}
                onChange={(e) => {
                  const newSource = e.target.value;
                  setSelectedTdSource(newSource);
                  setTdCurrentPage(1);
                }}
                width={{ base: '100%', md: '200px' }}
                {...fieldProps}
                mb={{ base: 2, md: 0 }}
                sx={{
                  '& option': {
                    background: '#f3efe7',
                    color: '#1e1e1e',
                  },
                }}
              >
                <option value="INTERVIEW">Interview Problems</option>
                <option value="AI">AI Problems</option>
              </Select>

              <InputGroup flex="1" mb={{ base: 2, md: 0 }}>
                <Input
                  placeholder="Search by problem number or name..."
                  value={tdSearchQuery}
                  onChange={(e) => setTdSearchQuery(e.target.value)}
                  {...fieldProps}
                />
                {tdSearchQuery && (
                  <InputRightElement>
                    <IconButton
                      icon={<CloseIcon />}
                      size="sm"
                      variant="ghost"
                      color="var(--cg-text)"
                      _hover={{ color: 'var(--cg-link)' }}
                      onClick={() => setTdSearchQuery('')}
                      aria-label="Clear search"
                    />
                  </InputRightElement>
                )}
              </InputGroup>

              <Select
                value={getSelectedTdProblem()}
                onChange={(e) => {
                  setSelectedTdProblem(e.target.value);
                }}
                width={{ base: '100%', md: '300px' }}
                placeholder="Select a Problem"
                {...fieldProps}
                sx={{
                  '& option': {
                    background: '#f3efe7',
                    color: '#1e1e1e',
                  },
                }}
              >
                {getCurrentTdProblemsList().map((problem, idx) => (
                  <option key={idx} value={problem.key}>
                    {problem.questionId ? `${problem.questionId}. ` : ''}
                    {problem.title}
                  </option>
                ))}
              </Select>

              <HStack spacing={2} justify={{ base: 'flex-start', md: 'flex-start' }}>
                <Button
                  size="sm"
                  {...createModeButtonProps(tdMode === 'standard', 'var(--cg-accent-blue)')}
                  onClick={() => setTdMode('standard')}
                >
                  Standard
                </Button>
                <Button
                  size="sm"
                  {...createModeButtonProps(tdMode === 'endless', 'var(--cg-accent-green)')}
                  onClick={() => setTdMode('endless')}
                >
                  Endless
                </Button>
              </HStack>
            </Stack>
          </Box>
        </Stack>
      </Box>

      {selectedProblemKey && selectedLeaderboard && (
        <VStack spacing={4} align="stretch">
          <Box {...surfaceProps} p={{ base: 3, md: 3 }}>
            <Text
              color="var(--cg-text)"
              fontSize={{ base: 'xs', md: 'sm' }}
              fontFamily="var(--cg-font-retro-display)"
            >
              <Text as="span" fontWeight="bold">
                Problem:
              </Text>{' '}
              {selectedTdProblemData?.problemInfo?.title} •
              <Text as="span" fontWeight="bold">
                {' '}
                Difficulty:
              </Text>{' '}
              {selectedTdProblemData?.problemInfo?.difficulty} •
              <Text as="span" fontWeight="bold">
                {' '}
                Total Breaches:
              </Text>{' '}
              {selectedTdProblemData?.problemInfo?.totalSubmissions}
              {selectedTdProblemData?.problemInfo?.avgExecutionTime > 0 && (
                <>
                  {' '}
                  •{' '}
                  <Text as="span" fontWeight="bold">
                    Average Execution Time:
                  </Text>{' '}
                  {selectedTdProblemData?.problemInfo?.avgExecutionTime.toFixed(2)}ms
                </>
              )}
            </Text>
          </Box>

          <Box {...surfaceProps} overflow="hidden">
            <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
              <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
                BREACH RANKINGS
              </Text>
            </Box>

            <TableContainer
              bg="rgba(255,255,255,0.14)"
              overflowX={{ base: 'auto', md: 'auto' }}
              overflowY="hidden"
              width="100%"
              sx={{ WebkitOverflowScrolling: 'touch' }}
            >
              <Table
                variant="unstyled"
                size={{ base: 'sm', md: 'md' }}
                minW={{ base: '720px', md: '100%' }}
              >
                <Thead>
                  <Tr bg="var(--cg-window-face)">
                    <Th {...headerCellProps}>Rank</Th>
                    <Th {...headerCellProps}>Username</Th>
                    {tdMode === 'endless' ? (
                      <>
                        <Th {...headerCellProps}>Endless Score</Th>
                        <Th {...headerCellProps}>Endless Waves</Th>
                        <Th {...headerCellProps} display={{ base: 'none', md: 'table-cell' }}>
                          Survival Time
                        </Th>
                      </>
                    ) : (
                      <>
                        <Th {...headerCellProps}>Score</Th>
                        <Th {...headerCellProps}>Best Time</Th>
                        <Th {...headerCellProps} display={{ base: 'none', md: 'table-cell' }}>
                          Avg Runtime
                        </Th>
                        <Th {...headerCellProps} display={{ base: 'none', md: 'table-cell' }}>
                          Avg Memory
                        </Th>
                        <Th {...headerCellProps} display={{ base: 'none', md: 'table-cell' }}>
                          Solution
                        </Th>
                        <Th {...headerCellProps} display={{ base: 'none', md: 'table-cell' }}>
                          Status
                        </Th>
                      </>
                    )}
                  </Tr>
                </Thead>
                <Tbody>
                  {getCurrentTdPageData().length > 0 ? (
                    getCurrentTdPageData().map((entry, index) => (
                      <MotionBox
                        as={Tr}
                        key={index}
                        variants={item}
                        transition={{ type: 'spring', stiffness: 100 }}
                        borderBottom="1px solid var(--cg-window-mid)"
                        bg={index % 2 === 0 ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.12)'}
                        _hover={{
                          bg: 'rgba(255,255,255,0.4)',
                        }}
                      >
                        <Td
                          color={
                            index + (tdCurrentPage - 1) * entriesPerPage < 3
                              ? 'var(--cg-accent-amber)'
                              : 'var(--cg-text)'
                          }
                          fontFamily="var(--cg-font-retro-display)"
                          fontWeight="bold"
                        >
                          {index + 1 + (tdCurrentPage - 1) * entriesPerPage}
                        </Td>
                        <Td color="var(--cg-text)" fontFamily="var(--cg-font-retro-display)">
                          {entry.userId ? (
                            <ChakraLink
                              as={RouterLink}
                              to={`/profile/${entry.userId}`}
                              color="var(--cg-link)"
                              _hover={{ textDecoration: 'underline', color: 'var(--cg-link)' }}
                            >
                              {entry.username}
                            </ChakraLink>
                          ) : (
                            entry.username
                          )}
                        </Td>
                        {tdMode === 'endless' ? (
                          <>
                            <Td
                              color="var(--cg-accent-green)"
                              fontFamily="var(--cg-font-retro-display)"
                            >
                              {entry.endlessScore || 0}
                            </Td>
                            <Td color="var(--cg-link)" fontFamily="var(--cg-font-retro-display)">
                              {entry.endlessWaves || 0}
                            </Td>
                            <Td
                              color="var(--cg-accent-amber)"
                              fontFamily="var(--cg-font-retro-display)"
                              display={{ base: 'none', md: 'table-cell' }}
                            >
                              {formatSeconds(entry.endlessSurvivalTime || 0)}
                            </Td>
                          </>
                        ) : (
                          <>
                            <Td
                              color="var(--cg-accent-green)"
                              fontFamily="var(--cg-font-retro-display)"
                            >
                              {entry.score}
                            </Td>
                            <Td color="var(--cg-link)" fontFamily="var(--cg-font-retro-display)">
                              {entry.bestTime}s
                            </Td>
                            <Td
                              color="var(--cg-accent-amber)"
                              fontFamily="var(--cg-font-retro-display)"
                              display={{ base: 'none', md: 'table-cell' }}
                            >
                              {entry.avgRuntime ? entry.avgRuntime.toFixed(2) : '0.00'}ms
                            </Td>
                            <Td
                              color="var(--cg-accent-amber)"
                              fontFamily="var(--cg-font-retro-display)"
                              display={{ base: 'none', md: 'table-cell' }}
                            >
                              {entry.avgMemory ? entry.avgMemory.toFixed(2) : '0.00'}MB
                            </Td>
                            <Td
                              color={
                                entry.solutionStatus
                                  ? 'var(--cg-accent-green)'
                                  : 'var(--cg-accent-red)'
                              }
                              fontFamily="var(--cg-font-retro-display)"
                              display={{ base: 'none', md: 'table-cell' }}
                            >
                              {entry.solutionStatus ? 'Accepted' : 'Rejected'}
                            </Td>
                            <Td
                              color={
                                entry.gameStatus ? 'var(--cg-accent-green)' : 'var(--cg-accent-red)'
                              }
                              fontFamily="var(--cg-font-retro-display)"
                              display={{ base: 'none', md: 'table-cell' }}
                            >
                              {entry.gameStatus ? 'Victory' : 'Defeat'}
                            </Td>
                          </>
                        )}
                      </MotionBox>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={tdMode === 'endless' ? 5 : 8} textAlign="center" py={8}>
                        <VStack spacing={4}>
                          <Text
                            color="var(--cg-text)"
                            fontSize="lg"
                            fontFamily="var(--cg-font-retro-display)"
                          >
                            {tdMode === 'endless'
                              ? 'NO ENDLESS RUNS RECORDED'
                              : 'NO BREACH ATTEMPTS RECORDED'}
                          </Text>
                          <Text color="var(--cg-muted)" fontFamily="var(--cg-font-retro-display)">
                            {tdMode === 'endless'
                              ? 'Survive endless waves to establish your legend.'
                              : 'Be the first to hack this system and establish your reputation.'}
                          </Text>
                        </VStack>
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        </VStack>
      )}

      {selectedProblemKey && selectedLeaderboard && (
        <Box {...surfaceProps} p={{ base: 3, md: 4 }}>
          <Stack
            direction={{ base: 'column', md: 'row' }}
            justify="center"
            align="center"
            spacing={{ base: 2, md: 4 }}
          >
            <IconButton
              icon={<ChevronLeftIcon />}
              aria-label="Previous page"
              onClick={() => setTdCurrentPage((prev) => Math.max(1, prev - 1))}
              isDisabled={tdCurrentPage === 1}
              size="sm"
              _disabled={{
                opacity: 0.4,
                cursor: 'not-allowed',
                boxShadow: 'var(--cg-window-inset)',
              }}
            />
            <Text color="var(--cg-text)" fontFamily="var(--cg-font-retro-display)">
              PAGE {tdCurrentPage} OF {tdTotalPages}
            </Text>
            <IconButton
              icon={<ChevronRightIcon />}
              aria-label="Next page"
              onClick={() => setTdCurrentPage((prev) => Math.min(tdTotalPages, prev + 1))}
              isDisabled={tdCurrentPage === tdTotalPages}
              size="sm"
              _disabled={{
                opacity: 0.4,
                cursor: 'not-allowed',
                boxShadow: 'var(--cg-window-inset)',
              }}
            />
          </Stack>
        </Box>
      )}
    </VStack>
  );
}

export default TowerDefenseLeaderboardPanel;
