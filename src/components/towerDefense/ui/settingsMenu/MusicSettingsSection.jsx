import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Box,
  FormControl,
  FormLabel,
  Heading,
  Select,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Switch,
  Text,
  VStack,
} from '@chakra-ui/react';
import React from 'react';
import { cyberpunkSwitchStyle } from './SettingsMenuShared';

const MusicSettingsSection = ({
  currentTrack,
  availableTracks,
  selectedTrackId,
  musicEnabled,
  musicVolume,
  handleMusicToggle,
  handleMusicVolumeChange,
  handleTrackSelect,
}) => (
  <Box mt={6}>
    <Heading
      size="sm"
      mb={4}
      color="#0a2c9a"
      fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
      textTransform="uppercase"
      letterSpacing="0.08em"
    >
      Background Music
    </Heading>

    {/* Now Playing Display */}
    <Box
      mb={4}
      p={3}
      borderWidth="2px"
      borderColor="#7f7f7f"
      borderRadius="0"
      bg="#efebe7"
      boxShadow="inset 1px 1px 0 rgba(255,255,255,0.72), inset -1px -1px 0 rgba(64,64,64,0.22)"
    >
      <Text
        fontWeight="bold"
        mb={1}
        color="#0a2c9a"
        fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
      >
        Now Playing:
      </Text>
      {currentTrack ? (
        <VStack align="flex-start" spacing={0}>
          <Text
            fontSize="lg"
            fontWeight="bold"
            color="#1f2430"
            fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
          >
            {currentTrack.title}
          </Text>
          <Text fontSize="sm" color="#4f5665" fontFamily="'Tahoma', 'MS Sans Serif', sans-serif">
            by {currentTrack.artist}
          </Text>
          <Text
            fontSize="xs"
            color="#4f5665"
            mt={1}
            fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
          >
            Attribution: {currentTrack.attribution}
          </Text>
        </VStack>
      ) : (
        <Text color="#4f5665" fontFamily="'Tahoma', 'MS Sans Serif', sans-serif">
          No track currently playing
        </Text>
      )}
    </Box>

    <FormControl display="flex" alignItems="center" mb={4}>
      <FormLabel htmlFor="music-toggle" mb="0">
        Enable Music
      </FormLabel>
      <Switch
        id="music-toggle"
        isChecked={musicEnabled}
        onChange={handleMusicToggle}
        colorScheme="purple"
        sx={cyberpunkSwitchStyle}
      />
    </FormControl>

    <FormControl isDisabled={!musicEnabled} mb={4}>
      <FormLabel htmlFor="music-volume" mb={2}>
        Volume
      </FormLabel>
      <Slider
        id="music-volume"
        min={0}
        max={1}
        step={0.01}
        value={musicVolume}
        onChange={handleMusicVolumeChange}
        colorScheme="purple"
      >
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb boxSize={6} fontSize="10px" fontWeight="bold">
          <Box w="100%" h="100%" display="flex" alignItems="center" justifyContent="center">
            <Text fontSize="xs">{Math.round(musicVolume * 100)}</Text>
          </Box>
        </SliderThumb>
      </Slider>
    </FormControl>

    {/* Track Selection */}
    <FormControl isDisabled={!musicEnabled} mb={2}>
      <FormLabel htmlFor="track-selection" mb={2}>
        Select Track
      </FormLabel>
      <Select
        id="track-selection"
        value={selectedTrackId}
        onChange={(e) => handleTrackSelect(e.target.value)}
        bg="#efebe7"
        borderColor="#5d636e"
        _hover={{ borderColor: '#0a2c9a' }}
        color="#1f2430"
        sx={{
          // Style the dropdown options
          '& option': {
            background: '#efebe7',
            color: '#1f2430',
          },
          '& optgroup': {
            background: '#efebe7',
            color: '#0a2c9a',
            fontWeight: 'bold',
          },
        }}
        icon={<ChevronDownIcon color="#0a2c9a" />}
      >
        <option value="">Choose a track...</option>
        <optgroup label="White Bat Audio - Karl Casey">
          {availableTracks
            .filter((track) => track.artist === 'Karl Casey')
            .map((track) => (
              <option key={track.id} value={track.id}>
                {track.title}
              </option>
            ))}
        </optgroup>
      </Select>
    </FormControl>

    {/* Attribution Notice */}
    <Text fontSize="xs" color="#4f5665" mt={6} fontFamily="'Tahoma', 'MS Sans Serif', sans-serif">
      Music provided by Karl Casey @ White Bat Audio. All music is copyright safe for use with
      proper attribution.
      <br />
      Visit{' '}
      <a
        href="https://karlcasey.bandcamp.com/"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#0a2c9a', textDecoration: 'underline' }}
      >
        karlcasey.bandcamp.com
      </a>{' '}
      for more music.
    </Text>
    {/* Attribution Notice for other artists besides Karl Casey */}
    <Text fontSize="xs" color="#4f5665" mt={6} fontFamily="'Tahoma', 'MS Sans Serif', sans-serif">
      All other music provided by other artists. All music is copyright safe for use with proper
      attribution. Visit the about page for more information.
    </Text>
    <Text fontSize="xs" color="#4f5665" mt={4} fontFamily="'Tahoma', 'MS Sans Serif', sans-serif">
      Some sound effects include assets from Zapsplat.com. Used with attribution as required.
    </Text>
  </Box>
);

export default MusicSettingsSection;
