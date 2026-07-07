import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';

const RETRO_DISPLAY_FONT = '"MS Sans Serif", "Microsoft Sans Serif", Tahoma, Geneva, sans-serif';
const RETRO_TERMINAL_FONT = '"Lucida Console", Monaco, "Courier New", monospace';

const progressSweep = keyframes`
  0% {
    transform: translateX(-18%);
  }

  100% {
    transform: translateX(168%);
  }
`;

const ledPulse = keyframes`
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.48;
  }
`;

const scanlineDrift = keyframes`
  0% {
    transform: translateY(-18%);
  }

  100% {
    transform: translateY(18%);
  }
`;

const DEFAULT_TERMINAL_ROWS = [
  { token: 'Boot', text: 'Start the desktop' },
  { token: 'Restore', text: 'Reconnect your session' },
  { token: 'Warm', text: 'Prepare the next screen' },
];
const SHORT_BOOT_VIEWPORT_QUERY = '@media (max-height: 560px) and (orientation: landscape)';

function RetroDesktopBootScreen({
  description = 'Please wait while the desktop comes back online and prepares the next screen.',
  footerText = 'The transfer continues automatically.',
  isProgressComplete = false,
  kicker = 'Retro desktop',
  progressLabel = 'Startup progress',
  terminalProgram = 'BOOT.EXE',
  terminalRows = DEFAULT_TERMINAL_ROWS,
  terminalTitle = 'Startup terminal',
  title = 'Launching CodeGrind...',
  windowStatusLabel = 'loading',
  windowTitle = 'CodeGrind Desktop Runtime',
}) {
  return (
    <Box
      data-testid="retro-desktop-boot-screen"
      position="relative"
      width="100%"
      height="100%"
      minH="100dvh"
      overflow="hidden"
      fontFamily={RETRO_DISPLAY_FONT}
      background={[
        'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0 2px, transparent 2px 100%)',
        'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0 10%, transparent 10% 100%)',
        'linear-gradient(180deg, #1b7b86 0%, #0b4e61 100%)',
      ].join(', ')}
      sx={{
        [SHORT_BOOT_VIEWPORT_QUERY]: {
          '& [data-boot-root]': {
            alignItems: 'start',
            paddingBottom: '8px',
            paddingTop: '8px',
          },
          '& [data-boot-window]': {
            width: 'min(96vw, 660px)',
          },
          '& [data-boot-titlebar]': {
            minHeight: '30px',
            paddingBottom: '6px',
            paddingInline: '10px',
            paddingTop: '6px',
          },
          '& [data-boot-window-buttons] > div': {
            height: '20px',
            width: '20px',
          },
          '& [data-boot-window-buttons] .chakra-text': {
            fontSize: '10px',
          },
          '& [data-boot-stack]': {
            gap: '8px',
            paddingBottom: '10px',
            paddingInline: '12px',
            paddingTop: '10px',
          },
          '& [data-boot-hero]': {
            gap: '10px',
            minHeight: '88px',
            padding: '10px',
          },
          '& [data-boot-icon-frame]': {
            height: '56px',
            width: '56px',
          },
          '& [data-boot-icon]': {
            height: '36px',
            width: '36px',
          },
          '& [data-boot-kicker]': {
            fontSize: '10px',
          },
          '& [data-boot-title]': {
            fontSize: '22px',
          },
          '& [data-boot-description]': {
            fontSize: '12px',
            lineHeight: '1.35',
            marginTop: '6px',
            minHeight: '0',
          },
          '& [data-boot-terminal]': {
            gap: '6px',
            minHeight: '0',
            padding: '10px',
          },
          '& [data-boot-terminal-header]': {
            fontSize: '10px',
          },
          '& [data-boot-terminal-row]': {
            fontSize: '12px',
            gap: '10px',
            gridTemplateColumns: '64px minmax(0, 1fr)',
            lineHeight: '1.35',
            minHeight: '0',
          },
          '& [data-boot-terminal-token]': {
            fontSize: '12px',
            lineHeight: '1.35',
          },
          '& [data-boot-progress]': {
            gap: '6px',
            padding: '10px',
          },
          '& [data-boot-progress-label]': {
            fontSize: '12px',
          },
          '& [data-boot-progress-track]': {
            height: '22px',
          },
          '& [data-boot-status]': {
            minHeight: '0',
            padding: '8px 10px',
          },
          '& [data-boot-status-text]': {
            fontSize: '12px',
            lineHeight: '1.35',
          },
          '& [data-boot-shadow]': {
            display: 'none',
          },
        },
      }}
    >
      <Box
        data-boot-shadow
        position="absolute"
        inset={0}
        opacity={0.14}
        bgImage="linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px)"
        bgSize="32px 32px"
      />
      <Box
        data-boot-shadow
        position="absolute"
        inset={0}
        opacity={0.08}
        bg="repeating-linear-gradient(180deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 4px)"
        mixBlendMode="screen"
        animation={`${scanlineDrift} 1.1s linear infinite`}
      />
      <Box
        data-boot-shadow
        position="absolute"
        right={{ base: '16px', md: '28px' }}
        bottom={{ base: '14px', md: '20px' }}
        width="min(28vw, 220px)"
        height="24px"
        bg="linear-gradient(180deg, rgba(255, 255, 255, 0.26), rgba(255, 255, 255, 0.02)), rgba(0, 0, 0, 0.18)"
        clipPath="polygon(0 0, 100% 0, 84% 100%, 0 100%)"
        opacity={0.2}
      />

      <Box
        data-boot-root
        position="relative"
        display="grid"
        placeItems="center"
        minH="100dvh"
        px={{ base: 3, md: 6 }}
        py={{ base: 3, md: 6 }}
      >
        <Box
          data-boot-window
          width="min(94vw, 660px)"
          maxW="100%"
          minH={{ base: '0', md: '408px' }}
          bg="linear-gradient(180deg, #d3cfc8 0%, #c6c3bd 100%)"
          color="#141414"
          border="2px solid #111111"
          boxShadow="inset 2px 2px 0 #ffffff, inset -2px -2px 0 #7e7e7e, 12px 12px 0 rgba(0, 0, 0, 0.28)"
          overflow="hidden"
        >
          <HStack
            data-boot-titlebar
            minH="34px"
            px={{ base: 3, md: 4 }}
            py={2}
            spacing={3}
            justify="space-between"
            bg="linear-gradient(90deg, #000080 0%, #0a2f8f 68%, #0b55d8 100%)"
            borderBottom="1px solid rgba(17, 17, 17, 0.72)"
            boxShadow="inset 1px 1px 0 rgba(255, 255, 255, 0.2)"
          >
            <HStack spacing={2} minW={0}>
              <Box
                data-boot-window-icon
                as="img"
                src="/EnhancedIcon.png"
                alt=""
                aria-hidden="true"
                width="16px"
                height="16px"
                objectFit="contain"
                flexShrink={0}
              />
              <Text
                data-boot-window-title
                color="#f7f7f7"
                fontFamily={RETRO_DISPLAY_FONT}
                fontSize={{ base: '13px', md: '15px' }}
                fontWeight="700"
                lineHeight="1"
                noOfLines={1}
              >
                {windowTitle}
              </Text>
            </HStack>

            <HStack data-boot-window-buttons spacing={1} flexShrink={0}>
              {[windowStatusLabel || '_', '□', 'X'].map((label, index) => (
                <Box
                  key={`${label}-${index}`}
                  display="grid"
                  placeItems="center"
                  width="22px"
                  height="22px"
                  bg="linear-gradient(180deg, #fefefe 0%, #d4d0c8 100%)"
                  border="1px solid #111111"
                  boxShadow="inset 1px 1px 0 #ffffff, inset -1px -1px 0 #7e7e7e"
                >
                  <Text fontSize="11px" fontWeight="700" lineHeight="1">
                    {label}
                  </Text>
                </Box>
              ))}
            </HStack>
          </HStack>

          <VStack
            data-boot-stack
            align="stretch"
            spacing={3.5}
            px={{ base: 4, md: 5 }}
            py={{ base: 4, md: 5 }}
          >
            <Box
              data-boot-hero
              display="grid"
              gridTemplateColumns={{ base: '1fr', sm: '72px minmax(0, 1fr)' }}
              gap={{ base: 3, sm: 4 }}
              alignItems="center"
              minH="118px"
              p={3}
              bg="#e8e4dc"
              border="2px solid #8d8d8d"
              boxShadow="inset 1px 1px 0 #ffffff, inset -1px -1px 0 #b1ada6"
            >
              <Box
                data-boot-icon-frame
                display="grid"
                placeItems="center"
                width="72px"
                height="72px"
                mx={{ base: 'auto', sm: '0' }}
                bg="linear-gradient(180deg, #f5f2ec 0%, #dad6ce 100%)"
                border="2px solid #111111"
                boxShadow="inset 1px 1px 0 #ffffff, inset -1px -1px 0 #7e7e7e"
              >
                <Box
                  data-boot-icon
                  as="img"
                  src="/EnhancedIcon.png"
                  alt=""
                  aria-hidden="true"
                  width="48px"
                  height="48px"
                  objectFit="contain"
                />
              </Box>

              <Box minW={0}>
                <Text
                  data-boot-kicker
                  m={0}
                  color="#555555"
                  fontSize="11px"
                  letterSpacing="0.08em"
                  textTransform="uppercase"
                >
                  {kicker}
                </Text>
                <Text
                  data-boot-title
                  as="h1"
                  m={0}
                  mt={1}
                  fontSize={{ base: '26px', md: '34px' }}
                  lineHeight="1.05"
                  fontWeight="700"
                >
                  {title}
                </Text>
                <Text
                  data-boot-description
                  m={0}
                  mt={2}
                  maxW="52ch"
                  minH={{ base: '0', sm: '2.9em' }}
                  color="#555555"
                  fontSize={{ base: '14px', md: '15px' }}
                  lineHeight="1.55"
                >
                  {description}
                </Text>
              </Box>
            </Box>

            <Box
              data-boot-divider
              height="2px"
              bg="linear-gradient(180deg, #7f7f7f 0 1px, #ffffff 1px 2px)"
            />

            <Box
              data-boot-terminal
              display="grid"
              gap={2.5}
              minH="114px"
              p={3}
              bg="#f5f5f5"
              border="2px solid #000000"
              boxShadow="inset 1px 1px 0 #ffffff, inset -1px -1px 0 #7e7e7e"
            >
              <HStack
                data-boot-terminal-header
                justify="space-between"
                spacing={3}
                color="#555555"
                fontSize="11px"
                textTransform="uppercase"
                letterSpacing="0.06em"
              >
                <Text fontFamily={RETRO_DISPLAY_FONT}>{terminalTitle}</Text>
                <Text fontFamily={RETRO_TERMINAL_FONT}>{terminalProgram}</Text>
              </HStack>

              <VStack align="stretch" spacing={1.5}>
                {(terminalRows?.length ? terminalRows : DEFAULT_TERMINAL_ROWS).map((row) => (
                  <Box
                    data-boot-terminal-row
                    key={`${row.token}-${row.text}`}
                    display="grid"
                    gridTemplateColumns="82px minmax(0, 1fr)"
                    gap={2.5}
                    alignItems="start"
                    minH="22px"
                    fontSize="14px"
                    lineHeight="1.6"
                  >
                    <Text
                      data-boot-terminal-token
                      color="#000082"
                      fontFamily={RETRO_TERMINAL_FONT}
                      fontSize="13px"
                      lineHeight="1.55"
                      textTransform="uppercase"
                    >
                      {row.token}
                    </Text>
                    <Text color="#1b1b1b" fontFamily={RETRO_TERMINAL_FONT}>
                      {row.text}
                    </Text>
                  </Box>
                ))}
              </VStack>
            </Box>

            <Box
              data-boot-progress
              display="grid"
              gap={1.5}
              p={3}
              bg="#e8e4dc"
              border="2px solid #8d8d8d"
              boxShadow="inset 1px 1px 0 #ffffff, inset -1px -1px 0 #b1ada6"
            >
              <Text data-boot-progress-label m={0} color="#555555" fontSize="13px" fontWeight="700">
                {progressLabel}
              </Text>
              <Box
                data-boot-progress-track
                position="relative"
                height="28px"
                overflow="hidden"
                bg="#f8f8f8"
                border="2px solid #000000"
                boxShadow="inset 1px 1px 0 #ffffff, inset -1px -1px 0 #808080"
              >
                <Box
                  position="absolute"
                  top="3px"
                  left="3px"
                  bottom="3px"
                  width={isProgressComplete ? 'calc(100% - 6px)' : '38%'}
                  bg="repeating-linear-gradient(90deg, #0000a8 0 12px, #3c67ff 12px 24px)"
                  animation={
                    isProgressComplete ? 'none' : `${progressSweep} 1.55s steps(9, end) infinite`
                  }
                />
              </Box>
            </Box>

            <HStack
              data-boot-status
              spacing={2}
              minH="33px"
              px={3}
              py={2}
              bg="#f1efe9"
              border="2px solid #8d8d8d"
              boxShadow="inset 1px 1px 0 #ffffff, inset -1px -1px 0 #c0bcb5"
            >
              <Box
                data-boot-status-led
                width="11px"
                height="11px"
                flexShrink={0}
                bg="#0ba40b"
                border="1px solid #000000"
                boxShadow="inset 1px 1px 0 rgba(255, 255, 255, 0.45)"
                animation={`${ledPulse} 1.1s steps(2, end) infinite`}
              />
              <Text data-boot-status-text color="#555555" fontSize="13px">
                {footerText}
              </Text>
            </HStack>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
}

export default RetroDesktopBootScreen;
