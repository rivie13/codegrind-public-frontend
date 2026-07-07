import { Box, Button, Container, HStack, Text, VStack } from '@chakra-ui/react';
import React, { useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import adSlots from '../../config/adSlots';
import BottomBannerAd from '../../components/ads/BottomBannerAd';
import TopBannerAd from '../../components/ads/TopBannerAd';
import PageTemplate from '../../components/layout/PageTemplate';
import LoadingProfile from '../../components/profileDashboard/LoadingProfile';
import ProfileHeader from '../../components/profileDashboard/ProfileHeader';
import ProfileTabs from '../../components/profileDashboard/ProfileTabs';
import StatsSummary from '../../components/profileDashboard/StatsSummary';
import useProfileData from '../../components/profileDashboard/hooks/useProfileData';

const PublicProfilePage = () => {
  const { userId } = useParams();
  const { userData, isLoading, achievements } = useProfileData(userId, { isPublicView: true });
  const [selectedCategory, setSelectedCategory] = useState('interview');

  if (isLoading) {
    return <LoadingProfile />;
  }

  if (!userData) {
    return (
      <PageTemplate title="Profile" showGiphyBackground>
        <Box color="red.300" fontFamily="monospace" textAlign="center" mt={10}>
          PROFILE.NOT.FOUND
        </Box>
      </PageTemplate>
    );
  }

  const profileShareUrl = userData?.id
    ? `${window.location.origin}/profile/${userData.id}`
    : window.location.href;

  return (
    <PageTemplate title={`Profile • ${userData.username}`} showGiphyBackground>
      <Box
        width="100%"
        maxWidth="728px"
        mx="auto"
        mt={4}
        mb={6}
        display={{ base: 'none', md: 'block' }}
      >
        <TopBannerAd slotId={adSlots.profileDashboard.top} />
      </Box>

      <Box
        width="100%"
        display="flex"
        flexDirection={{ base: 'column', lg: 'row' }}
        position="relative"
        overflowX="clip"
      >
        <Box flex="1" px={{ base: 2, md: 3 }}>
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
                PUBLIC PROFILE
              </Box>
              <Box fontSize="10px" opacity={0.85} textTransform="uppercase">
                Visitor mode
              </Box>
            </Box>
            <Container
              maxW="container.xl"
              pt={4}
              pb={4}
              px={{ base: 3, md: 4 }}
              bg="rgba(255,255,255,0.14)"
            >
              <VStack spacing={{ base: 6, md: 8 }} align="stretch">
                <ProfileHeader userData={userData} isPublicView shareUrl={profileShareUrl} />

                {/* Visitor CTA banner */}
                <Box
                  p={4}
                  bg="var(--cg-window-face)"
                  border="2px solid var(--cg-window-shadow)"
                  boxShadow="var(--cg-window-outset)"
                  borderRadius="0"
                  textAlign="center"
                >
                  <Text
                    fontFamily="var(--cg-font-retro-display)"
                    fontSize="sm"
                    color="var(--cg-text)"
                    mb={3}
                    letterSpacing="0.5px"
                  >
                    Think you can beat their score?{' '}
                    <Text as="span" color="var(--cg-link)" fontWeight="bold">
                      CodeGrind
                    </Text>{' '}
                    is a free coding practice platform — solve problems, earn XP, and climb the
                    leaderboard.
                  </Text>
                  <HStack spacing={3} justify="center" flexWrap="wrap">
                    <Button as={RouterLink} to="/problems" size="sm">
                      TRY THE DEMO
                    </Button>
                    <Button as={RouterLink} to="/register" size="sm">
                      SIGN UP FREE
                    </Button>
                  </HStack>
                </Box>

                <StatsSummary userData={userData} />

                <ProfileTabs
                  userData={userData}
                  achievements={achievements}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  handleViewSubmissions={null}
                  createdAiProblems={userData?.createdAiProblems}
                  createdAiProblemsTotal={userData?.createdAiProblemsTotal}
                />
              </VStack>
            </Container>
          </Box>
        </Box>
      </Box>

      <Box
        width="100%"
        maxWidth="728px"
        mx="auto"
        mt={6}
        mb={10}
        pb={12}
        display={{ base: 'none', md: 'block' }}
      >
        <BottomBannerAd slotId={adSlots.profileDashboard.bottom} />
      </Box>

      <Box height="100px"></Box>
    </PageTemplate>
  );
};

export default PublicProfilePage;
