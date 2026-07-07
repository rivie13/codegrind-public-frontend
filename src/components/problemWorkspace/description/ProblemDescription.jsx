import { Box, Divider, Text, VStack } from '@chakra-ui/react';
import ProblemMeta from './ProblemMeta';
import TestCaseList from './TestCaseList';
import MarkdownMessage from '../../chat/MarkdownMessage';

const CONTENT_BLOCK_STYLE = {
  bg: 'rgba(255,255,255,0.18)',
  border: '1px solid var(--cg-window-dark)',
  boxShadow: 'var(--cg-window-inset)',
};

const SECTION_TITLE_STYLE = {
  color: 'var(--cg-text)',
  fontSize: { base: 'sm', md: 'md' },
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const markdownStyles = {
  '& .message-markdown': {
    color: 'var(--cg-text)',
  },
  '& .message-markdown h1, & .message-markdown h2, & .message-markdown h3, & .message-markdown h4, & .message-markdown h5, & .message-markdown h6':
    {
      color: 'var(--cg-text)',
      marginBottom: '0.85rem',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
  '& .message-markdown p': {
    marginBottom: '0.85rem',
    color: 'var(--cg-text)',
    lineHeight: '1.7',
  },
  '& .message-markdown ul, & .message-markdown ol': {
    paddingLeft: '1.5rem',
    marginBottom: '0.85rem',
  },
  '& .message-markdown li': {
    marginBottom: '0.45rem',
    color: 'var(--cg-text)',
    lineHeight: '1.6',
  },
  '& .message-markdown a': {
    color: 'var(--cg-link)',
    textDecoration: 'underline',
  },
  '& .message-markdown blockquote': {
    margin: '0.85rem 0',
    padding: '0.6rem 0.9rem',
    borderLeft: '3px solid var(--cg-link)',
    background: 'rgba(10, 56, 154, 0.08)',
    color: 'var(--cg-text)',
  },
  '& .message-markdown hr': {
    border: 'none',
    borderTop: '1px solid var(--cg-window-dark)',
    margin: '1rem 0',
  },
  '& .message-markdown code': {
    background: 'rgba(0, 0, 0, 0.12)',
    padding: '2px 6px',
    border: '1px solid var(--cg-window-dark)',
    boxShadow: 'var(--cg-window-inset)',
    color: 'var(--cg-link)',
  },
  '& .message-markdown pre': {
    background: 'rgba(0, 0, 0, 0.12)',
    border: '1px solid var(--cg-window-dark)',
    boxShadow: 'var(--cg-window-inset)',
    padding: '12px',
    margin: '0.85rem 0',
    overflowX: 'auto',
    lineHeight: 1.45,
  },
  '& .message-markdown pre code': {
    background: 'transparent',
    padding: 0,
    border: 'none',
    boxShadow: 'none',
    color: 'var(--cg-text)',
  },
  '& .code-block-container': {
    margin: '0.85rem 0',
  },
  '& .markdown-message-surface .code-block-toolbar': {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
  },
  '& .markdown-message-surface .code-copy-button': {
    alignSelf: 'flex-start',
  },
  '& h1, & h2, & h3, & h4, & h5, & h6': {
    color: 'var(--cg-text)',
    marginBottom: '1rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  '& p': {
    color: 'var(--cg-text)',
    marginBottom: '1rem',
    lineHeight: '1.7',
  },
  '& code': {
    background: 'rgba(0, 0, 0, 0.12)',
    px: 1,
    py: 0.5,
    border: '1px solid var(--cg-window-dark)',
    boxShadow: 'var(--cg-window-inset)',
    color: 'var(--cg-link)',
  },
  '& pre': {
    background: 'rgba(0, 0, 0, 0.12)',
    p: 3,
    border: '1px solid var(--cg-window-dark)',
    boxShadow: 'var(--cg-window-inset)',
    marginBottom: '1rem',
    overflowX: 'auto',
  },
  '& ul, & ol': {
    paddingLeft: '2rem',
    marginY: '1rem',
  },
  '& li': {
    marginBottom: '0.5rem',
    color: 'var(--cg-text)',
  },
  '& strong': {
    color: 'var(--cg-text)',
    fontWeight: '700',
  },
  '& em': {
    color: 'var(--cg-muted)',
  },
  '& table': {
    borderCollapse: 'collapse',
    width: '100%',
    marginBottom: '1rem',
  },
  '& th': {
    borderBottom: '1px solid var(--cg-window-dark)',
    padding: '0.5rem',
    color: 'var(--cg-text)',
    textAlign: 'left',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  '& td': {
    borderBottom: '1px solid var(--cg-window-dark)',
    padding: '0.5rem',
    color: 'var(--cg-text)',
  },
};

function SectionTitle({ children }) {
  return <Text {...SECTION_TITLE_STYLE}>{children}</Text>;
}

function RichContent({ html, useMarkdown }) {
  if (!html) return null;

  return useMarkdown ? (
    <MarkdownMessage content={html} className="message-markdown" />
  ) : (
    <Box dangerouslySetInnerHTML={{ __html: html }} />
  );
}

const ProblemDescription = ({
  problemData,
  isHighRes: _isHighRes,
  animationsEnabled: _animationsEnabled = true,
  settings: _settings = {
    gridAnimation: { enabled: true, opacity: 0.2, speed: 30 },
    scanLineAnimation: { enabled: true, opacity: 0.5, speed: 5 },
    glitchEffects: { enabled: true, intensity: 1 },
    matrixEffects: { enabled: true, intensity: 1 },
  },
  quality: _quality = 'high',
}) => {
  const isLearningProblem = Boolean(
    problemData?.problemType === 'LEARNING' || problemData?.isLearningProblem
  );

  // Check if this is an AI/CODEGRIND problem by looking for AI-specific properties
  const isAIProblem = Boolean(
    problemData?.source === 'CODEGRIND' ||
    problemData?.source === 'AI' ||
    problemData?.functionName ||
    problemData?.metadata?.functionName ||
    (problemData?.questionFrontendId && String(problemData.questionFrontendId).startsWith('AI-'))
  );

  const isAiLikeProblem = isAIProblem || isLearningProblem;

  return (
    <Box
      width="100%"
      bg="rgba(255,255,255,0.12)"
      p={{ base: 4, md: 6 }}
      overflowY="auto"
      overflowX="hidden"
      height="100%"
      minHeight="100%"
      css={{
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'var(--cg-window-face)',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'var(--cg-window-shadow)',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: 'var(--cg-window-dark)',
        },
      }}
    >
      <VStack align="start" spacing={4} w="100%">
        <ProblemMeta problemData={problemData} />

        {isAiLikeProblem ? (
          <Box w="100%">
            <Box mb={6}>
              <SectionTitle>Problem Description</SectionTitle>
              <Box p={4} mt={3} color="var(--cg-text)" sx={markdownStyles} {...CONTENT_BLOCK_STYLE}>
                <RichContent
                  html={problemData?.content || problemData?.description || ''}
                  useMarkdown={isLearningProblem}
                />
              </Box>
            </Box>

            <Divider borderColor="var(--cg-window-dark)" mb={6} />

            {problemData?.constraints && (
              <Box mb={6}>
                <SectionTitle>Constraints</SectionTitle>
                <Box
                  p={4}
                  mt={3}
                  color="var(--cg-text)"
                  sx={markdownStyles}
                  {...CONTENT_BLOCK_STYLE}
                >
                  <RichContent html={problemData.constraints} useMarkdown={isLearningProblem} />
                </Box>
              </Box>
            )}

            {problemData?.examples && problemData.examples.length > 0 && (
              <Box mb={6}>
                <SectionTitle>Examples</SectionTitle>
                <TestCaseList examples={problemData.examples} />
              </Box>
            )}

            {problemData?.functionName && (
              <Box>
                <SectionTitle>Function Signature</SectionTitle>
                <Box p={4} mt={3} {...CONTENT_BLOCK_STYLE}>
                  <Text
                    fontSize="lg"
                    color="var(--cg-text)"
                    fontWeight="bold"
                    fontFamily="var(--cg-font-retro-terminal)"
                  >
                    {problemData.functionName}(
                    {problemData.functionParams &&
                      problemData.functionParams.map((param, idx) => (
                        <span key={idx}>
                          {idx > 0 ? ', ' : ''}
                          <span
                            style={{
                              color: 'var(--cg-accent-amber)',
                            }}
                          >
                            {param.name}
                          </span>
                          <span
                            style={{
                              color: 'var(--cg-muted)',
                            }}
                          >
                            {param.type ? `: ${param.type}` : ''}
                          </span>
                        </span>
                      ))}
                    )
                  </Text>

                  {problemData.functionParams && problemData.functionParams.length > 0 && (
                    <Box
                      mt={4}
                      p={3}
                      bg="rgba(0,0,0,0.12)"
                      border="1px solid var(--cg-window-dark)"
                      boxShadow="var(--cg-window-inset)"
                    >
                      <Text
                        color="var(--cg-accent-green)"
                        fontWeight="700"
                        mb={2}
                        textTransform="uppercase"
                        letterSpacing="0.08em"
                      >
                        Parameters:
                      </Text>
                      <VStack align="start" spacing={2} pl={3}>
                        {problemData.functionParams.map((param, idx) => (
                          <Text key={idx} color="var(--cg-text)" fontSize="sm">
                            <span
                              style={{
                                color: 'var(--cg-accent-amber)',
                                fontWeight: 'bold',
                              }}
                            >
                              {param.name}
                            </span>
                            <span
                              style={{
                                color: 'var(--cg-muted)',
                              }}
                            >
                              {' '}
                              ({param.type}){' '}
                            </span>
                            - {param.description}
                          </Text>
                        ))}
                      </VStack>
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          <Box
            w="100%"
            overflowX="auto"
            css={{
              '&::-webkit-scrollbar': {
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'var(--cg-window-face)',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'var(--cg-window-shadow)',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: 'var(--cg-window-dark)',
              },
            }}
          >
            <Box minWidth="max-content" p={4} {...CONTENT_BLOCK_STYLE}>
              <Box sx={markdownStyles}>
                <Box
                  dangerouslySetInnerHTML={{ __html: problemData?.content }}
                  style={{ display: 'inline-block' }}
                />
              </Box>
            </Box>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default ProblemDescription;
