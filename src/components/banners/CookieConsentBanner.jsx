import { Box, Button, Link as ChakraLink, Flex, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { initializeAdSense, initializeGoogleAnalytics } from '../../services/analyticsService';
import { createCookie, readCookie } from '../../utils/web/cookieUtils';

const COOKIE_NAME = 'cookie-consent-status';
const RETRO_BUTTON_OUTSET =
  'inset 1px 1px 0 var(--cg-window-light), inset 2px 2px 0 #f8f5ef, inset -1px -1px 0 #404040, inset -2px -2px 0 var(--cg-window-dark)';
const RETRO_BUTTON_INSET =
  'inset 1px 1px 0 #6d6d6d, inset 2px 2px 0 #3d3d3d, inset -1px -1px 0 var(--cg-window-light), inset -2px -2px 0 #f4efe7';

const retroButtonStyles = {
  bg: 'linear-gradient(180deg, #f4efe7 0%, #d5cec5 100%)',
  color: 'var(--cg-text)',
  border: '2px solid var(--cg-window-shadow)',
  borderRadius: 0,
  fontFamily: 'var(--cg-font-retro-display)',
  fontWeight: '700',
  boxShadow: RETRO_BUTTON_OUTSET,
  _hover: { bg: 'linear-gradient(180deg, #fbf8f1 0%, #e0dad1 100%)' },
  _active: {
    boxShadow: RETRO_BUTTON_INSET,
    transform: 'translate(1px, 1px)',
  },
};

const CookieConsentBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consentStatus = readCookie(COOKIE_NAME);
    if (consentStatus === 'accepted') {
      initializeGoogleAnalytics();
      initializeAdSense();
      setIsVisible(false);
    } else if (consentStatus === 'denied') {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    createCookie(COOKIE_NAME, 'accepted', 365);
    setIsVisible(false);
    initializeGoogleAnalytics();
    initializeAdSense();
  };

  const handleDeny = () => {
    createCookie(COOKIE_NAME, 'denied', 365);
    setIsVisible(false);
    // Optionally, you might want to inform the user that some functionalities might be limited
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Box
      data-testid="cookie-consent-banner"
      bg="linear-gradient(180deg, var(--cg-window) 0%, var(--cg-window-face) 100%)"
      color="var(--cg-text)"
      zIndex="1800"
      border="2px solid var(--cg-window-shadow)"
      boxShadow="var(--cg-window-outset), 14px 14px 0 rgba(0, 0, 0, 0.16)"
      overflow="hidden"
      style={{
        position: 'fixed',
        right: '16px',
        bottom: '16px',
        left: 'auto',
        top: 'auto',
        width: 'min(520px, calc(100vw - 32px))',
        maxWidth: 'min(520px, calc(100vw - 32px))',
      }}
    >
      <Flex
        alignItems="center"
        justifyContent="space-between"
        px={3}
        py={1.5}
        bg="linear-gradient(90deg, var(--cg-header-start) 0%, var(--cg-header-end) 100%)"
      >
        <Text
          fontSize="xs"
          fontWeight="700"
          letterSpacing="0.08em"
          textTransform="uppercase"
          fontFamily="var(--cg-font-retro-display)"
          color="var(--cg-header-text)"
        >
          Cookie Notice
        </Text>
        <Box
          w="8px"
          h="8px"
          bg="#8fffb3"
          border="1px solid rgba(0, 0, 0, 0.6)"
          boxShadow="inset 1px 1px 0 rgba(255, 255, 255, 0.55)"
          flexShrink={0}
        />
      </Flex>
      <Flex
        direction="column"
        alignItems="center"
        gap={4}
        p={4}
        bg="linear-gradient(180deg, var(--cg-window-face) 0%, var(--cg-window-face-strong) 100%)"
      >
        <Text
          textAlign="left"
          width="100%"
          fontFamily="var(--cg-font-retro-display)"
          fontSize="sm"
          lineHeight="1.5"
        >
          We would like to use cookies to improve your experience on our website and to analyze site
          traffic.
        </Text>
        <Flex
          direction={{ base: 'column', sm: 'row' }}
          alignItems={{ base: 'stretch', sm: 'center' }}
          justifyContent="flex-end"
          gap={2}
          width="100%"
          flexWrap="wrap"
        >
          <Button
            id="cookie-notice-accept"
            onClick={handleAccept}
            size="sm"
            px={5}
            {...retroButtonStyles}
          >
            Accept
          </Button>
          <Button
            id="cookie-notice-deny"
            onClick={handleDeny}
            size="sm"
            px={5}
            {...retroButtonStyles}
          >
            Deny
          </Button>
          <ChakraLink
            as={RouterLink}
            to="/privacy-policy"
            id="cookie-notice-info"
            color="var(--cg-link)"
            textDecoration="underline"
            _hover={{ color: 'var(--cg-link)' }}
            fontSize="sm"
            px={2}
            fontFamily="var(--cg-font-retro-display)"
            alignSelf={{ base: 'flex-start', sm: 'center' }}
          >
            More info
          </ChakraLink>
        </Flex>
      </Flex>
    </Box>
  );
};

export default CookieConsentBanner;
