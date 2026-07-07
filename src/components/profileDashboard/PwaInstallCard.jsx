import { CloseIcon } from '@chakra-ui/icons';
import { Box, Button, HStack, IconButton, Text, useToast } from '@chakra-ui/react';
import { useCallback, useState } from 'react';
import useIsMobileDevice from '../../hooks/useIsMobileDevice';
import { usePwaInstallPrompt } from '../../hooks/usePwaInstallPrompt';

const PWA_INSTALL_CARD_DISMISSED_KEY = 'codegrind-profile-pwa-install-dismissed-v1';

const readDismissedState = () => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(PWA_INSTALL_CARD_DISMISSED_KEY) === 'true';
};

const PwaInstallCard = () => {
  const toast = useToast();
  const isMobileDevice = useIsMobileDevice();
  const [isDismissed, setIsDismissed] = useState(() => readDismissedState());
  const { isAppInstalled, canPromptInstall, canInstallCTA, promptInstall } = usePwaInstallPrompt();

  const installButtonProps = canPromptInstall
    ? {
        bg: 'var(--cg-header-end)',
        color: 'var(--cg-header-text)',
        border: '2px solid var(--cg-window-shadow)',
        boxShadow: 'var(--cg-window-outset)',
        _hover: { bg: 'var(--cg-header-start)' },
      }
    : {
        bg: 'var(--cg-window-face)',
        color: 'var(--cg-link)',
        border: '2px solid var(--cg-window-shadow)',
        boxShadow: 'var(--cg-window-outset)',
        _hover: { bg: 'rgba(255,255,255,0.2)' },
      };

  const dismissCard = useCallback(() => {
    setIsDismissed(true);

    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PWA_INSTALL_CARD_DISMISSED_KEY, 'true');
  }, []);

  const handleInstallPress = useCallback(async () => {
    if (canPromptInstall) {
      await promptInstall();
      return;
    }

    toast({
      duration: 8200,
      isClosable: true,
      position: 'top',
      render: ({ onClose }) => (
        <Box
          bg="var(--cg-window-face)"
          border="2px solid var(--cg-window-shadow)"
          boxShadow="var(--cg-window-outset), 10px 10px 0 rgba(0, 0, 0, 0.12)"
          maxW="460px"
          overflow="hidden"
        >
          <Box className="cg-titlebar" px={3} py={2}>
            <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
              install_help.txt
            </Text>
          </Box>
          <Box p={4} bg="rgba(255,255,255,0.14)">
            <Text
              color="var(--cg-text)"
              fontFamily="var(--cg-font-retro-display)"
              fontSize="sm"
              mb={2}
            >
              Install on Android or iOS
            </Text>
            <Text
              color="var(--cg-muted)"
              fontFamily="var(--cg-font-retro-display)"
              fontSize="sm"
              lineHeight="1.6"
              mb={3}
            >
              Android: open browser menu and choose Install app or Add to Home screen. iOS: open in
              Safari, tap Share, then Add to Home Screen.
            </Text>
            <Button
              size="sm"
              onClick={onClose}
              bg="var(--cg-window-face)"
              color="var(--cg-link)"
              border="2px solid var(--cg-window-shadow)"
              boxShadow="var(--cg-window-outset)"
              fontFamily="var(--cg-font-retro-display)"
              _hover={{ bg: 'rgba(255,255,255,0.18)' }}
            >
              Close
            </Button>
          </Box>
        </Box>
      ),
    });
  }, [canPromptInstall, promptInstall, toast]);

  if (isAppInstalled) return null;
  if (!canInstallCTA) return null;
  if (isMobileDevice) return null;
  if (isDismissed) return null;

  return (
    <Box className="cg-panel-window" overflow="hidden">
      <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
        <HStack justify="space-between" align="center" spacing={3}>
          <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
            install_app.inf
          </Text>
          <IconButton
            size="xs"
            aria-label="Dismiss install banner"
            icon={<CloseIcon boxSize={2.5} />}
            onClick={dismissCard}
            bg="var(--cg-window-face)"
            color="var(--cg-text)"
            border="2px solid var(--cg-window-shadow)"
            boxShadow="var(--cg-window-outset)"
            minW="24px"
            h="24px"
            _hover={{ bg: 'rgba(255,255,255,0.2)' }}
            _active={{ boxShadow: 'var(--cg-window-inset)' }}
          />
        </HStack>
      </Box>

      <Box px={{ base: 4, md: 5 }} py={{ base: 4, md: 5 }} bg="rgba(255,255,255,0.14)">
        <Text
          color="var(--cg-text)"
          fontFamily="var(--cg-font-retro-display)"
          fontSize={{ base: 'sm', md: 'md' }}
          letterSpacing="0.03em"
          textTransform="uppercase"
          mb={2}
        >
          Install CodeGrind App Mode
        </Text>

        <Text
          color="var(--cg-muted)"
          fontSize={{ base: 'sm', md: 'md' }}
          lineHeight="1.7"
          fontFamily="var(--cg-font-retro-display)"
          mb={4}
        >
          {canPromptInstall
            ? 'Pin CodeGrind to your desktop for faster launch, cleaner fullscreen play, and fewer browser UI interruptions.'
            : 'Install from your phone browser: Android via the browser menu and iOS via Safari Share to Add to Home Screen.'}
        </Text>

        <HStack justify="space-between" align="center" flexWrap="wrap" spacing={3}>
          <Text
            color="var(--cg-muted)"
            fontSize="xs"
            fontFamily="var(--cg-font-retro-display)"
            letterSpacing="0.04em"
            maxW="520px"
          >
            Install once per device. Works on Windows, Mac, Linux, Android, and iOS.
          </Text>

          <Button
            size="sm"
            onClick={handleInstallPress}
            fontFamily="var(--cg-font-retro-display)"
            textTransform="uppercase"
            letterSpacing="0.05em"
            {...installButtonProps}
          >
            {canPromptInstall ? 'Install CodeGrind' : 'Show Android + iOS Steps'}
          </Button>
        </HStack>
      </Box>
    </Box>
  );
};

export default PwaInstallCard;
