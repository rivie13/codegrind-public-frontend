import { Box, Button, Flex, Heading, HStack, Text } from '@chakra-ui/react';
import React from 'react';
import { FaTimes } from 'react-icons/fa';
import CorporateDossier from '../CorporateDossier';
import {
  RETRO_WINDOW_BUTTON_ASSET,
  RETRO_WINDOW_BUTTON_PRESSED_ASSET,
} from '../../../../utils/assets/towerDefenseAssetUrls';
const RETRO_PANEL_SHADOW =
  'inset 1px 1px 0 rgba(255, 255, 255, 0.76), inset -1px -1px 0 rgba(104, 104, 104, 0.28), 0 10px 16px rgba(0, 0, 0, 0.1)';

const CodeEditorSetupPanel = ({
  showTerminal,
  terminalHeight,
  currentWave,
  onStartWave,
  onResetGame,
  selectedTowerType,
  onCancelTowerPlacement,
  problemTitle,
  difficulty,
  isDemo,
  showHowToPlay,
  setShowHowToPlay,
  lives,
  effectiveCodeGenerated,
  shellTheme = 'default',
}) => {
  const isRetroDesktopTheme = shellTheme === 'retro-desktop';
  const retroButtonSx = {
    backgroundImage: `url(${RETRO_WINDOW_BUTTON_ASSET})`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize: '100% 100%',
    backgroundColor: '#d4d0c8',
    borderRadius: '0',
    border: '1px solid rgba(31, 36, 48, 0.32)',
    color: '#1f2430',
    fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
    fontWeight: '700',
    letterSpacing: '0.03em',
    px: 4,
    _hover: {
      backgroundImage: `url(${RETRO_WINDOW_BUTTON_PRESSED_ASSET})`,
      transform: 'translateY(1px)',
    },
    _active: {
      backgroundImage: `url(${RETRO_WINDOW_BUTTON_PRESSED_ASSET})`,
      transform: 'translateY(1px)',
    },
  };

  if (isRetroDesktopTheme) {
    return (
      <Flex
        direction="column"
        justify="flex-start"
        align="center"
        height={showTerminal ? `calc(100% - ${terminalHeight})` : '100%'}
        minHeight="0"
        flex="1"
        maxHeight="100%"
        overflowY="auto"
        bg="#d4d0c8"
        color="#1f2430"
        p={{ base: 3, md: 6 }}
        m="0"
        position="relative"
      >
        <Box
          mb={5}
          p={4}
          width="min(100%, 760px)"
          bg="#f4efe6"
          border="2px solid #575c66"
          boxShadow={RETRO_PANEL_SHADOW}
        >
          <Text
            fontSize="xs"
            fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
            color="#000080"
            fontWeight="700"
            letterSpacing="0.08em"
            textTransform="uppercase"
          >
            {currentWave > 1 ? 'Defense Grid Ready' : 'Initialization Required'}
          </Text>
          <Heading
            as="h3"
            size="md"
            mt={2}
            mb={3}
            color="#1f2430"
            fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
          >
            {currentWave > 1 ? `Ready for Wave ${currentWave}` : 'Initialize the code workspace'}
          </Heading>
          <Text color="#3f4654" fontSize="sm" mb={4}>
            {currentWave > 1
              ? 'The editor is unlocked. Start the next wave or reset the mission if you want a clean run.'
              : 'Deploy a Function module from the Game panel to unlock the editor and continue the Hello Print mission.'}
          </Text>

          {currentWave > 1 ? (
            <HStack spacing={3} mt={4} flexWrap="wrap">
              <Button
                variant="unstyled"
                size="md"
                onClick={onStartWave}
                sx={retroButtonSx}
                data-tutorial="start-wave-button"
              >
                Start Wave {currentWave}
              </Button>
              <Button variant="unstyled" size="md" onClick={onResetGame} sx={retroButtonSx}>
                Reset Mission
              </Button>
              {selectedTowerType && (
                <Button
                  variant="unstyled"
                  size="md"
                  onClick={onCancelTowerPlacement}
                  sx={retroButtonSx}
                >
                  Cancel Placement
                </Button>
              )}
            </HStack>
          ) : (
            <Box
              mt={4}
              p={3}
              bg="#ffffff"
              border="2px solid #7d828a"
              boxShadow={RETRO_PANEL_SHADOW}
            >
              <Text
                fontSize="xs"
                fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                color="#000080"
                fontWeight="700"
                textTransform="uppercase"
                mb={2}
              >
                Mission Summary
              </Text>
              <Text fontSize="sm" color="#2d3440" mb={1}>
                Challenge: {problemTitle}
              </Text>
              <Text fontSize="sm" color="#2d3440" mb={1}>
                Difficulty: {difficulty}
              </Text>
              <Text fontSize="sm" color="#2d3440" mb={3}>
                Next step: place a Function tower, then come back here to inspect or edit the
                generated code.
              </Text>
              <Button
                variant="unstyled"
                size="sm"
                onClick={() => setShowHowToPlay(true)}
                sx={retroButtonSx}
              >
                Open Setup Guide
              </Button>
            </Box>
          )}

          {showHowToPlay && (
            <Box
              mt={4}
              bg="#ffffff"
              p={4}
              border="2px solid #7d828a"
              boxShadow={RETRO_PANEL_SHADOW}
              color="#1f2430"
              fontSize="sm"
            >
              <Flex justify="space-between" align="center" mb={3}>
                <Text
                  fontWeight="700"
                  color="#000080"
                  fontSize="sm"
                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  textTransform="uppercase"
                  letterSpacing="0.04em"
                >
                  Setup Guide
                </Text>
                <Button
                  variant="unstyled"
                  size="xs"
                  onClick={() => setShowHowToPlay(false)}
                  sx={{ ...retroButtonSx, px: 2, py: 1 }}
                >
                  <FaTimes />
                </Button>
              </Flex>
              <Box as="ul" pl={4} m={0}>
                <Box as="li" mb={2}>
                  Open the Game panel and place a Function module first.
                </Box>
                <Box as="li" mb={2}>
                  Each tower or deployable writes matching code into this workspace.
                </Box>
                <Box as="li" mb={2}>
                  Use verification before the last wave so you do not enter endless failure waves.
                </Box>
                <Box as="li">
                  Reset the mission if you want to restart the generated program from scratch.
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        <Box
          p={3}
          mb={6}
          width="min(100%, 760px)"
          bg="#ece6da"
          border="2px solid #7d828a"
          boxShadow={RETRO_PANEL_SHADOW}
        >
          <Text fontSize="sm" color="#384150" fontFamily="'Tahoma', 'MS Sans Serif', sans-serif">
            Each defense module you place updates the code workspace. Use the Game panel to build,
            then return here to inspect or refine the generated solution.
          </Text>
        </Box>

        <Box
          position="absolute"
          bottom="10px"
          right="10px"
          bg="#f4efe6"
          p={2.5}
          border="2px solid #7d828a"
          boxShadow={RETRO_PANEL_SHADOW}
          fontSize="10px"
          color="#36404e"
          fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
          maxWidth="220px"
        >
          <Text fontSize="9px" color="#000080" mb={1} fontWeight="700" textTransform="uppercase">
            System Status
          </Text>
          <Flex justify="space-between" mb={1}>
            <Text>Wave:</Text>
            <Text color="#000080">{currentWave || 'Init'}</Text>
          </Flex>
          <Flex justify="space-between" mb={1}>
            <Text>Lives:</Text>
            <Text color={lives > 5 ? '#2f6d2f' : lives > 2 ? '#8a6500' : '#8a1d1d'}>{lives}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text>Code:</Text>
            <Text color={effectiveCodeGenerated ? '#2f6d2f' : '#8a1d1d'}>
              {effectiveCodeGenerated ? 'Active' : 'Pending'}
            </Text>
          </Flex>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex
      direction="column"
      justify="flex-start"
      align="center"
      height={showTerminal ? `calc(100% - ${terminalHeight})` : '100%'}
      minHeight="0"
      flex="1"
      maxHeight="100%"
      overflowY="auto"
      bg="#050510"
      color="#00ccff"
      p={{ base: 2, md: 6 }}
      m="0"
      bgImage="linear-gradient(0deg, rgba(0,20,40,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,20,40,0.3) 1px, transparent 1px)"
      bgSize="20px 20px"
      position="relative"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(180deg, rgba(0,30,60,0.2) 0%, rgba(0,10,30,0.1) 100%)',
        pointerEvents: 'none',
      }}
      sx={{
        '@keyframes scanline': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, transparent, rgba(0, 204, 255, 0.2), transparent)',
          opacity: 0.5,
          animation: 'scanline 4s linear infinite',
        },
      }}
    >
      <Box
        mb={6}
        p={4}
        borderRadius="sm"
        bg="rgba(0,10,25,0.85)"
        borderLeft="2px solid"
        borderColor="#00ccff"
        maxWidth="80%"
        boxShadow="0 0 20px rgba(0, 120, 255, 0.1)"
        position="relative"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '8px',
          height: '8px',
          bg: '#00ccff',
          boxShadow: '0 0 5px #00ccff',
        }}
      >
        <Heading
          as="h3"
          size="md"
          mb={3}
          mt={2}
          color="#00ccff"
          fontFamily="'Orbitron', sans-serif"
          textShadow="0 0 5px rgba(0, 204, 255, 0.5)"
          letterSpacing="1px"
          display="flex"
          alignItems="center"
          _before={{
            content: '">>"',
            color: '#00ffaa',
            fontWeight: 'bold',
            marginRight: '8px',
            fontFamily: 'monospace',
          }}
        >
          {currentWave > 1 ? 'DEFENSE_GRID:READY' : 'SYSTEM_INITIALIZATION:PENDING'}
        </Heading>
        {currentWave > 1 ? (
          <HStack spacing={3} mt={4}>
            <Button
              colorScheme="green"
              size="md"
              onClick={onStartWave}
              bg="rgba(0, 200, 100, 0.2)"
              color="#00ff88"
              border="1px solid #00ff88"
              boxShadow="0 0 10px rgba(0, 255, 136, 0.2)"
              _hover={{
                bg: 'rgba(0, 200, 100, 0.3)',
                boxShadow: '0 0 15px rgba(0, 255, 136, 0.3)',
              }}
              fontFamily="'Orbitron', sans-serif"
              letterSpacing="1px"
              data-tutorial="start-wave-button"
            >
              START_WAVE_{currentWave}
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={onResetGame}
              bg="rgba(200, 30, 60, 0.1)"
              color="#ff3366"
              border="1px solid #ff3366"
              boxShadow="0 0 10px rgba(255, 51, 102, 0.1)"
              _hover={{
                bg: 'rgba(200, 30, 60, 0.2)',
                boxShadow: '0 0 15px rgba(255, 51, 102, 0.2)',
              }}
              fontFamily="'Orbitron', sans-serif"
              letterSpacing="1px"
            >
              RESET_ALL
            </Button>

            {selectedTowerType && (
              <Button
                variant="outline"
                size="md"
                onClick={onCancelTowerPlacement}
                bg="rgba(50, 50, 70, 0.2)"
                color="#aaccff"
                border="1px solid #aaccff"
                boxShadow="0 0 10px rgba(170, 204, 255, 0.1)"
                _hover={{
                  bg: 'rgba(50, 50, 70, 0.3)',
                  boxShadow: '0 0 15px rgba(170, 204, 255, 0.2)',
                }}
                fontFamily="'Orbitron', sans-serif"
                letterSpacing="1px"
              >
                CANCEL
              </Button>
            )}
          </HStack>
        ) : (
          <CorporateDossier
            problemTitle={problemTitle}
            difficulty={difficulty}
            category="algorithmic data"
            currentWave={currentWave}
            isDemo={isDemo}
            onShowGuide={() => setShowHowToPlay(true)}
          />
        )}

        {showHowToPlay && (
          <Box
            mt={4}
            bgGradient="linear(to-br, #181824, #23243a)"
            p={4}
            borderRadius="lg"
            color="#ffee99"
            fontSize="sm"
            fontFamily="monospace"
            boxShadow="0 2px 12px rgba(0,0,0,0.25)"
            border="1px solid #333"
            maxHeight="300px"
            overflowY="auto"
            sx={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#ffaa00 #23243a',
              '&::-webkit-scrollbar': { width: '8px', background: '#23243a' },
              '&::-webkit-scrollbar-thumb': { background: '#ffaa00', borderRadius: '8px' },
            }}
          >
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontWeight="bold" color="#ffcc00" fontSize="md" letterSpacing="0.5px">
                Neural Interface Guide:
              </Text>
              <Button
                size="xs"
                variant="ghost"
                color="#ffaa00"
                onClick={() => setShowHowToPlay(false)}
              >
                <FaTimes />
              </Button>
            </Flex>
            <ul style={{ marginLeft: '1.5em', marginBottom: '0.5em' }}>
              <li style={{ marginBottom: '0.5em' }}>
                <b>Foundation Modules</b>: Click "JACK IN" to activate neural interface. Deploy
                FUNCTION and OBJECT modules first to establish algorithmic backbone.
              </li>
              <li style={{ marginBottom: '0.5em' }}>
                <b>Code Matrix</b>: Placing towers injects corresponding code patterns. You can
                manually edit code after neural interface activation.
              </li>
              <li style={{ marginBottom: '0.5em' }}>
                <b>ICE Countermeasures</b>: Various tower types represent different programming
                concepts (ForLoop, WhileLoop, IfCondition, etc.).
              </li>
              <li style={{ marginBottom: '0.5em' }}>
                <b>Verification Protocol</b>: Required before final wave. Failed verification
                triggers endless nightmare waves with maximum corporate resistance.
              </li>
              <li style={{ marginBottom: '0.5em' }}>
                <b>Neural Synthesis</b>: AI assistance for code generation and refinement (limited
                in demo mode).
              </li>
              <li style={{ marginBottom: '0.5em' }}>
                <b>Data Extraction</b>: Survive all security layers to complete the breach and
                extract corporate databits.
              </li>
            </ul>
            <Text color="#ffaa00" fontSize="xs" mt={2}>
              <b>Tip:</b> Hover over any interface element for detailed neural pathway information!
            </Text>
          </Box>
        )}
      </Box>
      <Box
        p={1}
        mb={6}
        borderRadius="sm"
        bg="rgba(40,20,0,0.6)"
        borderLeft="2px solid"
        borderColor="#ffaa00"
        maxWidth="80%"
        position="relative"
        _before={{
          content: '""',
          position: 'absolute',
          top: '50%',
          left: '-10px',
          width: '6px',
          height: '6px',
          borderRadius: 'full',
          bg: '#ffaa00',
          transform: 'translateY(-50%)',
          boxShadow: '0 0 5px #ffaa00',
        }}
      >
        <Text
          fontSize="xs"
          color="#ffbb44"
          fontFamily="monospace"
          display="flex"
          alignItems="center"
        >
          <Box as="span" color="#ffaa00" fontWeight="bold" mr={2}>
            {'>'}
          </Box>
          Each defense module deployed will inject corresponding code patterns into the algorithm
          matrix.
        </Text>
      </Box>

      <Box
        position="absolute"
        bottom="10px"
        right="10px"
        bg="rgba(0,10,30,0.7)"
        p={2}
        borderRadius="sm"
        fontSize="10px"
        color="#88aacc"
        fontFamily="monospace"
        maxWidth="200px"
        borderTop="1px solid #0f4667"
        borderRight="1px solid #0f4667"
      >
        <Text fontSize="9px" color="#00ccff" mb={1}>
          SYSTEM STATUS
        </Text>
        <Flex justify="space-between" mb={1}>
          <Text>WAVE:</Text>
          <Text color="#00ffaa">{currentWave || 'INIT'}</Text>
        </Flex>
        <Flex justify="space-between" mb={1}>
          <Text>LIVES:</Text>
          <Text color={lives > 5 ? '#00ffaa' : lives > 2 ? '#ffcc00' : '#ff3366'}>{lives}</Text>
        </Flex>
        <Flex justify="space-between">
          <Text>CODE:</Text>
          <Text color={effectiveCodeGenerated ? '#00ffaa' : '#ff3366'}>
            {effectiveCodeGenerated ? 'ACTIVE' : 'PENDING'}
          </Text>
        </Flex>
      </Box>
    </Flex>
  );
};

export default CodeEditorSetupPanel;
