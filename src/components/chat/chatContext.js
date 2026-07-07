import { scrubContextText, stripHtml, truncateText, wrapUserCode } from './chatHelpers';

const normalizeArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item !== null && item !== undefined);
};

const stringifyParamList = (params) => {
  const normalized = normalizeArray(params);
  if (normalized.length === 0) return null;

  return normalized
    .map((param) => {
      if (typeof param === 'string') {
        return scrubContextText(stripHtml(param));
      }

      if (!param || typeof param !== 'object') {
        return null;
      }

      const name = param.name || param.paramName || 'param';
      const type = param.type || param.dataType || 'unknown';
      return `${name}: ${type}`;
    })
    .filter(Boolean)
    .join(', ');
};

const stringifyExamples = (examples) => {
  const normalized = normalizeArray(examples);
  if (normalized.length === 0) return null;

  return normalized
    .map((example) => scrubContextText(stripHtml(String(example))))
    .filter(Boolean)
    .join(' | ');
};

const buildProblemMetadata = (problem = {}) => {
  const metadata =
    problem?.metadata && typeof problem.metadata === 'object' ? problem.metadata : {};
  const params = problem.functionParams || metadata.params || metadata.functionParams || [];
  const outputType =
    problem.returnType || metadata.returnType || metadata.return?.type || metadata.return || null;

  return {
    canonicalName:
      problem.referenceName || metadata.referenceName || metadata.referenceSlug || null,
    functionName: problem.functionName || metadata.name || metadata.functionName || null,
    inputSpec: stringifyParamList(params),
    outputSpec: typeof outputType === 'string' ? outputType : null,
  };
};

const buildProblemDescription = (problem = {}, fallbackDescription = '') => {
  const descriptionParts = [];
  const primaryDescription = problem.description || problem.content || fallbackDescription;

  if (primaryDescription) {
    descriptionParts.push(scrubContextText(stripHtml(primaryDescription)));
  }

  if (problem.constraints) {
    descriptionParts.push(`Constraints: ${scrubContextText(stripHtml(problem.constraints))}`);
  }

  const examples = stringifyExamples(problem.examples);
  if (examples) {
    descriptionParts.push(`Examples: ${examples}`);
  }

  return descriptionParts.join('\n');
};

const buildRecentHistory = (messages) => {
  return messages
    .filter((msg) => !msg.isThinking && !msg.isError && msg.content && msg.id !== 'intro')
    .slice(-6)
    .map((msg) => ({
      role: msg.isAi ? 'assistant' : 'user',
      content:
        typeof msg.content === 'string' ? scrubContextText(msg.content) : '[non-text content]',
    }));
};

const extractExecutionErrors = (output) => {
  if (!output || typeof output !== 'string') return '';

  const lines = output.split('\n');
  const errorLines = [];
  let capturingFailedTest = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const normalized = line.toLowerCase();

    if (line.includes('Test Case Failed') || line.includes('❌ Test Case Failed')) {
      capturingFailedTest = true;
      errorLines.push(line);
      continue;
    }

    if (capturingFailedTest) {
      if (line.includes('------------------')) {
        capturingFailedTest = false;
        errorLines.push(line);
        continue;
      }

      if (
        line.startsWith('Input:') ||
        line.startsWith('Expected Output:') ||
        line.startsWith('Actual Output:') ||
        line.startsWith('Expected:') ||
        line.startsWith('Output:') ||
        line.startsWith('Compilation Error:') ||
        line.startsWith('Runtime Error:') ||
        line.startsWith('Message:') ||
        line.startsWith('Error:')
      ) {
        errorLines.push(line);
      }
      continue;
    }

    if (
      normalized.includes('compilation error') ||
      normalized.includes('runtime error') ||
      normalized.startsWith('error:')
    ) {
      errorLines.push(line);
    }
  }

  return errorLines.join('\n').trim();
};

const extractTerminalErrors = (output) => {
  if (!output || typeof output !== 'string') return '';

  const lines = output.split('\n');
  const errorLines = [];
  let capturingFailedTest = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const normalized = line.toLowerCase();

    if (line.includes('[TEST') && line.includes('FAILED')) {
      capturingFailedTest = true;
      errorLines.push(line);
      continue;
    }

    if (capturingFailedTest) {
      if (line.includes('------------------')) {
        capturingFailedTest = false;
        errorLines.push(line);
        continue;
      }

      if (
        line.startsWith('Input:') ||
        line.startsWith('Expected Output:') ||
        line.startsWith('Actual Output:') ||
        line.startsWith('Expected:') ||
        line.startsWith('Output:') ||
        line.startsWith('Compilation Error:') ||
        line.startsWith('Runtime Error:') ||
        line.startsWith('Message:') ||
        line.startsWith('Error:')
      ) {
        errorLines.push(line);
      }
      continue;
    }

    if (
      normalized.includes('compilation error') ||
      normalized.includes('runtime error') ||
      (line.startsWith('Error:') && !line.startsWith('[ERROR]'))
    ) {
      errorLines.push(line);
    }
  }

  return errorLines.join('\n').trim();
};

export const buildProblemChatContext = ({
  problemId,
  draftProblem,
  problemData,
  code,
  executionResult,
  messages,
}) => {
  const baseProblem = draftProblem || problemData || {};
  const metadata = buildProblemMetadata(baseProblem);
  const filteredErrors = extractExecutionErrors(executionResult || '');
  const rawTerminal = executionResult || '';
  const rawCode = code || '';
  const recentHistory = buildRecentHistory(messages);
  const resolvedProblemId = problemId || baseProblem.titleSlug || baseProblem.id || null;

  return {
    problem: {
      title: baseProblem.title || baseProblem.titleSlug || null,
      titleSlug: baseProblem.titleSlug || null,
      difficulty: baseProblem.difficulty || null,
      description: buildProblemDescription(baseProblem),
    },
    problemMetadata: metadata,
    problemId: resolvedProblemId,
    language: baseProblem.language || null,
    codeRaw: truncateText(rawCode, 3000),
    codeWrapped: truncateText(wrapUserCode(rawCode), 3200),
    terminalErrors: truncateText(filteredErrors, 2000),
    terminalOutputRaw: truncateText(rawTerminal, 2500),
    chatHistory: recentHistory,
  };
};

export const buildTowerDefenseChatContext = ({
  problemId,
  problem,
  problemDescription,
  language,
  code,
  terminalOutput,
  messages,
}) => {
  const baseProblem = problem || {};
  const metadata = buildProblemMetadata(baseProblem);
  const filteredTerminal = extractTerminalErrors(terminalOutput || '');
  const rawTerminal = terminalOutput || '';
  const rawCode = code || '';
  const recentHistory = buildRecentHistory(messages);
  const resolvedProblemId = problemId || baseProblem.titleSlug || baseProblem.id || null;

  return {
    problem: {
      title: baseProblem.title || null,
      titleSlug: baseProblem.titleSlug || resolvedProblemId || null,
      difficulty: baseProblem.difficulty || null,
      description: buildProblemDescription(baseProblem, problemDescription),
    },
    problemMetadata: metadata,
    problemId: resolvedProblemId,
    language: language || null,
    codeRaw: truncateText(rawCode, 3000),
    codeWrapped: truncateText(wrapUserCode(rawCode), 3200),
    terminalErrors: truncateText(filteredTerminal, 2000),
    terminalOutputRaw: truncateText(rawTerminal, 2500),
    chatHistory: recentHistory,
  };
};
