import {
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
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

const AudioSettingsSection = ({
  soundEffectsEnabled,
  soundEffectsVolume,
  handleSoundEffectsToggle,
  handleSoundEffectsVolumeChange
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
            background: '#00ffcc',
            boxShadow: '0 0 8px #00ffcc',
          }
        }}
      >
        <Box flex="1" textAlign="left" fontWeight="bold">
          <Flex align="center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00ffcc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
            </svg>
            Audio Settings
          </Flex>
        </Box>
        <AccordionIcon />
      </AccordionButton>
    </h2>
    <AccordionPanel pb={4}>
      <VStack spacing={6} align="stretch" py={4}>
        <FormControl>
          <FormLabel htmlFor="sound-effects-toggle" mb={2}>
            Enable Sound Effects
          </FormLabel>
          <Switch
            id="sound-effects-toggle"
            isChecked={soundEffectsEnabled}
            onChange={handleSoundEffectsToggle}
            colorScheme="cyan"
            sx={cyberpunkSwitchStyle}
          />
        </FormControl>
        
        <FormControl isDisabled={!soundEffectsEnabled}>
          <FormLabel htmlFor="sound-effects-volume" mb={2}>
            Volume
          </FormLabel>
          <Slider
            id="sound-effects-volume"
            min={0}
            max={1}
            step={0.01}
            value={soundEffectsVolume}
            onChange={handleSoundEffectsVolumeChange}
            colorScheme="cyan"
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb boxSize={6} fontSize="10px" fontWeight="bold">
              <Flex w="100%" h="100%" alignItems="center" justifyContent="center">
                <Text fontSize="xs">{Math.round(soundEffectsVolume * 100)}</Text>
              </Flex>
            </SliderThumb>
          </Slider>
        </FormControl>
      </VStack>
    </AccordionPanel>
  </AccordionItem>
);

export default AudioSettingsSection;
