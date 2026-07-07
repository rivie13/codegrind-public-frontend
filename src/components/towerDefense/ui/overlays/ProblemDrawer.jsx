import {
  Box,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Heading,
  List,
  ListIcon,
  ListItem,
  Progress,
  Text,
} from '@chakra-ui/react';
import React from 'react';
import { FaShieldAlt, FaTerminal } from 'react-icons/fa';

const stripHtmlTags = (html) => {
  if (!html) return '';
  return html.replace(/<\/?[^>]+(>|$)/g, '');
};

const parseAIProblemExamples = (examples) => {
  if (!examples || examples.length === 0) return [];

  try {
    // If examples is already an array of objects with input/output/explanation, return it
    if (Array.isArray(examples) && typeof examples[0] === 'object' && examples[0].input) {
      return examples;
    }

    // If examples is a string, try to parse it as JSON
    let parsedExamples;
    try {
      parsedExamples = Array.isArray(examples) ? examples : JSON.parse(examples);
    } catch (jsonError) {
      console.warn('Failed to parse examples as JSON, treating as plain string:', jsonError);
      // If it's not valid JSON, treat the entire string as a single example
      parsedExamples = [examples];
    }

    // Map each example HTML string to an object with input, output, and explanation
    return parsedExamples.map((example) => {
      if (typeof example !== 'string') return example;

      // Extract input, output, and explanation from the HTML content using more flexible regex
      const inputMatch = example.match(
        /<strong>Input:<\/strong>\s*(.*?)(?:<br>|,<br>|<\/p>|<strong>)/i
      );
      const outputMatch = example.match(
        /<strong>Output:<\/strong>\s*(.*?)(?:<br>|,<br>|<\/p>|<strong>)/i
      );
      const explanationMatch = example.match(/<strong>Explanation:<\/strong>\s*(.*?)(?:<\/p>|$)/i);

      // Handle other potential formats by direct detection of sections
      if (!inputMatch && !outputMatch) {
        // Try alternative pattern matching if we couldn't find input/output
        const inputAltMatch = example.match(/Input:?\s*(.*?)(?:Output|$)/i);
        const outputAltMatch = example.match(/Output:?\s*(.*?)(?:Explanation|$)/i);
        const explanationAltMatch = example.match(/Explanation:?\s*(.*?)$/i);

        return {
          input: inputAltMatch ? stripHtmlTags(inputAltMatch[1]).trim() : '',
          output: outputAltMatch ? stripHtmlTags(outputAltMatch[1]).trim() : '',
          explanation: explanationAltMatch ? stripHtmlTags(explanationAltMatch[1]).trim() : '',
        };
      }

      return {
        input: inputMatch ? stripHtmlTags(inputMatch[1]).trim() : '',
        output: outputMatch ? stripHtmlTags(outputMatch[1]).trim() : '',
        explanation: explanationMatch ? stripHtmlTags(explanationMatch[1]).trim() : '',
      };
    });
  } catch (error) {
    console.error('Error parsing AI problem examples:', error);
    console.error('Original examples data:', examples);

    // Last resort fallback - if all else fails, return a simple formatted example
    if (typeof examples === 'string') {
      return [
        {
          input: 'Could not parse',
          output: 'Could not parse',
          explanation: stripHtmlTags(examples),
        },
      ];
    }
    return [];
  }
};

const ProblemDrawer = ({
  isOpen,
  onClose,
  problem,
  problemDescription,
  currentWave,
  parseAIProblemExamplesFromProps,
}) => {
  // Use our local implementation if no parser provided via props
  const parseExamplesFunc = parseAIProblemExamplesFromProps || parseAIProblemExamples;

  // Debug output to help diagnose issues
  React.useEffect(() => {
    if (problem) {
      // console.log("ProblemDrawer received problem:", {
      //   title: problem.title,
      //   source: problem.source,
      //   hasExamples: !!problem.examples,
      //   examplesCount: problem.examples?.length || 0
      // });
    }
  }, [problem]);

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="lg">
      <DrawerOverlay backgroundColor="rgba(0,0,0,0.7)" backdropFilter="blur(2px)" />
      <DrawerContent
        bg="#0a0a14"
        color="white"
        borderLeft="1px solid cyan.700"
        boxShadow="0 0 20px rgba(0, 170, 255, 0.3)"
      >
        <DrawerCloseButton color="cyan.400" />
        <DrawerHeader
          borderBottom="1px solid"
          borderColor="cyan.900"
          bgGradient="linear(to-r, #000614, #001a2c)"
        >
          <Flex alignItems="center" gap={2}>
            <FaTerminal color="#00ccff" />
            <Text
              bgGradient="linear(to-r, cyan.400, green.400)"
              bgClip="text"
              fontFamily="'Orbitron', sans-serif"
              textShadow="0 0 5px #00ccff"
              letterSpacing="1px"
              fontSize="lg"
            >
              Mission Briefing: {problemDescription?.title || 'Tower Defense Hack'}
            </Text>
          </Flex>
        </DrawerHeader>
        <DrawerBody>
          <Box
            mb={6}
            p={4}
            bg="rgba(0,200,255,0.1)"
            borderRadius="md"
            border="1px solid"
            borderColor="cyan.900"
            boxShadow="0 0 10px rgba(0, 170, 255, 0.2) inset"
          >
            <Text
              fontStyle="italic"
              color="cyan.300"
              mb={3}
              fontFamily="'Orbitron', sans-serif"
              textShadow="0 0 3px #00ccff"
              fontSize="sm"
            >
              {problemDescription?.hackingContext ||
                'Breach the system by building a tower defense solution.'}
            </Text>
            <Progress size="xs" colorScheme="cyan" value={20 * currentWave} mb={2} />
            <Text fontSize="sm" color="#00ccff" fontFamily="'Orbitron', sans-serif">
              Breach Progress: {20 * currentWave}%
            </Text>
          </Box>

          <Box
            p={4}
            bg="rgba(10,20,30,0.7)"
            borderRadius="md"
            mb={4}
            border="1px solid #001a2c"
            boxShadow="0 0 10px rgba(0, 100, 255, 0.1) inset"
          >
            {/* Display problem content based on problem type */}
            {problem && (problem.source === 'LEETCODE' || problem.source === 'CODEGRIND') ? (
              // For LeetCode problems, display the HTML directly
              <Box
                className="problem-description"
                sx={{
                  p: { mb: 3 },
                  pre: {
                    bg: 'rgba(0,10,20,0.9)',
                    p: 3,
                    borderRadius: 'md',
                    mb: 4,
                    overflowX: 'auto',
                    border: '1px solid #001a2c',
                    boxShadow: '0 0 5px rgba(0, 170, 255, 0.1) inset',
                  },
                  code: {
                    fontFamily: 'monospace',
                    bg: 'rgba(0,10,20,0.9)',
                    px: 1,
                    borderRadius: 'sm',
                    color: '#00ffcc',
                  },
                  ul: { pl: 6, mb: 4 },
                  li: { mb: 2 },
                  strong: {
                    color: 'cyan.300',
                    fontFamily: "'Orbitron', sans-serif",
                    textShadow: '0 0 2px #00ccff',
                  },
                  sup: { fontSize: 'xs', verticalAlign: 'super' },
                }}
                dangerouslySetInnerHTML={{ __html: problem.content }}
              />
            ) : (
              // For AI problems, display content from dedicated fields
              <>
                {/* Description */}
                <Box mb={5}>
                  <Box
                    dangerouslySetInnerHTML={{ __html: problem.content }}
                    sx={{
                      p: { mb: 3 },
                      code: {
                        fontFamily: 'monospace',
                        bg: 'rgba(0,10,20,0.9)',
                        px: 1,
                        borderRadius: 'sm',
                        color: '#00ffcc',
                      },
                    }}
                  />
                </Box>

                {/* Examples */}
                {(problemDescription?.examples?.length > 0 || problem?.examples) && (
                  <Box mb={5}>
                    <Heading
                      size="md"
                      color="cyan.300"
                      mb={3}
                      fontFamily="'Orbitron', sans-serif"
                      textShadow="0 0 4px #00ccff"
                    >
                      Examples
                    </Heading>
                    {/* Check if it's an AI problem with examples */}
                    {problem?.source === 'AI' && problem?.examples
                      ? // For AI problems, directly render the examples array as HTML
                        problem.examples.map((example, idx) => (
                          <Box
                            key={idx}
                            mb={4}
                            p={3}
                            bg="rgba(0,15,30,0.9)"
                            borderRadius="md"
                            border="1px solid #002a3c"
                            boxShadow="0 0 8px rgba(0, 170, 255, 0.1) inset"
                            dangerouslySetInnerHTML={{ __html: example }}
                            sx={{
                              p: { mb: 3 },
                              strong: { color: 'cyan.300' },
                              br: { mb: 1 },
                              code: {
                                fontFamily: 'monospace',
                                bg: 'rgba(0,10,20,0.9)',
                                px: 1,
                                borderRadius: 'sm',
                                color: '#00ffcc',
                              },
                            }}
                          />
                        ))
                      : // For LeetCode problems or if using problemDescription
                        (problemDescription?.examples?.length > 0
                          ? problemDescription.examples
                          : parseExamplesFunc(problem?.examples)
                        ).map((example, idx) => (
                          <Box
                            key={idx}
                            mb={4}
                            p={3}
                            bg="rgba(0,15,30,0.9)"
                            borderRadius="md"
                            border="1px solid #002a3c"
                            boxShadow="0 0 8px rgba(0, 170, 255, 0.1) inset"
                          >
                            <Text mb={1}>
                              <Text
                                as="span"
                                fontWeight="bold"
                                fontFamily="'Orbitron', sans-serif"
                                color="#00ccff"
                                textShadow="0 0 2px #00ccff"
                              >
                                Input:
                              </Text>{' '}
                              {example.input}
                            </Text>
                            <Text mb={1}>
                              <Text
                                as="span"
                                fontWeight="bold"
                                fontFamily="'Orbitron', sans-serif"
                                color="#00ccff"
                                textShadow="0 0 2px #00ccff"
                              >
                                Output:
                              </Text>{' '}
                              {example.output}
                            </Text>
                            {example.explanation && (
                              <Text fontSize="sm" color="gray.400">
                                <Text
                                  as="span"
                                  fontWeight="bold"
                                  fontFamily="'Orbitron', sans-serif"
                                  color="#00ccff"
                                  textShadow="0 0 2px #00ccff"
                                >
                                  Explanation:
                                </Text>{' '}
                                {example.explanation}
                              </Text>
                            )}
                          </Box>
                        ))}
                  </Box>
                )}

                {/* Constraints */}
                {(problem.constraints ||
                  problemDescription?.constraints ||
                  problemDescription?.rawConstraints) && (
                  <Box mb={3}>
                    <Heading
                      size="md"
                      color="cyan.300"
                      mb={3}
                      fontFamily="'Orbitron', sans-serif"
                      textShadow="0 0 4px #00ccff"
                    >
                      Constraints
                    </Heading>

                    {/* For AI problems, display constraints directly from the database */}
                    {problemDescription?.isAIProblem ? (
                      <List
                        spacing={3}
                        p={3}
                        bg="rgba(0,15,30,0.9)"
                        borderRadius="md"
                        border="1px solid #002a3c"
                        boxShadow="0 0 8px rgba(0, 170, 255, 0.1) inset"
                      >
                        {typeof problem.constraints === 'string' ? (
                          // If it's a string that might be HTML
                          problem.constraints.includes('<ul>') ||
                          problem.constraints.includes('<li>') ? (
                            <Box
                              p={3}
                              bg="rgba(0,15,30,0.9)"
                              borderRadius="md"
                              className="constraints-container"
                              sx={{
                                ul: { pl: 6, margin: 0 },
                                li: { mb: 2 },
                                code: {
                                  fontFamily: 'monospace',
                                  bg: 'rgba(0,10,20,0.9)',
                                  px: 1,
                                  borderRadius: 'sm',
                                  color: '#00ffcc',
                                },
                                sup: { fontSize: 'xs', verticalAlign: 'super' },
                              }}
                              dangerouslySetInnerHTML={{ __html: problem.constraints }}
                            />
                          ) : (
                            // If it's a plain string, split by newlines or common separators
                            problem.constraints.split(/\n|\r\n|•|-|•/).map((constraint, idx) => (
                              <ListItem key={idx} display="flex" alignItems="flex-start">
                                <ListIcon as={FaShieldAlt} color="cyan.400" mt={1} />
                                <Text>{stripHtmlTags(constraint).trim()}</Text>
                              </ListItem>
                            ))
                          )
                        ) : Array.isArray(problem.constraints) ? (
                          // If it's already an array
                          problem.constraints.map((constraint, idx) => (
                            <ListItem key={idx} display="flex" alignItems="flex-start">
                              <ListIcon as={FaShieldAlt} color="cyan.400" mt={1} />
                              <Text>
                                {typeof constraint === 'string'
                                  ? stripHtmlTags(constraint)
                                  : JSON.stringify(constraint)}
                              </Text>
                            </ListItem>
                          ))
                        ) : (
                          <ListItem display="flex" alignItems="flex-start">
                            <ListIcon as={FaShieldAlt} color="cyan.400" mt={1} />
                            <Text>No constraints specified for this problem.</Text>
                          </ListItem>
                        )}
                      </List>
                    ) : // For LeetCode problems, use the previous logic
                    typeof problem.constraints === 'string' ? (
                      // Fallback for other string formats
                      <Box
                        p={3}
                        bg="rgba(0,15,30,0.9)"
                        borderRadius="md"
                        border="1px solid #002a3c"
                        boxShadow="0 0 8px rgba(0, 170, 255, 0.1) inset"
                        sx={{
                          ul: { pl: 6, margin: 0 },
                          li: { mb: 2 },
                          code: {
                            fontFamily: 'monospace',
                            bg: 'rgba(0,10,20,0.9)',
                            px: 1,
                            borderRadius: 'sm',
                            color: '#00ffcc',
                          },
                        }}
                        dangerouslySetInnerHTML={{ __html: problem.constraints }}
                      />
                    ) : Array.isArray(problem.constraints) ? (
                      // Handle array of constraints
                      <List
                        spacing={3}
                        p={3}
                        bg="rgba(0,15,30,0.9)"
                        borderRadius="md"
                        border="1px solid #002a3c"
                        boxShadow="0 0 8px rgba(0, 170, 255, 0.1) inset"
                      >
                        {problem.constraints.map((constraint, idx) => (
                          <ListItem key={idx} display="flex" alignItems="flex-start">
                            <ListIcon as={FaShieldAlt} color="cyan.400" mt={1} />
                            <Text>{constraint}</Text>
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      // Final fallback
                      <Text
                        color="gray.400"
                        p={3}
                        bg="rgba(0,15,30,0.9)"
                        borderRadius="md"
                        border="1px solid #002a3c"
                      >
                        No specific constraints provided for this problem.
                      </Text>
                    )}
                  </Box>
                )}
              </>
            )}
          </Box>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default ProblemDrawer;
