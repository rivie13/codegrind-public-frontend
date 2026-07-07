import { Badge, Box, Button, Flex, Text, Tooltip } from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../../../services/api';
import {
  RATE_LIMIT_EXCEEDED_EVENT,
  RATE_LIMIT_UPDATED_EVENT,
  SNIPPET_AD_MODAL_REQUESTED_EVENT,
  SNIPPET_GENERATED_EVENT,
} from '../../../../utils/core/events';
import visualSettingsManager from '../../../../utils/game/VisualSettingsManager';
import AdModal from '../../AdModal';
import { useAuth } from '../../../../contexts/AuthContext';

/**
 * Component to display AI snippet generation rate limit information
 * @param {Object} props - Component props
 * @param {boolean} props.showDetails - Whether to show detailed information or just a simple indicator
 * @returns {JSX.Element} - Rate limit indicator component
 */
const RateLimitIndicator = ({ showDetails = false, shellTheme = 'default' }) => {
  const isRetroDesktopTheme = shellTheme === 'retro-desktop';
  const { user } = useAuth();
  const snippetAdPromptKey = 'td_snippet_ad_prompt_opt_out';
  const snippetAdOptions = {
    short: { credits: 5, minViewMs: 15000, label: 'Short (+5)' },
    long: { credits: 10, minViewMs: 30000, label: 'Long (+10)' },
    full: { credits: 20, minViewMs: 60000, label: 'Full (+20)' },
  };
  const normalizeAdType = (adType) => (snippetAdOptions[adType] ? adType : 'short');
  const [rateLimitInfo, setRateLimitInfo] = useState({
    limit: 0,
    remaining: 0,
    used: 0,
    extraCredits: 0,
    totalRemaining: 0,
    unlimited: false,
    snippetAdCooldownUntil: null,
    snippetAdCooldownRemaining: 0,
    resetIn: 0,
    resetPeriod: 600, // Default 10 minutes
    loading: true,
  });

  // State for the countdown timer
  const [countdown, setCountdown] = useState(0);
  const [adCooldownRemaining, setAdCooldownRemaining] = useState(0);
  const [showAdModal, setShowAdModal] = useState(false);
  const [isApplyingCredit, setIsApplyingCredit] = useState(false);
  const [selectedAdType, setSelectedAdType] = useState('short');
  const [basicSnippetFallbackEnabled, setBasicSnippetFallbackEnabled] = useState(false);
  const [hideSnippetAdPrompt, setHideSnippetAdPrompt] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(snippetAdPromptKey) === 'true';
  });
  const [activeAdRequestId, setActiveAdRequestId] = useState(null);
  const adPromptEventName = 'td-snippet-ad-prompt-changed';
  const rawMembershipTier = (
    user?.membershipTier ||
    localStorage.getItem('membership_tier') ||
    'FREE'
  ).toUpperCase();
  const membershipTier = rawMembershipTier === 'PRO' ? 'PREMIUM' : rawMembershipTier;
  const isUnlimited = membershipTier === 'UNLIMITED';
  const canShowRewardAds = !isUnlimited;
  const activeAdType = normalizeAdType(selectedAdType);
  const selectedAdConfig = snippetAdOptions[activeAdType];

  // Create a memoized fetch function
  const fetchRateLimitInfo = useCallback(async () => {
    try {
      //console.log('Fetching rate limit info...');

      // Generate new session token if not exists (to ensure limit resets on refresh)
      if (!window.sessionStorage.getItem('snippet_session_token')) {
        const newToken = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        window.sessionStorage.setItem('snippet_session_token', newToken);
        //console.log(`Generated new session token on rate check: ${newToken}`);
      }

      const response = await api.towerDefense.checkRateLimit();
      //console.log('Rate limit response:', response);

      if (response && !response.error) {
        const resetInSeconds = response.resetIn || 600;

        setRateLimitInfo({
          limit: response.limit || 0,
          remaining: response.remaining || 0,
          used: response.used || 0,
          extraCredits: response.extraCredits || 0,
          totalRemaining: (response.totalRemaining ?? response.remaining) || 0,
          unlimited: Boolean(response.unlimited),
          snippetAdCooldownUntil: response.snippetAdCooldownUntil || null,
          snippetAdCooldownRemaining: response.snippetAdCooldownRemaining || 0,
          resetIn: resetInSeconds,
          resetPeriod: response.resetPeriod || 600,
          loading: false,
          timestamp: Date.now(), // Add timestamp to track when data was fetched
        });

        setAdCooldownRemaining(response.snippetAdCooldownRemaining || 0);

        // Set the initial countdown value
        setCountdown(resetInSeconds);

        // Dispatch event that rate limit has been updated
        window.dispatchEvent(
          new CustomEvent(RATE_LIMIT_UPDATED_EVENT, {
            detail: { rateLimit: response },
          })
        );
      } else {
        setRateLimitInfo((prev) => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error fetching rate limit info:', error);
      setRateLimitInfo((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  // Fetch rate limit info on component mount
  useEffect(() => {
    // Initial fetch
    fetchRateLimitInfo();

    // Refresh rate limit info more frequently - every 15 seconds
    const intervalId = setInterval(fetchRateLimitInfo, 15000);

    // Add listener for snippet generation events
    const handleSnippetGenerated = (event) => {
      //console.log('Snippet generated event detected, updating rate limits...');

      // Check if the event has rate limit info we can use directly
      if (event.detail?.rateLimit) {
        //console.log('Using rate limit info from event:', event.detail.rateLimit);
        const resetInSeconds = event.detail.rateLimit.resetIn || 600;

        setRateLimitInfo({
          limit: event.detail.rateLimit.limit || 0,
          remaining: event.detail.rateLimit.remaining || 0,
          used: event.detail.rateLimit.used || 0,
          extraCredits: event.detail.rateLimit.extraCredits || 0,
          totalRemaining:
            (event.detail.rateLimit.totalRemaining ?? event.detail.rateLimit.remaining) || 0,
          unlimited: Boolean(event.detail.rateLimit.unlimited),
          snippetAdCooldownUntil: event.detail.rateLimit.snippetAdCooldownUntil || null,
          snippetAdCooldownRemaining: event.detail.rateLimit.snippetAdCooldownRemaining || 0,
          resetIn: resetInSeconds,
          resetPeriod: event.detail.rateLimit.resetPeriod || 600,
          loading: false,
          timestamp: Date.now(),
        });

        setAdCooldownRemaining(event.detail.rateLimit.snippetAdCooldownRemaining || 0);

        // Update countdown
        setCountdown(resetInSeconds);
      } else {
        // Otherwise fetch the latest info
        setTimeout(fetchRateLimitInfo, 500); // Slight delay to ensure server has processed the request
      }
    };

    window.addEventListener(SNIPPET_GENERATED_EVENT, handleSnippetGenerated);

    const handleRateLimitExceeded = (event) => {
      if (isUnlimited) {
        return;
      }
      const effectiveRemaining =
        (event.detail?.rateLimit?.totalRemaining ?? event.detail?.rateLimit?.remaining) || 0;
      if (event.detail?.rateLimit) {
        const resetInSeconds = event.detail.rateLimit.resetIn || 600;

        setRateLimitInfo((prev) => ({
          ...prev,
          limit: event.detail.rateLimit.limit || prev.limit,
          remaining: event.detail.rateLimit.remaining || 0,
          extraCredits: event.detail.rateLimit.extraCredits || 0,
          totalRemaining:
            (event.detail.rateLimit.totalRemaining ?? event.detail.rateLimit.remaining) || 0,
          unlimited: Boolean(event.detail.rateLimit.unlimited),
          snippetAdCooldownUntil: event.detail.rateLimit.snippetAdCooldownUntil || null,
          snippetAdCooldownRemaining: event.detail.rateLimit.snippetAdCooldownRemaining || 0,
          resetIn: resetInSeconds,
          resetPeriod: event.detail.rateLimit.resetPeriod || prev.resetPeriod,
          loading: false,
          timestamp: Date.now(),
        }));

        setCountdown(resetInSeconds);
        setAdCooldownRemaining(event.detail.rateLimit.snippetAdCooldownRemaining || 0);
      }

      if (effectiveRemaining === 0 && !hideSnippetAdPrompt) {
        setShowAdModal(true);
      }
    };

    const handleSnippetAdRequested = (event) => {
      if (!event.detail?.requestId) return;

      if (isUnlimited) {
        const resolver = window.__snippetAdResolvers?.get(event.detail.requestId);
        if (resolver) {
          resolver({ watched: false, reason: 'unlimited' });
          window.__snippetAdResolvers.delete(event.detail.requestId);
        }
        return;
      }

      if (hideSnippetAdPrompt) {
        const resolver = window.__snippetAdResolvers?.get(event.detail.requestId);
        if (resolver) {
          resolver({ watched: false, reason: 'opted_out' });
          window.__snippetAdResolvers.delete(event.detail.requestId);
        }
        return;
      }

      setActiveAdRequestId(event.detail.requestId);
      setSelectedAdType('short');
      setShowAdModal(true);
    };

    window.addEventListener(RATE_LIMIT_EXCEEDED_EVENT, handleRateLimitExceeded);
    window.addEventListener(SNIPPET_AD_MODAL_REQUESTED_EVENT, handleSnippetAdRequested);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener(SNIPPET_GENERATED_EVENT, handleSnippetGenerated);
      window.removeEventListener(RATE_LIMIT_EXCEEDED_EVENT, handleRateLimitExceeded);
      window.removeEventListener(SNIPPET_AD_MODAL_REQUESTED_EVENT, handleSnippetAdRequested);
    };
  }, [fetchRateLimitInfo, hideSnippetAdPrompt, isUnlimited]);

  useEffect(() => {
    const settings = visualSettingsManager.getSettings();
    setBasicSnippetFallbackEnabled(settings.aiBasicSnippetFallbackEnabled === true);

    const handleBasicSnippetSettingChange = (event) => {
      if (typeof event.detail?.enabled === 'boolean') {
        setBasicSnippetFallbackEnabled(event.detail.enabled);
      }
    };

    const handleSettingsChanged = (event) => {
      if (typeof event.detail?.aiBasicSnippetFallbackEnabled === 'boolean') {
        setBasicSnippetFallbackEnabled(event.detail.aiBasicSnippetFallbackEnabled);
      }
    };

    window.addEventListener('td-basic-snippet-setting-changed', handleBasicSnippetSettingChange);
    window.addEventListener('td-settings-changed', handleSettingsChanged);

    return () => {
      window.removeEventListener(
        'td-basic-snippet-setting-changed',
        handleBasicSnippetSettingChange
      );
      window.removeEventListener('td-settings-changed', handleSettingsChanged);
    };
  }, []);

  useEffect(() => {
    const handlePromptPreferenceChange = (event) => {
      if (typeof event.detail?.hidden !== 'boolean') return;
      setHideSnippetAdPrompt(event.detail.hidden);
    };

    window.addEventListener(adPromptEventName, handlePromptPreferenceChange);
    return () => window.removeEventListener(adPromptEventName, handlePromptPreferenceChange);
  }, []);

  // Add a countdown effect
  useEffect(() => {
    // Only start countdown if we have valid data and not loading
    if (!rateLimitInfo.loading && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            // Fetch updated info when countdown reaches zero
            fetchRateLimitInfo();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [countdown, rateLimitInfo.loading, fetchRateLimitInfo]);

  useEffect(() => {
    if (adCooldownRemaining > 0) {
      const timer = setInterval(() => {
        setAdCooldownRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            fetchRateLimitInfo();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [adCooldownRemaining, fetchRateLimitInfo]);

  // Format reset time as minutes:seconds for better UX with shorter reset periods
  const formatResetTime = (seconds) => {
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      return `${hours}h ${minutes}m ${secs}s`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      // Ensure seconds are always displayed with two digits
      const formattedSecs = secs < 10 ? `0${secs}` : secs;
      return `${minutes}m ${formattedSecs}s`;
    }
  };

  // Determine badge color based on remaining limit
  const getBadgeColor = () => {
    const { remaining, totalRemaining, limit, loading } = rateLimitInfo;
    const effectiveRemaining = totalRemaining || remaining;
    if (loading) return 'gray';
    if (effectiveRemaining === 0) return 'red';
    if (effectiveRemaining < limit * 0.3) return 'orange';
    if (effectiveRemaining < limit * 0.7) return 'yellow';
    return 'green';
  };

  const getEffectiveRemaining = () =>
    rateLimitInfo.unlimited
      ? Number.POSITIVE_INFINITY
      : (rateLimitInfo.totalRemaining ?? rateLimitInfo.remaining);

  const handleWatchAd = (adType = 'short') => {
    if (!canShowRewardAds || adCooldownRemaining > 0) return;
    setSelectedAdType(normalizeAdType(adType));
    setShowAdModal(true);
  };

  const handleDismissToggleChange = (event) => {
    const nextValue = event.target.checked;
    setHideSnippetAdPrompt(nextValue);
    localStorage.setItem(snippetAdPromptKey, String(nextValue));
    window.dispatchEvent(
      new CustomEvent(adPromptEventName, {
        detail: { hidden: nextValue },
      })
    );
  };

  const handleAdComplete = async () => {
    if (isApplyingCredit) return;

    setIsApplyingCredit(true);
    try {
      await api.towerDefense.addSnippetCredit(null, activeAdType);
      const resolver = activeAdRequestId
        ? window.__snippetAdResolvers?.get(activeAdRequestId)
        : null;
      if (resolver) {
        resolver({ watched: true });
        window.__snippetAdResolvers.delete(activeAdRequestId);
      }
      setActiveAdRequestId(null);
    } catch (error) {
      console.error('Error adding snippet credit:', error);
    } finally {
      await fetchRateLimitInfo();
      setIsApplyingCredit(false);
    }
  };

  const handleAdModalClose = () => {
    if (activeAdRequestId) {
      const resolver = window.__snippetAdResolvers?.get(activeAdRequestId);
      if (resolver) {
        resolver({ watched: false, allowBasicSnippet: false });
        window.__snippetAdResolvers.delete(activeAdRequestId);
      }
      setActiveAdRequestId(null);
    }
    setShowAdModal(false);
  };

  const handleSkipBasicSnippets = () => {
    if (activeAdRequestId) {
      const resolver = window.__snippetAdResolvers?.get(activeAdRequestId);
      if (resolver) {
        resolver({ watched: false, allowBasicSnippet: basicSnippetFallbackEnabled });
        window.__snippetAdResolvers.delete(activeAdRequestId);
      }
      setActiveAdRequestId(null);
    }
    setShowAdModal(false);
  };

  // Simple indicator when details are not needed
  if (!showDetails) {
    const effectiveRemaining = getEffectiveRemaining();
    const isUnlimitedAccess = rateLimitInfo.unlimited;
    return (
      <>
        <Flex align="center" gap={2}>
          <Tooltip
            label={
              rateLimitInfo.loading
                ? 'Loading AI rate limit info...'
                : isUnlimitedAccess
                  ? 'AI Snippets: Unlimited access. No rate limits or ad cooldowns.'
                  : `AI Snippets: ${effectiveRemaining}/${rateLimitInfo.limit} remaining. Resets in ${formatResetTime(countdown)}. Ad cooldown: ${adCooldownRemaining > 0 ? formatResetTime(adCooldownRemaining) : 'Ready'}`
            }
            placement="top"
          >
            <Badge
              colorScheme={isRetroDesktopTheme ? undefined : getBadgeColor()}
              variant={isRetroDesktopTheme ? 'solid' : 'subtle'}
              px={2}
              py={1}
              borderRadius={isRetroDesktopTheme ? '0' : 'full'}
              bg={isRetroDesktopTheme ? '#e7e2d8' : undefined}
              color={isRetroDesktopTheme ? '#1f2430' : undefined}
              border={isRetroDesktopTheme ? '1px solid #6f6f6f' : undefined}
              boxShadow={
                isRetroDesktopTheme
                  ? 'inset 1px 1px 0 rgba(255,255,255,0.72), inset -1px -1px 0 rgba(104,104,104,0.22)'
                  : undefined
              }
              fontFamily={isRetroDesktopTheme ? "'Tahoma', 'MS Sans Serif', sans-serif" : undefined}
              fontWeight="700"
              cursor={effectiveRemaining === 0 ? 'pointer' : 'default'}
              onClick={effectiveRemaining === 0 ? handleWatchAd : undefined}
            >
              AI:{' '}
              {rateLimitInfo.loading
                ? '...'
                : isUnlimitedAccess
                  ? 'Unlimited'
                  : `${effectiveRemaining}/${rateLimitInfo.limit}`}
            </Badge>
          </Tooltip>
          {!rateLimitInfo.loading && !isUnlimitedAccess && (
            <Text
              fontSize="xs"
              color={
                isRetroDesktopTheme
                  ? adCooldownRemaining > 0
                    ? '#8B3A3A'
                    : '#0B2BA8'
                  : adCooldownRemaining > 0
                    ? 'orange.300'
                    : 'gray.400'
              }
              fontFamily={isRetroDesktopTheme ? "'Tahoma', 'MS Sans Serif', sans-serif" : undefined}
              fontWeight={isRetroDesktopTheme ? '700' : undefined}
            >
              {adCooldownRemaining > 0
                ? `Cooldown ${formatResetTime(adCooldownRemaining)}`
                : 'Cooldown Ready'}
            </Text>
          )}
          {(effectiveRemaining === 0 || hideSnippetAdPrompt) && canShowRewardAds && (
            <Tooltip
              label={
                adCooldownRemaining > 0
                  ? `Ad cooldown: ${formatResetTime(adCooldownRemaining)}`
                  : 'Watch a short ad for +5 snippets'
              }
              placement="top"
            >
              <Button
                size="xs"
                colorScheme={isRetroDesktopTheme ? undefined : 'purple'}
                variant={isRetroDesktopTheme ? 'unstyled' : 'outline'}
                onClick={() => handleWatchAd('short')}
                isDisabled={adCooldownRemaining > 0}
                sx={
                  isRetroDesktopTheme
                    ? {
                        minH: '26px',
                        borderRadius: '0',
                        border: '2px solid #6f6f6f',
                        bg: '#d4d0c8',
                        color: '#1f2430',
                        px: 2.5,
                        fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
                        fontWeight: '700',
                        boxShadow:
                          'inset 1px 1px 0 rgba(255,255,255,0.72), inset -1px -1px 0 rgba(104,104,104,0.22)',
                        _hover: {
                          bg: '#ece9e1',
                          transform: 'translateY(1px)',
                        },
                      }
                    : undefined
                }
              >
                Watch Ad
              </Button>
            </Tooltip>
          )}
        </Flex>
        {canShowRewardAds && (
          <AdModal
            isOpen={showAdModal}
            onClose={handleAdModalClose}
            onAdComplete={handleAdComplete}
            title="AI Snippet Sponsor"
            ctaLabel={`Unlock +${selectedAdConfig.credits} Snippet${selectedAdConfig.credits > 1 ? 's' : ''}`}
            footerText={`Skip the ad to use basic snippets only (less effective).`}
            processingText="Processing snippet bandwidth..."
            minViewMs={selectedAdConfig.minViewMs}
            adTypeOptions={snippetAdOptions}
            selectedAdType={activeAdType}
            onAdTypeChange={setSelectedAdType}
            adTypeLabel="Ad length"
            adTypeSelectionDisabled={true}
            showSkipButton={true}
            skipLabel="Use basic snippets"
            showDismissToggle={true}
            dismissToggleLabel="Don't show this again"
            dismissToggleChecked={hideSnippetAdPrompt}
            onDismissToggleChange={handleDismissToggleChange}
          />
        )}
      </>
    );
  }

  // Detailed display
  return (
    <>
      <Box
        bg="#efebe7"
        p={3}
        borderRadius="md"
        border="1px solid"
        borderColor={`${getBadgeColor()}.500`}
      >
        <Text fontWeight="bold" mb={1}>
          AI Snippet Generation Limits
        </Text>

        {rateLimitInfo.loading ? (
          <Text fontSize="sm" color="gray.400">
            Loading rate limit information...
          </Text>
        ) : (
          <>
            <Text fontSize="sm">
              <Badge colorScheme={getBadgeColor()} mr={1}>
                {rateLimitInfo.unlimited
                  ? 'Unlimited'
                  : `${getEffectiveRemaining()}/${rateLimitInfo.limit}`}
              </Badge>
              {rateLimitInfo.unlimited ? 'snippet access' : 'snippets remaining'}
            </Text>
            {rateLimitInfo.extraCredits > 0 && (
              <Text fontSize="xs" color="purple.300" mt={1}>
                Ad credits: {rateLimitInfo.extraCredits}
              </Text>
            )}
            {!rateLimitInfo.unlimited && (
              <Text fontSize="xs" color="gray.400">
                Resets in {formatResetTime(countdown)}
              </Text>
            )}
            {canShowRewardAds && !rateLimitInfo.unlimited && (
              <Text fontSize="xs" color={adCooldownRemaining > 0 ? 'orange.300' : 'gray.400'}>
                Ad cooldown:{' '}
                {adCooldownRemaining > 0 ? formatResetTime(adCooldownRemaining) : 'Ready'}
              </Text>
            )}
            <Flex mt={2} direction="column" gap={2}>
              {getEffectiveRemaining() === 0 && canShowRewardAds && (
                <Text fontSize="xs" color="red.300">
                  You've reached your limit. Watch an ad to restore AI snippets.
                </Text>
              )}
              {basicSnippetFallbackEnabled && (
                <Text fontSize="xs" color="purple.200">
                  Basic fallback snippets can be used by skipping the ad.
                </Text>
              )}
              {hideSnippetAdPrompt && canShowRewardAds && (
                <Text fontSize="xs" color="gray.400">
                  Ad prompt hidden. You can still watch an ad below to restore AI snippets.
                </Text>
              )}
              {canShowRewardAds && (
                <Flex gap={2} flexWrap="wrap" align="center">
                  <Button
                    size="sm"
                    colorScheme="purple"
                    variant={activeAdType === 'short' ? 'solid' : 'outline'}
                    onClick={() => setSelectedAdType('short')}
                  >
                    {snippetAdOptions.short.label}
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="purple"
                    variant={activeAdType === 'long' ? 'solid' : 'outline'}
                    onClick={() => setSelectedAdType('long')}
                  >
                    {snippetAdOptions.long.label}
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="purple"
                    variant={activeAdType === 'full' ? 'solid' : 'outline'}
                    onClick={() => setSelectedAdType('full')}
                  >
                    {snippetAdOptions.full.label}
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="cyan"
                    onClick={() => handleWatchAd(activeAdType)}
                    isLoading={isApplyingCredit}
                    isDisabled={adCooldownRemaining > 0}
                  >
                    Watch Ad
                  </Button>
                </Flex>
              )}
            </Flex>
          </>
        )}
      </Box>
      {canShowRewardAds && (
        <AdModal
          isOpen={showAdModal}
          onClose={handleAdModalClose}
          onAdComplete={handleAdComplete}
          title="AI Snippet Sponsor"
          ctaLabel={`Unlock +${selectedAdConfig.credits} Snippet${selectedAdConfig.credits > 1 ? 's' : ''}`}
          footerText={
            basicSnippetFallbackEnabled
              ? 'Skip the ad to use basic snippets only (less effective).'
              : 'Enable basic fallback snippets in settings to allow a non-AI fallback.'
          }
          processingText="Processing snippet bandwidth..."
          minViewMs={selectedAdConfig.minViewMs}
          adTypeOptions={snippetAdOptions}
          selectedAdType={activeAdType}
          onAdTypeChange={setSelectedAdType}
          adTypeLabel="Ad length"
          adTypeSelectionDisabled={true}
          showSkipButton={basicSnippetFallbackEnabled}
          skipLabel="Use basic snippets"
          onSkip={handleSkipBasicSnippets}
          showDismissToggle={true}
          dismissToggleLabel="Don't show this again"
          dismissToggleChecked={hideSnippetAdPrompt}
          onDismissToggleChange={handleDismissToggleChange}
        />
      )}
    </>
  );
};
export default RateLimitIndicator;
