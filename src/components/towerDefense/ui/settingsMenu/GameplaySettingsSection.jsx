import {
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Switch,
  Text,
  VStack
} from '@chakra-ui/react';
import React from 'react';
import { cyberpunkSwitchStyle } from './SettingsMenuShared';

const GameplaySettingsSection = ({
  canEditGameSettings,
  difficultyMinimums,
  startingCreditsValue,
  startingLivesValue,
  enemyHealthValue,
  enemySpeedValue,
  totalWavesValue,
  hardcoreModeValue,
  aiChatEnabledValue,
  aiCodeSnippetsEnabledValue,
  towerSelectorEnabledValue,
  deployableMenuEnabledValue,
  autoStartWavesValue,
  applySettingsUpdate,
  syncAICodeSnippetSetting,
  onGameSettingsChange,
  HARDCORE_GAME_SETTINGS
}) => (
  <AccordionItem border="none">
    <h2>
      <AccordionButton
        _expanded={{ bg: "#0f4667", color: "white" }}
        _hover={{ bg: "#0D1321" }}
        borderRadius="md"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          '&[aria-expanded=true]:before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: '3px',
            background: '#ffcc00',
            boxShadow: '0 0 8px #ffcc00'
          }
        }}
      >
        <Box flex="1" textAlign="left" fontWeight="bold">
          <Flex align="center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffcc00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Gameplay Settings
          </Flex>
        </Box>
        {!canEditGameSettings && (
          <Badge colorScheme="red" mr={2} fontSize="0.6rem">LOCKED</Badge>
        )}
        <AccordionIcon />
      </AccordionButton>
    </h2>
    <AccordionPanel pb={4}>
      <VStack spacing={5} align="stretch" py={2}>
        <Text fontSize="xs" color="gray.400">
          Adjustments apply only outside active waves.
        </Text>

        <FormControl isDisabled={!canEditGameSettings}>
          <FormLabel mb={2}>Hardcore Mode</FormLabel>
          <Switch
            isChecked={hardcoreModeValue}
            onChange={() => {
              const nextValue = !hardcoreModeValue;
              if (nextValue) {
                applySettingsUpdate({
                  hardcoreMode: true,
                  ...HARDCORE_GAME_SETTINGS
                });
              } else {
                applySettingsUpdate({ hardcoreMode: false });
              }
            }}
            colorScheme="red"
            sx={cyberpunkSwitchStyle}
          />
          <Text fontSize="xs" color="gray.500" mt={2}>
            Applies: no AI chat, no AI snippets, terminal-only menus, auto-start waves.
          </Text>
        </FormControl>

        <Divider borderColor="rgba(255, 255, 255, 0.08)" />

        <FormControl isDisabled={!canEditGameSettings}>
          <FormLabel mb={2}>AI Chat</FormLabel>
          <Switch
            isChecked={aiChatEnabledValue}
            onChange={() => applySettingsUpdate({ aiChatEnabled: !aiChatEnabledValue })}
            colorScheme="cyan"
            sx={cyberpunkSwitchStyle}
          />
        </FormControl>

        <FormControl isDisabled={!canEditGameSettings}>
          <FormLabel mb={2}>AI Code Snippets</FormLabel>
          <Switch
            isChecked={aiCodeSnippetsEnabledValue}
            onChange={() => syncAICodeSnippetSetting(!aiCodeSnippetsEnabledValue, { updateGameSettings: true })}
            colorScheme="cyan"
            sx={cyberpunkSwitchStyle}
          />
        </FormControl>

        <FormControl isDisabled={!canEditGameSettings}>
          <FormLabel mb={2}>Tower Selector Menu</FormLabel>
          <Switch
            isChecked={towerSelectorEnabledValue}
            onChange={() => applySettingsUpdate({ towerSelectorEnabled: !towerSelectorEnabledValue })}
            colorScheme="cyan"
            sx={cyberpunkSwitchStyle}
          />
        </FormControl>

        <FormControl isDisabled={!canEditGameSettings}>
          <FormLabel mb={2}>Deployable Menu</FormLabel>
          <Switch
            isChecked={deployableMenuEnabledValue}
            onChange={() => applySettingsUpdate({ deployableMenuEnabled: !deployableMenuEnabledValue })}
            colorScheme="orange"
            sx={cyberpunkSwitchStyle}
          />
        </FormControl>

        <FormControl isDisabled={!canEditGameSettings}>
          <FormLabel mb={2}>Auto-Start Waves</FormLabel>
          <Switch
            isChecked={autoStartWavesValue}
            onChange={() => applySettingsUpdate({ autoStartWaves: !autoStartWavesValue })}
            colorScheme="yellow"
            sx={cyberpunkSwitchStyle}
          />
        </FormControl>

        <Divider borderColor="rgba(255, 255, 255, 0.08)" />

        <FormControl isDisabled={!canEditGameSettings}>
          <FormLabel mb={2}>Starting Credits</FormLabel>
          <Slider
            min={difficultyMinimums.initialCredits}
            max={1000}
            step={10}
            value={startingCreditsValue}
            onChange={(value) => onGameSettingsChange({ startingCredits: value })}
            colorScheme="yellow"
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb boxSize={6} fontSize="10px" fontWeight="bold">
              <Flex w="100%" h="100%" alignItems="center" justifyContent="center">
                <Text fontSize="xs">{startingCreditsValue}</Text>
              </Flex>
            </SliderThumb>
          </Slider>
          <Text fontSize="xs" color="gray.500">Min: {difficultyMinimums.initialCredits}</Text>
        </FormControl>

        <FormControl isDisabled={!canEditGameSettings}>
          <FormLabel mb={2}>Starting Lives</FormLabel>
          <Slider
            min={difficultyMinimums.initialLives}
            max={20}
            step={1}
            value={startingLivesValue}
            onChange={(value) => onGameSettingsChange({ startingLives: value })}
            colorScheme="yellow"
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb boxSize={6} fontSize="10px" fontWeight="bold">
              <Flex w="100%" h="100%" alignItems="center" justifyContent="center">
                <Text fontSize="xs">{startingLivesValue}</Text>
              </Flex>
            </SliderThumb>
          </Slider>
          <Text fontSize="xs" color="gray.500">Min: {difficultyMinimums.initialLives}</Text>
        </FormControl>

        <FormControl isDisabled={!canEditGameSettings}>
          <FormLabel mb={2}>Enemy Health Multiplier</FormLabel>
          <Slider
            min={difficultyMinimums.baseEnemyHealth}
            max={2}
            step={0.05}
            value={enemyHealthValue}
            onChange={(value) => onGameSettingsChange({ enemyHealthMultiplier: value })}
            colorScheme="yellow"
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb boxSize={6} fontSize="10px" fontWeight="bold">
              <Flex w="100%" h="100%" alignItems="center" justifyContent="center">
                <Text fontSize="xs">{enemyHealthValue.toFixed(2)}</Text>
              </Flex>
            </SliderThumb>
          </Slider>
          <Text fontSize="xs" color="gray.500">Min: {difficultyMinimums.baseEnemyHealth}</Text>
        </FormControl>

        <FormControl isDisabled={!canEditGameSettings}>
          <FormLabel mb={2}>Enemy Speed Multiplier</FormLabel>
          <Slider
            min={difficultyMinimums.baseEnemySpeed}
            max={2}
            step={0.05}
            value={enemySpeedValue}
            onChange={(value) => onGameSettingsChange({ enemySpeedMultiplier: value })}
            colorScheme="yellow"
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb boxSize={6} fontSize="10px" fontWeight="bold">
              <Flex w="100%" h="100%" alignItems="center" justifyContent="center">
                <Text fontSize="xs">{enemySpeedValue.toFixed(2)}</Text>
              </Flex>
            </SliderThumb>
          </Slider>
          <Text fontSize="xs" color="gray.500">Min: {difficultyMinimums.baseEnemySpeed}</Text>
        </FormControl>

        <FormControl isDisabled={!canEditGameSettings}>
          <FormLabel mb={2}>Total Waves</FormLabel>
          <Slider
            min={difficultyMinimums.totalWaves}
            max={15}
            step={1}
            value={totalWavesValue}
            onChange={(value) => onGameSettingsChange({ totalWaves: value })}
            colorScheme="yellow"
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb boxSize={6} fontSize="10px" fontWeight="bold">
              <Flex w="100%" h="100%" alignItems="center" justifyContent="center">
                <Text fontSize="xs">{totalWavesValue}</Text>
              </Flex>
            </SliderThumb>
          </Slider>
          <Text fontSize="xs" color="gray.500">Min: {difficultyMinimums.totalWaves}</Text>
        </FormControl>
      </VStack>
    </AccordionPanel>
  </AccordionItem>
);

export default GameplaySettingsSection;
