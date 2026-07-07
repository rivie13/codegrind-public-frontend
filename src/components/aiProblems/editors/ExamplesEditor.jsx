import {
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiPlus, FiRefreshCcw, FiX } from 'react-icons/fi';
import { formatCompactJSON, tryParseJSON, unwrapExtraNesting } from '../utils/formatters';

const UI_FONT_FAMILY = "'Tahoma', 'MS Sans Serif', sans-serif";

const RETRO_CARD_PROPS = {
  bg: '#d4d0c8',
  border: '1px solid #7f7f7f',
  borderRadius: '0',
  boxShadow: 'var(--cg-window-outset)',
};

const RETRO_LABEL_PROPS = {
  color: '#0a2c9a',
  fontFamily: UI_FONT_FAMILY,
  fontSize: 'xs',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const RETRO_TEXTAREA_PROPS = {
  color: '#1f2430',
  bg: '#ffffff',
  border: '2px solid #7f7f7f',
  borderRadius: '0',
  boxShadow: 'var(--cg-window-inset)',
  fontFamily: 'Consolas, "Courier New", monospace',
  _hover: {
    borderColor: '#5d636e',
  },
  _focusVisible: {
    borderColor: '#0a2c9a',
    boxShadow: 'var(--cg-window-inset)',
  },
};

const createRetroButtonProps = (toneColor, overrides = {}) => ({
  bg: '#d4d0c8',
  color: toneColor,
  border: '1px solid #7f7f7f',
  borderRadius: '0',
  boxShadow: 'var(--cg-window-outset)',
  fontFamily: UI_FONT_FAMILY,
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  _hover: {
    bg: '#efebe7',
    color: toneColor,
  },
  _active: {
    boxShadow: 'var(--cg-window-inset)',
    transform: 'translateY(1px)',
  },
  ...overrides,
});

const parseExampleValues = (values) => values.map(tryParseJSON).map(unwrapExtraNesting);

const ExamplesEditor = ({
  testCases,
  expectedOutputs,
  setExamples,
  examples,
  onRegenerateExamples,
  isRegeneratingExamples,
}) => {
  const cases = useMemo(() => testCases || [], [testCases]);
  const outputs = useMemo(() => expectedOutputs || [], [expectedOutputs]);
  const aiGeneratedExamples = examples || [];

  const [localCases, setLocalCases] = useState(() => cases.map(formatCompactJSON));
  const [localOutputs, setLocalOutputs] = useState(() => outputs.map(formatCompactJSON));

  const inputRefs = useRef([]);
  const outputRefs = useRef([]);

  useEffect(() => {
    const formattedCases = cases.map(formatCompactJSON);
    const formattedOutputs = outputs.map(formatCompactJSON);

    if (JSON.stringify(cases) !== JSON.stringify(localCases.map(tryParseJSON))) {
      setLocalCases(formattedCases);
    }

    if (JSON.stringify(outputs) !== JSON.stringify(localOutputs.map(tryParseJSON))) {
      setLocalOutputs(formattedOutputs);
    }
  }, [cases, outputs, localCases, localOutputs]);

  const syncExamples = (nextCases = localCases, nextOutputs = localOutputs) => {
    setExamples({
      testCases: parseExampleValues(nextCases),
      expectedOutputs: parseExampleValues(nextOutputs),
    });
  };

  const handleInputChange = (index, value) => {
    const nextCases = [...localCases];
    nextCases[index] = value;
    setLocalCases(nextCases);
  };

  const handleOutputChange = (index, value) => {
    const nextOutputs = [...localOutputs];
    nextOutputs[index] = value;
    setLocalOutputs(nextOutputs);
  };

  const handleInputBlur = () => {
    syncExamples();
  };

  const handleOutputBlur = () => {
    syncExamples();
  };

  const prettifyJSON = () => {
    try {
      const prettifiedInputs = localCases.map((value) => {
        try {
          const parsed = JSON.parse(value);
          return JSON.stringify(parsed, null, 2);
        } catch {
          return value;
        }
      });

      const prettifiedOutputs = localOutputs.map((value) => {
        try {
          const parsed = JSON.parse(value);
          return JSON.stringify(parsed, null, 2);
        } catch {
          return value;
        }
      });

      setLocalCases(prettifiedInputs);
      setLocalOutputs(prettifiedOutputs);
    } catch (error) {
      console.error('Error formatting JSON:', error);
    }
  };

  const compactifyJSON = () => {
    try {
      const compactInputs = localCases.map((value) => {
        try {
          const parsed = JSON.parse(value);
          return JSON.stringify(parsed);
        } catch {
          return value;
        }
      });

      const compactOutputs = localOutputs.map((value) => {
        try {
          const parsed = JSON.parse(value);
          return JSON.stringify(parsed);
        } catch {
          return value;
        }
      });

      setLocalCases(compactInputs);
      setLocalOutputs(compactOutputs);
    } catch (error) {
      console.error('Error compacting JSON:', error);
    }
  };

  const handleAddExample = () => {
    const nextCases = [...localCases, '[]'];
    const nextOutputs = [...localOutputs, 'null'];

    setLocalCases(nextCases);
    setLocalOutputs(nextOutputs);
    syncExamples(nextCases, nextOutputs);
  };

  const handleDeleteExample = (index) => {
    const nextCases = [...localCases];
    const nextOutputs = [...localOutputs];

    nextCases.splice(index, 1);
    nextOutputs.splice(index, 1);

    setLocalCases(nextCases);
    setLocalOutputs(nextOutputs);
    syncExamples(nextCases, nextOutputs);
  };

  return (
    <VStack spacing={3} align="stretch">
      <Button
        leftIcon={<Icon as={FiRefreshCcw} />}
        {...createRetroButtonProps('#0a2c9a')}
        onClick={onRegenerateExamples}
        isLoading={isRegeneratingExamples}
        loadingText="Regenerating..."
        alignSelf="flex-start"
        mb={2}
      >
        Regenerate Examples with Current Test Cases
      </Button>

      {localCases.map((testCase, index) => (
        <Card key={index} variant="outline" {...RETRO_CARD_PROPS}>
          <CardBody>
            <Flex justify="space-between" align="center" mb={2} flexWrap="wrap" gap={2}>
              <Heading size="sm" color="#0a2c9a" fontFamily={UI_FONT_FAMILY}>
                Example {index + 1}:
              </Heading>
              <HStack spacing={2} flexWrap="wrap">
                <Button
                  size="sm"
                  {...createRetroButtonProps('#0a2c9a')}
                  onClick={prettifyJSON}
                  title="Format JSON"
                  fontSize="xs"
                >
                  Format JSON
                </Button>
                <Button
                  size="sm"
                  {...createRetroButtonProps('#0a2c9a')}
                  onClick={compactifyJSON}
                  title="Compact JSON"
                  fontSize="xs"
                >
                  Compact JSON
                </Button>
                <Button
                  size="sm"
                  {...createRetroButtonProps('#7d1d1d')}
                  onClick={() => handleDeleteExample(index)}
                  leftIcon={<Icon as={FiX} />}
                  fontSize="xs"
                >
                  Delete
                </Button>
              </HStack>
            </Flex>

            <FormControl mb={3}>
              <FormLabel {...RETRO_LABEL_PROPS}>Input: (Use valid JSON)</FormLabel>
              <Textarea
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                value={testCase}
                onChange={(event) => handleInputChange(index, event.target.value)}
                onBlur={handleInputBlur}
                {...RETRO_TEXTAREA_PROPS}
                minHeight="100px"
                placeholder="e.g., [5,[1,1,2,2,3]]"
              />
            </FormControl>

            <FormControl>
              <FormLabel {...RETRO_LABEL_PROPS}>Output: (Use valid JSON)</FormLabel>
              <Textarea
                ref={(element) => {
                  outputRefs.current[index] = element;
                }}
                value={localOutputs[index]}
                onChange={(event) => handleOutputChange(index, event.target.value)}
                onBlur={handleOutputBlur}
                {...RETRO_TEXTAREA_PROPS}
                minHeight="100px"
                placeholder="e.g., true or 42 or [1,2,3]"
              />
            </FormControl>
          </CardBody>
        </Card>
      ))}

      <Button
        leftIcon={<Icon as={FiPlus} />}
        {...createRetroButtonProps('#0f6f17')}
        onClick={handleAddExample}
        width="100%"
      >
        Add Example
      </Button>

      {aiGeneratedExamples.length > 0 && (
        <Box mt={4}>
          <Heading size="sm" color="#0a2c9a" fontFamily={UI_FONT_FAMILY} mb={2}>
            AI-Generated Explanations
          </Heading>
          <Card variant="outline" {...RETRO_CARD_PROPS}>
            <CardBody>
              <Box
                color="#1f2430"
                bg="#ffffff"
                border="2px solid #7f7f7f"
                boxShadow="var(--cg-window-inset)"
                p={3}
                dangerouslySetInnerHTML={{
                  __html: aiGeneratedExamples.join('<br><br>'),
                }}
                sx={{
                  '& code': {
                    bg: '#f5f0df',
                    color: '#0a2c9a',
                    padding: '0.1em 0.3em',
                    borderRadius: '0',
                    fontFamily: 'JetBrains Mono, monospace',
                    border: '1px solid #a57d4f',
                  },
                  '& p': {
                    marginBottom: '1em',
                    fontFamily: UI_FONT_FAMILY,
                  },
                }}
              />
            </CardBody>
          </Card>
        </Box>
      )}
    </VStack>
  );
};

export default ExamplesEditor;
