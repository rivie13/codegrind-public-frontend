import { Box, Container, useDisclosure, useToast, VStack } from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import adSlots from '../../config/adSlots';
import { useAuth } from '../../contexts/AuthContext';
import { useSiteRouteTransition } from '../../contexts/SiteRouteTransitionContext';
import { api } from '../../services/api';
import BottomBannerAd from '../ads/BottomBannerAd';
import TopBannerAd from '../ads/TopBannerAd';
import SupportContactPanel from '../feedback/SupportContactPanel';
import PageTemplate from '../layout/PageTemplate';
import ClusterProgressWidget from './ClusterProgressWidget';
import DashboardWelcomeModal from './DashboardWelcomeModal';
import useProfileData from './hooks/useProfileData';
import useProfileForm from './hooks/useProfileForm';
import LearningPathProgressWidget from './LearningPathProgressWidget';
import LoadingProfile from './LoadingProfile';
import NextObjectiveWidget from './NextObjectiveWidget';
import PwaInstallCard from './PwaInstallCard';
import ProfileEditModal from './ProfileEditModal';
import ProfileHeader from './ProfileHeader';
import ProfileTabs from './ProfileTabs';
import StatsSummary from './StatsSummary';

const ProfileDashboard = () => {
  const { user } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const navigate = useNavigate();
  const { startRouteTransition } = useSiteRouteTransition();
  const { userData, isLoading, achievements, refreshProfileData } = useProfileData(user?.id);
  const [billingError, setBillingError] = useState('');
  const [billingLoading, setBillingLoading] = useState(false);
  const {
    formData,
    setFormData,
    handleUpdateProfile,
    error,
    isLoading: isUpdating,
    avatarLoading,
    avatarError,
    passwordErrors,
    passwordMatchError,
  } = useProfileForm(userData, onClose, refreshProfileData);
  const [selectedCategory, setSelectedCategory] = useState('interview');
  const [walletSummary, setWalletSummary] = useState({ balance: null, events: [] });

  const loadWalletSummary = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    try {
      const wallet = await api.store.getWallet();
      setWalletSummary({
        balance: Number.isFinite(wallet?.balance) ? wallet.balance : null,
        events: Array.isArray(wallet?.events) ? wallet.events : [],
      });
    } catch {
      setWalletSummary({ balance: null, events: [] });
    }
  }, [user?.id]);

  useEffect(() => {
    loadWalletSummary();
  }, [loadWalletSummary]);

  const handleViewSubmissions = () => {
    if (startRouteTransition) {
      startRouteTransition('/profile/submissions');
      return;
    }

    navigate('/profile/submissions');
  };

  const handleUpgrade = () => {
    if (startRouteTransition) {
      startRouteTransition('/pricing');
      return;
    }

    navigate('/pricing');
  };

  const handleManageBilling = async () => {
    setBillingError('');
    setBillingLoading(true);

    try {
      const response = await api.payments.createPortalSession();
      if (!response?.url) {
        throw new Error('Unable to open billing portal.');
      }

      window.location.href = response.url;
    } catch (error) {
      setBillingError(error.message || 'Unable to open billing portal.');
      if (
        !(typeof toast.isActive === 'function' && toast.isActive('billing-action-failed-profile'))
      ) {
        toast({
          id: 'billing-action-failed-profile',
          title: 'Billing action failed',
          description: 'We could not start that billing action right now. Please try again.',
          status: 'warning',
          duration: 4000,
          isClosable: true,
          position: 'top',
        });
      }
    } finally {
      setBillingLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingProfile />;
  }

  const profileShareUrl = userData?.id ? `${window.location.origin}/profile/${userData.id}` : '';

  return (
    <PageTemplate title="My Dashboard" showGiphyBackground>
      {/* Top banner ad */}
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

      {/* Content with sidebar layout */}
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
                MY DASHBOARD
              </Box>
              <Box fontSize="var(--cg-font-size-meta)" opacity={0.85} textTransform="uppercase">
                Profile workspace
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
                <ProfileHeader
                  userData={userData}
                  onEditProfile={onOpen}
                  avatarLoading={avatarLoading}
                  avatarError={avatarError}
                  onManageBilling={
                    userData?.membershipTier && userData?.membershipTier !== 'FREE'
                      ? handleManageBilling
                      : null
                  }
                  onUpgrade={userData?.membershipTier === 'FREE' ? handleUpgrade : null}
                  billingLoading={billingLoading}
                  billingError={billingError}
                  shareUrl={profileShareUrl}
                  dataPacketsBalance={walletSummary.balance}
                  dataPacketEvents={walletSummary.events}
                />

                <SupportContactPanel
                  title="Need account or billing help?"
                  description="Reach billing for subscription issues, use support for general account help, or send a bug report from here if something breaks on your dashboard."
                  showBilling
                  showInfo
                  showBugReport
                  bugReportProps={{
                    pageType: 'profile-dashboard',
                    pageContext: {
                      profileUserId: userData?.id,
                      username: userData?.username,
                      membershipTier: userData?.membershipTier,
                      subscriptionStatus: userData?.subscriptionStatus,
                    },
                    clientState: {
                      hasActiveSubscription:
                        userData?.membershipTier && userData?.membershipTier !== 'FREE',
                    },
                  }}
                />

                <PwaInstallCard />

                <NextObjectiveWidget userId={user?.id} />

                <LearningPathProgressWidget />

                <ClusterProgressWidget userId={user?.id} />

                <StatsSummary userData={userData} />

                <ProfileTabs
                  userData={userData}
                  achievements={achievements}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  handleViewSubmissions={handleViewSubmissions}
                  createdAiProblems={userData?.createdAiProblems}
                  createdAiProblemsTotal={userData?.createdAiProblemsTotal}
                />
              </VStack>
            </Container>
          </Box>
        </Box>
      </Box>

      {/* Bottom banner ad */}
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

      {/* First-visit welcome tutorial */}
      <DashboardWelcomeModal userId={userData?.id ?? user?.id} />

      {/* Edit Profile Modal */}
      <ProfileEditModal
        isOpen={isOpen}
        onClose={onClose}
        formData={formData}
        setFormData={setFormData}
        handleUpdateProfile={handleUpdateProfile}
        error={error}
        isLoading={isUpdating}
        passwordErrors={passwordErrors}
        passwordMatchError={passwordMatchError}
        avatarError={avatarError}
        avatarLoading={avatarLoading}
        userData={userData}
      />

      <Box height="100px"></Box>
    </PageTemplate>
  );
};

export default ProfileDashboard;
