import { Box, Button, HStack, Text, VStack } from '@chakra-ui/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import useCityStoryState from '../../hooks/city/useCityStoryState';
import useIsMobileDevice from '../../hooks/useIsMobileDevice';
import {
  buildCityReturnState,
  CITY_RETURN_STATE_EVENT,
  getCityReturnHref,
  isCityRoute,
  normalizeCityReturnState,
  readCityReturnState,
  shouldOfferCityReturn,
  writeCityReturnState,
} from '../../utils/navigation/cityNavigation';
import { restoreFullscreenFromIntent } from '../../utils/mobile/fullscreenState';

const CityReturnBanner = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isLoading: isStoryStateLoading, saveReturnState, storyState } = useCityStoryState();
  const isMobileDevice = useIsMobileDevice();
  const currentlyInCity = isCityRoute(location.pathname);
  const lastPersistedHrefRef = useRef('');
  const [cityReturnState, setCityReturnState] = useState(() => {
    if (currentlyInCity) {
      return buildCityReturnState(location);
    }

    return readCityReturnState();
  });
  const persistedCityReturnState = useMemo(
    () => normalizeCityReturnState(storyState?.cityReturnState),
    [storyState]
  );
  const resolvedCityReturnState = cityReturnState || persistedCityReturnState;

  useEffect(() => {
    if (!currentlyInCity) return;

    const nextState = buildCityReturnState(location);
    setCityReturnState(nextState);
    writeCityReturnState(nextState);
  }, [currentlyInCity, location]);

  useEffect(() => {
    if (!currentlyInCity || !isAuthenticated || isStoryStateLoading) {
      return;
    }

    const nextState = buildCityReturnState(location);
    const nextHref = getCityReturnHref(nextState);
    if (lastPersistedHrefRef.current === nextHref) {
      return;
    }

    lastPersistedHrefRef.current = nextHref;
    void saveReturnState(nextState).catch(() => {
      lastPersistedHrefRef.current = '';
    });
  }, [currentlyInCity, isAuthenticated, isStoryStateLoading, location, saveReturnState]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncCityReturnState = (event) => {
      const nextState = event?.detail?.state;

      if (typeof nextState === 'object' || nextState === null) {
        setCityReturnState(nextState);
        return;
      }

      setCityReturnState(readCityReturnState());
    };

    window.addEventListener(CITY_RETURN_STATE_EVENT, syncCityReturnState);
    window.addEventListener('storage', syncCityReturnState);

    return () => {
      window.removeEventListener(CITY_RETURN_STATE_EVENT, syncCityReturnState);
      window.removeEventListener('storage', syncCityReturnState);
    };
  }, []);

  if (currentlyInCity || !shouldOfferCityReturn(location.pathname)) {
    return null;
  }

  if (isAuthenticated && isStoryStateLoading && !cityReturnState) {
    return null;
  }

  const cityReturnHref = getCityReturnHref(resolvedCityReturnState);
  const cityButtonLabel = resolvedCityReturnState ? 'Back to City' : 'Enter City';
  const shouldForceFloatingPill = isMobileDevice;
  const frameShadow = 'var(--cg-window-outset), 10px 10px 0 rgba(0, 0, 0, 0.18)';
  const buttonOutset =
    'inset 1px 1px 0 var(--cg-window-light), inset 2px 2px 0 #f8f5ef, inset -1px -1px 0 #404040, inset -2px -2px 0 var(--cg-window-dark)';
  const buttonInset =
    'inset 1px 1px 0 #6d6d6d, inset 2px 2px 0 #3d3d3d, inset -1px -1px 0 var(--cg-window-light), inset -2px -2px 0 #f4efe7';
  const handleCityReturnClick = async () => {
    await restoreFullscreenFromIntent();
    navigate(cityReturnHref);
  };

  if (shouldForceFloatingPill) {
    return (
      <Box
        data-testid="city-return-banner"
        data-city-return-variant="floating-pill"
        position="fixed"
        left={{ base: 2, md: 5 }}
        bottom="calc(72px + env(safe-area-inset-bottom, 0px))"
        zIndex={1751}
        pointerEvents="auto"
        style={{ touchAction: 'manipulation' }}
      >
        <Button
          size="sm"
          bg="linear-gradient(180deg, #f4efe7 0%, #d5cec5 100%)"
          color="var(--cg-text)"
          border="2px solid var(--cg-window-shadow)"
          _hover={{ bg: 'linear-gradient(180deg, #fbf8f1 0%, #e0dad1 100%)' }}
          _active={{
            bg: 'linear-gradient(180deg, #d8d1c7 0%, #eee7dc 100%)',
            boxShadow: buttonInset,
            transform: 'translate(1px, 1px)',
          }}
          _focusVisible={{ outline: '1px dotted var(--cg-window-shadow)', outlineOffset: '-4px' }}
          minH="36px"
          px={3.5}
          borderRadius="0"
          fontSize="xs"
          fontFamily="var(--cg-font-retro-display)"
          fontWeight="700"
          letterSpacing="0.03em"
          whiteSpace="nowrap"
          boxShadow={`${buttonOutset}, 6px 6px 0 rgba(0, 0, 0, 0.14)`}
          onClick={handleCityReturnClick}
        >
          {cityButtonLabel}
        </Button>
      </Box>
    );
  }

  return (
    <Box
      data-testid="city-return-banner"
      data-city-return-variant="responsive"
      position="fixed"
      left={{ base: 2, md: 5 }}
      bottom={{
        base: 'calc(72px + env(safe-area-inset-bottom, 0px))',
        md: 'calc(76px + env(safe-area-inset-bottom, 0px))',
      }}
      zIndex={1751}
      pointerEvents="auto"
      style={{ touchAction: 'manipulation' }}
    >
      <VStack
        align="stretch"
        spacing={0}
        minW={{ base: '168px', md: '188px' }}
        bg="var(--cg-window)"
        border="2px solid var(--cg-window-shadow)"
        borderRadius="0"
        boxShadow={frameShadow}
        overflow="hidden"
      >
        <HStack
          spacing={2}
          align="center"
          justify="space-between"
          px={3}
          py={1.5}
          bg="linear-gradient(90deg, var(--cg-header-start) 0%, var(--cg-header-end) 100%)"
        >
          <Text
            color="var(--cg-header-text)"
            fontFamily="var(--cg-font-retro-display)"
            fontSize="xs"
            fontWeight="700"
            letterSpacing="0.08em"
            textTransform="uppercase"
          >
            City Mode
          </Text>
          <Box
            w="8px"
            h="8px"
            bg="#8fffb3"
            border="1px solid rgba(0, 0, 0, 0.6)"
            boxShadow="inset 1px 1px 0 rgba(255, 255, 255, 0.55)"
            flexShrink={0}
          />
        </HStack>

        <Box
          bg="linear-gradient(180deg, var(--cg-window-face) 0%, var(--cg-window-face-strong) 100%)"
          p={3}
        >
          <Button
            size="sm"
            bg="linear-gradient(180deg, #f4efe7 0%, #d5cec5 100%)"
            color="var(--cg-text)"
            border="2px solid var(--cg-window-shadow)"
            _hover={{ bg: 'linear-gradient(180deg, #fbf8f1 0%, #e0dad1 100%)' }}
            _active={{
              bg: 'linear-gradient(180deg, #d8d1c7 0%, #eee7dc 100%)',
              boxShadow: buttonInset,
              transform: 'translate(1px, 1px)',
            }}
            _focusVisible={{ outline: '1px dotted var(--cg-window-shadow)', outlineOffset: '-4px' }}
            w="100%"
            minW={{ base: '140px', md: '156px' }}
            minH={{ base: '42px', md: '44px' }}
            px={4}
            borderRadius="0"
            fontSize={{ base: 'sm', md: 'md' }}
            fontFamily="var(--cg-font-retro-display)"
            fontWeight="700"
            letterSpacing="0.01em"
            whiteSpace="nowrap"
            boxShadow={buttonOutset}
            onClick={handleCityReturnClick}
          >
            {cityButtonLabel}
          </Button>
        </Box>
      </VStack>
    </Box>
  );
};

export default CityReturnBanner;
