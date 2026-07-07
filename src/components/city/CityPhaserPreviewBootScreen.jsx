import { Box } from '@chakra-ui/react';
import RetroDesktopBootScreen from './RetroDesktopBootScreen';

const PREVIEW_PHASE_COPY = {
  error: {
    description:
      'The apartment safehouse did not boot cleanly. The room is on hold while the error stays on screen.',
    footerText: 'Safehouse boot failed. Check the message on screen.',
    isProgressComplete: false,
    kicker: 'Apartment safehouse',
    progressLabel: 'Safehouse boot failed',
    terminalRows: [
      { token: 'Route', text: 'Apartment safehouse requested' },
      { token: 'Boot', text: 'The room stopped loading before it could open' },
      { token: 'Hold', text: 'Keeping the safehouse on hold until the fault clears' },
    ],
    title: 'Apartment Safehouse Boot Failed',
    windowStatusLabel: 'err',
  },
  ready: {
    description: 'The apartment safehouse is ready. Control is about to move into the room.',
    footerText: 'Apartment safehouse ready. Entering the room now.',
    isProgressComplete: true,
    kicker: 'Apartment safehouse',
    progressLabel: 'Safehouse ready',
    terminalRows: [
      { token: 'Route', text: 'City route is open' },
      { token: 'Load', text: 'Room art, avatar, and terminal are in place' },
      { token: 'Enter', text: 'Control passes to the room on the next frame' },
    ],
    title: 'Opening Apartment Safehouse...',
    windowStatusLabel: 'ok',
  },
  route: {
    description: 'Opening the apartment safehouse.',
    footerText: 'Loading the room. Please wait.',
    isProgressComplete: false,
    kicker: 'Apartment safehouse',
    progressLabel: 'Opening city route',
    terminalRows: [
      { token: 'Swap', text: 'Switching to the apartment safehouse' },
      { token: 'Open', text: 'Opening the room window' },
      { token: 'Queue', text: 'Preparing the room to load' },
    ],
    title: 'Loading Apartment Safehouse...',
    windowStatusLabel: 'run',
  },
  runtime: {
    description: 'The apartment safehouse is loading.',
    footerText: 'Bringing the room online.',
    isProgressComplete: false,
    kicker: 'Apartment safehouse',
    progressLabel: 'Booting Phaser runtime',
    terminalRows: [
      { token: 'Load', text: 'Loading the room engine' },
      { token: 'Open', text: 'Opening the room view' },
      { token: 'Prime', text: 'Preparing art and scene data' },
    ],
    title: 'Loading Apartment Safehouse...',
    windowStatusLabel: 'run',
  },
  scene: {
    description: 'The apartment scene is loading art, controls, and room interactions.',
    footerText: 'Room booting. Control unlocks when it is ready.',
    isProgressComplete: false,
    kicker: 'Apartment safehouse',
    progressLabel: 'Loading apartment scene',
    terminalRows: [
      { token: 'Map', text: 'Loading the apartment layout and room markers' },
      { token: 'Input', text: 'Checking controls and camera framing' },
      { token: 'Link', text: 'Connecting the safehouse terminal and exit' },
    ],
    title: 'Loading Apartment Safehouse...',
    windowStatusLabel: 'run',
  },
};

function CityPhaserPreviewBootScreen({
  errorMessage = '',
  isVisible = true,
  phase = 'route',
  position = 'absolute',
  zIndex = 2,
}) {
  const normalizedPhase = errorMessage ? 'error' : PREVIEW_PHASE_COPY[phase] ? phase : 'route';
  const phaseCopy = PREVIEW_PHASE_COPY[normalizedPhase];

  return (
    <Box
      position={position}
      inset={position === 'absolute' || position === 'fixed' ? 0 : undefined}
      width="100%"
      height="100%"
      minH="100dvh"
      overflow="hidden"
      zIndex={zIndex}
      opacity={isVisible ? 1 : 0}
      transition="opacity 220ms ease"
      pointerEvents="none"
    >
      <RetroDesktopBootScreen
        description={phaseCopy.description}
        footerText={phaseCopy.footerText}
        isProgressComplete={phaseCopy.isProgressComplete}
        kicker={phaseCopy.kicker}
        progressLabel={phaseCopy.progressLabel}
        terminalRows={phaseCopy.terminalRows}
        title={phaseCopy.title}
        windowStatusLabel={phaseCopy.windowStatusLabel}
        windowTitle="city.exe"
      />
    </Box>
  );
}

export default CityPhaserPreviewBootScreen;
