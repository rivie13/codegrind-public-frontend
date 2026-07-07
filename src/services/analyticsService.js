const GTM_ID = 'G-TZBYE7GZJN';
const ADSENSE_CLIENT = import.meta.env.VITE_GOOGLE_ADSENSE_ID || 'ca-pub-7733001105026476';

// Enabled in production builds, or when VITE_ENABLE_ANALYTICS=true (tests/staging).
const analyticsEnabled = import.meta.env.PROD || import.meta.env.VITE_ENABLE_ANALYTICS === 'true';

export const trackGooglePageView = ({ path, title, location } = {}) => {
  if (!analyticsEnabled) return;
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  try {
    window.gtag('event', 'page_view', {
      page_path: path || `${window.location?.pathname || ''}${window.location?.search || ''}`,
      page_title: title || (typeof document !== 'undefined' ? document.title : undefined),
      page_location: location || window.location?.href,
    });
  } catch (e) {
    console.error('[AnalyticsService] Error calling gtag("event", "page_view"): ', e);
  }
};

export const trackGoogleAnalyticsEvent = (eventName, params = {}) => {
  if (!analyticsEnabled) return;
  if (!eventName || typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  try {
    window.gtag('event', eventName, params);
  } catch (e) {
    console.error('[AnalyticsService] Error calling gtag("event"): ', e);
  }
};

// Inject the GTM script tag if not already present, then configure.
// No-op in non-production environments.
export const initializeGoogleAnalytics = () => {
  if (!analyticsEnabled) return;

  const configureGtag = () => {
    try {
      window.gtag('config', GTM_ID, { send_page_view: false });
      trackGooglePageView();
    } catch (e) {
      console.error('[AnalyticsService] Error calling gtag("config"): ', e);
    }
  };

  if (typeof window.gtag === 'function') {
    configureGtag();
    return;
  }

  // GTM script not yet loaded — inject it now
  if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GTM_ID}`;
    script.onload = configureGtag;
    script.onerror = () => console.error('[AnalyticsService] GTM script failed to load.');
    document.head.appendChild(script);
  } else {
    // Script tag exists but gtag not yet defined — wait for it
    setTimeout(() => {
      if (typeof window.gtag === 'function') configureGtag();
    }, 2000);
  }
};

// Inject the AdSense script tag if not already present.
// No-op in non-production environments.
export const initializeAdSense = () => {
  if (!analyticsEnabled) return;

  if (window.adsenseScriptLoaded || document.querySelector('script[src*="adsbygoogle.js"]')) {
    window.adsenseScriptLoaded = true;
    return;
  }

  window.adsbygoogle = window.adsbygoogle || [];
  window.adInitialized = window.adInitialized || {};
  window.adsenseScriptLoaded = false;

  const script = document.createElement('script');
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  script.crossOrigin = 'anonymous';
  script.async = true;
  script.onload = () => {
    window.adsenseScriptLoaded = true;
  };
  script.onerror = (error) => {
    console.error('[AnalyticsService] AdSense script failed to load:', error);
  };
  document.head.appendChild(script);
};
