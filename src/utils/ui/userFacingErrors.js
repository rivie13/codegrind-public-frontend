const TECHNICAL_MESSAGE_PATTERNS = [
  /\b(?:TypeError|ReferenceError|SyntaxError|AbortError|NetworkError)\b/i,
  /\b(?:ECONN|ENOTFOUND|ETIMEDOUT|ERR_[A-Z_]+)\b/i,
  /\b(?:stack trace|exception|undefined|null reference)\b/i,
  /\b(?:request failed with status code|http error|status:?\s*\d{3})\b/i,
  /\b(?:csrf|oauth|jwt|prisma|sql|sqlite|postgres|mongodb)\b/i,
  /\b(?:failed to fetch|network request failed|load failed|cannot read properties?)\b/i,
  /https?:\/\//i,
  /[A-Z]:\\/i,
  /\/api\//i,
  /\{.*\}|\[object\s+Object\]/i,
];

const normalizeMessage = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim();
};

export const redactSensitiveErrorText = (value) => {
  const normalized = normalizeMessage(value);
  if (!normalized) return '';

  return normalized
    .replace(/\b\d{1,3}(?:\.\d{1,3}){3}\b(?::\d+)?/g, '[hidden-address]')
    .replace(/https?:\/\/\S+/gi, '[hidden-url]')
    .replace(/[A-Z]:\\\S+/g, '[hidden-path]')
    .replace(/\/api\/\S+/gi, '[hidden-endpoint]')
    .replace(/\bBearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [hidden-token]');
};

const isLikelyTechnicalMessage = (message) => {
  if (!message) return true;
  if (message.length > 180) return true;
  return TECHNICAL_MESSAGE_PATTERNS.some((pattern) => pattern.test(message));
};

export const getUserFacingErrorMessage = (errorOrMessage, fallbackMessage) => {
  const fallback = normalizeMessage(fallbackMessage);

  const rawMessage = normalizeMessage(
    typeof errorOrMessage === 'string'
      ? errorOrMessage
      : errorOrMessage?.data?.message || errorOrMessage?.message || ''
  );

  if (!rawMessage) return fallback;
  if (isLikelyTechnicalMessage(rawMessage)) return fallback;

  return redactSensitiveErrorText(rawMessage);
};

export const getOptionalInlineErrorDetail = (errorOrMessage) => {
  const rawMessage = normalizeMessage(
    typeof errorOrMessage === 'string'
      ? errorOrMessage
      : errorOrMessage?.data?.message || errorOrMessage?.message || ''
  );

  if (!rawMessage || isLikelyTechnicalMessage(rawMessage)) {
    return null;
  }

  return redactSensitiveErrorText(rawMessage);
};

export const sanitizeExecutionDisplayText = (value) => {
  if (!value) return '';

  return String(value)
    .split(/\r?\n/)
    .map((line) => line.replace(/\b\d{1,3}(?:\.\d{1,3}){3}\b(?::\d+)?/g, '[hidden-address]'))
    .map((line) => line.replace(/https?:\/\/\S+/gi, '[hidden-url]'))
    .map((line) => line.replace(/[A-Z]:\\\S+/g, '[hidden-path]'))
    .map((line) => line.replace(/\/api\/\S+/gi, '[hidden-endpoint]'))
    .map((line) => line.replace(/^\s*at\s+.+$/g, '[hidden-stack-frame]'))
    .join('\n');
};

export default getUserFacingErrorMessage;
