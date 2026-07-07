export const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
};

export const normalizeProblemId = (id) => {
    if (typeof id === 'string' && id.startsWith('ai-')) {
        return id;
    }

    const isAIProblem = window.location.pathname.includes('/ai-problems/');

    if (isAIProblem) {
        return `ai-${id || window.location.pathname.split('/').pop()}`;
    }

    return id;
};

export const stripHtml = (value) => {
    if (!value || typeof value !== 'string') return '';
    return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

export const truncateText = (value, maxChars = 2000) => {
    if (!value || typeof value !== 'string') return '';
    if (value.length <= maxChars) return value;
    return `${value.slice(0, maxChars)}\n...[truncated]`;
};

export const wrapUserCode = (value) => {
    if (!value || typeof value !== 'string') return '';
    return `[USER_CODE_START]\n${value}\n[USER_CODE_END]`;
};

export const scrubContextText = (value) => {
    if (!value || typeof value !== 'string') return '';
    return value.replace(/\b(hack|hacker|breach|exploit|attack|attacks|malware|phishing|zero[-\s]?day|backdoor|weapon|kill|harm)\b/gi, '[redacted]');
};

export const sanitizeOutgoingMessage = (value) => {
    if (!value || typeof value !== 'string') return '';
    return value.replace(/\b(hack|hacker|breach|exploit|attack|attacks|malware|phishing|zero[-\s]?day|backdoor|weapon|kill|harm)\b/gi, 'issue');
};

export const formatCooldown = (seconds) => {
    if (!seconds || seconds <= 0) return '0s';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
};

export const getResetRemainingSeconds = (lastResetTime) => {
    if (!lastResetTime) return null;
    const lastResetMs = lastResetTime instanceof Date
        ? lastResetTime.getTime()
        : new Date(lastResetTime).getTime();
    if (Number.isNaN(lastResetMs)) return null;
    const resetMs = lastResetMs + 24 * 60 * 60 * 1000;
    return Math.max(0, Math.floor((resetMs - Date.now()) / 1000));
};

export const filterDuplicateLimitMessages = (messages) => {
    let hasLimitMessage = false;

    return messages.slice().reverse().filter(msg => {
        if (msg.isLimit) {
            if (hasLimitMessage) {
                return false;
            }
            hasLimitMessage = true;
        }
        return true;
    }).reverse();
};
