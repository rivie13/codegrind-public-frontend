import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
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

const VisualSettingsSection = ({
  qualityPreset,
  renderScale,
  handleQualityPresetChange,
  handleRenderScaleChange,
  maxProjectiles,
  setMaxProjectiles,
  particleEffects,
  setParticleEffects,
  particleIntensity,
  setParticleIntensity,
  projectileComplexity,
  setProjectileComplexity,
  projectileTrails,
  setProjectileTrails,
  projectileGlow,
  setProjectileGlow,
  projectileAnimations,
  setProjectileAnimations,
  explosionSize,
  setExplosionSize,
  explosionParticles,
  setExplosionParticles,
  projectileDuration,
  setProjectileDuration,
  explosionEffects,
  setExplosionEffects,
  hitEffects,
  setHitEffects,
  combatText,
  setCombatText,
  handleProjectileSettingsChange,
  handleSpecialEffectsChange
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
            Visual Settings
          </Flex>
        </Box>
        <AccordionIcon />
      </AccordionButton>
    </h2>
    <AccordionPanel pb={4}>
      <VStack spacing={6} align="stretch" py={4}>
        <Box>
          <Heading 
            size="sm" 
            mb={4} 
            color="#00ffcc"
            textShadow="0 0 5px rgba(0, 255, 204, 0.4)"
            fontFamily="'Orbitron', sans-serif"
            letterSpacing="0.5px"
          >
            Visual Quality
          </Heading>
          
          <HStack spacing={2} mb={4}>
            <Button 
              size="sm" 
              colorScheme={qualityPreset === 'high' ? 'green' : 'gray'}
              onClick={() => handleQualityPresetChange('high')}
            >
              High
            </Button>
            <Button 
              size="sm" 
              colorScheme={qualityPreset === 'medium' ? 'blue' : 'gray'}
              onClick={() => handleQualityPresetChange('medium')}
            >
              Medium
            </Button>
            <Button 
              size="sm" 
              colorScheme={qualityPreset === 'low' ? 'yellow' : 'gray'}
              onClick={() => handleQualityPresetChange('low')}
            >
              Low
            </Button>
            <Button 
              size="sm" 
              colorScheme={qualityPreset === 'minimal' ? 'red' : 'gray'}
              onClick={() => handleQualityPresetChange('minimal')}
            >
              Minimal
            </Button>
            <Button 
              size="sm" 
              colorScheme={qualityPreset === 'auto' ? 'purple' : 'gray'}
              onClick={() => handleQualityPresetChange('auto')}
            >
              Auto
            </Button>
          </HStack>
          
          <FormControl mb={4}>
            <FormLabel htmlFor="render-scale" mb={2}>
              Render Scale
            </FormLabel>
            <Slider
              id="render-scale"
              min={0.5}
              max={1.5}
              step={0.1}
              value={renderScale}
              onChange={handleRenderScaleChange}
              colorScheme="green"
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb boxSize={6} fontSize="10px" fontWeight="bold">
                <Flex w="100%" h="100%" alignItems="center" justifyContent="center">
                  <Text fontSize="xs">{renderScale.toFixed(1)}</Text>
                </Flex>
              </SliderThumb>
            </Slider>
          </FormControl>
          
          {qualityPreset === 'custom' && (
            <Badge colorScheme="purple" mb={2}>Custom Settings</Badge>
          )}
        </Box>
        
        {/* Projectile and Effects Accordion */}
        <Accordion allowToggle defaultIndex={[]} mt={2}>
          <AccordionItem border="1px solid" borderColor="#3D4756" borderRadius="md" mb={3}>
            <h2>
              <AccordionButton _hover={{ bg: "#2D3748" }}>
                <Box flex="1" textAlign="left">
                  <Heading size="sm" color="#00ccff">Projectile & Effects Settings</Heading>
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4} bg="#1a1e2a">
              <VStack align="stretch" spacing={4}>
                <FormControl>
                  <FormLabel htmlFor="max-projectiles" mb={2}>
                    Maximum Projectiles
                  </FormLabel>
                  <Slider
                    id="max-projectiles"
                    min={10}
                    max={150}
                    step={10}
                    value={maxProjectiles}
                    onChange={(val) => {
                      setMaxProjectiles(val);
                      handleProjectileSettingsChange();
                    }}
                    colorScheme="cyan"
                  >
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb boxSize={6} fontSize="10px" fontWeight="bold">
                      <Flex w="100%" h="100%" alignItems="center" justifyContent="center">
                        <Text fontSize="xs">{maxProjectiles}</Text>
                      </Flex>
                    </SliderThumb>
                  </Slider>
                </FormControl>
                
                <FormControl display="flex" alignItems="center" mb={2}>
                  <FormLabel htmlFor="particle-effects-toggle" mb="0">
                    Particle Effects
                  </FormLabel>
                  <Switch
                    id="particle-effects-toggle"
                    isChecked={particleEffects}
                    onChange={() => {
                      setParticleEffects(!particleEffects);
                      handleProjectileSettingsChange();
                    }}
                    colorScheme="blue"
                    sx={cyberpunkSwitchStyle}
                  />
                </FormControl>
                
                <FormControl isDisabled={!particleEffects}>
                  <FormLabel htmlFor="particle-intensity" mb={2}>
                    Particle Intensity
                  </FormLabel>
                  <Slider
                    id="particle-intensity"
                    min={0}
                    max={1}
                    step={0.1}
                    value={particleIntensity}
                    onChange={(val) => {
                      setParticleIntensity(val);
                      handleProjectileSettingsChange();
                    }}
                    colorScheme="blue"
                  >
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb boxSize={6} fontSize="10px" fontWeight="bold">
                      <Flex w="100%" h="100%" alignItems="center" justifyContent="center">
                        <Text fontSize="xs">{particleIntensity.toFixed(1)}</Text>
                      </Flex>
                    </SliderThumb>
                  </Slider>
                </FormControl>
                
                <Divider borderColor="#3D4756" />
                
                <FormControl>
                  <FormLabel htmlFor="projectile-complexity" mb={2}>
                    Projectile Detail Level
                    <Text fontSize="xs" color="gray.400" mt={1}>
                      Controls whether projectiles use fancy (high) or minimal (low) visual effects
                    </Text>
                  </FormLabel>
                  <Slider
                    id="projectile-complexity"
                    min={0.2}
                    max={1}
                    step={0.1}
                    value={projectileComplexity}
                    onChange={(val) => {
                      setProjectileComplexity(val);
                      handleProjectileSettingsChange();
                    }}
                    colorScheme="purple"
                  >
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb boxSize={6} fontSize="10px" fontWeight="bold">
                      <Flex w="100%" h="100%" alignItems="center" justifyContent="center">
                        <Text fontSize="xs">{projectileComplexity.toFixed(1)}</Text>
                      </Flex>
                    </SliderThumb>
                  </Slider>
                </FormControl>
                
                <HStack spacing={4}>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="projectile-trails-toggle" mb="0" fontSize="sm">
                      Trails
                    </FormLabel>
                    <Switch
                      id="projectile-trails-toggle"
                      isChecked={projectileTrails}
                      onChange={() => {
                        setProjectileTrails(!projectileTrails);
                        handleProjectileSettingsChange();
                      }}
                      colorScheme="purple"
                      size="sm"
                      sx={cyberpunkSwitchStyle}
                    />
                  </FormControl>
                  
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="projectile-glow-toggle" mb="0" fontSize="sm">
                      Glow
                    </FormLabel>
                    <Switch
                      id="projectile-glow-toggle"
                      isChecked={projectileGlow}
                      onChange={() => {
                        setProjectileGlow(!projectileGlow);
                        handleProjectileSettingsChange();
                      }}
                      colorScheme="purple"
                      size="sm"
                      sx={cyberpunkSwitchStyle}
                    />
                  </FormControl>
                  
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="projectile-animations-toggle" mb="0" fontSize="sm">
                      Animations
                    </FormLabel>
                    <Switch
                      id="projectile-animations-toggle"
                      isChecked={projectileAnimations}
                      onChange={() => {
                        setProjectileAnimations(!projectileAnimations);
                        handleProjectileSettingsChange();
                      }}
                      colorScheme="purple"
                      size="sm"
                      sx={cyberpunkSwitchStyle}
                    />
                  </FormControl>
                </HStack>
                
                <FormControl>
                  <FormLabel htmlFor="explosion-size" mb={2}>
                    Explosion Size
                  </FormLabel>
                  <Slider
                    id="explosion-size"
                    min={0.4}
                    max={1.5}
                    step={0.1}
                    value={explosionSize}
                    onChange={(val) => {
                      setExplosionSize(val);
                      handleProjectileSettingsChange();
                    }}
                    colorScheme="orange"
                  >
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb boxSize={6} fontSize="10px" fontWeight="bold">
                      <Flex w="100%" h="100%" alignItems="center" justifyContent="center">
                        <Text fontSize="xs">{explosionSize.toFixed(1)}</Text>
                      </Flex>
                    </SliderThumb>
                  </Slider>
                </FormControl>
                
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="explosion-particles-toggle" mb="0">
                    Explosion Particles
                  </FormLabel>
                  <Switch
                    id="explosion-particles-toggle"
                    isChecked={explosionParticles}
                    onChange={() => {
                      setExplosionParticles(!explosionParticles);
                      handleProjectileSettingsChange();
                    }}
                    colorScheme="orange"
                    sx={cyberpunkSwitchStyle}
                  />
                </FormControl>

                <Divider borderColor="#3D4756" />

                <Text fontSize="sm" color="#00ccff" fontWeight="bold">
                  Special Effects
                </Text>
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="explosion-effects-toggle" mb="0" fontSize="sm">
                    Explosion Flashes
                  </FormLabel>
                  <Switch
                    id="explosion-effects-toggle"
                    isChecked={explosionEffects}
                    onChange={() => {
                      setExplosionEffects(!explosionEffects);
                      handleSpecialEffectsChange();
                    }}
                    colorScheme="pink"
                    size="sm"
                    sx={cyberpunkSwitchStyle}
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="hit-effects-toggle" mb="0" fontSize="sm">
                    Hit Flashes
                  </FormLabel>
                  <Switch
                    id="hit-effects-toggle"
                    isChecked={hitEffects}
                    onChange={() => {
                      setHitEffects(!hitEffects);
                      handleSpecialEffectsChange();
                    }}
                    colorScheme="pink"
                    size="sm"
                    sx={cyberpunkSwitchStyle}
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="combat-text-toggle" mb="0" fontSize="sm">
                    Combat Text
                    <Text fontSize="xs" color="gray.400">
                      Damage numbers & status tags
                    </Text>
                  </FormLabel>
                  <Switch
                    id="combat-text-toggle"
                    isChecked={combatText}
                    onChange={() => {
                      setCombatText(!combatText);
                      handleSpecialEffectsChange();
                    }}
                    colorScheme="pink"
                    size="sm"
                    sx={cyberpunkSwitchStyle}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel htmlFor="projectile-duration" mb={2}>
                    Projectile Duration
                  </FormLabel>
                  <Slider
                    id="projectile-duration"
                    min={0.5}
                    max={1.5}
                    step={0.1}
                    value={projectileDuration}
                    onChange={(val) => {
                      setProjectileDuration(val);
                      handleProjectileSettingsChange();
                    }}
                    colorScheme="cyan"
                  >
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb boxSize={6} fontSize="10px" fontWeight="bold">
                      <Flex w="100%" h="100%" alignItems="center" justifyContent="center">
                        <Text fontSize="xs">{projectileDuration.toFixed(1)}</Text>
                      </Flex>
                    </SliderThumb>
                  </Slider>
                </FormControl>
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </VStack>
    </AccordionPanel>
  </AccordionItem>
);

export default VisualSettingsSection;
