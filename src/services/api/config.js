// Determine API URL based on the current hostname.
// In production builds, import.meta.env.PROD === true and Vite's dead-code
// elimination removes the dev/localhost branches from the bundle.
const getBrowserLocation = () => (typeof window === 'undefined' ? null : window.location);

const getApiUrl = () => {
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 'https://api.codegrind.online';
  }

  const envApiUrl = import.meta.env.VITE_API_URL;
  const location = getBrowserLocation();

  if (!location) {
    return envApiUrl || 'https://api.codegrind.online';
  }

  const { hostname, origin } = location;

  if (hostname === 'dev.codegrind.online') {
    return envApiUrl || 'http://dev.codegrind.online:3000';
  }

  if (hostname.endsWith('.trycloudflare.com')) {
    return envApiUrl || origin;
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return envApiUrl || 'http://localhost:3000';
  }

  // Any other hostname in dev/test mode — use env override or production default
  return envApiUrl || 'https://api.codegrind.online';
};

// Get AI server URL — supplied via env var only; no dev fallback needed.
const getAiServerUrl = () => {
  return import.meta.env.VITE_AI_SERVER_URL;
};

const getJudge0Url = () => {
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_JUDGE0_API_URL || 'https://judge0.codegrind.online';
  }

  const location = getBrowserLocation();

  if (!location) {
    return import.meta.env.VITE_JUDGE0_API_URL || 'https://judge0.codegrind.online';
  }

  const { hostname } = location;

  if (hostname === 'dev.codegrind.online') {
    return 'http://dev.codegrind.online:2358';
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:2358';
  }

  // Any other hostname in dev/test mode — use env override or production default
  return import.meta.env.VITE_JUDGE0_API_URL || 'https://judge0.codegrind.online';
};

const API_URL = getApiUrl();
const AI_SERVER_URL = getAiServerUrl();
const JUDGE0_API_URL = getJudge0Url();

export {
  getApiUrl,
  getAiServerUrl,
  getJudge0Url,
  API_URL,
  AI_SERVER_URL,
  JUDGE0_API_URL,
};
