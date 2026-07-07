import { Box } from '@chakra-ui/react';
import React from 'react';
import AdUnit from './AdUnit';

const TopBannerAd = ({ slotId = '5056340385', adHeight = '90px', wrapperMb = 4 }) => {
  return (
    <Box
      width="100%"
      overflow="hidden"
      mb={wrapperMb}
      minHeight={adHeight}
      maxHeight={adHeight}
      position="relative"
    >
      <AdUnit
        slotId={slotId}
        format="horizontal"
        style={{
          minHeight: adHeight,
          width: '100%',
        }}
        adCategory="site"
      />
    </Box>
  );
};

export default TopBannerAd;
