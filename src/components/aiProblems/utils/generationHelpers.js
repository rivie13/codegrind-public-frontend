/**
 * Collection of utility functions for AI problem generation
 */

import { Button, HStack, Text, VStack } from '@chakra-ui/react';
import React from 'react';
import logger from '../../../utils/core/logger';

/**
 * Handles continuing the generation process after a step fails
 * 
 * @param {Function} setStepStatus - State setter function for step status
 * @param {Function} toast - Toast notification function
 * @param {string} step - The step that failed
 * @param {string} nextStep - The next step to continue with
 * @returns {Object} - Empty object to continue the generation process
 */
export const continueAfterFailedStep = (setStepStatus, toast, step, nextStep) => {
  // Mark the failed step with a "skipped" status
  setStepStatus(prev => ({
    ...prev,
    [step]: { 
      status: 'skipped', 
      retryCount: 2,
      error: `${step} generation was skipped`
    }
  }));
  
  // Close any existing toasts
  toast.closeAll();
  
  // Show a notification that we're continuing
  toast({
    title: `Continuing without ${step}`,
    description: `Proceeding to generate ${nextStep}. You can regenerate ${step} later.`,
    status: 'info',
    duration: 3000,
  });
  
  // Return an empty object for this step so the generation flow can continue
  return {};
};

/**
 * Makes an API call to generate a step with retry logic
 * 
 * @param {Object} params - Parameters for the generation
 * @param {string} params.step - The step to generate
 * @param {Object} params.api - The API service object
 * @param {Function} params.setStepStatus - State setter for step status
 * @param {Object} params.previousData - Previous generation data
 * @param {number} params.difficultyLevel - Difficulty level setting
 * @param {string} params.language - Programming language
 * @param {string} params.aiModel - AI model to use
 * @param {string} params.userId - User ID
 * @param {number} params.wackiness - Wackiness level
 * @param {string} params.additionalInfo - Additional context info
 * @param {number} params.generationId - ID of the current generation
 * @param {Function} params.toast - Toast notification function
 * @returns {Promise<Object>} - The result of the generation
 */
export const generateStep = async ({
  step,
  api,
  setStepStatus,
  setGeneratedProblem,
  previousData = {},
  difficultyLevel,
  language,
  aiModel,
  userId,
  wackiness,
  additionalInfo,
  generationId,
  currentGenerationIdRef,
  toast,
  regenerateSpecificStep,
  onRateLimit
}) => {
  // Capture the current generation ID when this step starts
  const thisGenerationId = generationId;
  
  // Set status to loading when starting
  setStepStatus(prev => ({
    ...prev,
    [step]: { status: 'loading', retryCount: prev[step]?.retryCount || 0 }
  }));
  
  // Function to make the actual API call
  const makeApiCall = async () => {
    try {
      // console.log(`Making API call for ${step}`, {
      //   step,
      //   problemType: previousData.problemType,
      //   difficulty: difficultyLevel,
      //   language,
      //   model: aiModel,
      //   userId,
      //   wackiness,
      //   additionalInfo,
      //   previousData
      // });
      
      const response = await api.aiProblems.generate({
        step,
        problemType: previousData.problemType,
        difficulty: difficultyLevel,
        language,
        model: aiModel,
        userId,
        wackiness,
        additionalInfo,
        previousData
      });

      if (response?.showAd) {
        if (onRateLimit) {
          onRateLimit(response);
        }
        const rateLimitError = new Error(response.message || 'AI problem generation limit reached');
        rateLimitError.name = 'RateLimitError';
        rateLimitError.data = response;
        throw rateLimitError;
      }
      
      // Log the complete response for debugging
      // console.log(`Response for ${step}:`, JSON.stringify(response));
      
      return response;
    } catch (error) {
      console.error(`API call failed for ${step}:`);
      logger.debug(error.stack);
      throw error;
    }
  };
  
  // Maximum retry attempts
  const MAX_RETRIES = 2;
  let attempt = 0;
  
  // Loop until successful or max retries reached
  while (attempt < MAX_RETRIES) {
    // Exit early if generation ID changed
    if (currentGenerationIdRef.current !== thisGenerationId) {
      throw new Error('Generation canceled');
    }
    
    attempt++;
    // console.log(`Attempt ${attempt}/${MAX_RETRIES} for ${step}`);
    
    try {
      const result = await makeApiCall();
      
      // Check generation ID again after API call completes
      if (currentGenerationIdRef.current !== thisGenerationId) {
        throw new Error('Generation canceled');
      }
      
      // Check if the result contains error information
      if (result.error) {
        console.warn(`Step ${step} returned partial result due to error:`, result.errorMessage);
        
        // If this is the last attempt, use the partial result but mark as failed
        if (attempt >= MAX_RETRIES) {
          setStepStatus(prev => ({
            ...prev,
            [step]: { 
              status: 'failed', 
              retryCount: attempt,
              error: result.errorMessage || 'Unknown error'
            }
          }));
          
          // Determine the next step based on current step
          const steps = [
            'title', 'description', 'functionName', 'functionParams', 
            'testCases', 'expectedOutputs', 'examples', 'codeSnippets', 
            'constraints', 'solution'
          ];
          const currentIndex = steps.indexOf(step);
          const nextStep = currentIndex < steps.length - 1 ? steps[currentIndex + 1] : 'finished';
          
          // Show toast with options
          return handleStepFailure({
            step,
            nextStep,
            error: result.errorMessage || 'Unknown error',
            toast,
            setStepStatus,
            regenerateSpecificStep,
            currentGenerationIdRef
          });
        }
        
        // Update the generatedProblem state with this step's result
        setGeneratedProblem(prev => ({
          ...prev,
          ...result
        }));
        
        return result;
      }
      
      // Success! Update status and return result
      setStepStatus(prev => ({
        ...prev,
        [step]: { status: 'completed', retryCount: prev[step]?.retryCount || 0 }
      }));
      
      // Update the generatedProblem state with this step's result
      setGeneratedProblem(prev => ({
        ...prev,
        ...result
      }));
      
      return result;
    } catch (error) {
      // Exit if this generation was canceled
      if (error.message === 'Generation canceled' || 
          currentGenerationIdRef.current !== thisGenerationId) {
        throw error;
      }
      
      console.error(`Error on attempt ${attempt}/${MAX_RETRIES} for ${step}:`);
      logger.debug(error.stack);
      
      // Last attempt failed, mark as error
      if (attempt >= MAX_RETRIES) {
        setStepStatus(prev => ({
          ...prev,
          [step]: { 
            status: 'failed', 
            retryCount: attempt,
            error: error.message || 'Unknown error'
          }
        }));
        
        // Determine the next step based on current step
        const steps = [
          'title', 'description', 'functionName', 'functionParams', 
          'testCases', 'expectedOutputs', 'examples', 'codeSnippets', 
          'constraints', 'solution'
        ];
        const currentIndex = steps.indexOf(step);
        const nextStep = currentIndex < steps.length - 1 ? steps[currentIndex + 1] : 'finished';
        
        return handleStepFailure({
          step,
          nextStep,
          error: error.message || 'Unknown error',
          toast,
          setStepStatus,
          regenerateSpecificStep,
          currentGenerationIdRef
        });
      }
      
      // Not the last attempt, mark as retrying and wait before next try
      setStepStatus(prev => ({
        ...prev,
        [step]: { 
          status: 'retrying', 
          retryCount: attempt,
          error: error.message || 'Unknown error'
        }
      }));
      
      // Wait before next retry
      console.log(`Waiting before retry ${attempt+1}/${MAX_RETRIES} for ${step}...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

/**
 * Helper function to handle step failure with UI prompts
 */
const handleStepFailure = ({
  step,
  nextStep,
  error,
  toast,
  setStepStatus,
  regenerateSpecificStep,
  currentGenerationIdRef
}) => {
  return new Promise((resolve, reject) => {
    toast({
      title: `Failed to generate ${step}`,
      description: React.createElement(
        VStack,
        { align: "start" },
        React.createElement(Text, {}, error),
        React.createElement(
          HStack,
          { mt: 2, spacing: 2 },
          React.createElement(
            Button,
            {
              size: "sm",
              colorScheme: "blue",
              onClick: async () => {
                toast.closeAll();
                try {
                  const result = await regenerateSpecificStep(step);
                  if (result) {
                    resolve(result);
                  } else {
                    reject(new Error(`Could not regenerate ${step}`));
                  }
                } catch (regenerateError) {
                  reject(regenerateError);
                }
              }
            },
            "Retry this step"
          ),
          React.createElement(
            Button,
            {
              size: "sm",
              variant: "outline",
              colorScheme: "yellow",
              onClick: () => {
                toast.closeAll();
                // Continue to next step with a default placeholder
                const result = continueAfterFailedStep(setStepStatus, toast, step, nextStep);
                resolve(result);
              }
            },
            "Continue anyway"
          ),
          React.createElement(
            Button,
            {
              size: "sm",
              variant: "outline",
              colorScheme: "red",
              onClick: () => {
                toast.closeAll();
                // Cancel the whole generation
                currentGenerationIdRef.current++;
                reject(new Error('Generation canceled by user'));
              }
            },
            "Cancel"
          )
        )
      ),
      status: 'error',
      duration: null,
      isClosable: false,
    });
  });
};

/**
 * Clean and process a solution string, handling escape sequences
 * 
 * @param {string} solution - Raw solution string
 * @returns {string} - Processed solution string
 */
export const parseEscapeSequences = (text) => {
  if (!text) return '';
  // Replace escaped newlines, tabs, quotes, etc. with actual characters
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r')
    .replace(/\\'/g, '\'')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}; 