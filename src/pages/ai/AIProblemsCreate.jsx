import { Box, Button, Flex, useToast } from '@chakra-ui/react';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Import components
import BottomBannerAd from '../../components/ads/BottomBannerAd';
import TopBannerAd from '../../components/ads/TopBannerAd';
import PageTemplate from '../../components/layout/PageTemplate';
import AdModal from '../../components/towerDefense/AdModal';

// Import AI problem components
import ProblemParametersForm from '../../components/aiProblems/generators/ProblemParametersForm';
import SaveOptionsModal from '../../components/aiProblems/modals/SaveOptionsModal';
import ChatAssistantPanel from '../../components/aiProblems/create/ChatAssistantPanel';
import GenerationCard from '../../components/aiProblems/create/GenerationCard';
import GeneratedProblemContent from '../../components/aiProblems/create/GeneratedProblemContent';
import BugReportButton from '../../components/feedback/BugReportButton';
import RetroPageShell from '../../components/retro/RetroPageShell';

// Import hooks
import useGenerationState from '../../components/aiProblems/hooks/useGenerationState';

// Import configs
import adSlots from '../../config/adSlots';
import { api } from '../../services/api';

const AIProblemsCreate = ({ user }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const problemViewRef = useRef(null);

  // Use the generation state hook
  const {
    // Problem parameters
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

    // Generation state
    isGenerating,
    generatedProblem,
    stepStatus,
    setGeneratedProblem,

    // Additional state
    isRegeneratingSolution,
    isRegeneratingExamples,
    isRegeneratingTitle,
    isRegeneratingDescription,
    isRegeneratingConstraints,
    showSaveOptions,
    setShowSaveOptions,
    problemNumber,
    isSolutionVerified,
    setIsSolutionVerified,
    testResults,
    setTestResults,
    testError,
    setTestError,
    isRunningTest,
    setIsRunningTest,
    showGenerationAdModal,
    setShowGenerationAdModal,
    generationRateLimit,
    isRateLimitLoading,
    selectedGenerationAdType,
    setSelectedGenerationAdType,
    isProcessingGenerationAd,
    handleGenerationAdComplete,
    xpSummary,
    xpAwards,
    xpLevelUpInfo,
    dataPacketAward,

    // Functions
    handleGenerate,
    handleSave,
    handleReset,
    handleRegenerateSolution,
    handleRegenerateExamples,
    regenerateSpecificStep,

    // Refs
    editorForSolutionRef,
  } = useGenerationState({ api, user, toast, problemViewRef });

  const generationAdOptions = {
    short: { label: 'Short (15s) +1 generation' },
    long: { label: 'Long (30s) +2 generations' },
    full: { label: 'Full (60s) +5 generations' },
  };

  const remainingCredits = generationRateLimit?.unlimited
    ? 'Unlimited credits'
    : `${generationRateLimit?.totalRemaining ?? generationRateLimit?.remaining ?? '—'} credits`;

  // Navigation handlers
  const handleGoToProblem = () => {
    setShowSaveOptions(false);
    navigate('/ai-problems/browse');
  };

  const handleGenerateAnother = () => {
    setShowSaveOptions(false);
    handleReset();
    // Scroll back to the top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <PageTemplate title="Create AI Problem" showGiphyBackground>
      <RetroPageShell
        mainMaxW="container.xl"
        heroFileLabel="ai-generator.exe"
        heroTitle="AI Problem Generator"
        heroSubtitle="Configure the prompt, inspect the generated draft, test the solution, and save only after the problem is actually verified."
        heroMeta={isGenerating ? 'Generating' : remainingCredits}
        heroActions={
          <>
            <BugReportButton
              pageType="ai-problem-create"
              pageContext={{ pageTitle: 'AI Problem Generator' }}
              clientState={{
                problemType,
                difficultyLevel,
                wackiness,
                language,
                aiModel,
                hasGeneratedProblem: Boolean(generatedProblem?.title),
                generatedProblemTitle: generatedProblem?.title || '',
              }}
              buttonLabel="Report generator bug"
              buttonProps={{
                size: 'sm',
                color: 'var(--cg-accent-red)',
                width: { base: '100%', sm: 'auto' },
              }}
            />
            <Button
              onClick={() => navigate('/ai-problems')}
              color="var(--cg-accent-blue)"
              width={{ base: '100%', sm: 'auto' }}
            >
              Back to AI menu
            </Button>
          </>
        }
        topSlot={
          <Box
            width="100%"
            maxWidth={{ base: '100%', md: '728px' }}
            mx="auto"
            mt={{ base: 4, md: 6 }}
            mb={{ base: 4, md: 6 }}
            px={{ base: 4, md: 0 }}
          >
            <TopBannerAd slotId={adSlots.generic.top} />
          </Box>
        }
        bottomSlot={
          <Box
            width="100%"
            maxWidth={{ base: '100%', md: '728px' }}
            mx="auto"
            mt={{ base: 1, md: 2 }}
            mb={{ base: 8, md: 10 }}
            px={{ base: 4, md: 0 }}
          >
            <BottomBannerAd slotId={adSlots.generic.bottom} />
          </Box>
        }
      >
        <Flex width="100%" flexDirection={{ base: 'column', xl: 'row' }} gap={{ base: 6, md: 8 }}>
          <Box width={{ base: '100%', xl: '360px' }} minWidth={{ xl: '360px' }} flexShrink={0}>
            <ProblemParametersForm
              problemType={problemType}
              setProblemType={setProblemType}
              difficultyLevel={difficultyLevel}
              setDifficultyLevel={setDifficultyLevel}
              wackiness={wackiness}
              setWackiness={setWackiness}
              language={language}
              setLanguage={setLanguage}
              aiModel={aiModel}
              setAIModel={setAIModel}
              additionalInfo={additionalInfo}
              setAdditionalInfo={setAdditionalInfo}
              isGenerating={isGenerating}
              handleGenerate={handleGenerate}
              handleReset={handleReset}
              generationRateLimit={generationRateLimit}
              isRateLimitLoading={isRateLimitLoading}
            />
          </Box>

          <Flex
            flex="1"
            minW={0}
            flexDirection={{ base: 'column', '2xl': 'row' }}
            gap={{ base: 5, md: 6 }}
          >
            <Box flex="1" minW={0}>
              <GenerationCard
                isGenerating={isGenerating}
                stepStatus={stepStatus}
                generatedProblem={generatedProblem}
              />

              <GeneratedProblemContent
                generatedProblem={generatedProblem}
                isGenerating={isGenerating}
                problemViewRef={problemViewRef}
                regenerateSpecificStep={regenerateSpecificStep}
                isRegeneratingTitle={isRegeneratingTitle}
                isRegeneratingDescription={isRegeneratingDescription}
                isRegeneratingConstraints={isRegeneratingConstraints}
                handleRegenerateExamples={handleRegenerateExamples}
                isRegeneratingExamples={isRegeneratingExamples}
                handleRegenerateSolution={handleRegenerateSolution}
                isRegeneratingSolution={isRegeneratingSolution}
                language={language}
                setGeneratedProblem={setGeneratedProblem}
                setIsSolutionVerified={setIsSolutionVerified}
                isSolutionVerified={isSolutionVerified}
                testResults={testResults}
                testError={testError}
                isRunningTest={isRunningTest}
                setIsRunningTest={setIsRunningTest}
                setTestResults={setTestResults}
                setTestError={setTestError}
                editorForSolutionRef={editorForSolutionRef}
                handleSave={handleSave}
              />
            </Box>

            <ChatAssistantPanel generatedProblem={generatedProblem} />
          </Flex>
        </Flex>

        <SaveOptionsModal
          isOpen={showSaveOptions}
          onClose={() => setShowSaveOptions(false)}
          title={generatedProblem.title}
          problemNumber={problemNumber}
          xpSummary={xpSummary}
          xpAwards={xpAwards}
          levelUpInfo={xpLevelUpInfo}
          dataPacketAward={dataPacketAward}
          onGoToProblem={handleGoToProblem}
          onCreateAnother={handleGenerateAnother}
        />

        <AdModal
          isOpen={showGenerationAdModal}
          onClose={() => setShowGenerationAdModal(false)}
          onAdComplete={handleGenerationAdComplete}
          title="AI Problem Generation Boost"
          ctaLabel="Unlock Generation Credit"
          footerText={
            generationRateLimit?.resetIn
              ? `Limit resets in ${Math.max(0, Math.floor(generationRateLimit.resetIn / 60))} minutes. Watching this ad adds extra credits now.`
              : 'Watching this ad adds extra AI problem generations.'
          }
          processingText="Syncing sponsor link..."
          adTypeOptions={generationAdOptions}
          selectedAdType={selectedGenerationAdType}
          onAdTypeChange={setSelectedGenerationAdType}
          adTypeSelectionDisabled={isProcessingGenerationAd}
          showSkipButton
          skipLabel="Maybe later"
          onSkip={() => setShowGenerationAdModal(false)}
        />
      </RetroPageShell>
    </PageTemplate>
  );
};

export default AIProblemsCreate;
