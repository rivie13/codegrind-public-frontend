import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../../services/api';
import { getUserFacingErrorMessage } from '../../../utils/ui/userFacingErrors';
import { generateStep } from '../utils/generationHelpers';
import { unwrapTestCasesArray } from '../utils/formatters';
import { normalizeDataPacketsPayload } from '../../../utils/economy/dataPackets';

/**
 * Custom hook to manage AI problem generation state
 *
 * @param {Object} options
 * @param {Object} options.api - API service for making requests
 * @param {Object} options.user - Current user information
 * @param {Function} options.toast - Toast notification function
 * @param {Object} options.problemViewRef - Reference to scroll to problem view
 * @returns {Object} Generation state and functions
 */
const useGenerationState = ({ api, user, toast, problemViewRef }) => {
  // If toast isn't provided, create a dummy toast function
  const toastFn = toast || (() => {});

  const defaultAiModel = '';

  // Problem parameters
  const [problemType, setProblemType] = useState('random');
  const [difficultyLevel, setDifficultyLevel] = useState(3);
  const [wackiness, setWackiness] = useState(3);
  const [language, setLanguage] = useState('python');
  const [aiModel, setAIModel] = useState(defaultAiModel);
  const [additionalInfo, setAdditionalInfo] = useState('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProblem, setGeneratedProblem] = useState({});
  const [stepStatus, setStepStatus] = useState({
    title: { status: 'pending', retryCount: 0 },
    description: { status: 'pending', retryCount: 0 },
    functionName: { status: 'pending', retryCount: 0 },
    functionParams: { status: 'pending', retryCount: 0 },
    testCases: { status: 'pending', retryCount: 0 },
    expectedOutputs: { status: 'pending', retryCount: 0 },
    examples: { status: 'pending', retryCount: 0 },
    codeSnippets: { status: 'pending', retryCount: 0 },
    constraints: { status: 'pending', retryCount: 0 },
    solution: { status: 'pending', retryCount: 0 },
  });

  // Additional state variables
  const [isRegeneratingSolution, setIsRegeneratingSolution] = useState(false);
  const [isRegeneratingExamples, setIsRegeneratingExamples] = useState(false);
  const [isRegeneratingTitle, setIsRegeneratingTitle] = useState(false);
  const [isRegeneratingDescription, setIsRegeneratingDescription] = useState(false);
  const [isRegeneratingConstraints, setIsRegeneratingConstraints] = useState(false);
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [savedProblemSlug, setSavedProblemSlug] = useState('');
  const [problemNumber, setProblemNumber] = useState('');
  const [isSolutionVerified, setIsSolutionVerified] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [testError, setTestError] = useState(null);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [showGenerationAdModal, setShowGenerationAdModal] = useState(false);
  const [generationRateLimit, setGenerationRateLimit] = useState(null);
  const [isRateLimitLoading, setIsRateLimitLoading] = useState(true);
  const [selectedGenerationAdType, setSelectedGenerationAdType] = useState('short');
  const [isProcessingGenerationAd, setIsProcessingGenerationAd] = useState(false);
  const [xpSummary, setXpSummary] = useState(null);
  const [xpAwards, setXpAwards] = useState([]);
  const [xpLevelUpInfo, setXpLevelUpInfo] = useState(null);
  const [dataPacketAward, setDataPacketAward] = useState(null);

  // Refs
  const retryCountsRef = useRef({});
  const currentGenerationIdRef = useRef(0);
  const editorForSolutionRef = useRef(null);
  const rateLimitStatusToastShownRef = useRef(false);

  const refreshGenerationRateLimit = useCallback(async () => {
    try {
      setIsRateLimitLoading(true);
      const response = await api.aiProblems.getRateLimitStatus();
      rateLimitStatusToastShownRef.current = false;
      if (response?.rateLimit) {
        setGenerationRateLimit(response.rateLimit);
      }
    } catch (error) {
      console.error('Error fetching generation rate limit status:', error);
      if (!rateLimitStatusToastShownRef.current) {
        rateLimitStatusToastShownRef.current = true;
        toastFn({
          id: 'ai-generation-status-unavailable',
          title: 'Generator status unavailable',
          description: 'Some generator status data could not be loaded. You can still try again.',
          status: 'warning',
          duration: 3500,
          isClosable: true,
        });
      }
    } finally {
      setIsRateLimitLoading(false);
    }
  }, [api, toastFn]);

  useEffect(() => {
    refreshGenerationRateLimit();
    const intervalId = setInterval(refreshGenerationRateLimit, 15000);
    return () => clearInterval(intervalId);
  }, [refreshGenerationRateLimit, user?.id]);

  const handleGenerationRateLimit = (payload) => {
    const rawTier = (
      user?.membershipTier ||
      localStorage.getItem('membership_tier') ||
      'FREE'
    ).toUpperCase();
    const membershipTier = rawTier === 'PRO' ? 'PREMIUM' : rawTier;
    if (membershipTier === 'UNLIMITED') {
      toastFn({
        title: 'Unlimited Access Active',
        description: 'Unlimited members should not be rate limited. Please try again.',
        status: 'info',
        duration: 3000,
      });
      return;
    }
    const nextRateLimit = payload?.rateLimit || null;
    const cooldownRemaining = nextRateLimit?.adCooldownRemaining || 0;
    setGenerationRateLimit(nextRateLimit);
    if (cooldownRemaining > 0) {
      toastFn({
        title: 'Ad Cooldown Active',
        description: `Please wait ${Math.ceil(cooldownRemaining / 60)}m before watching another ad.`,
        status: 'info',
        duration: 3500,
      });
      setShowGenerationAdModal(false);
      return;
    }
    setShowGenerationAdModal(true);
    toastFn({
      title: 'Generation Limit Reached',
      description: payload?.message || 'You have reached your AI problem generation limit.',
      status: 'warning',
      duration: 4000,
    });
  };

  /**
   * Function to regenerate a specific step
   */
  const regenerateSpecificStep = async (step) => {
    try {
      // Set the appropriate loading state based on step
      switch (step) {
        case 'title':
          setIsRegeneratingTitle(true);
          break;
        case 'description':
          setIsRegeneratingDescription(true);
          break;
        case 'constraints':
          setIsRegeneratingConstraints(true);
          break;
      }

      // Set just this step's status to loading
      setStepStatus((prev) => ({
        ...prev,
        [step]: { status: 'loading' },
      }));

      // Get all the data we have so far to use as context
      const result = await generateStep({
        step,
        api,
        setStepStatus,
        setGeneratedProblem,
        previousData: generatedProblem,
        difficultyLevel,
        language,
        aiModel,
        userId: user?.id,
        wackiness,
        additionalInfo,
        generationId: currentGenerationIdRef.current,
        currentGenerationIdRef,
        toast: toastFn,
        regenerateSpecificStep,
        onRateLimit: handleGenerationRateLimit,
      });

      // Update the generated problem with the new step result
      setGeneratedProblem((prev) => ({
        ...prev,
        ...result,
      }));

      toastFn({
        title: 'Step Regenerated',
        description: `Successfully regenerated the ${step} step.`,
        status: 'success',
        duration: 3000,
      });

      // Return true to indicate success
      return true;
    } catch (error) {
      if (error.name === 'RateLimitError') {
        setIsGenerating(false);
        return false;
      }
      console.error(`Error regenerating ${step}:`, error);
      toastFn({
        title: 'Regeneration Failed',
        description: getUserFacingErrorMessage(error, `Failed to regenerate ${step}.`),
        status: 'error',
        duration: 5000,
      });

      // Return false to indicate failure
      return false;
    } finally {
      // Clear the loading state based on step
      switch (step) {
        case 'title':
          setIsRegeneratingTitle(false);
          break;
        case 'description':
          setIsRegeneratingDescription(false);
          break;
        case 'constraints':
          setIsRegeneratingConstraints(false);
          break;
      }
    }
  };

  /**
   * Handle the main problem generation process
   */
  const handleGenerate = async () => {
    try {
      try {
        const status = await api.aiProblems.getRateLimitStatus();
        const nextRateLimit = status?.rateLimit || null;
        if (nextRateLimit) {
          setGenerationRateLimit(nextRateLimit);
        }
        if (nextRateLimit && !nextRateLimit.unlimited) {
          const remaining = nextRateLimit.totalRemaining ?? nextRateLimit.remaining ?? 0;
          if (remaining <= 0) {
            handleGenerationRateLimit({
              rateLimit: nextRateLimit,
              message: 'You have reached your AI problem generation limit.',
            });
            return;
          }
        }
      } catch (error) {
        console.error('Error preflighting generation rate limit:', error);
      }

      // Increment the generation ID to invalidate any previous generation
      currentGenerationIdRef.current++;
      const thisGenerationId = currentGenerationIdRef.current;

      setIsGenerating(true);
      // Initialize with an empty object instead of null
      setGeneratedProblem({});
      // Reset solution verification state
      setIsSolutionVerified(false);

      // Clear test results from previous problem
      setTestResults(null);
      setTestError(null);

      // Reset all retry counts both in state and ref
      retryCountsRef.current = {};
      setStepStatus({
        title: { status: 'pending', retryCount: 0 },
        description: { status: 'pending', retryCount: 0 },
        functionName: { status: 'pending', retryCount: 0 },
        functionParams: { status: 'pending', retryCount: 0 },
        testCases: { status: 'pending', retryCount: 0 },
        expectedOutputs: { status: 'pending', retryCount: 0 },
        examples: { status: 'pending', retryCount: 0 },
        codeSnippets: { status: 'pending', retryCount: 0 },
        constraints: { status: 'pending', retryCount: 0 },
        solution: { status: 'pending', retryCount: 0 },
      });

      // Determine the actual problem type once at the beginning
      let actualProblemType = problemType;
      if (problemType === 'random') {
        let problemTypes = [];

        // Select problem types based on difficulty level
        if (difficultyLevel >= 1 && difficultyLevel <= 3) {
          // Beginner-friendly options for easy difficulty
          problemTypes = [
            'variables',
            'conditionals',
            'loops',
            'math',
            'string-basic',
            'array-basic',
          ];
        } else if (difficultyLevel >= 4 && difficultyLevel <= 7) {
          // Intermediate options for medium difficulty
          problemTypes = [
            'array',
            'string',
            'hash',
            'sorting',
            'recursion',
            'two-pointers',
            'simulation',
            'linked-list',
            'stack',
            'queue',
          ];
        } else {
          // Advanced options for hard difficulty
          problemTypes = [
            'tree',
            'graph',
            'dp',
            'greedy',
            'binary-search',
            'bit-manipulation',
            'backtracking',
            'divide-conquer',
            'trie',
            'heap',
          ];
        }

        // Select a random problem type from the appropriate list
        actualProblemType = problemTypes[Math.floor(Math.random() * problemTypes.length)];
        //console.log(`Selected random problem type based on difficulty ${difficultyLevel}: ${actualProblemType}`);
      }

      // Initialize an accumulator for previous data with the actual problem type
      let accumulatedData = {
        problemType: actualProblemType,
        difficulty: difficultyLevel,
        wackiness,
        language,
        aiModel,
      };

      // Sequential step generation with accumulated data
      const stepGenerators = [
        { name: 'title', logMessage: 'Generated title:' },
        { name: 'description', logMessage: 'Generated description:' },
        { name: 'functionName', logMessage: 'Generated function name:' },
        { name: 'functionParams', logMessage: 'Generated function params:' },
        { name: 'testCases', logMessage: 'Generated test cases:' },
        { name: 'expectedOutputs', logMessage: 'Generated expected outputs:' },
        { name: 'examples', logMessage: 'Generated examples:' },
        { name: 'codeSnippets', logMessage: 'Generated code snippets:' },
        { name: 'constraints', logMessage: 'Generated constraints:' },
        { name: 'solution', logMessage: 'Generated solution (raw):' },
      ];

      for (const step of stepGenerators) {
        // Check if generation is still valid
        if (currentGenerationIdRef.current !== thisGenerationId) return;

        const stepData = await generateStep({
          step: step.name,
          api,
          setStepStatus,
          setGeneratedProblem,
          previousData: accumulatedData,
          difficultyLevel,
          language,
          aiModel,
          userId: user?.id,
          wackiness,
          additionalInfo,
          generationId: thisGenerationId,
          currentGenerationIdRef,
          toast: toastFn,
          regenerateSpecificStep,
          onRateLimit: handleGenerationRateLimit,
        });

        //console.log(step.logMessage, stepData);

        // Apply unwrapping to test cases and expected outputs after generation
        if (step.name === 'testCases' && stepData?.testCases) {
          stepData.testCases = unwrapTestCasesArray(stepData.testCases);
          //console.log('Unwrapped test cases:', stepData.testCases);
        }
        if (step.name === 'expectedOutputs' && stepData?.expectedOutputs) {
          stepData.expectedOutputs = unwrapTestCasesArray(stepData.expectedOutputs);
          //console.log('Unwrapped expected outputs:', stepData.expectedOutputs);
        }

        // Special handling for solution step
        if (step.name === 'solution') {
          // Ensure solution data is properly formatted
          if (stepData) {
            if (typeof stepData.solution === 'string') {
              // Solution is already a string, use it directly
              accumulatedData = { ...accumulatedData, ...stepData };
            } else if (stepData.solution) {
              // Solution might be an object, convert to string
              accumulatedData = {
                ...accumulatedData,
                solution: JSON.stringify(stepData.solution),
              };
            } else {
              // No solution property found, log error
              console.error("Solution data missing expected 'solution' property:", stepData);
              accumulatedData = { ...accumulatedData, solution: '// Solution generation failed' };
            }
          } else {
            console.error('Solution data is null or undefined');
            accumulatedData = { ...accumulatedData, solution: '// Solution generation failed' };
          }
        } else {
          // For non-solution steps, just merge the data
          accumulatedData = { ...accumulatedData, ...stepData };
        }
      }

      //console.log("Final accumulated data:", accumulatedData);

      // Update state with all generated data
      setGeneratedProblem(accumulatedData);
      setIsGenerating(false);
      refreshGenerationRateLimit();
    } catch (error) {
      if (error.name === 'RateLimitError') {
        setIsGenerating(false);
        refreshGenerationRateLimit();
        return;
      }
      console.error('Generation error:', error);
      setStepStatus((prev) => ({
        ...prev,
        solution: { status: 'failed', error: error.message || 'Unknown error' },
      }));
      setIsGenerating(false);
      refreshGenerationRateLimit();
    }
  };

  /**
   * Handle saving the generated problem
   */
  const handleSave = async () => {
    try {
      if (!generatedProblem) {
        throw new Error('No problem to save');
      }

      // Clear test results when saving
      setTestResults(null);
      setTestError(null);

      // Generate a URL-friendly slug from the title
      const titleSlug = generatedProblem.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Convert numeric difficulty level to enum string
      const getDifficultyEnum = (level) => {
        if (level >= 1 && level <= 3) return 'EASY';
        if (level >= 4 && level <= 7) return 'MEDIUM';
        return 'HARD';
      };

      // Prepare the problem data with all necessary fields
      const problemToSave = {
        ...generatedProblem,
        titleSlug,
        difficulty: getDifficultyEnum(generatedProblem.difficulty), // Convert to enum
        codeSnippets: generatedProblem.snippets, // Rename the property
        // Make sure examples are included and testCases/expectedOutputs are unwrapped
        examples: generatedProblem.examples || [],
        testCases: unwrapTestCasesArray(generatedProblem.testCases),
        expectedOutputs: unwrapTestCasesArray(generatedProblem.expectedOutputs),
      };

      // Remove the original snippets property to avoid duplication
      delete problemToSave.snippets;

      const saveResponse = await api.aiProblems.saveProblem(problemToSave);
      const xpPayload = saveResponse?.xp || null;
      setXpSummary(xpPayload?.summary || null);
      setXpAwards(Array.isArray(xpPayload?.awards) ? xpPayload.awards : []);
      setXpLevelUpInfo(xpPayload?.levelUp || null);
      setDataPacketAward(
        normalizeDataPacketsPayload(saveResponse?.dataPackets, {
          fallbackXpAmount: Array.isArray(xpPayload?.awards)
            ? xpPayload.awards.reduce((sum, award) => sum + (award?.amount || 0), 0)
            : 0,
        })
      );

      // Fix: Access displayNumber from the problem object returned by the backend
      const problemNumber = saveResponse.problem?.displayNumber || Date.now().toString().slice(-4);

      toastFn({
        title: 'Problem Saved',
        description: 'Your AI generated problem has been saved successfully.',
        status: 'success',
        duration: 5000,
      });

      // Set the saved problem slug and show options instead of navigating
      setSavedProblemSlug(titleSlug);
      // Also store the problem number for display
      setProblemNumber(problemNumber);
      setShowSaveOptions(true);
    } catch (error) {
      console.error('Error saving problem:', error);
      toastFn({
        title: 'Save Error',
        description: getUserFacingErrorMessage(error, 'Failed to save the problem.'),
        status: 'error',
        duration: 5000,
      });
    }
  };

  /**
   * Handle regenerating the solution
   */
  const handleRegenerateSolution = async () => {
    if (!generatedProblem) return;

    try {
      // Force sync any edited content to state first
      const editorContainer = document.querySelector('.code-editor-container');
      if (editorContainer) {
        // Trigger blur on any active editors
        const activeElement = document.activeElement;
        if (activeElement && editorContainer.contains(activeElement)) {
          // Attempt to blur manually
          activeElement.blur();
        }
      }

      // Wait a moment for state to update
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Clear any previous test results
      setTestResults(null);
      setTestError(null);

      setIsRegeneratingSolution(true);
      // Reset solution verification since we're generating a new solution
      setIsSolutionVerified(false);

      // Call the API to generate just the solution step
      const solutionData = await api.aiProblems.generate({
        step: 'solution',
        problemType: generatedProblem.problemType,
        difficulty: generatedProblem.difficulty,
        language,
        model: aiModel,
        userId: user?.id,
        wackiness,
        additionalInfo,
        previousData: {
          title: generatedProblem.title,
          description: generatedProblem.description,
          functionName: generatedProblem.functionName,
          functionParams: generatedProblem.functionParams,
          testCases: generatedProblem.testCases,
          expectedOutputs: generatedProblem.expectedOutputs,
        },
      });

      // Update the solution in the state
      if (solutionData && solutionData.solution) {
        setGeneratedProblem({
          ...generatedProblem,
          solution: solutionData.solution,
        });

        toastFn({
          title: 'Solution Regenerated',
          description: 'A new solution has been generated for this problem.',
          status: 'success',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error regenerating solution:', error);
      toastFn({
        title: 'Regeneration Failed',
        description: getUserFacingErrorMessage(error, 'Failed to regenerate the solution.'),
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsRegeneratingSolution(false);
    }
  };

  /**
   * Handle regenerating the examples
   */
  const handleRegenerateExamples = async () => {
    if (!generatedProblem || !generatedProblem.testCases || !generatedProblem.expectedOutputs) {
      toastFn({
        title: 'Cannot regenerate examples',
        description: 'Test cases and expected outputs must be available.',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      // Force blur on any active textareas to ensure state is updated
      const activeElement = document.activeElement;
      if (activeElement) {
        // Check if it's a textarea or input
        if (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT') {
          activeElement.blur();
          // Wait a moment for state to update
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
      }

      setIsRegeneratingExamples(true);

      // Call the API to generate just the examples step
      const examplesData = await api.aiProblems.generate({
        step: 'examples',
        problemType: generatedProblem.problemType,
        difficulty: generatedProblem.difficulty,
        language,
        model: aiModel,
        userId: user?.id,
        wackiness,
        additionalInfo,
        previousData: {
          title: generatedProblem.title,
          description: generatedProblem.description,
          functionName: generatedProblem.functionName,
          functionParams: generatedProblem.functionParams,
          testCases: generatedProblem.testCases,
          expectedOutputs: generatedProblem.expectedOutputs,
        },
      });

      // Update the examples in the state
      if (examplesData && examplesData.examples) {
        setGeneratedProblem({
          ...generatedProblem,
          examples: examplesData.examples,
        });

        toastFn({
          title: 'Examples Regenerated',
          description: 'New examples have been generated based on current test cases and outputs.',
          status: 'success',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error regenerating examples:', error);
      toastFn({
        title: 'Regeneration Failed',
        description: getUserFacingErrorMessage(error, 'Failed to regenerate the examples.'),
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsRegeneratingExamples(false);
    }
  };

  /**
   * Reset all state for a new problem
   */
  const handleReset = async () => {
    // Clear backend cache first
    try {
      await api.aiProblems.clearAllTempProblems();
      //console.log('Cleared backend cache successfully');
    } catch (error) {
      console.error('Error clearing backend cache:', error);
      // Continue with reset even if cache clear fails
    }

    // Increment the generation ID to invalidate the current generation
    currentGenerationIdRef.current++;

    // Reset UI state immediately
    setIsGenerating(false);
    setGeneratedProblem({});
    setIsSolutionVerified(false);

    // Clear test results and errors
    setTestResults(null);
    setTestError(null);
    setIsRunningTest(false);

    setStepStatus({
      title: { status: 'pending', retryCount: 0 },
      description: { status: 'pending', retryCount: 0 },
      functionName: { status: 'pending', retryCount: 0 },
      functionParams: { status: 'pending', retryCount: 0 },
      testCases: { status: 'pending', retryCount: 0 },
      expectedOutputs: { status: 'pending', retryCount: 0 },
      examples: { status: 'pending', retryCount: 0 },
      codeSnippets: { status: 'pending', retryCount: 0 },
      constraints: { status: 'pending', retryCount: 0 },
      solution: { status: 'pending', retryCount: 0 },
    });
  };

  const handleGenerationAdComplete = async () => {
    if (isProcessingGenerationAd) return;
    if (generationRateLimit?.adCooldownRemaining > 0) {
      toastFn({
        title: 'Ad Cooldown Active',
        description: `Please wait ${Math.ceil(generationRateLimit.adCooldownRemaining / 60)}m before watching another ad.`,
        status: 'info',
        duration: 3500,
      });
      setShowGenerationAdModal(false);
      return;
    }

    try {
      setIsProcessingGenerationAd(true);
      const response = await api.aiProblems.addGenerationCredit(selectedGenerationAdType);
      setGenerationRateLimit(response?.rateLimit || null);
      refreshGenerationRateLimit();
      toastFn({
        title: 'Credits Added',
        description: `You earned ${response?.creditsEarned || 0} extra generation credit(s).`,
        status: 'success',
        duration: 4000,
      });
      setShowGenerationAdModal(false);
    } catch (error) {
      toastFn({
        title: 'Ad Credit Failed',
        description: getUserFacingErrorMessage(
          error,
          'Unable to add generation credits. Please try again later.'
        ),
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsProcessingGenerationAd(false);
    }
  };

  return {
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
    setIsGenerating,
    generatedProblem,
    setGeneratedProblem,
    stepStatus,
    setStepStatus,

    // Additional state
    isRegeneratingSolution,
    isRegeneratingExamples,
    isRegeneratingTitle,
    isRegeneratingDescription,
    isRegeneratingConstraints,
    showSaveOptions,
    setShowSaveOptions,
    savedProblemSlug,
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

    // Refs
    currentGenerationIdRef,
    editorForSolutionRef,
    problemViewRef,

    // Functions
    handleGenerate,
    handleSave,
    handleReset,
    handleRegenerateSolution,
    handleRegenerateExamples,
    regenerateSpecificStep,
  };
};

export default useGenerationState;
