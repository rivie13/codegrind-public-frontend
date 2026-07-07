import DOMPurify from 'dompurify';
import { Box, Button, Divider, Flex, Text, VStack } from '@chakra-ui/react';
import ExamplesEditor from '../editors/ExamplesEditor';
import SolutionEditor from '../editors/SolutionEditor';
import SolutionTester from '../testers/SolutionTester';
import TestResultsDisplay from '../testers/TestResultsDisplay';
import { RetroInset, RetroPanel } from '../../retro/RetroPageShell';

const SECTION_TITLE_PROPS = {
  color: 'var(--cg-text)',
  fontSize: { base: 'sm', md: 'md' },
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const CONTENT_BLOCK_SX = {
  '& code': {
    bg: 'rgba(0, 0, 0, 0.12)',
    color: 'var(--cg-link)',
    padding: '0.1em 0.35em',
    border: '1px solid var(--cg-window-dark)',
    boxShadow: 'var(--cg-window-inset)',
  },
  '& p': {
    marginBottom: '1em',
    lineHeight: '1.7',
  },
  '& ul, & ol': {
    paddingLeft: '1.4rem',
    marginBottom: '1em',
  },
  '& li': {
    marginBottom: '0.5em',
    lineHeight: '1.6',
  },
};

function SectionHeader({ title, action }) {
  return (
    <Flex
      justify="space-between"
      align={{ base: 'stretch', sm: 'center' }}
      flexDirection={{ base: 'column', sm: 'row' }}
      gap={2}
      mb={3}
    >
      <Text {...SECTION_TITLE_PROPS}>{title}</Text>
      {action}
    </Flex>
  );
}

const GeneratedProblemContent = ({
  generatedProblem,
  isGenerating,
  problemViewRef,
  regenerateSpecificStep,
  isRegeneratingTitle,
  isRegeneratingDescription,
  isRegeneratingConstraints,
  handleRegenerateExamples,
  isRegeneratingExamples,
  handleRegenerateSolution,
  isRegeneratingSolution,
  language,
  setGeneratedProblem,
  setIsSolutionVerified,
  isSolutionVerified,
  testResults,
  testError,
  isRunningTest,
  setIsRunningTest,
  setTestResults,
  setTestError,
  editorForSolutionRef,
  handleSave,
}) => {
  if (!Object.keys(generatedProblem || {}).length) {
    return null;
  }

  return (
    <Box ref={problemViewRef}>
      <RetroPanel
        fileLabel="problem-content.md"
        title="Problem Content"
        subtitle="Review the draft, regenerate weak sections, verify the solution, and save only after it actually passes."
      >
        <VStack
          spacing={6}
          align="stretch"
          divider={<Divider borderColor="var(--cg-window-dark)" />}
        >
          {generatedProblem.title && (
            <Box>
              <SectionHeader
                title="Problem Title"
                action={
                  <Button
                    size="sm"
                    color="var(--cg-accent-blue)"
                    onClick={() => regenerateSpecificStep('title')}
                    isLoading={isRegeneratingTitle}
                    loadingText="Regenerating..."
                    width={{ base: '100%', sm: 'auto' }}
                  >
                    Regenerate
                  </Button>
                }
              />
              <RetroInset p={4}>
                <Text color="var(--cg-text)" fontWeight="700" lineHeight="1.6">
                  {generatedProblem.title}
                </Text>
              </RetroInset>
            </Box>
          )}

          {generatedProblem.description && (
            <Box>
              <SectionHeader
                title="Problem Description"
                action={
                  <Button
                    size="sm"
                    color="var(--cg-accent-blue)"
                    onClick={() => regenerateSpecificStep('description')}
                    isLoading={isRegeneratingDescription}
                    loadingText="Regenerating..."
                    width={{ base: '100%', sm: 'auto' }}
                  >
                    Regenerate
                  </Button>
                }
              />
              <RetroInset p={4}>
                <Box
                  color="var(--cg-text)"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(generatedProblem.description),
                  }}
                  sx={CONTENT_BLOCK_SX}
                />
              </RetroInset>
            </Box>
          )}

          {generatedProblem.testCases && generatedProblem.expectedOutputs && (
            <Box>
              <SectionHeader title="Examples" />
              <Box>
                <ExamplesEditor
                  testCases={generatedProblem.testCases}
                  expectedOutputs={generatedProblem.expectedOutputs}
                  examples={generatedProblem.examples}
                  setExamples={(data) => {
                    setGeneratedProblem({
                      ...generatedProblem,
                      testCases: data.testCases,
                      expectedOutputs: data.expectedOutputs,
                    });
                  }}
                  onRegenerateExamples={handleRegenerateExamples}
                  isRegeneratingExamples={isRegeneratingExamples}
                />
              </Box>
            </Box>
          )}

          {generatedProblem.constraints && (
            <Box>
              <SectionHeader
                title="Constraints"
                action={
                  <Button
                    size="sm"
                    color="var(--cg-accent-blue)"
                    onClick={() => regenerateSpecificStep('constraints')}
                    isLoading={isRegeneratingConstraints}
                    loadingText="Regenerating..."
                    width={{ base: '100%', sm: 'auto' }}
                  >
                    Regenerate
                  </Button>
                }
              />
              <RetroInset p={4}>
                <Box
                  color="var(--cg-text)"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(generatedProblem.constraints),
                  }}
                  sx={CONTENT_BLOCK_SX}
                />
              </RetroInset>
            </Box>
          )}

          {generatedProblem.solution && (
            <Box>
              <SectionHeader title="Solution" />
              <RetroInset overflow="hidden">
                <Box className="code-editor-container">
                  <SolutionEditor
                    solution={generatedProblem.solution}
                    language={language}
                    setSolution={(solution) => {
                      setGeneratedProblem({
                        ...generatedProblem,
                        solution,
                      });
                      setIsSolutionVerified(false);
                    }}
                    setEditorRef={(ref) => (editorForSolutionRef.current = ref)}
                  />
                </Box>

                <Flex
                  p={4}
                  justifyContent={{ base: 'stretch', sm: 'space-between' }}
                  borderTop="1px solid"
                  borderColor="var(--cg-window-dark)"
                >
                  <Button
                    color="var(--cg-accent-blue)"
                    onClick={handleRegenerateSolution}
                    isLoading={isRegeneratingSolution}
                    loadingText="Regenerating..."
                    size="sm"
                    width={{ base: '100%', sm: 'auto' }}
                  >
                    Regenerate Solution
                  </Button>
                </Flex>

                <Box
                  w="100%"
                  px={4}
                  pb={4}
                  pt={4}
                  borderTop="1px solid"
                  borderColor="var(--cg-window-dark)"
                >
                  <SolutionTester
                    problem={generatedProblem}
                    solution={generatedProblem.solution}
                    language={language}
                    onTestComplete={setIsSolutionVerified}
                    onResultsUpdate={(results, error) => {
                      setTestResults(results);
                      setTestError(error);
                    }}
                    editorRef={editorForSolutionRef}
                    isRunningTest={isRunningTest}
                    setIsRunningTest={setIsRunningTest}
                  />

                  <TestResultsDisplay results={testResults} error={testError} />
                </Box>
              </RetroInset>
            </Box>
          )}

          {!isGenerating &&
            generatedProblem.title &&
            generatedProblem.description &&
            generatedProblem.solution && (
              <RetroInset p={4}>
                <Text
                  color={isSolutionVerified ? 'var(--cg-accent-green)' : 'var(--cg-accent-amber)'}
                  mb={3}
                  fontSize="sm"
                >
                  {isSolutionVerified
                    ? 'Solution verified. The problem is ready to save.'
                    : 'Test and verify the solution before saving so the generated problem stays solvable.'}
                </Text>
                <Button
                  color={isSolutionVerified ? 'var(--cg-accent-green)' : 'var(--cg-muted)'}
                  size="lg"
                  onClick={handleSave}
                  width="100%"
                  isDisabled={!isSolutionVerified}
                  title={
                    isSolutionVerified
                      ? 'Save problem'
                      : "Verify your solution first by clicking 'Test Solution'"
                  }
                  fontWeight="bold"
                >
                  {isSolutionVerified ? 'Save Problem' : 'Test Solution First'}
                </Button>
              </RetroInset>
            )}
        </VStack>
      </RetroPanel>
    </Box>
  );
};

export default GeneratedProblemContent;
