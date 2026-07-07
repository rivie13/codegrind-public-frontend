import { DEPLOYABLE_TYPES } from '../../../game-engine-v2';

export const normalizeTerminalOutput = (output) => {
  if (Array.isArray(output)) {
    return output
      .map((item) => {
        if (typeof item === 'string') {
          return { text: `${item}\n`, className: 'terminal-line' };
        }
        if (item && typeof item === 'object') {
          if (typeof item.text === 'string') {
            return item;
          }
          if (typeof item.message === 'string') {
            return { text: `${item.message}\n`, className: item.className || 'terminal-line' };
          }
        }
        return null;
      })
      .filter(Boolean);
  }

  if (typeof output !== 'string') {
    return [];
  }

  const lines = output.split('\n');
  return lines.map((line) => ({ text: `${line}\n`, className: 'terminal-line' }));
};

export const getDeployablePlacementType = (deployable) => {
  if (!deployable) return 'any';
  const byKey = deployable.key ? DEPLOYABLE_TYPES[deployable.key] : null;
  const byType = !byKey
    ? Object.values(DEPLOYABLE_TYPES).find((item) => item.type === deployable.type)
    : null;
  return (byKey || byType)?.placementType || 'any';
};

export const resolveTypeKey = (input, types) => {
  if (!input) return null;
  const normalizeKey = (value) => value.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  const normalizeMatch = (value) => value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const directKey = normalizeKey(input);
  if (types[directKey]) return directKey;

  const normalized = normalizeMatch(input);
  const aliasMap = {
    BURST: 'BURST_TURRET',
    BLAST: 'BLAST_TURRET',
  };
  const aliasKey = aliasMap[normalized];
  if (aliasKey && types[aliasKey]) return aliasKey;

  const match = Object.keys(types).find((key) => {
    const typeName = types[key]?.type || '';
    return normalizeMatch(key) === normalized || normalizeMatch(typeName) === normalized;
  });
  return match || null;
};

export const getTowerDefenseProblemId = (problem) => {
  if (!problem) return null;

  const normalizedSource = String(problem?.source || '').toUpperCase();
  const metadataFrontendId =
    problem?.metadata?.frontendQuestionId || problem?.metadata?.questionFrontendId;
  const isAIProblem = normalizedSource === 'AI' || problem?.isAIProblem;

  let rawId;
  if (isAIProblem) {
    rawId =
      problem?.displayNumber || metadataFrontendId || problem?.questionFrontendId || problem?.id;
  } else if (normalizedSource === 'LEARNING' || normalizedSource === 'CODEGRIND') {
    rawId = problem?.id || problem?.questionId || metadataFrontendId || problem?.questionFrontendId;
  } else {
    // Legacy interview/leetcode rows still key off questionId.
    rawId =
      problem?.questionId ||
      metadataFrontendId ||
      problem?.questionFrontendId ||
      problem?.displayNumber ||
      problem?.id;
  }

  const parsedId = parseInt(rawId, 10);
  return Number.isNaN(parsedId) ? null : parsedId;
};
