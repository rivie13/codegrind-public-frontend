import { Box, Container } from '@chakra-ui/react';
import React from 'react';
import Leaderboards from '../../components/leaderboards/Leaderboards';
import PageTemplate from '../../components/layout/PageTemplate';
import PageSeo from '../../components/seo/PageSeo';
import BottomBannerAd from '../../components/ads/BottomBannerAd';
import TopBannerAd from '../../components/ads/TopBannerAd';
import adSlots from '../../config/adSlots';

function LeaderboardsPage() {
  return (
    <PageTemplate title="Global Leaderboard" showGiphyBackground>
      <PageSeo
        title="Global Coding Leaderboard: Top Coders on CodeGrind"
        description="See who is putting in the most coding practice on CodeGrind. The global leaderboard ranks XP from real problem solves, cluster completions, and Code Breach tower defense missions."
        path="/leaderboards"
        keywords="coding leaderboard, programming leaderboard, dsa practice leaderboard, codegrind leaderboard, top coders"
      />
      {/* Top banner ad */}
      <Box width="100%" maxWidth="728px" mx="auto" mt={4} mb={6}>
        <TopBannerAd slotId={adSlots.generic.top} />
      </Box>

      <Box width="100%" display="flex" flexDirection="column" position="relative">
        <Box flex="1" px={{ base: 2, md: 3 }}>
          <Container maxW="container.xl" pb={8} px={0}>
            <Box className="cg-panel-window" overflow="hidden">
              <Box
                className="cg-titlebar"
                px={{ base: 3, md: 4 }}
                py={2}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                gap={3}
              >
                <Box fontSize={{ base: 'xs', md: 'sm' }} fontWeight="700" letterSpacing="0.08em">
                  GLOBAL LEADERBOARD
                </Box>
                <Box fontSize="10px" opacity={0.85} textTransform="uppercase">
                  Ranking workspace
                </Box>
              </Box>
              <Box bg="rgba(255,255,255,0.14)" p={{ base: 2, md: 3 }}>
                <Leaderboards />
              </Box>
            </Box>
          </Container>
        </Box>
      </Box>

      {/* Bottom banner ad */}
      <Box width="100%" maxWidth="728px" mx="auto" mt={6} mb={10} pb={10}>
        <BottomBannerAd slotId={adSlots.generic.bottom} />
      </Box>
    </PageTemplate>
  );
}

export default LeaderboardsPage;
