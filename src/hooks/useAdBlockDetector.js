import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Multi-strategy ad blocker detection hook.
 *
 * 1. Bait element — creates a div with class names and dimensions that ad
 *    blockers universally target. If the element is hidden or removed, an ad
 *    blocker is present.
 * 2. AdSense script probe — tries to fetch a tiny portion of the Google
 *    AdSense loader script. A network error signals a blocker.
 * 3. Window flag — checks whether the AdSense script previously loaded by
 *    Root.jsx set `window.adsenseScriptLoaded`.
 *
 * The hook returns `{ adBlockDetected, recheckAdBlock }`.
 * `recheckAdBlock` lets the UI re-run detection after the user claims they
 * have disabled their blocker.
 */
const useAdBlockDetector = () => {
  const [adBlockDetected, setAdBlockDetected] = useState(null); // null = still checking
  const baitRef = useRef(null);

  const detect = useCallback(async () => {
    let blocked = false;

    // --- Strategy 1: Bait element ----------------------------------------
    try {
      const bait = document.createElement('div');
      bait.className = 'adsbox ad-banner ad-placeholder textads banner-ads ad-unit pub_300x250';
      bait.setAttribute('data-ad-slot', 'test');
      bait.style.cssText = 'width:1px;height:1px;position:absolute;left:-10000px;top:-10000px;';
      document.body.appendChild(bait);
      baitRef.current = bait;

      // Give ad blocker rules a tick to act
      await new Promise((r) => setTimeout(r, 150));

      const computed = window.getComputedStyle(bait);
      if (
        (!bait.offsetParent && bait.offsetHeight === 0) ||
        computed.display === 'none' ||
        computed.visibility === 'hidden' ||
        bait.offsetHeight === 0
      ) {
        blocked = true;
      }
      document.body.removeChild(bait);
      baitRef.current = null;
    } catch {
      // If removing fails, the element was probably already removed by a blocker
      blocked = true;
    }

    // --- Strategy 2: Fetch probe to ad script URL -------------------------
    if (!blocked) {
      try {
        const resp = await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store',
        });
        // `no-cors` yields opaque response (type "opaque") which is fine —
        // if the request was completely blocked we land in the catch.
        void resp;
      } catch {
        blocked = true;
      }
    }

    // --- Strategy 3: Check Root.jsx flag ----------------------------------
    if (!blocked) {
      // Root.jsx sets `window.adsenseScriptLoaded = true` on script load.
      // If the script tag exists but the flag is still false after a
      // reasonable timeout, the script was blocked.
      const scriptTag = document.querySelector('script[src*="adsbygoogle.js"]');
      if (scriptTag && window.adsenseScriptLoaded === false) {
        blocked = true;
      }
    }

    setAdBlockDetected(blocked);
  }, []);

  useEffect(() => {
    // Small delay so the Root-level AdSense script has time to load/fail
    const timer = setTimeout(detect, 800);
    return () => {
      clearTimeout(timer);
      if (baitRef.current && baitRef.current.parentNode) {
        baitRef.current.parentNode.removeChild(baitRef.current);
      }
    };
  }, [detect]);

  return { adBlockDetected, recheckAdBlock: detect };
};

export default useAdBlockDetector;
