import { Box } from '@chakra-ui/react';
import React, { useMemo } from 'react';

const GIPHY_MEDIA_URLS = [
  'https://media.giphy.com/media/XDd5b7NUbS1C1PMjUl/giphy.gif',
  'https://media.giphy.com/media/B1xUp52rUnrv1Leakw/giphy.gif',
  'https://media.giphy.com/media/BW51OCstarPBm/giphy.gif',
  'https://media.giphy.com/media/970Sr8vpwEbXG/giphy.gif',
  'https://media.giphy.com/media/4H3Ii5eLChYul9p7NL/giphy.gif',
  'https://media.giphy.com/media/pOEbLRT4SwD35IELiQ/giphy.gif',
  'https://media.giphy.com/media/ToMjGpPcTt3go0nrrFe/giphy.gif',
  'https://media.giphy.com/media/9PcG1RUVwi25kJQCzu/giphy.gif'
];

const GiphyBackground = ({ opacity = 0.22 }) => {
  const selectedSrc = useMemo(() => {
    const index = Math.floor(Math.random() * GIPHY_MEDIA_URLS.length);
    return GIPHY_MEDIA_URLS[index];
  }, []);

  return (
    <Box
      position="absolute"
      top="0"
      left="0"
      right="0"
      bottom="0"
      zIndex="0"
      overflow="hidden"
      pointerEvents="none"
    >
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        opacity={opacity}
        backgroundImage={`url(${selectedSrc})`}
        backgroundRepeat="repeat"
        backgroundSize="320px 320px"
        backgroundPosition="top left"
        sx={{
          filter: 'saturate(0.9)',
          transform: 'scale(1.02)',
          transformOrigin: 'center'
        }}
      />
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bg="linear-gradient(180deg, rgba(10, 12, 16, 0.85) 0%, rgba(10, 12, 16, 0.7) 35%, rgba(10, 12, 16, 0.85) 100%)"
      />
    </Box>
  );
};

export default GiphyBackground;
