/**
 * guestFunnelService.js — Posts guest trial funnel events to Azure Monitor
 * via the backend /api/analytics/guest-funnel endpoint.
 *
 * Events land in the App Insights `customEvents` table (via the
 * `microsoft.custom_event.name` OTel attribute) so they're usable in the
 * built-in Funnels blade under Usage.
 */

import { fetchWithError } from './api/fetcher';
import { trackGoogleAnalyticsEvent } from './analyticsService';
import logger from '../utils/core/logger';

const ENDPOINT = '/api/analytics/guest-funnel';

function getClientMetadata() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {};
  }
  const ua = navigator.userAgent || '';

  // OS Detection
  let os = 'Unknown';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Macintosh|Mac OS X/i.test(ua) && !/iPhone|iPad|iPod/i.test(ua)) os = 'macOS';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Linux/i.test(ua)) os = 'Linux';

  // Browser Detection
  let browser = 'Unknown';
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Chrome/i.test(ua) && !/Chromium/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/MSIE|Trident/i.test(ua)) browser = 'IE';

  // Device Type Detection
  let deviceType = 'desktop';
  const isMobile = /Mobi|Android|iPhone|iPod/i.test(ua);
  const isTablet = /iPad|Tablet|PlayBook|Silk/i.test(ua);
  if (isTablet) {
    deviceType = 'tablet';
  } else if (isMobile) {
    deviceType = 'mobile';
  }

  return {
    client_os: os,
    client_browser: browser,
    client_device: deviceType,
    client_viewport_w: String(window.innerWidth || 0),
    client_viewport_h: String(window.innerHeight || 0),
    client_screen_w: String(window.screen?.width || 0),
    client_screen_h: String(window.screen?.height || 0),
  };
}

/**
 * Fire-and-forget POST. Never throws — failures are logged and swallowed
 * so they never disrupt the user experience.
 *
 * @param {string} step  One of the VALID_FUNNEL_STEPS on the backend
 * @param {Record<string, string>} [metadata]  Optional context
 */
export async function trackGuestFunnelStep(step, metadata = {}) {
  const clientMeta = getClientMetadata();
  const enrichedMetadata = {
    ...clientMeta,
    ...metadata,
  };

  trackGoogleAnalyticsEvent(`guest_funnel_${step}`, enrichedMetadata);

  try {
    return await fetchWithError(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step, metadata: enrichedMetadata }),
    });
  } catch (err) {
    logger.warn(`[guestFunnel] Failed to record step "${step}":`, err.message);
    return null;
  }
}
