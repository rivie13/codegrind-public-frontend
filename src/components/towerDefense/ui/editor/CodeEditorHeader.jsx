import { Box, Button, Flex, Text } from '@chakra-ui/react';
import React from 'react';
import { FaCode, FaKeyboard } from 'react-icons/fa';
import RateLimitIndicator from '../overlays/RateLimitIndicator';

const CodeEditorHeader = ({
  compactMobileLandscape = false,
  showMobileKeyboardButton = false,
  leftAddon = null,
  rightAddon = null,
  shellTheme = 'default',
}) => {
  const isPortraitMobileMode = showMobileKeyboardButton && !compactMobileLandscape;
  const isRetroDesktopTheme = shellTheme === 'retro-desktop';

  const blurActiveElement = () => {
    if (typeof document === 'undefined') return;

    const activeElement = document.activeElement;
    if (
      activeElement &&
      activeElement !== document.body &&
      typeof activeElement.blur === 'function'
    ) {
      activeElement.blur();
    }
  };

  const handleHideMobileKeyboardPress = (event) => {
    event?.preventDefault?.();
    blurActiveElement();
  };

  const handleHideMobileKeyboardClick = (event) => {
    event?.preventDefault?.();
    blurActiveElement();
  };

  const titleLabel = isRetroDesktopTheme ? 'CODE WORKSPACE' : 'CODE_MATRIX';
  const titleAccent = isRetroDesktopTheme
    ? 'desktop editor'
    : compactMobileLandscape
      ? '// tower-synced'
      : '// tower-synced neural interface';
  const headerBg = isRetroDesktopTheme ? '#d4d0c8' : '#0c1220';
  const headerBorderColor = isRetroDesktopTheme ? '#6d747d' : '#0f4667';
  const accentColor = isRetroDesktopTheme ? '#000080' : '#00ccff';
  const accentSoftColor = isRetroDesktopTheme ? '#4b5563' : '#88ccee';
  const iconBackground = isRetroDesktopTheme ? '#efede6' : 'rgba(0, 204, 255, 0.1)';
  const iconBorder = isRetroDesktopTheme ? '1px solid #7d828a' : '1px solid rgba(0, 204, 255, 0.3)';
  const titleFont = isRetroDesktopTheme
    ? "'Tahoma', 'MS Sans Serif', sans-serif"
    : "'Orbitron', sans-serif";

  const normalizedRightAddon = rightAddon ? (
    <Box
      flex="1 1 auto"
      minW="0"
      display="flex"
      justifyContent="flex-start"
      sx={{
        '& > *': {
          width: 'auto !important',
          maxWidth: '100%',
          minWidth: 0,
          flexWrap: 'nowrap',
        },
      }}
    >
      {rightAddon}
    </Box>
  ) : null;
  const portraitMobileRightAddon = rightAddon ? (
    <Box minW="0" display="flex" flexShrink={0}>
      {rightAddon}
    </Box>
  ) : null;

  const controlCluster = (
    <Flex
      gap={compactMobileLandscape ? 1.5 : 2}
      alignItems="center"
      flexWrap="nowrap"
      justify="flex-end"
      flexShrink={0}
    >
      <RateLimitIndicator shellTheme={shellTheme} />
    </Flex>
  );

  const mobileKeyboardButton = showMobileKeyboardButton ? (
    <Button
      size={compactMobileLandscape ? 'xs' : 'sm'}
      variant={isRetroDesktopTheme ? 'solid' : 'outline'}
      leftIcon={<FaKeyboard />}
      onMouseDown={handleHideMobileKeyboardPress}
      onTouchStart={handleHideMobileKeyboardPress}
      onClick={handleHideMobileKeyboardClick}
      flexShrink={0}
      color={isRetroDesktopTheme ? '#1f2430' : '#dff9ff'}
      bg={isRetroDesktopTheme ? '#d4d0c8' : 'rgba(0, 204, 255, 0.08)'}
      borderColor={isRetroDesktopTheme ? '#7d828a' : 'rgba(0, 204, 255, 0.32)'}
      fontFamily={titleFont}
      fontSize={compactMobileLandscape ? '0.66rem' : '0.72rem'}
      letterSpacing="0.04em"
      px={compactMobileLandscape ? 2.5 : 3}
      _hover={{
        color: isRetroDesktopTheme ? '#1f2430' : '#00ccff',
        bg: isRetroDesktopTheme ? '#f5efe3' : 'rgba(0, 204, 255, 0.14)',
        borderColor: isRetroDesktopTheme ? '#000080' : 'rgba(0, 204, 255, 0.55)',
      }}
      _active={{ bg: isRetroDesktopTheme ? '#c4bfb7' : 'rgba(0, 204, 255, 0.2)' }}
      sx={
        isRetroDesktopTheme
          ? {
              borderRadius: '0',
              border: '1px solid #7d828a',
              boxShadow:
                'inset 1px 1px 0 rgba(255, 255, 255, 0.76), inset -1px -1px 0 rgba(104, 104, 104, 0.28)',
            }
          : undefined
      }
    >
      Hide Keyboard
    </Button>
  ) : null;

  const headerIcon = (
    <Box
      color={accentColor}
      display="flex"
      alignItems="center"
      justifyContent="center"
      borderRadius={isRetroDesktopTheme ? '0' : 'full'}
      w={compactMobileLandscape ? '20px' : '24px'}
      h={compactMobileLandscape ? '20px' : '24px'}
      bg={iconBackground}
      border={iconBorder}
      flexShrink={0}
    >
      <FaCode />
    </Box>
  );

  const headerTitle = (
    <Text
      color={accentColor}
      fontWeight="bold"
      fontFamily={titleFont}
      letterSpacing="0.5px"
      fontSize={compactMobileLandscape ? 'xs' : undefined}
      minW="0"
      noOfLines={1}
    >
      {titleLabel}{' '}
      {!compactMobileLandscape && (
        <Text as="span" fontSize="xs" color={accentSoftColor} letterSpacing="0">
          {titleAccent}
        </Text>
      )}
    </Text>
  );

  return (
    <Flex
      bg={headerBg}
      p={compactMobileLandscape ? 1 : 2}
      justifyContent="space-between"
      alignItems={compactMobileLandscape ? 'center' : 'stretch'}
      gap={compactMobileLandscape ? 1 : 2}
      flexDirection={compactMobileLandscape ? 'row' : 'column'}
      flexWrap="nowrap"
      overflow={compactMobileLandscape ? 'hidden' : undefined}
      borderBottom="1px solid"
      borderColor={headerBorderColor}
      position="relative"
      _after={
        isRetroDesktopTheme
          ? undefined
          : {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: '10%',
              right: '10%',
              height: '1px',
              background:
                'linear-gradient(90deg, transparent, rgba(0, 204, 255, 0.3), transparent)',
            }
      }
    >
      {compactMobileLandscape ? (
        <>
          <Flex alignItems="center" gap={2} minW="0" flexShrink={1}>
            {headerIcon}
            {headerTitle}
          </Flex>
          {leftAddon && <Box flexShrink={0}>{leftAddon}</Box>}
          <Box flex="1" minW="0" />
          {controlCluster}
          {normalizedRightAddon}
          {mobileKeyboardButton}
        </>
      ) : isPortraitMobileMode ? (
        <>
          <Flex
            data-testid="code-editor-header-mobile-portrait-top-row"
            alignItems="center"
            gap={2}
            minW="0"
          >
            {headerIcon}
            {headerTitle}
          </Flex>
          <Flex
            data-testid="code-editor-header-mobile-portrait-control-row"
            gap={2}
            alignItems="stretch"
            flexDirection="column"
            justify="flex-start"
          >
            <Flex
              data-testid="code-editor-header-mobile-portrait-primary-controls"
              gap={2}
              alignItems="center"
              flexWrap="nowrap"
              justify="flex-start"
            >
              {controlCluster}
            </Flex>
            <Flex
              data-testid="code-editor-header-mobile-portrait-secondary-controls"
              gap={2}
              alignItems="center"
              flexWrap="nowrap"
              justify="flex-start"
            >
              {portraitMobileRightAddon}
              {mobileKeyboardButton}
            </Flex>
          </Flex>
        </>
      ) : (
        <>
          <Flex
            data-testid="code-editor-header-desktop-top-row"
            alignItems="center"
            justifyContent="flex-start"
            gap={3}
            minW="0"
          >
            <Flex alignItems="center" gap={2} minW="0" flex="1 1 auto">
              {leftAddon && <Box flexShrink={0}>{leftAddon}</Box>}
              {headerIcon}
              {headerTitle}
            </Flex>
          </Flex>
          <Flex
            data-testid="code-editor-header-desktop-control-row"
            gap={3}
            alignItems="center"
            flexWrap="nowrap"
            justify="space-between"
            minW="0"
          >
            {normalizedRightAddon || <Box flex="1 1 auto" minW="0" />}
            <Flex gap={2} alignItems="center" flexWrap="nowrap" justify="flex-end" flexShrink={0}>
              {controlCluster}
              {mobileKeyboardButton}
            </Flex>
          </Flex>
        </>
      )}
    </Flex>
  );
};

export default CodeEditorHeader;
