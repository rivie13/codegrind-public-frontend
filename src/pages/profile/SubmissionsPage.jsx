import { Box, Button, Container, Flex, Heading, Icon, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import PageTemplate from '../../components/layout/PageTemplate';
import SubmissionsDashboard from '../../components/submissions/SubmissionsDashboard';
import BottomBannerAd from '../../components/ads/BottomBannerAd';
import TopBannerAd from '../../components/ads/TopBannerAd';
import adSlots from '../../config/adSlots';
import { useAuth } from '../../contexts/AuthContext';
import { useSiteRouteTransition } from '../../contexts/SiteRouteTransitionContext';

// Motion components
const MotionBox = motion(Box);

function SubmissionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { startRouteTransition } = useSiteRouteTransition();

  // Handle navigation back to profile
  const handleBackToProfile = () => {
    if (startRouteTransition) {
      startRouteTransition('/profile');
      return;
    }

    navigate('/profile');
  };

  return (
    <PageTemplate title="Submissions">
      <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <Container
          minW={{ base: '100%', md: '800px' }}
          maxW="container.xl"
          py={{ base: 6, md: 8 }}
          px={{ base: 3, md: 0 }}
        >
          <TopBannerAd slotId={adSlots.generic.top} />

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
                SUBMISSIONS WORKSPACE
              </Box>
              <Box fontSize="10px" opacity={0.85} textTransform="uppercase">
                Profile history window
              </Box>
            </Box>
            <Flex
              justifyContent="space-between"
              alignItems={{ base: 'flex-start', md: 'center' }}
              mb={0}
              bg="rgba(255,255,255,0.14)"
              p={{ base: 3, md: 4 }}
              borderRadius="0"
              flexDirection={{ base: 'column', md: 'row' }}
              gap={{ base: 3, md: 0 }}
            >
              <Button
                leftIcon={<Icon as={FaArrowLeft} />}
                onClick={handleBackToProfile}
                width={{ base: '100%', md: 'auto' }}
              >
                Back to Profile
              </Button>
              <MotionBox initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                <Heading
                  color="var(--cg-text)"
                  fontFamily="var(--cg-font-retro-display)"
                  letterSpacing="0.08em"
                  textTransform="uppercase"
                  fontSize={{ base: 'xl', md: '2xl' }}
                  textAlign={{ base: 'center', md: 'left' }}
                >
                  Code Submissions
                </Heading>
                <Text
                  mt={1}
                  fontSize="sm"
                  color="var(--cg-muted)"
                  textAlign={{ base: 'center', md: 'left' }}
                >
                  Review accepted solves, runtimes, and recent submission history.
                </Text>
              </MotionBox>
            </Flex>
          </Box>

          <MotionBox
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            bg="var(--cg-window-face)"
            border="2px solid var(--cg-window-shadow)"
            p={{ base: 4, md: 6 }}
            borderRadius="0"
            mt={4}
            position="relative"
            boxShadow="var(--cg-window-outset), 12px 12px 0 rgba(0,0,0,0.12)"
            _before={{
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '28px',
              background: 'linear-gradient(90deg, var(--cg-header-start), var(--cg-header-end))',
              zIndex: 1,
            }}
          >
            <Text
              position="absolute"
              top="6px"
              left="12px"
              zIndex={2}
              fontSize="xs"
              fontWeight="700"
              letterSpacing="0.08em"
              color="var(--cg-header-text)"
            >
              solve_history.dat
            </Text>
            <Box pt="32px">
              <SubmissionsDashboard userId={user?.id} />
            </Box>
          </MotionBox>
          <BottomBannerAd slotId={adSlots.generic.bottom} />
        </Container>
      </MotionBox>
    </PageTemplate>
  );
}

export default SubmissionsPage;
