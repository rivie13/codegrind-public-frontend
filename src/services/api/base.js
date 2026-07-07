import { API_URL } from './config';

// Function to get base API URL
const getBaseUrl = () => {
  const normalized = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
  return normalized;
};

const getApiBaseUrl = () => getBaseUrl();
const getApiOrigin = () => API_URL;

export { getBaseUrl, getApiBaseUrl, getApiOrigin };
