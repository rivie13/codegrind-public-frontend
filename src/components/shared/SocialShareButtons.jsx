import { Box, HStack, IconButton, Text, Tooltip } from '@chakra-ui/react';
import React from 'react';
import { FaFacebookF, FaLinkedinIn, FaRedditAlien, FaXTwitter } from 'react-icons/fa6';
import { SiBluesky } from 'react-icons/si';
import { useAuth } from '../../contexts/AuthContext';
import { trackUserContentEvent } from '../../services/userContentEventService';

const PLATFORMS = [
  {
    id: 'x',
    label: 'Share on X',
    Icon: FaXTwitter,
    color: '#ffffff',
    hoverColor: 'rgba(255,255,255,0.15)',
    border: 'rgba(255,255,255,0.4)',
    getUrl: (url, text) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: 'bluesky',
    label: 'Share on Bluesky',
    Icon: SiBluesky,
    color: '#0085ff',
    hoverColor: 'rgba(0,133,255,0.15)',
    border: 'rgba(0,133,255,0.5)',
    getUrl: (url, text) =>
      `https://bsky.app/intent/compose?text=${encodeURIComponent(`${text} ${url}`)}`,
  },
  {
    id: 'reddit',
    label: 'Share on Reddit',
    Icon: FaRedditAlien,
    color: '#ff4500',
    hoverColor: 'rgba(255,69,0,0.15)',
    border: 'rgba(255,69,0,0.5)',
    getUrl: (url, text) =>
      `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
  },
  {
    id: 'linkedin',
    label: 'Share on LinkedIn',
    Icon: FaLinkedinIn,
    color: '#0a66c2',
    hoverColor: 'rgba(10,102,194,0.15)',
    border: 'rgba(10,102,194,0.5)',
    getUrl: (url) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    id: 'facebook',
    label: 'Share on Facebook',
    Icon: FaFacebookF,
    color: '#1877f2',
    hoverColor: 'rgba(24,119,242,0.15)',
    border: 'rgba(24,119,242,0.5)',
    getUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
];

const openShareWindow = (shareUrl) => {
  window.open(shareUrl, '_blank', 'width=600,height=500,noopener,noreferrer');
};

const getUrlPath = (rawUrl) => {
  try {
    return new URL(rawUrl).pathname || '/';
  } catch {
    return '/';
  }
};

/**
 * Cyberpunk-styled social share icon buttons.
 *
 * @param {string}  props.url       - The URL to share
 * @param {string}  props.text      - Pre-filled share text (without URL for X/Bluesky)
 * @param {string}  [props.label]   - Optional label above the buttons
 * @param {boolean} [props.compact] - Smaller icons, no label
 * @param {string}  [props.surface] - Analytics surface for reward telemetry
 */
const SocialShareButtons = ({
  url,
  text,
  label,
  compact = false,
  surface = 'unknown',
  theme = 'default',
}) => {
  const auth = useAuth();
  const isRewardEligible = Boolean(auth?.isAuthenticated && auth?.user?.isEmailVerified === true);
  const safeUrl = url || window.location.href;
  const safeText = text || '';
  const isRetroDesktopTheme = theme === 'retro-desktop';

  const handleShare = (platformId, shareUrl) => {
    openShareWindow(shareUrl);

    // Incentive telemetry is gated to authenticated, email-verified users only.
    if (!isRewardEligible) return;

    void trackUserContentEvent('user_social_share', {
      platform: platformId,
      surface,
      urlPath: getUrlPath(safeUrl),
    });
  };

  return (
    <Box textAlign="center">
      {!compact && label && (
        <Text
          fontFamily={isRetroDesktopTheme ? "'Tahoma', 'MS Sans Serif', sans-serif" : 'monospace'}
          fontSize="xs"
          color={isRetroDesktopTheme ? '#3b4250' : 'rgba(255,255,255,0.5)'}
          mb={1}
          textTransform="uppercase"
          letterSpacing="1px"
          fontWeight={isRetroDesktopTheme ? '700' : undefined}
        >
          {label}
        </Text>
      )}
      <HStack spacing={compact ? 1 : 2} flexWrap="wrap" justify="center">
        {PLATFORMS.map(({ id, label: platformLabel, Icon, color, hoverColor, border, getUrl }) => (
          <Tooltip key={id} label={platformLabel} hasArrow placement="top" fontSize="xs">
            <IconButton
              aria-label={platformLabel}
              icon={<Icon />}
              size={compact ? 'xs' : 'sm'}
              variant="unstyled"
              tabIndex={-1}
              display="flex"
              alignItems="center"
              justifyContent="center"
              color={color}
              border={isRetroDesktopTheme ? '2px solid #5d636e' : `1px solid ${border}`}
              borderRadius={isRetroDesktopTheme ? '0' : 'md'}
              bg={isRetroDesktopTheme ? '#d4d0c8' : 'transparent'}
              boxShadow={
                isRetroDesktopTheme
                  ? 'inset 1px 1px 0 rgba(255,255,255,0.68), inset -1px -1px 0 rgba(64,64,64,0.24)'
                  : `0 0 6px ${border}`
              }
              _hover={{
                bg: isRetroDesktopTheme ? '#efebe7' : hoverColor,
                boxShadow: isRetroDesktopTheme
                  ? 'inset 1px 1px 0 rgba(255,255,255,0.82), inset -1px -1px 0 rgba(64,64,64,0.28)'
                  : `0 0 12px ${border}`,
                transform: isRetroDesktopTheme ? 'translateY(1px)' : 'translateY(-1px)',
              }}
              _active={{ transform: 'translateY(0)' }}
              transition="all 0.15s ease"
              minW={compact ? '24px' : '32px'}
              h={compact ? '24px' : '32px'}
              onClick={() => handleShare(id, getUrl(safeUrl, safeText))}
            />
          </Tooltip>
        ))}
      </HStack>
    </Box>
  );
};

export default SocialShareButtons;
