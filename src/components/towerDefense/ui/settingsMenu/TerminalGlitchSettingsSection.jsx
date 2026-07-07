import {
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Radio,
  RadioGroup,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Switch,
  Text,
  VStack
} from '@chakra-ui/react';
import React from 'react';
import audioManager from '../../../../utils/audio/AudioManager';
import visualSettingsManager from '../../../../utils/game/VisualSettingsManager';
import { cyberpunkSwitchStyle } from './SettingsMenuShared';

const TerminalGlitchSettingsSection = ({
  terminalGlitchEnabled,
  setTerminalGlitchEnabled,
  terminalGlitchIntensity,
  setTerminalGlitchIntensity,
  terminalTypingEnabled,
  setTerminalTypingEnabled,
  terminalTypingSpeed,
  setTerminalTypingSpeed,
  editorMatrixEnabled,
  setEditorMatrixEnabled,
  editorMatrixIntensity,
  setEditorMatrixIntensity,
  editorMatrixVisibleLinesMin,
  setEditorMatrixVisibleLinesMin,
  editorMatrixVisibleLinesMax,
  setEditorMatrixVisibleLinesMax,
  canvasGlitchEnabled,
  setCanvasGlitchEnabled,
  canvasGlitchIntensity,
  setCanvasGlitchIntensity,
  canvasFlickerEnabled,
  setCanvasFlickerEnabled,
  canvasFlickerIntensity,
  setCanvasFlickerIntensity,
  canvasFlashEnabled,
  setCanvasFlashEnabled,
  canvasFlashIntensity,
  setCanvasFlashIntensity,
  terminalForceScroll,
  setTerminalForceScroll,
  terminalScrollFrequency,
  setTerminalScrollFrequency,
  setQualityPreset
}) => (
  <AccordionItem border="none" mt={2}>
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
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
            </svg>
            Terminal & Glitch Settings
          </Flex>
        </Box>
        <AccordionIcon />
      </AccordionButton>
    </h2>
    <AccordionPanel pb={4}>
      <VStack align="stretch" spacing={4}>
        <FormControl display="flex" alignItems="center" mb={2}>
          <FormLabel htmlFor="terminal-glitch-toggle" mb="0">
            Glitch Effects
          </FormLabel>
          <Switch
            id="terminal-glitch-toggle"
            isChecked={terminalGlitchEnabled}
            onChange={() => {
              // Set the new state locally
              setTerminalGlitchEnabled(!terminalGlitchEnabled);
              
              // Apply the change immediately (fixes state inconsistency)
              setTimeout(() => {
                visualSettingsManager.updateTerminalVisuals(
                  !terminalGlitchEnabled, // Use the inverted value since state hasn't updated yet
                  terminalGlitchIntensity, 
                  terminalTypingEnabled,
                  terminalTypingSpeed
                );
                // Trigger event notification to update terminal immediately
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('td-settings-changed'));
                }
                audioManager.playSoundEffect('ui-hover');
              }, 0);
            }}
            colorScheme="pink"
            sx={cyberpunkSwitchStyle}
          />
        </FormControl>
        
        <FormControl isDisabled={!terminalGlitchEnabled}>
          <FormLabel htmlFor="terminal-glitch-intensity" mb={2}>
            Glitch Intensity
          </FormLabel>
          <Slider
            id="terminal-glitch-intensity"
            min={0}
            max={1}
            step={0.1}
            value={terminalGlitchIntensity}
            onChange={(val) => {
              setTerminalGlitchIntensity(val);
              
              // Apply intensity change immediately (fixes immediate feedback issue)
              visualSettingsManager.updateTerminalVisuals(
                terminalGlitchEnabled,
                val, // Use the new value directly
                terminalTypingEnabled,
                terminalTypingSpeed
              );
              
              // Trigger event notification to update terminal immediately
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('td-settings-changed'));
              }
            }}
            colorScheme="pink"
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb boxSize={6} fontSize="10px" fontWeight="bold">
              <Flex w="100%" h="100%" alignItems="center" justifyContent="center">
                <Text fontSize="xs">{terminalGlitchIntensity.toFixed(1)}</Text>
              </Flex>
            </SliderThumb>
          </Slider>
        </FormControl>
        
        <FormControl display="flex" alignItems="center" mb={2}>
          <FormLabel htmlFor="terminal-typing-toggle" mb="0">
            Typing Animation
          </FormLabel>
          <Switch
            id="terminal-typing-toggle"
            isChecked={terminalTypingEnabled}
            onChange={() => {
              // Set the new state locally
              setTerminalTypingEnabled(!terminalTypingEnabled);
              
              // Apply the change immediately (fixes state inconsistency)
              setTimeout(() => {
                visualSettingsManager.updateTerminalVisuals(
                  terminalGlitchEnabled, 
                  terminalGlitchIntensity,
                  !terminalTypingEnabled, // Use the inverted value since state hasn't updated yet
                  terminalTypingSpeed
                );
                // Trigger event notification to update terminal immediately
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('td-settings-changed'));
                }
                audioManager.playSoundEffect('ui-hover');
              }, 0);
            }}
            colorScheme="teal"
            sx={cyberpunkSwitchStyle}
          />
        </FormControl>
        
        <FormControl isDisabled={!terminalTypingEnabled}>
          <FormLabel htmlFor="terminal-typing-speed" mb={2}>
            Typing Speed
          </FormLabel>
          <Slider
            id="terminal-typing-speed"
            min={0.4}
            max={1.5}
            step={0.1}
            value={terminalTypingSpeed}
            onChange={(val) => {
              setTerminalTypingSpeed(val);
              
              // Apply speed change immediately (fixes immediate feedback issue)
              visualSettingsManager.updateTerminalVisuals(
                terminalGlitchEnabled,
                terminalGlitchIntensity,
                terminalTypingEnabled,
                val // Use the new value directly
              );
              
              // Trigger event notification to update terminal immediately
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('td-settings-changed'));
              }
            }}
            colorScheme="teal"
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb boxSize={6} fontSize="10px" fontWeight="bold">
              <Flex w="100%" h="100%" alignItems="center" justifyContent="center">
                <Text fontSize="xs">{terminalTypingSpeed.toFixed(1)}</Text>
              </Flex>
            </SliderThumb>
          </Slider>
        </FormControl>

        <Divider borderColor="#3D4756" my={2} />

        <Text fontSize="sm" color="#00ccff" fontWeight="bold">
          Editor & Canvas Effects
        </Text>

        <FormControl display="flex" alignItems="center" mb={2}>
          <FormLabel htmlFor="editor-matrix-toggle" mb="0">
            Editor Matrix Obfuscation
          </FormLabel>
          <Switch
            id="editor-matrix-toggle"
            isChecked={editorMatrixEnabled}
            onChange={() => {
              const nextValue = !editorMatrixEnabled;
              setEditorMatrixEnabled(nextValue);

              setTimeout(() => {
                visualSettingsManager.updateEditorMatrixSettings(
                  nextValue,
                  editorMatrixIntensity,
                  editorMatrixVisibleLinesMin,
                  editorMatrixVisibleLinesMax
                );
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('td-settings-changed'));
                }
                audioManager.playSoundEffect('ui-hover');
                setQualityPreset('custom');
              }, 0);
            }}
            colorScheme="green"
            sx={cyberpunkSwitchStyle}
          />
        </FormControl>

        <FormControl isDisabled={!editorMatrixEnabled}>
          <FormLabel htmlFor="editor-matrix-intensity" mb={2}>
            Matrix Intensity
          </FormLabel>
          <Slider
            id="editor-matrix-intensity"
            min={0}
            max={1}
            step={0.1}
            value={editorMatrixIntensity}
            onChange={(val) => {
              setEditorMatrixIntensity(val);
              visualSettingsManager.updateEditorMatrixSettings(
                editorMatrixEnabled,
                val,
                editorMatrixVisibleLinesMin,
                editorMatrixVisibleLinesMax
              );
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('td-settings-changed'));
              }
              setQualityPreset('custom');
            }}
            colorScheme="green"
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb boxSize={6} fontSize="10px" fontWeight="bold">
              <Flex w="100%" h="100%" alignItems="center" justifyContent="center">
                <Text fontSize="xs">{editorMatrixIntensity.toFixed(1)}</Text>
              </Flex>
            </SliderThumb>
          </Slider>
        </FormControl>

        <FormControl isDisabled={!editorMatrixEnabled}>
          <FormLabel htmlFor="editor-matrix-visible-max" mb={2}>
            Max Visible Lines (High Lives)
          </FormLabel>
          <Slider
            id="editor-matrix-visible-max"
            min={1}
            max={12}
            step={1}
            value={editorMatrixVisibleLinesMax}
            onChange={(val) => {
              const nextValue = Math.max(val, editorMatrixVisibleLinesMin);
              setEditorMatrixVisibleLinesMax(nextValue);
              visualSettingsManager.updateEditorMatrixSettings(
                editorMatrixEnabled,
                editorMatrixIntensity,
                editorMatrixVisibleLinesMin,
                nextValue
              );
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('td-settings-changed'));
              }
              setQualityPreset('custom');
            }}
            colorScheme="green"
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb boxSize={6} fontSize="10px" fontWeight="bold">
              <Flex w="100%" h="100%" alignItems="center" justifyContent="center">
                <Text fontSize="xs">{editorMatrixVisibleLinesMax}</Text>
              </Flex>
            </SliderThumb>
          </Slider>
        </FormControl>

        <FormControl isDisabled={!editorMatrixEnabled}>
          <FormLabel htmlFor="editor-matrix-visible-min" mb={2}>
            Min Visible Lines (Low Lives)
          </FormLabel>
          <Slider
            id="editor-matrix-visible-min"
            min={1}
            max={12}
            step={1}
            value={editorMatrixVisibleLinesMin}
            onChange={(val) => {
              const nextValue = Math.min(val, editorMatrixVisibleLinesMax);
              setEditorMatrixVisibleLinesMin(nextValue);
              visualSettingsManager.updateEditorMatrixSettings(
                editorMatrixEnabled,
                editorMatrixIntensity,
                nextValue,
                editorMatrixVisibleLinesMax
              );
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('td-settings-changed'));
              }
              setQualityPreset('custom');
            }}
            colorScheme="green"
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb boxSize={6} fontSize="10px" fontWeight="bold">
              <Flex w="100%" h="100%" alignItems="center" justifyContent="center">
                <Text fontSize="xs">{editorMatrixVisibleLinesMin}</Text>
              </Flex>
            </SliderThumb>
          </Slider>
        </FormControl>

        <FormControl display="flex" alignItems="center" mb={2}>
          <FormLabel htmlFor="canvas-glitch-toggle" mb="0">
            Canvas Glitch
          </FormLabel>
          <Switch
            id="canvas-glitch-toggle"
            isChecked={canvasGlitchEnabled}
            onChange={() => {
              const nextValue = !canvasGlitchEnabled;
              setCanvasGlitchEnabled(nextValue);

              setTimeout(() => {
                visualSettingsManager.updateCanvasGlitchSettings(
                  nextValue,
                  canvasGlitchIntensity,
                  canvasFlickerEnabled,
                  canvasFlickerIntensity,
                  canvasFlashEnabled,
                  canvasFlashIntensity
                );
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('td-settings-changed'));
                }
                audioManager.playSoundEffect('ui-hover');
                setQualityPreset('custom');
              }, 0);
            }}
            colorScheme="purple"
            sx={cyberpunkSwitchStyle}
          />
        </FormControl>

        <FormControl isDisabled={!canvasGlitchEnabled}>
          <FormLabel htmlFor="canvas-glitch-intensity" mb={2}>
            Canvas Glitch Intensity
          </FormLabel>
          <Slider
            id="canvas-glitch-intensity"
            min={0}
            max={1}
            step={0.1}
            value={canvasGlitchIntensity}
            onChange={(val) => {
              setCanvasGlitchIntensity(val);
              visualSettingsManager.updateCanvasGlitchSettings(
                canvasGlitchEnabled,
                val,
                canvasFlickerEnabled,
                canvasFlickerIntensity,
                canvasFlashEnabled,
                canvasFlashIntensity
              );
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('td-settings-changed'));
              }
              setQualityPreset('custom');
            }}
            colorScheme="purple"
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb boxSize={6} fontSize="10px" fontWeight="bold">
              <Flex w="100%" h="100%" alignItems="center" justifyContent="center">
                <Text fontSize="xs">{canvasGlitchIntensity.toFixed(1)}</Text>
              </Flex>
            </SliderThumb>
          </Slider>
        </FormControl>

        <FormControl display="flex" alignItems="center" mb={2}>
          <FormLabel htmlFor="canvas-flicker-toggle" mb="0">
            Canvas Flicker
          </FormLabel>
          <Switch
            id="canvas-flicker-toggle"
            isChecked={canvasFlickerEnabled}
            onChange={() => {
              const nextValue = !canvasFlickerEnabled;
              setCanvasFlickerEnabled(nextValue);

              setTimeout(() => {
                visualSettingsManager.updateCanvasGlitchSettings(
                  canvasGlitchEnabled,
                  canvasGlitchIntensity,
                  nextValue,
                  canvasFlickerIntensity,
                  canvasFlashEnabled,
                  canvasFlashIntensity
                );
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('td-settings-changed'));
                }
                audioManager.playSoundEffect('ui-hover');
                setQualityPreset('custom');
              }, 0);
            }}
            colorScheme="purple"
            sx={cyberpunkSwitchStyle}
          />
        </FormControl>

        <FormControl isDisabled={!canvasFlickerEnabled}>
          <FormLabel htmlFor="canvas-flicker-intensity" mb={2}>
            Flicker Intensity
          </FormLabel>
          <Slider
            id="canvas-flicker-intensity"
            min={0}
            max={1}
            step={0.1}
            value={canvasFlickerIntensity}
            onChange={(val) => {
              setCanvasFlickerIntensity(val);
              visualSettingsManager.updateCanvasGlitchSettings(
                canvasGlitchEnabled,
                canvasGlitchIntensity,
                canvasFlickerEnabled,
                val,
                canvasFlashEnabled,
                canvasFlashIntensity
              );
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('td-settings-changed'));
              }
              setQualityPreset('custom');
            }}
            colorScheme="purple"
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb boxSize={6} fontSize="10px" fontWeight="bold">
              <Flex w="100%" h="100%" alignItems="center" justifyContent="center">
                <Text fontSize="xs">{canvasFlickerIntensity.toFixed(1)}</Text>
              </Flex>
            </SliderThumb>
          </Slider>
        </FormControl>

        <FormControl display="flex" alignItems="center" mb={2}>
          <FormLabel htmlFor="canvas-flash-toggle" mb="0">
            Canvas Flash
          </FormLabel>
          <Switch
            id="canvas-flash-toggle"
            isChecked={canvasFlashEnabled}
            onChange={() => {
              const nextValue = !canvasFlashEnabled;
              setCanvasFlashEnabled(nextValue);

              setTimeout(() => {
                visualSettingsManager.updateCanvasGlitchSettings(
                  canvasGlitchEnabled,
                  canvasGlitchIntensity,
                  canvasFlickerEnabled,
                  canvasFlickerIntensity,
                  nextValue,
                  canvasFlashIntensity
                );
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('td-settings-changed'));
                }
                audioManager.playSoundEffect('ui-hover');
                setQualityPreset('custom');
              }, 0);
            }}
            colorScheme="purple"
            sx={cyberpunkSwitchStyle}
          />
        </FormControl>

        <FormControl isDisabled={!canvasFlashEnabled}>
          <FormLabel htmlFor="canvas-flash-intensity" mb={2}>
            Flash Intensity
          </FormLabel>
          <Slider
            id="canvas-flash-intensity"
            min={0}
            max={1}
            step={0.1}
            value={canvasFlashIntensity}
            onChange={(val) => {
              setCanvasFlashIntensity(val);
              visualSettingsManager.updateCanvasGlitchSettings(
                canvasGlitchEnabled,
                canvasGlitchIntensity,
                canvasFlickerEnabled,
                canvasFlickerIntensity,
                canvasFlashEnabled,
                val
              );
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('td-settings-changed'));
              }
              setQualityPreset('custom');
            }}
            colorScheme="purple"
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb boxSize={6} fontSize="10px" fontWeight="bold">
              <Flex w="100%" h="100%" alignItems="center" justifyContent="center">
                <Text fontSize="xs">{canvasFlashIntensity.toFixed(1)}</Text>
              </Flex>
            </SliderThumb>
          </Slider>
        </FormControl>
        
        <Divider borderColor="#3D4756" my={2} />
        
        <FormControl display="flex" alignItems="center" mb={2}>
          <FormLabel htmlFor="terminal-force-scroll-toggle" mb="0">
            Auto-Scroll Terminal
          </FormLabel>
          <Switch
            id="terminal-force-scroll-toggle"
            isChecked={terminalForceScroll}
            onChange={() => {
              // Set the new state locally
              setTerminalForceScroll(!terminalForceScroll);
              
              // Apply the change immediately
              setTimeout(() => {
                visualSettingsManager.updateTerminalScrolling(
                  !terminalForceScroll, // Use inverted value
                  terminalScrollFrequency
                );
                audioManager.playSoundEffect('ui-hover');
                
                // Trigger event notification to update terminal immediately
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('td-settings-changed'));
                }
              }, 0);
            }}
            colorScheme="cyan"
          />
        </FormControl>
        
        <FormControl isDisabled={!terminalForceScroll}>
          <FormLabel htmlFor="terminal-scroll-frequency" mb={2}>
            Scroll Frequency
          </FormLabel>
          <RadioGroup
            id="terminal-scroll-frequency"
            value={terminalScrollFrequency}
            onChange={(val) => {
              setTerminalScrollFrequency(val);
              
              // Apply change immediately
              visualSettingsManager.updateTerminalScrolling(
                terminalForceScroll,
                val
              );
              
              // Play feedback sound
              audioManager.playSoundEffect('ui-hover');
              
              // Trigger event notification
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('td-settings-changed'));
              }
            }}
            colorScheme="cyan"
          >
            <HStack spacing={4} mt={2}>
              <Radio value="every">Every Message</Radio>
              <Radio value="batch">After Batch</Radio>
              <Radio value="manual">Manual Only</Radio>
            </HStack>
          </RadioGroup>
        </FormControl>
      </VStack>
    </AccordionPanel>
  </AccordionItem>
);

export default TerminalGlitchSettingsSection;
