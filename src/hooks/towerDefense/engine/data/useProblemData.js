import { useCallback, useEffect, useRef, useState } from 'react';
import MapGenerator from '../../../../components/towerDefense/MapGenerator';
import {
  getDifficultyConfig,
  normalizeProblemDifficulty,
} from '../../../../utils/problems/difficultyConfig';
import { api } from '../../../../services/api';
import logger from '../../../../utils/core/logger';

/**
 * Custom hook to fetch and manage problem data for the Tower Defense game
 *
 * @param {string} titleSlug - The slug of the problem to fetch
 * @param {Function} clearChatHistory - Function to clear chat history when loading a new problem
 * @param {string|null} difficultyOverride - Optional override for map difficulty
 * @returns {Object} Problem data and related state values
 */
export default function useProblemData(
  titleSlug,
  clearChatHistory,
  difficultyOverride = null,
  options = {}
) {
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatedMap, setGeneratedMap] = useState(null);
  const [difficultyProcessed, setDifficultyProcessed] = useState(false);
  const lastGeneratedKeyRef = useRef(null);
  const activeRequestRef = useRef(0);
  const latestSlugRef = useRef(null);
  const sharedMap = options?.sharedMap || null;
  const setSharedMap = options?.setSharedMap || null;
  const preserveMapOnSlugChange = Boolean(options?.preserveMapOnSlugChange);
  const preserveChatOnSlugChange = Boolean(options?.preserveChatOnSlugChange);
  const mapSeedKey = options?.mapSeedKey || null;

  /**
   * Generate a map for the problem based on its difficulty
   * @param {string} slug - The problem slug to use as a seed
   * @param {string} difficulty - The difficulty level of the problem
   */
  const generateMap = useCallback(
    (slug, difficulty) => {
      //console.log('[DEBUG] Generating map with slug:', slug, 'difficulty:', difficulty);
      try {
        if (sharedMap && preserveMapOnSlugChange) {
          setGeneratedMap(sharedMap);
          return;
        }
        const normalizedDifficulty = normalizeProblemDifficulty(difficulty);
        const seedSource = String(mapSeedKey || slug || '');
        const generationKey = `${seedSource}:${normalizedDifficulty}`;
        if (lastGeneratedKeyRef.current === generationKey) {
          return;
        }
        lastGeneratedKeyRef.current = generationKey;

        const seed = seedSource.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const difficultyConfig = getDifficultyConfig(normalizedDifficulty);
        const mapGenerator = new MapGenerator(
          difficultyConfig.gridSize.cols,
          difficultyConfig.gridSize.rows,
          normalizedDifficulty.toLowerCase(),
          seed
        );
        const mapData = mapGenerator.generateMap();

        // Guard against invalid map data
        if (!mapData || !mapData.map || !Array.isArray(mapData.map)) {
          console.error('[ERROR] Map generation failed - invalid map data returned');
          return;
        }

        // Store the difficulty used for this map
        mapData.difficulty = normalizedDifficulty.toLowerCase();
        mapData.cellSize = difficultyConfig.cellSize;

        // Create a grid reference for backward compatibility
        mapData.grid = mapData.map;

        // Safely log dimensions with null checks
        const gridLength = mapData.map.length || 0;
        const firstRowLength = mapData.map[0]?.length || 0;
        //console.log('[DEBUG] Map generated successfully:', gridLength, 'x', firstRowLength);
        if (typeof setSharedMap === 'function') {
          setSharedMap(mapData);
        }
        setGeneratedMap(mapData);
      } catch (error) {
        console.error('[ERROR] Failed to generate map:', error);
        const normalizedDifficulty = normalizeProblemDifficulty(difficulty);
        const difficultyConfig = getDifficultyConfig(normalizedDifficulty);
        // Create a fallback map structure to prevent UI errors
        const fallbackMap = {
          grid: [[]],
          path: [],
          difficulty: normalizedDifficulty.toLowerCase(),
          cellSize: difficultyConfig.cellSize,
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 0, y: 0 },
        };
        if (typeof setSharedMap === 'function') {
          setSharedMap(fallbackMap);
        }
        setGeneratedMap(fallbackMap);
      }
    },
    [mapSeedKey, preserveMapOnSlugChange, setSharedMap, sharedMap]
  );

  /**
   * Fetch problem data from the API
   * @param {string} slug - The problem slug to fetch
   */
  const fetchProblem = useCallback(
    async (slug) => {
      const requestId = activeRequestRef.current + 1;
      activeRequestRef.current = requestId;
      latestSlugRef.current = slug;

      try {
        setLoading(true);

        // Clear chat history when fetching a new problem
        if (clearChatHistory && !preserveChatOnSlugChange) {
          clearChatHistory();
        }

        const sourceHint = options?.sourceHint || null;

        // Try to fetch from regular problems first
        let data;
        let isAIProblem = false;
        let isLearningProblem = false;

        if (sourceHint === 'learning') {
          try {
            data = await api.learningProblems.getById(slug);
            isLearningProblem = true;
          } catch (err) {
            data = null;
          }
        }

        if (!data) {
          try {
            data = await api.problems.getById(slug);
            //console.log("Found problem in LEETCODE problems:", slug);
          } catch (err) {
            // If not found, try AI problems
            try {
              data = await api.aiProblems.getById(slug);
              isAIProblem = true;
              //console.log("Found problem in AI problems:", slug);
            } catch (innerErr) {
              // Finally, try learning problems
              try {
                data = await api.learningProblems.getById(slug);
                isLearningProblem = true;
              } catch (learningErr) {
                throw new Error('Problem not found in regular, AI, or learning problems');
              }
            }
          }
        }

        const normalizedSource = String(data?.source || '')
          .trim()
          .toUpperCase();
        const metadataFrontendId =
          data?.metadata?.frontendQuestionId || data?.metadata?.questionFrontendId || null;
        const resolvedQuestionFrontendId =
          data.questionFrontendId ||
          metadataFrontendId ||
          (isLearningProblem
            ? `LEARN-${data.id}`
            : isAIProblem
              ? `AI-${data.id}`
              : data.questionId || data.displayNumber || data.id || null);

        // Process the data for consistent format between problem types
        const processedData = {
          ...data,
          content: data.content || data.description,
          difficulty: data.difficulty?.toUpperCase(),
          questionFrontendId: resolvedQuestionFrontendId,
          displayNumber: data.displayNumber || metadataFrontendId || null,
          isAIProblem:
            !isLearningProblem &&
            normalizedSource !== 'CODEGRIND' &&
            (isAIProblem ||
              // Additional checks for AI problem properties
              Boolean(data.functionName) ||
              Boolean(data.functionParams) ||
              Boolean(data.expectedOutputs) ||
              data.source === 'AI' ||
              (!data.questionId && data.aiModel)),
          isLearningProblem,
          source: isLearningProblem
            ? 'LEARNING'
            : normalizedSource === 'CODEGRIND'
              ? 'CODEGRIND'
              : isAIProblem || normalizedSource === 'AI'
                ? 'AI'
                : normalizedSource === 'LEETCODE'
                  ? 'LEETCODE'
                  : 'CODEGRIND',
          // Ensure examples are handled correctly for both types
          examples: data.examples || [],
        };

        // Log problem type for debugging
        //console.log(`Problem ${slug} identified as: ${processedData.isAIProblem ? 'AI Problem' : 'LeetCode Problem'}`);
        //console.log(`Detection factors: functionName=${Boolean(data.functionName)}, functionParams=${Boolean(data.functionParams)}, expectedOutputs=${Boolean(data.expectedOutputs)}, aiModel=${Boolean(data.aiModel)}`);

        // For debugging purposes, log the examples data
        if (processedData.examples && processedData.examples.length > 0) {
          //console.log(`Found ${processedData.examples.length} examples for ${slug}`);
        } else {
          console.warn(`No examples found for ${slug}`);
        }

        // Log snippet information for debugging
        if (data.codeSnippets) {
          // console.log("Problem loaded with code snippets:",
          //   Array.isArray(data.codeSnippets)
          //     ? `${data.codeSnippets.length} language snippets available`
          //     : `Snippets available for ${Object.keys(data.codeSnippets).length} languages`
          // );
        } else {
          console.warn('No code snippets found in problem data - will use fallback templates');
        }

        if (activeRequestRef.current !== requestId || latestSlugRef.current !== slug) {
          return;
        }

        setProblem(processedData);
        setLoading(false);
      } catch (err) {
        if (activeRequestRef.current !== requestId || latestSlugRef.current !== slug) {
          return;
        }

        logger.error('Error fetching problem:');
        logger.debug(err.stack);
        setError('Failed to load problem data. Please try again.');
        setLoading(false);
      }
    },
    [clearChatHistory, options?.sourceHint, preserveChatOnSlugChange]
  );

  // Fetch problem data when the titleSlug changes
  useEffect(() => {
    if (!titleSlug) {
      return;
    }

    latestSlugRef.current = titleSlug;
    setError(null);

    // Reset difficultyProcessed when the problem changes
    if (!preserveMapOnSlugChange) {
      setDifficultyProcessed(false);
      setGeneratedMap(null);
      lastGeneratedKeyRef.current = null;
    } else if (sharedMap) {
      setGeneratedMap(sharedMap);
      setDifficultyProcessed(true);
    }
    fetchProblem(titleSlug);
  }, [fetchProblem, preserveMapOnSlugChange, sharedMap, titleSlug]);

  useEffect(() => {
    if (!sharedMap) return;
    if (generatedMap !== sharedMap) {
      setGeneratedMap(sharedMap);
    }
  }, [generatedMap, sharedMap]);

  // Generate map when we have a titleSlug - doesn't need to wait for full problem data
  useEffect(() => {
    if (!titleSlug) {
      return;
    }

    if (!problem?.difficulty && !difficultyOverride) {
      return;
    }

    if (sharedMap && preserveMapOnSlugChange) {
      if (!generatedMap) {
        setGeneratedMap(sharedMap);
      }
      return;
    }

    // Check if we need to generate a map
    if (!generatedMap) {
      //console.log('[DEBUG] Generating initial map for:', titleSlug);
      // Generate the map using the problem difficulty once available
      generateMap(titleSlug, difficultyOverride || problem.difficulty);
    } else {
      //console.log('[DEBUG] Map already exists, skipping generation');
    }
  }, [titleSlug, problem?.difficulty, difficultyOverride, generatedMap, generateMap]);

  // Separate effect to update map difficulty when problem data is loaded
  useEffect(() => {
    if (!problem?.difficulty && !difficultyOverride) {
      return;
    }
    if (sharedMap && preserveMapOnSlugChange) {
      return;
    }
    if (!difficultyProcessed) {
      const difficulty = difficultyOverride || problem?.difficulty;
      if (difficulty) {
        generateMap(titleSlug, difficulty);
        setDifficultyProcessed(true);
      }
    }
  }, [
    problem?.difficulty,
    difficultyOverride,
    difficultyProcessed,
    generateMap,
    preserveMapOnSlugChange,
    sharedMap,
    titleSlug,
  ]);

  const renderProblemDescription = useCallback(() => {
    if (!problem) return null;

    return {
      title: problem.title,
      description: problem.description || '',
      content: problem.content || problem.description || '',
      examples: Array.isArray(problem.examples) ? problem.examples : [],
      constraints: problem.constraints || '',
      difficulty: problem.difficulty || '',
      isAIProblem: Boolean(problem.isAIProblem),
    };
  }, [problem]);

  return {
    problem,
    loading,
    error,
    generatedMap,
    setGeneratedMap,
    generateMap,
    fetchProblem,
    setProblem,
    renderProblemDescription,
  };
}
