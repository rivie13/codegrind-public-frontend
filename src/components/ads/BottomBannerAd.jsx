import { Box } from '@chakra-ui/react';
import React from 'react';
import AdUnit from './AdUnit';

const BottomBannerAd = ({
  slotId = '9351579126',
  adHeight = '90px',
  wrapperMt = 6,
  wrapperMb = 4,
}) => {
  return (
    <Box
      width="100%"
      overflow="hidden"
      mt={wrapperMt}
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

export default BottomBannerAd;
