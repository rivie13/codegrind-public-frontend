import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Icon,
  Select,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import DOMPurify from 'dompurify';
import { useEffect, useState } from 'react';
import { FiPlus, FiRefreshCcw } from 'react-icons/fi';
import ModelSelector from '../../common/ModelSelector';
import { RetroInset, RetroPanel } from '../../retro/RetroPageShell';

const FIELD_LABEL_PROPS = {
  color: 'var(--cg-muted)',
  fontSize: 'xs',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  mb: 2,
};

const LANGUAGE_OPTIONS = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
];

/**
 * Form component for AI problem generation parameters
 *
 * @param {Object} props
 * @param {string} props.problemType - Selected problem type
 * @param {Function} props.setProblemType - Setter for problem type
 * @param {number} props.difficultyLevel - Selected difficulty level (1-10)
 * @param {Function} props.setDifficultyLevel - Setter for difficulty level
 * @param {number} props.wackiness - Selected wackiness level (1-10)
 * @param {Function} props.setWackiness - Setter for wackiness level
 * @param {string} props.language - Selected programming language
 * @param {Function} props.setLanguage - Setter for language
 * @param {string} props.aiModel - Selected AI model
 * @param {Function} props.setAIModel - Setter for AI model
 * @param {string} props.additionalInfo - Additional information text
 * @param {Function} props.setAdditionalInfo - Setter for additional info
 * @param {boolean} props.isGenerating - Whether generation is in progress
 * @param {Function} props.handleGenerate - Handler for generate button
 * @param {Function} props.handleReset - Handler for reset button
 * @param {Object} props.generationRateLimit - Rate limit data for generation
 * @param {boolean} props.isRateLimitLoading - Whether rate limit data is loading
 */
const ProblemParametersForm = ({
  problemType,
  setProblemType,
  difficultyLevel,
  setDifficultyLevel,
  wackiness,
  setWackiness,
  language,
  setLanguage,
  aiModel,
  setAIModel,
  additionalInfo,
  setAdditionalInfo,
  isGenerating,
  handleGenerate,
  handleReset,
  generationRateLimit,
  isRateLimitLoading,
}) => {
  const [resetCountdown, setResetCountdown] = useState(null);
  const [cooldownCountdown, setCooldownCountdown] = useState(null);

  useEffect(() => {
    if (!generationRateLimit) {
      setResetCountdown(null);
      setCooldownCountdown(null);
      return;
    }

    setResetCountdown(generationRateLimit.resetIn ?? null);
    setCooldownCountdown(generationRateLimit.adCooldownRemaining ?? null);

    const intervalId = setInterval(() => {
      setResetCountdown((prev) => (typeof prev === 'number' ? Math.max(prev - 1, 0) : prev));
      setCooldownCountdown((prev) => (typeof prev === 'number' ? Math.max(prev - 1, 0) : prev));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [generationRateLimit]);

  const formatSeconds = (seconds) => {
    if (seconds === null || seconds === undefined) return '—';
    const total = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const formatPeriod = (periodMs) => {
    if (!periodMs) return 'per period';
    const hours = periodMs / (60 * 60 * 1000);
    if (hours >= 24) return 'per 24h';
    if (hours >= 1) return `per ${Math.round(hours)}h`;
    const minutes = Math.max(1, Math.round(periodMs / 60000));
    return `per ${minutes}m`;
  };

  const remainingTotal = generationRateLimit?.unlimited
    ? '∞'
    : (generationRateLimit?.totalRemaining ?? generationRateLimit?.remaining ?? '—');
  const limitTotal = generationRateLimit?.unlimited ? '∞' : (generationRateLimit?.limit ?? '—');
  const resetAtLabel = generationRateLimit?.reset
    ? new Date(generationRateLimit.reset).toLocaleTimeString()
    : null;
  const cooldownReady = (cooldownCountdown ?? 0) <= 0;
  const cooldownText = cooldownReady ? 'Ready' : `In ${formatSeconds(cooldownCountdown)}`;

  return (
    <RetroPanel
      fileLabel="params.ini"
      title="Problem Parameters"
      subtitle="Set the scope, difficulty, language, and model before you generate a new draft."
    >
      <VStack spacing={5} align="stretch">
        <FormControl>
          <FormLabel {...FIELD_LABEL_PROPS}>Problem Type</FormLabel>
          <Select
            value={problemType}
            onChange={(e) => setProblemType(e.target.value)}
            sx={{
              '& option': {
                color: 'var(--cg-text)',
              },
              '& optgroup': {
                color: 'var(--cg-text)',
                fontWeight: 'bold',
              },
            }}
          >
            <option value="random">Random (Surprise me!)</option>

            <optgroup label="Beginner Friendly">
              <option value="variables">Variables & Basic Operations</option>
              <option value="conditionals">Conditional Logic (if/else)</option>
              <option value="loops">Simple Loops</option>
              <option value="math">Basic Math Problems</option>
              <option value="string-basic">String Manipulation (Basic)</option>
              <option value="array-basic">Array Basics</option>
            </optgroup>

            <optgroup label="Intermediate">
              <option value="array">Array Manipulation</option>
              <option value="string">String Processing</option>
              <option value="hash">Hash Tables/Dictionaries</option>
              <option value="sorting">Sorting & Searching</option>
              <option value="recursion">Recursion</option>
              <option value="two-pointers">Two Pointers Technique</option>
              <option value="simulation">Simulation Problems</option>
              <option value="linked-list">Linked Lists</option>
              <option value="stack">Stacks</option>
              <option value="queue">Queues</option>
            </optgroup>

            <optgroup label="Advanced">
              <option value="tree">Tree Traversal & Manipulation</option>
              <option value="graph">Graph Algorithms</option>
              <option value="dp">Dynamic Programming</option>
              <option value="greedy">Greedy Algorithms</option>
              <option value="binary-search">Binary Search Applications</option>
              <option value="bit-manipulation">Bit Manipulation</option>
              <option value="backtracking">Backtracking</option>
              <option value="divide-conquer">Divide & Conquer</option>
              <option value="trie">Trie Data Structure</option>
              <option value="heap">Heap/Priority Queue</option>
            </optgroup>
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel {...FIELD_LABEL_PROPS}>Difficulty Level ({difficultyLevel}/10)</FormLabel>
          <Box mb={2}>
            <Flex justify="space-between">
              <Text fontSize="sm" color="var(--cg-accent-green)">
                Easy (1-3)
              </Text>
              <Text fontSize="sm" color="var(--cg-accent-amber)">
                Medium (4-7)
              </Text>
              <Text fontSize="sm" color="var(--cg-accent-red)">
                Hard (8-10)
              </Text>
            </Flex>
          </Box>
          <Slider
            value={difficultyLevel}
            onChange={(val) => setDifficultyLevel(val)}
            min={1}
            max={10}
            step={1}
            mb={2}
          >
            <SliderTrack bg="rgba(0, 0, 0, 0.15)">
              <SliderFilledTrack bg="linear-gradient(90deg, var(--cg-accent-green), var(--cg-link), var(--cg-accent-red))" />
            </SliderTrack>
            <SliderThumb
              boxSize={6}
              boxShadow="var(--cg-window-outset)"
              borderWidth="1px"
              borderColor="var(--cg-window-shadow)"
              bg="var(--cg-window)"
            >
              <Text fontSize="xs" fontWeight="bold" color="var(--cg-text)">
                {difficultyLevel}
              </Text>
            </SliderThumb>
          </Slider>
          <Flex justify="space-between">
            <Text fontSize="xs" color="var(--cg-muted)">
              Beginner
            </Text>
            <Text fontSize="xs" color="var(--cg-muted)">
              Graduate level
            </Text>
          </Flex>
        </FormControl>

        <FormControl>
          <FormLabel {...FIELD_LABEL_PROPS}>Wackiness Level ({wackiness}/10)</FormLabel>
          <Box mb={2}>
            <Flex justify="space-between">
              <Text fontSize="sm" color="var(--cg-link)">
                Mild (1-3)
              </Text>
              <Text fontSize="sm" color="var(--cg-accent-amber)">
                Creative (4-7)
              </Text>
              <Text fontSize="sm" color="var(--cg-accent-red)">
                Wild (8-10)
              </Text>
            </Flex>
          </Box>
          <Slider
            value={wackiness}
            min={1}
            max={10}
            step={1}
            onChange={(val) => setWackiness(val)}
            mb={2}
          >
            <SliderTrack bg="rgba(0, 0, 0, 0.15)">
              <SliderFilledTrack bg="linear-gradient(90deg, var(--cg-link), var(--cg-accent-amber), var(--cg-accent-red))" />
            </SliderTrack>
            <SliderThumb
              boxSize={6}
              boxShadow="var(--cg-window-outset)"
              borderWidth="1px"
              borderColor="var(--cg-window-shadow)"
              bg="var(--cg-window)"
            >
              <Text fontSize="xs" fontWeight="bold" color="var(--cg-text)">
                {wackiness}
              </Text>
            </SliderThumb>
          </Slider>
          <Flex justify="space-between">
            <Text fontSize="xs" color="var(--cg-muted)">
              Standard
            </Text>
            <Text fontSize="xs" color="var(--cg-muted)">
              Outlandish
            </Text>
          </Flex>
        </FormControl>

        <FormControl>
          <FormLabel {...FIELD_LABEL_PROPS}>Programming Language</FormLabel>
          <Flex wrap="wrap" gap={2}>
            {LANGUAGE_OPTIONS.map((option) => {
              const isActive = language === option.value;

              return (
                <Button
                  key={option.value}
                  onClick={() => setLanguage(option.value)}
                  color={isActive ? 'var(--cg-link)' : 'var(--cg-text)'}
                  bg={isActive ? 'var(--cg-window-face)' : 'var(--cg-window)'}
                  boxShadow={isActive ? 'var(--cg-window-inset)' : 'var(--cg-window-outset)'}
                  border="1px solid var(--cg-window-shadow)"
                  fontWeight={isActive ? '700' : '500'}
                  px={4}
                >
                  {option.label}
                </Button>
              );
            })}
          </Flex>
        </FormControl>

        <Box sx={{ '& label': FIELD_LABEL_PROPS, '& p': { color: 'var(--cg-muted)' } }}>
          <ModelSelector
            feature="problem"
            value={aiModel}
            onChange={setAIModel}
            theme="retro-desktop"
          />
        </Box>

        <FormControl>
          <FormLabel {...FIELD_LABEL_PROPS}>Additional Information</FormLabel>
          <Textarea
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(DOMPurify.sanitize(e.target.value))}
            placeholder="Any specific themes, constraints, or requirements you'd like to include"
            rows={4}
          />
        </FormControl>

        <Box display="flex" gap={3} mt={6} mb={1} flexDirection={{ base: 'column', sm: 'row' }}>
          <Button
            leftIcon={<Icon as={FiPlus} />}
            color="var(--cg-accent-blue)"
            onClick={handleGenerate}
            isLoading={isGenerating}
            loadingText="Generating..."
            size="md"
            flex={{ sm: '1' }}
            mb={{ base: 2, sm: 0 }}
            minHeight="40px"
            fontWeight="bold"
          >
            Generate Problem
          </Button>

          <Button
            leftIcon={<Icon as={FiRefreshCcw} />}
            color="var(--cg-accent-red)"
            onClick={handleReset}
            size="md"
            width={{ base: '100%', sm: 'auto' }}
            minHeight="40px"
          >
            Reset
          </Button>
        </Box>

        <RetroInset p={4}>
          <Flex justifyContent="space-between" alignItems="center" mb={2}>
            <Text
              color="var(--cg-text)"
              fontSize="sm"
              fontWeight="700"
              textTransform="uppercase"
              letterSpacing="0.08em"
            >
              Generation Limits
            </Text>
            <Text color="var(--cg-muted)" fontSize="xs">
              {isRateLimitLoading ? 'Loading…' : 'Live'}
            </Text>
          </Flex>
          <VStack align="stretch" spacing={1} fontSize="xs" color="var(--cg-text)">
            <Text>
              Remaining: {remainingTotal} / {limitTotal}
              {generationRateLimit?.extraCredits
                ? ` (+${generationRateLimit.extraCredits} bonus)`
                : ''}
            </Text>
            <Text>
              Rate: {limitTotal} {formatPeriod(generationRateLimit?.resetPeriod)}
            </Text>
            <Text>
              Refreshes in: {formatSeconds(resetCountdown)}
              {resetAtLabel ? ` (at ${resetAtLabel})` : ''}
            </Text>
            <Text>Ad cooldown: {cooldownText}</Text>
          </VStack>
        </RetroInset>
      </VStack>
    </RetroPanel>
  );
};

export default ProblemParametersForm;
