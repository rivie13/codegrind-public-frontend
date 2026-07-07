import { Box } from '@chakra-ui/react';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import adSlots from '../../config/adSlots';
import useHasHydrated from '../../hooks/useHasHydrated';

// Track which slots have been initialized - use a global object
// This is important - must be outside the component
const browserWindow = typeof window !== 'undefined' ? window : null;

if (browserWindow) {
  browserWindow.adInitialized = browserWindow.adInitialized || {};
  browserWindow.adsAttempted = browserWindow.adsAttempted || 0;
  browserWindow.insElementCount = browserWindow.insElementCount || 0;
}

// Create a unique instance ID for each ad rendering
const getUniqueAdId = () => `ad-${Math.random().toString(36).substring(2, 15)}`;

const AdUnit = ({
  slotId,
  format = 'auto',
  responsive = true,
  style = {},
  fallbackContent = null,
  adType = null,
  adCategory = 'site',
}) => {
  const { user } = useAuth();
  const hasHydrated = useHasHydrated();
  const adRef = useRef(null);
  const [adFailed, setAdFailed] = useState(false);
  const [uniqueId] = useState(getUniqueAdId());
  const storedMembershipTier = browserWindow?.localStorage?.getItem('membership_tier');
  const membershipTier = (user?.membershipTier || storedMembershipTier || 'FREE').toUpperCase();
  const normalizedTier = membershipTier === 'PRO' ? 'PREMIUM' : membershipTier;
  const isUnlimited = normalizedTier.includes('UNLIMITED');
  const isPremium = normalizedTier.includes('PREMIUM');
  const isSiteAd = adCategory === 'site';
  const isRewardAd = adCategory === 'reward';

  // If no slotId is provided but adType is video, use the video ad slot
  const effectiveSlotId =
    slotId || (adType === 'video' ? adSlots.video?.inArticle : adSlots.generic.sidebar);

  useEffect(() => {
    // Skip if no DOM or ref
    if (typeof window === 'undefined' || !adRef.current) return;

    if (!hasHydrated) return;

    const adContainer = adRef.current;

    // Create an iframe to isolate the AdSense code from React's rendering cycle
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = format === 'horizontal' ? '90px' : '250px';
    iframe.style.border = 'none';
    iframe.title = 'Advertisement';
    iframe.id = uniqueId;

    // Clear the ad container first
    while (adContainer.firstChild) {
      adContainer.removeChild(adContainer.firstChild);
    }

    // Append the iframe
    adContainer.appendChild(iframe);

    // Determine the correct format based on adType
    let adFormat = format;
    let adClass = 'adsbygoogle';

    if (adType === 'video') {
      adFormat = 'fluid';
      adClass = 'adsbygoogle adsbygoogle-noablate';
    } else if (adType === 'interactive') {
      adFormat = 'autorelaxed';
    }

    // Add video-specific attributes if adType is video
    const videoAttributes =
      adType === 'video'
        ? `data-ad-format="fluid"
       data-ad-layout="in-article"
       data-ad-layout-key="-fb+5w+4e-db+86"`
        : '';

    // Add interactive-specific attributes if adType is interactive
    const interactiveAttributes =
      adType === 'interactive'
        ? `data-ad-format="autorelaxed"
       data-full-width-responsive="true"`
        : '';

    // Create and insert the ad code inside the iframe
    try {
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
              width: 100%;
              height: 100%;
            }
          </style>
        </head>
        <body>
          <ins class="${adClass}"
               style="display:block; text-align:center;"
               data-ad-client="ca-pub-7733001105026476"
               data-ad-slot="${effectiveSlotId}"
               ${adType === 'video' ? videoAttributes : ''}
               ${adType === 'interactive' ? interactiveAttributes : ''}
               ${!adType ? `data-ad-format="${adFormat}" data-full-width-responsive="${responsive ? 'true' : 'false'}"` : ''}></ins>
          <script>
            (adsbygoogle = window.adsbygoogle || []).push({});
          </script>
        </body>
        </html>
      `);
      iframeDoc.close();

      //console.log(`AdUnit initialized: type=${adType || 'standard'}, slot=${effectiveSlotId}, format=${adFormat}`);
    } catch (error) {
      console.error(`AdUnit error:`, error);
      setAdFailed(true);
    }

    return () => {
      // Make sure to clean up the iframe when component unmounts
      const mountedIframe = adContainer.querySelector(`iframe#${uniqueId}`);
      if (mountedIframe) {
        adContainer.removeChild(mountedIframe);
      }
    };
  }, [effectiveSlotId, format, responsive, uniqueId, adType, hasHydrated]);

  if (!hasHydrated) return null;
  if (!effectiveSlotId) return null;
  if (isSiteAd && (isPremium || isUnlimited)) return null;
  if (isRewardAd && isUnlimited) return null;

  if (adFailed && fallbackContent) {
    return fallbackContent;
  }

  // For video ads, we want a bit more height
  const minHeight = adType === 'video' ? '300px' : format === 'horizontal' ? '90px' : '250px';

  return (
    <Box
      ref={adRef}
      className={`adsbygoogle-container ${adType ? `ad-type-${adType}` : ''}`}
      style={{
        display: 'block',
        overflow: 'hidden',
        minHeight,
        ...style,
      }}
    />
  );
};

export default AdUnit;
