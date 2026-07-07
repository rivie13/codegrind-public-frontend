/**
 * Utility functions for handling Google AdSense in a React environment
 */

/**
 * Checks if the AdSense script is loaded
 * @returns {boolean} True if AdSense script is loaded
 */
export const isAdsenseLoaded = () => {
  return !!window.adsbygoogle || 
         !!document.querySelector('script[src*="adsbygoogle.js"]');
};

/**
 * Load the AdSense script if not already loaded
 * @param {string} publisherId The publisher ID
 * @returns {Promise} A promise that resolves when the script is loaded
 */
export const loadAdsenseScript = (publisherId = 'ca-pub-7733001105026476') => {
  return new Promise((resolve, reject) => {
    // Don't load if already loaded
    if (isAdsenseLoaded()) {
      //console.log('AdSense script already loaded');
      resolve(true);
      return;
    }
    
    // Create and add the script
    const script = document.createElement('script');
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
    script.crossOrigin = 'anonymous';
    script.async = true;
    
    script.onload = () => {
      window.adsbygoogle = window.adsbygoogle || [];
      //console.log('AdSense script loaded successfully');
      resolve(true);
    };
    
    script.onerror = (err) => {
      console.error('AdSense script failed to load:', err);
      reject(err);
    };
    
    document.head.appendChild(script);
  });
};

/**
 * Safely push an ad to AdSense
 * @param {Object} options Options to pass to adsbygoogle.push
 * @returns {Promise} A promise that resolves when the ad is pushed
 */
export const pushAd = (options = {}) => {
  return new Promise((resolve, reject) => {
    if (!window.adsbygoogle) {
      window.adsbygoogle = [];
    }
    
    // Wrap in timeout to ensure DOM is ready
    setTimeout(() => {
      try {
        window.adsbygoogle.push(options);
        resolve(true);
      } catch (error) {
        console.error('Error pushing ad:', error);
        reject(error);
      }
    }, 50);
  });
};

/**
 * Clean up stale AdSense elements to prevent conflicts
 */
export const cleanupStaleAds = () => {
  // Clean up any lingering AdSense elements without ad status
  document.querySelectorAll('.adsbygoogle').forEach(el => {
    if (!el.getAttribute('data-ad-status') && 
        !el.querySelector('iframe') && 
        el.parentNode) {
      //console.log('Cleaning up stale AdSense element');
      el.innerHTML = '';
    }
  });
};

/**
 * Reset the AdSense state for testing
 */
export const resetAdState = () => {
  // Reset tracking objects
  window.adInitialized = {};
  window.adsAttempted = 0;
  window.insElementCount = 0;
  
  // Clean up any lingering elements
  cleanupStaleAds();
  
  //console.log('AdSense state reset');
};

/**
 * Create an iframe-isolated ad
 * @param {HTMLElement} container The container element
 * @param {Object} adConfig The ad configuration
 */
export const createIframeAd = (container, adConfig) => {
  if (!container) return null;
  
  // Default configuration
  const config = {
    slot: '5056340385',
    format: 'auto',
    responsive: true,
    client: 'ca-pub-7733001105026476',
    ...adConfig
  };
  
  // Create the iframe
  const iframe = document.createElement('iframe');
  iframe.style.width = '100%';
  iframe.style.height = config.format === 'horizontal' ? '90px' : '250px';
  iframe.style.border = 'none';
  iframe.title = 'Advertisement';
  
  // Add to container
  container.appendChild(iframe);
  
  // Write the ad code to the iframe
  const iframeDoc = iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.client}" crossorigin="anonymous"></script>
      <style>
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        .adsbygoogle {
          display: block;
          width: 100%;
          height: 100%;
        }
      </style>
    </head>
    <body>
      <ins class="adsbygoogle"
           data-ad-client="${config.client}"
           data-ad-slot="${config.slot}"
           data-ad-format="${config.format}"
           data-full-width-responsive="${config.responsive ? 'true' : 'false'}"
           style="display:block;"></ins>
      <script>
        (adsbygoogle = window.adsbygoogle || []).push({});
      </script>
    </body>
    </html>
  `);
  iframeDoc.close();
  
  return iframe;
};

/**
 * Create a video ad element 
 * @param {HTMLElement} container The container element
 * @param {string} slotId The ad slot ID
 * @returns {HTMLElement} The created ad element
 */
export const createVideoAd = (container, slotId) => {
  if (!container) return null;
  
  // Create iframe for the video ad
  const iframe = document.createElement('iframe');
  iframe.style.width = '100%';
  iframe.style.height = '300px';
  iframe.style.border = 'none';
  iframe.title = 'Video Advertisement';
  iframe.id = `video-ad-${Math.random().toString(36).substring(2, 9)}`;
  
  // Clear the container
  container.innerHTML = '';
  container.appendChild(iframe);
  
  // Write the ad code to the iframe
  const iframeDoc = iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7733001105026476" crossorigin="anonymous"></script>
      <style>
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        .adsbygoogle {
          display: block;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <ins class="adsbygoogle adsbygoogle-noablate"
          style="display:block; text-align:center;"
          data-ad-client="ca-pub-7733001105026476"
          data-ad-slot="${slotId}"
          data-ad-format="fluid"
          data-ad-layout="in-article"
          data-ad-layout-key="-fb+5w+4e-db+86"></ins>
      <script>
        (adsbygoogle = window.adsbygoogle || []).push({});
      </script>
    </body>
    </html>
  `);
  iframeDoc.close();
  
  //console.log(`Video ad created with slot ID: ${slotId}`);
  return iframe;
};

/**
 * Force reload all ads on the page
 */
export const reloadAllAds = () => {
  // Clear all existing ad containers
  document.querySelectorAll('.adsbygoogle-container').forEach(container => {
    container.innerHTML = '';
  });
  
  // Force a new push for each ad
  if (window.adsbygoogle && window.adsbygoogle.push) {
    document.querySelectorAll('.adsbygoogle').forEach(() => {
      try {
        window.adsbygoogle.push({});
      } catch (error) {
        console.warn('Error pushing ad:', error);
      }
    });
  }
  
  //console.log('All ads reloaded');
};

export default {
  isAdsenseLoaded,
  loadAdsenseScript,
  pushAd,
  cleanupStaleAds,
  resetAdState,
  createIframeAd,
  createVideoAd,
  reloadAllAds
}; 