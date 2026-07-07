import { Box } from '@chakra-ui/react';
import PageTemplate from '../../../../components/layout/PageTemplate';
import BottomBannerAd from '../../../../components/ads/BottomBannerAd';
import SidebarAd from '../../../../components/ads/SidebarAd';
import TopBannerAd from '../../../../components/ads/TopBannerAd';
import adSlots from '../../../../config/adSlots';

function AdsLayout({ children }) {
  return (
    <PageTemplate showGiphyBackground>
      {/* Top banner ad */}
      <Box width="100%" maxWidth="728px" mx="auto" mt={4} mb={6}>
        <TopBannerAd slotId={adSlots.gamesLanding.top} />
      </Box>

      {/* Content with sidebar layout */}
      <Box
        width="100%"
        display="flex"
        flexDirection={{ base: 'column', lg: 'row' }}
        position="relative"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #00FFFF, transparent)',
          zIndex: 0,
        }}
        _after={{
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #FF00DE, transparent)',
          zIndex: 0,
        }}
      >
        {/* Cyberpunk grid background pattern */}
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          opacity="0.05"
          background="linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)"
          backgroundSize="30px 30px"
          pointerEvents="none"
          zIndex={-1}
        />

        {/* Left sidebar ad - only visible on desktop */}
        <Box
          width={{ base: '100%', lg: '250px' }}
          mr={{ base: 0, lg: 6 }}
          mb={{ base: 6, lg: 0 }}
          display={{ base: 'none', lg: 'block' }}
          position="relative"
        >
          <SidebarAd slotId={adSlots.gamesLanding.sidebar} />
        </Box>

        {/* Main content */}
        <Box flex="1">{children}</Box>

        {/* Right sidebar ad */}
        <Box
          width={{ base: '100%', lg: '250px' }}
          ml={{ base: 0, lg: 6 }}
          mt={{ base: 6, lg: 0 }}
          display={{ base: 'none', lg: 'block' }}
          position="relative"
        >
          <SidebarAd slotId={adSlots.gamesLanding.sidebar} />
        </Box>
      </Box>

      {/* Bottom banner ad */}
      <Box width="100%" maxWidth="728px" mx="auto" mt={6} mb={4} pb={10}>
        <BottomBannerAd slotId={adSlots.gamesLanding.bottom} />
      </Box>
    </PageTemplate>
  );
}

export default AdsLayout;
