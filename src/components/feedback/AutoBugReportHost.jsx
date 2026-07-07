import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import BugReportDialog from './BugReportDialog';
import { recordClientIssue } from '../../utils/feedback/clientIssueReporter';

const ISSUE_TOAST_PATTERN =
  /\b(error|failed|unavailable|could not|unable|not saved|timed out|denied|problem unavailable|verification failed|save error|delete failed|unlink failed)\b/i;

const IGNORED_TITLES = new Set(['could not send bug report']);

const EXPECTED_ERROR_TITLE_PATTERNS = [
  /^invalid username$/i,
  /^invalid password$/i,
  /^passwords do not match$/i,
  /^compilation failed$/i,
];

const EXPECTED_ERROR_TEXT_PATTERNS = [
  /email verification required/i,
  /invalid password/i,
  /invalid username/i,
  /passwords? do not match/i,
  /rate limit (?:reached|exceeded)/i,
  /learning limit reached/i,
  /failed test execution/i,
  /failed tests/i,
  /compilation failed/i,
  /run ai diagnostic/i,
];

const normalizeText = (value) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

const isExpectedErrorToast = ({ title, description, combined }) => {
  if (EXPECTED_ERROR_TITLE_PATTERNS.some((pattern) => pattern.test(title))) {
    return true;
  }

  return EXPECTED_ERROR_TEXT_PATTERNS.some((pattern) => pattern.test(combined || description));
};

const inferPageType = (pathname) => {
  if (pathname.includes('/games/tower-defense')) return 'tower-defense';
  if (pathname.includes('/learning')) return 'learning-content';
  if (pathname.includes('/problems') || pathname.includes('/ai-problems')) return 'problem';
  return 'other';
};

const collectToastCandidates = (node) => {
  if (!(node instanceof HTMLElement)) return [];

  const candidates = [];
  if (
    node.matches('[role="alert"], [data-status], [class*="chakra-alert"], [class*="chakra-toast"]')
  ) {
    candidates.push(node);
  }

  node
    .querySelectorAll?.(
      '[role="alert"], [data-status], [class*="chakra-alert"], [class*="chakra-toast"]'
    )
    ?.forEach((candidate) => candidates.push(candidate));

  return candidates;
};

const extractIssueToast = (node) => {
  const status =
    node.getAttribute('data-status') ||
    node.querySelector?.('[data-status]')?.getAttribute('data-status') ||
    '';

  const lines = String(node.innerText || node.textContent || '')
    .split(/\n+/)
    .map((line) => normalizeText(line))
    .filter(Boolean);

  if (!lines.length) return null;

  const title = lines[0];
  const description = lines.slice(1).join(' ');
  const combined = normalizeText(`${title} ${description}`);
  const titleKey = title.toLowerCase();

  if (!combined || IGNORED_TITLES.has(titleKey)) {
    return null;
  }

  if (isExpectedErrorToast({ title, description, combined })) {
    return null;
  }

  const looksLikeIssue = status === 'error' || ISSUE_TOAST_PATTERN.test(combined);
  if (!looksLikeIssue) {
    return null;
  }

  return {
    title,
    description,
    fingerprint: `${titleKey}|${description.toLowerCase()}`,
  };
};

function AutoBugReportHost() {
  const { pathname } = useLocation();
  const pageType = useMemo(() => inferPageType(pathname), [pathname]);
  const [promptState, setPromptState] = useState(null);
  const promptTimeoutRef = useRef(null);
  const lastFingerprintRef = useRef('');
  const lastOpenedAtRef = useRef(0);

  const handleClose = useCallback(() => {
    setPromptState(null);
  }, []);

  const schedulePrompt = useCallback(
    (issue) => {
      const now = Date.now();
      if (!issue?.fingerprint || promptState) return;

      if (
        lastFingerprintRef.current === issue.fingerprint &&
        now - lastOpenedAtRef.current < 15000
      ) {
        return;
      }

      window.clearTimeout(promptTimeoutRef.current);
      promptTimeoutRef.current = window.setTimeout(() => {
        lastFingerprintRef.current = issue.fingerprint;
        lastOpenedAtRef.current = Date.now();
        setPromptState({
          ...issue,
          key: `${issue.fingerprint}-${Date.now()}`,
        });
      }, 3000);
    },
    [promptState]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleWindowError = (event) => {
      recordClientIssue({
        title: 'Unhandled client error',
        description: 'A client-side error occurred before the page could recover.',
        source: 'window.error',
        error: event?.error || event?.message || null,
      });
    };

    const handleUnhandledRejection = (event) => {
      recordClientIssue({
        title: 'Unhandled promise rejection',
        description: 'A background request failed unexpectedly.',
        source: 'window.unhandledrejection',
        error: event?.reason || null,
      });
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const processNode = (node) => {
      collectToastCandidates(node).forEach((candidate) => {
        const issueToast = extractIssueToast(candidate);
        if (!issueToast) return;

        recordClientIssue({
          title: issueToast.title,
          description: issueToast.description || issueToast.title,
          source: 'toast',
          metadata: { pathname },
        });

        schedulePrompt(issueToast);
      });
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => processNode(node));
      });
    });

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      observer.disconnect();
      window.clearTimeout(promptTimeoutRef.current);
    };
  }, [pathname, schedulePrompt]);

  if (!promptState) return null;

  const initialDescription = [
    `Auto-captured issue: ${promptState.title}`,
    promptState.description || 'No extra toast description was available.',
    '',
    'What were you doing right before this happened?',
    '- ',
    '',
    'What did you expect to happen instead?',
    '- ',
  ].join('\n');

  return (
    <BugReportDialog
      key={promptState.key}
      isOpen
      onClose={handleClose}
      pageType={pageType}
      initialDescription={initialDescription}
      pageContext={{
        autoPrompt: true,
        autoPromptPathname: pathname,
        triggerToastTitle: promptState.title,
        triggerToastDescription: promptState.description || '',
      }}
      clientState={{
        autoPromptTriggered: true,
        autoPromptTitle: promptState.title,
      }}
    />
  );
}

export default AutoBugReportHost;

export { extractIssueToast };
