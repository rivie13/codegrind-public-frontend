import { Box, Flex } from '@chakra-ui/react';
import React from 'react';
import BottomBannerAd from '../../../ads/BottomBannerAd';

const GameContainer = ({
  header,
  gameBoard,
  codeEditor,
  problemDrawer,
  aiChatDrawer,
  adSlotId
}) => {
  return (
    <Box 
      bg="#101820" 
      minH="calc(100vh - 80px)"
      bgSize="cover"
      bgBlendMode="overlay"
      sx={{
        padding: '20px',
        fontSize: '16px',
        '@media (max-height: 900px)': {
          padding: '16px',
          fontSize: '14px',
        },
        '@media (max-height: 768px)': {
          padding: '12px',
          fontSize: '12px',
        },
        '@media (max-height: 600px)': {
          fontSize: '11px',
        },
        '& *': {
          fontSize: 'inherit !important',
        },
      }}
    >
      {header}
      
      <Flex 
        width="100%"
        sx={{
          height: 'auto',
          minHeight: 'calc(100vh - 180px)',
          gap: '20px',
          '@media (max-height: 900px)': {
            minHeight: 'calc(100vh - 160px)',
            gap: '16px',
          },
          '@media (max-height: 800px)': {
            minHeight: '900px',
          },
          '@media (max-height: 768px)': {
            minHeight: 'calc(100vh - 140px)',
            gap: '12px',
          },
        }}
      >
        {/* Left side - Tower Defense Grid */}
        {gameBoard}
        
        {/* Right side - Code Editor */}
        {codeEditor}
      </Flex>
      
      {/* Bottom Banner Ad */}
      <Box mt={4} mb={12} pb={12}>
        <BottomBannerAd slotId={adSlotId} />
      </Box>

      {/* Drawers */}
      {problemDrawer}
      {aiChatDrawer}
    </Box>
  );
};

export default GameContainer; 