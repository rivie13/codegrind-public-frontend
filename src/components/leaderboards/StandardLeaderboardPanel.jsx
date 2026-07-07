import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '@chakra-ui/icons';
import {
  Box,
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

function StandardLeaderboardPanel({
  selectedSource,
  setSelectedSource,
  searchQuery,
  setSearchQuery,
  getSelectedProblem,
  setSelectedProblem,
  getCurrentProblemsList,
  leaderboardData,
  selectedProblemData,
  getCurrentPageData,
  currentPage,
  setCurrentPage,
  entriesPerPage,
}) {
  const selectedProblemKey = getSelectedProblem();
  const selectedLeaderboard = selectedProblemKey ? leaderboardData[selectedProblemKey] : null;
  const totalPages = selectedLeaderboard
    ? Math.ceil(selectedLeaderboard.scores.length / entriesPerPage)
    : 1;

  return (
    <VStack spacing={4} align="stretch">
      <Box {...surfaceProps} overflow="hidden">
        <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
          <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
            SCORE FILTERS
          </Text>
        </Box>

        <Stack
          spacing={3}
          direction={{ base: 'column', md: 'row' }}
          align="stretch"
          p={{ base: 3, md: 4 }}
          bg="rgba(255,255,255,0.14)"
        >
          <Select
            value={selectedSource}
            onChange={(event) => {
              const newSource = event.target.value;
              setSelectedSource(newSource);
              setCurrentPage(1);
            }}
            width={{ base: '100%', md: '200px' }}
            {...fieldProps}
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

          <InputGroup flex="1">
            <Input
              placeholder="Search by problem number or name..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              {...fieldProps}
            />
            {searchQuery && (
              <InputRightElement>
                <IconButton
                  icon={<CloseIcon />}
                  size="sm"
                  variant="ghost"
                  color="var(--cg-text)"
                  _hover={{ color: 'var(--cg-link)' }}
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                />
              </InputRightElement>
            )}
          </InputGroup>

          <Select
            value={selectedProblemKey}
            onChange={(event) => {
              setSelectedProblem(event.target.value);
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
            {getCurrentProblemsList().map((problem, index) => (
              <option key={index} value={problem.key}>
                {problem.questionId ? `${problem.questionId}. ` : ''}
                {problem.title}
              </option>
            ))}
          </Select>
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
              {selectedProblemData?.problemInfo?.title} •
              <Text as="span" fontWeight="bold">
                {' '}
                Difficulty:
              </Text>{' '}
              {selectedProblemData?.problemInfo?.difficulty} •
              <Text as="span" fontWeight="bold">
                {' '}
                Total Submissions:
              </Text>{' '}
              {selectedProblemData?.problemInfo?.totalSubmissions}
              {selectedProblemData?.problemInfo?.avgExecutionTime > 0 && (
                <>
                  {' '}
                  •{' '}
                  <Text as="span" fontWeight="bold">
                    Average Execution Time:
                  </Text>{' '}
                  {selectedProblemData?.problemInfo?.avgExecutionTime.toFixed(2)}ms
                </>
              )}
            </Text>
          </Box>

          <Box {...surfaceProps} overflow="hidden">
            <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
              <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
                RANKINGS
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
                    <Th {...headerCellProps}>High Score</Th>
                    <Th {...headerCellProps}>Best Time</Th>
                    <Th {...headerCellProps} display={{ base: 'none', md: 'table-cell' }}>
                      Avg Runtime
                    </Th>
                    <Th {...headerCellProps} display={{ base: 'none', md: 'table-cell' }}>
                      Avg Memory
                    </Th>
                    <Th {...headerCellProps} display={{ base: 'none', md: 'table-cell' }}>
                      Submissions
                    </Th>
                  </Tr>
                </Thead>

                <Tbody>
                  {getCurrentPageData().length > 0 ? (
                    getCurrentPageData().map((entry, index) => (
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
                            index + (currentPage - 1) * entriesPerPage < 3
                              ? 'var(--cg-accent-amber)'
                              : 'var(--cg-text)'
                          }
                          fontFamily="var(--cg-font-retro-display)"
                          fontWeight="bold"
                        >
                          {index + 1 + (currentPage - 1) * entriesPerPage}
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
                        <Td
                          color="var(--cg-accent-green)"
                          fontFamily="var(--cg-font-retro-display)"
                        >
                          {entry.highScore}
                        </Td>
                        <Td color="var(--cg-link)" fontFamily="var(--cg-font-retro-display)">
                          {entry.bestTime}s
                        </Td>
                        <Td
                          color="var(--cg-accent-amber)"
                          fontFamily="var(--cg-font-retro-display)"
                          display={{ base: 'none', md: 'table-cell' }}
                        >
                          {entry.avgRuntime.toFixed(2)}ms
                        </Td>
                        <Td
                          color="var(--cg-accent-amber)"
                          fontFamily="var(--cg-font-retro-display)"
                          display={{ base: 'none', md: 'table-cell' }}
                        >
                          {entry.avgMemory.toFixed(2)}MB
                        </Td>
                        <Td
                          color="var(--cg-link)"
                          fontFamily="var(--cg-font-retro-display)"
                          display={{ base: 'none', md: 'table-cell' }}
                        >
                          {entry.totalSubmissions}
                        </Td>
                      </MotionBox>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={7} textAlign="center" py={8}>
                        <VStack spacing={4}>
                          <Text
                            color="var(--cg-text)"
                            fontSize="lg"
                            fontFamily="var(--cg-font-retro-display)"
                          >
                            NO DATA FOUND
                          </Text>
                          <Text color="var(--cg-muted)" fontFamily="var(--cg-font-retro-display)">
                            Be the first to conquer this challenge and claim your position.
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
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              isDisabled={currentPage === 1}
              size="sm"
              _disabled={{
                opacity: 0.4,
                cursor: 'not-allowed',
                boxShadow: 'var(--cg-window-inset)',
              }}
            />

            <Text color="var(--cg-text)" fontFamily="var(--cg-font-retro-display)">
              PAGE {currentPage} OF {totalPages}
            </Text>

            <IconButton
              icon={<ChevronRightIcon />}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              isDisabled={currentPage === totalPages}
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

export default StandardLeaderboardPanel;
