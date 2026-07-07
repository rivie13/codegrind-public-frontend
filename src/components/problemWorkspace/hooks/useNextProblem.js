import { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import logger from '../../../utils/core/logger';
import {
  getNextClusterSlug,
  normalizeClusterNavigation,
} from '../../../utils/navigation/clusterNavigation';

const formatFallbackTitle = (slug) =>
  String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');

const resolveNextProblemCursor = (problemData) => {
  if (!problemData) return null;

  const candidates = [
    problemData?.questionId,
    problemData?.questionFrontendId,
    problemData?.displayNumber,
    problemData?.metadata?.frontendQuestionId,
    problemData?.titleSlug,
    problemData?.id,
  ];

  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined) continue;
    const normalized = String(candidate).trim();
    if (normalized) return normalized;
  }

  return null;
};

const useNextProblem = ({
  problemData,
  isAIProblem,
  currentTitleSlug = null,
  clusterNavigation = null,
}) => {
  const [nextProblem, setNextProblem] = useState(null);

  useEffect(() => {
    const fetchNextProblem = async () => {
      try {
        logger.info('Fetching next problem:');

        if (!isAIProblem) {
          const normalizedClusterNavigation = normalizeClusterNavigation(clusterNavigation);
          const activeSlug = currentTitleSlug || problemData?.titleSlug;
          const isClusterOrderedSlug = Boolean(
            normalizedClusterNavigation &&
            activeSlug &&
            normalizedClusterNavigation.orderedSlugs.includes(activeSlug)
          );

          if (isClusterOrderedSlug) {
            const clusterNextSlug = getNextClusterSlug(normalizedClusterNavigation, activeSlug);
            if (!clusterNextSlug) {
              setNextProblem(null);
              return;
            }
            logger.info('Using cluster-ordered next problem slug:');
            logger.debug(clusterNextSlug);

            try {
              const lookup = await api.problems.lookupBySlugs([clusterNextSlug]);
              const matched = Array.isArray(lookup?.problems)
                ? lookup.problems.find((entry) => entry?.titleSlug === clusterNextSlug)
                : null;

              if (matched) {
                setNextProblem(matched);
                return;
              }
            } catch (lookupError) {
              logger.error('Cluster next-problem lookup failed, using slug fallback.');
              logger.debug(lookupError);
            }

            setNextProblem({
              titleSlug: clusterNextSlug,
              title: formatFallbackTitle(clusterNextSlug),
              difficulty: 'Unknown',
            });
            return;
          }
        }

        if (isAIProblem) {
          if (problemData && problemData.id) {
            logger.debug(`AI problem ID: ${problemData.id}`);
            const response = await api.aiProblems.getNextProblem(
              problemData.id,
              problemData.displayNumber
            );

            if (response.error) {
              throw new Error(response.error);
            }

            logger.info('Next AI problem data:');
            logger.debug(response);
            setNextProblem(response);
          } else {
            logger.error('Missing problem ID for AI problem');
            setNextProblem(null);
          }
        } else {
          const nextCursor = resolveNextProblemCursor(problemData);
          if (nextCursor) {
            logger.info('Fetching next interview problem for cursor:');
            logger.debug(nextCursor);

            const response = await api.problems.getNextProblem(nextCursor);

            if (response.error) {
              throw new Error(response.error);
            }

            logger.info('Next interview problem data:');
            logger.debug(response);
            setNextProblem(response);
          } else {
            logger.error('Missing cursor for interview problem');
            setNextProblem(null);
          }
        }
      } catch (error) {
        logger.error('Error fetching next problem:');
        logger.debug(error);
        setNextProblem(null);
      }
    };

    fetchNextProblem();
  }, [problemData, isAIProblem, currentTitleSlug, clusterNavigation]);

  return { nextProblem, setNextProblem };
};

export default useNextProblem;
