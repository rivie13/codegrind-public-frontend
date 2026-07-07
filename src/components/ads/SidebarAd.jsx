import { Box } from '@chakra-ui/react';
import React from 'react';
import AdUnit from './AdUnit';

const SidebarAd = ({ slotId = '2345678901' }) => {
  return (
    <Box
      width="100%"
      maxWidth="250px"
      overflow="hidden"
      mb={4}
      maxHeight="1000px"
      position="relative"
    >
      <AdUnit 
        slotId={slotId} 
        format="vertical" 
        style={{ 
          minHeight: '400px', 
          maxHeight: '1000px',
          width: '100%'
        }}
        adCategory="site"
      />
    </Box>
  );
};

export default SidebarAd; 