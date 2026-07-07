import { Box, Flex, HStack, Spinner, Text, VStack } from '@chakra-ui/react';
import { RetroInset } from '../../retro/RetroPageShell';

const STEP_LABELS = {
  title: 'Generate Title',
  description: 'Generate Problem Description',
  functionName: 'Define Function Name',
  functionParams: 'Define Function Parameters',
  testCases: 'Generate Test Cases',
  expectedOutputs: 'Generate Expected Outputs',
  examples: 'Format Examples',
  codeSnippets: 'Generate Code Snippets',
  constraints: 'Define Constraints',
  solution: 'Generate Solution',
};

const STEP_ORDER = Object.keys(STEP_LABELS);

const STATUS_META = {
  completed: {
    color: 'var(--cg-accent-green)',
    bg: 'rgba(36, 106, 42, 0.14)',
    label: 'Complete',
  },
  success: {
    color: 'var(--cg-accent-green)',
    bg: 'rgba(36, 106, 42, 0.14)',
    label: 'Complete',
  },
  loading: {
    color: 'var(--cg-link)',
    bg: 'rgba(10, 56, 154, 0.12)',
    label: 'Working',
  },
  'in-progress': {
    color: 'var(--cg-link)',
    bg: 'rgba(10, 56, 154, 0.12)',
    label: 'Working',
  },
  failed: {
    color: 'var(--cg-accent-red)',
    bg: 'rgba(139, 31, 31, 0.12)',
    label: 'Error',
  },
  error: {
    color: 'var(--cg-accent-red)',
    bg: 'rgba(139, 31, 31, 0.12)',
    label: 'Error',
  },
  partial: {
    color: 'var(--cg-accent-red)',
    bg: 'rgba(139, 31, 31, 0.12)',
    label: 'Partial',
  },
  skipped: {
    color: 'var(--cg-accent-amber)',
    bg: 'rgba(118, 81, 0, 0.12)',
    label: 'Skipped',
  },
  pending: {
    color: 'var(--cg-muted)',
    bg: 'rgba(0, 0, 0, 0.08)',
    label: 'Pending',
  },
};

/**
 * Component to display the progress of AI problem generation
 *
 * @param {Object} props
 * @param {Object} props.stepStatus - Status of each generation step
 */
const GenerationProgress = ({ stepStatus }) => {
  const calculateProgress = () => {
    const steps = Object.keys(stepStatus);
    const completedSteps = steps.filter(
      (step) => stepStatus[step].status === 'completed' || stepStatus[step].status === 'success'
    ).length;

    const inProgressSteps = steps.filter(
      (step) => stepStatus[step].status === 'loading' || stepStatus[step].status === 'in-progress'
    ).length;

    // Weight in-progress steps as half complete for progress calculation
    return Math.round(((completedSteps + inProgressSteps * 0.5) / steps.length) * 100);
  };

  const progressPercent = calculateProgress();

  return (
    <RetroInset p={{ base: 4, md: 5 }}>
      <Flex justify="space-between" align="center" mb={4} gap={4} wrap="wrap">
        <Text
          color="var(--cg-text)"
          fontWeight="700"
          textTransform="uppercase"
          letterSpacing="0.08em"
        >
          Generation Progress
        </Text>
        <HStack spacing={2}>
          <Spinner color="var(--cg-link)" speed="0.8s" emptyColor="rgba(10, 56, 154, 0.18)" />
          <Text color="var(--cg-link)" fontSize="sm" fontWeight="700">
            AI working on your problem...
          </Text>
        </HStack>
      </Flex>

      <Box mb={5}>
        <Flex justify="space-between" mb={1.5}>
          <Text color="var(--cg-muted)" fontSize="sm">
            Overall progress
          </Text>
          <Text color="var(--cg-text)" fontSize="sm" fontWeight="700">
            {progressPercent}%
          </Text>
        </Flex>
        <Box
          w="100%"
          h="12px"
          bg="rgba(0, 0, 0, 0.12)"
          border="1px solid var(--cg-window-dark)"
          boxShadow="var(--cg-window-inset)"
          position="relative"
          overflow="hidden"
        >
          <Box
            h="100%"
            w={`${progressPercent}%`}
            bg="var(--cg-link)"
            transition="width 0.25s ease-out"
          />
        </Box>
      </Box>

      <VStack spacing={2.5} align="stretch">
        {STEP_ORDER.map((step) => {
          const status = stepStatus?.[step] || { status: 'pending', retryCount: 0 };
          const meta = STATUS_META[status.status] || STATUS_META.pending;

          return (
            <Flex
              key={step}
              align="center"
              justify="space-between"
              gap={3}
              p={3}
              border="1px solid var(--cg-window-dark)"
              boxShadow="var(--cg-window-inset)"
              bg={meta.bg}
            >
              <HStack spacing={3} align="center">
                <Box
                  width="12px"
                  height="12px"
                  bg={meta.color}
                  border="1px solid var(--cg-window-shadow)"
                  boxShadow="var(--cg-window-outset)"
                />
                <Box>
                  <Text color="var(--cg-text)" fontSize="sm" fontWeight="700">
                    {STEP_LABELS[step]}
                  </Text>
                  {status.error ? (
                    <Text color="var(--cg-accent-red)" fontSize="xs">
                      {status.error.substring(0, 80)}
                      {status.error.length > 80 ? '...' : ''}
                    </Text>
                  ) : null}
                </Box>
              </HStack>

              <Text
                color={meta.color}
                fontSize="xs"
                fontWeight="700"
                textTransform="uppercase"
                letterSpacing="0.08em"
              >
                {meta.label}
              </Text>
            </Flex>
          );
        })}
      </VStack>

      <Text mt={4} color="var(--cg-muted)" fontSize="xs" textAlign="center">
        Creating a custom-tailored programming challenge just for you.
      </Text>
    </RetroInset>
  );
};

export default GenerationProgress;
