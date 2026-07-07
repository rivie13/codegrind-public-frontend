const ISSUE_EVENT = 'codegrind:client-issue-recorded';
const MAX_BUFFERED_ISSUES = 6;
const MAX_SUMMARY_LENGTH = 320;

const normalizeValue = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim();
};

const redactSensitiveText = (value) => {
  const normalized = normalizeValue(value);
  if (!normalized) return '';

  return normalized
    .replace(/\b\d{1,3}(?:\.\d{1,3}){3}\b(?::\d+)?/g, '[hidden-address]')
    .replace(/https?:\/\/\S+/gi, '[hidden-url]')
    .replace(/[A-Z]:\\\S+/g, '[hidden-path]')
    .replace(/\/api\/\S+/gi, '[hidden-endpoint]')
    .replace(/\bBearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [hidden-token]')
    .replace(/\bat\s+.+?:\d+:\d+/g, '[hidden-stack-frame]');
};

const summarizeIssue = (issue) => {
  const parts = [
    issue.recordedAt,
    issue.source,
    issue.title,
    issue.description,
    issue.errorMessage,
  ].filter(Boolean);

  return redactSensitiveText(parts.join(' | ')).slice(0, MAX_SUMMARY_LENGTH);
};

const readErrorMessage = (error) => {
  if (!error) return '';
  if (typeof error === 'string') return error;
  return error?.data?.message || error?.message || error?.reason || '';
};

const recentIssues = [];

export const recordClientIssue = ({
  title,
  description,
  source = 'client',
  status = 'error',
  error = null,
  metadata = {},
}) => {
  const normalizedTitle = redactSensitiveText(title || 'Client issue');
  const normalizedDescription = redactSensitiveText(description || normalizedTitle);
  const errorMessage = redactSensitiveText(readErrorMessage(error)).slice(0, 220);
  const metadataSummary = Object.entries(metadata || {})
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .slice(0, 4)
    .map(([key, value]) => `${key}:${redactSensitiveText(value)}`)
    .join(', ')
    .slice(0, 180);

  const entry = {
    recordedAt: new Date().toISOString(),
    title: normalizedTitle,
    description: normalizedDescription,
    source: redactSensitiveText(source || 'client'),
    status: redactSensitiveText(status || 'error'),
    errorMessage,
    metadataSummary,
  };

  const previousEntry = recentIssues[0];
  const isDuplicate =
    previousEntry &&
    previousEntry.title === entry.title &&
    previousEntry.description === entry.description &&
    previousEntry.source === entry.source;

  if (!isDuplicate) {
    recentIssues.unshift(entry);
    recentIssues.splice(MAX_BUFFERED_ISSUES, recentIssues.length - MAX_BUFFERED_ISSUES);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ISSUE_EVENT, { detail: entry }));
  }

  return isDuplicate ? previousEntry : entry;
};

export const getRecentClientIssues = () => recentIssues.slice();

export const buildRecentIssueClientState = () => {
  const issues = getRecentClientIssues();
  if (!issues.length) return {};

  return issues.reduce(
    (accumulator, issue, index) => {
      accumulator[`recentIssue${index + 1}`] = summarizeIssue(issue);
      return accumulator;
    },
    {
      recentIssueCount: String(issues.length),
    }
  );
};

export default recordClientIssue;
