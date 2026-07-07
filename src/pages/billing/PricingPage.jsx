import { Box, Container, VStack, useToast } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import BottomBannerAd from '../../components/ads/BottomBannerAd';
import TopBannerAd from '../../components/ads/TopBannerAd';
import SupportContactPanel from '../../components/feedback/SupportContactPanel';
import PageTemplate from '../../components/layout/PageTemplate';
import { useAuth } from '../../contexts/AuthContext';
import adSlots from '../../config/adSlots';
import { api } from '../../services/api';
import { getUserFacingErrorMessage } from '../../utils/ui/userFacingErrors';
import BenefitsSection from './components/BenefitsSection';
import CallToAction from './components/CallToAction';
import ComingSoonSection from './components/ComingSoonSection';
import CurrentStatus from './components/CurrentStatus';
import FooterNote from './components/FooterNote';
import PlanSelector from './components/PlanSelector';
import PricingHeader from './components/PricingHeader';
import StatusBanner from './components/StatusBanner';

const PricingPage = () => {
  const { user, isAuthenticated, refreshAuth } = useAuth();
  const [checkoutStatus, setCheckoutStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingTier, setLoadingTier] = useState(null);
  const [isSyncingTier, setIsSyncingTier] = useState(false);
  const [billingCycle, setBillingCycle] = useState('MONTHLY');
  const navigate = useNavigate();
  const toast = useToast();

  const membershipTier = user?.membershipTier || 'FREE';
  const displayTier = membershipTier;
  const subscriptionInterval = user?.subscriptionInterval
    ? user.subscriptionInterval.toString().toUpperCase()
    : null;

  const tierRank = {
    FREE: 0,
    PREMIUM: 1,
    UNLIMITED: 2,
  };

  const intervalRank = {
    MONTHLY: 0,
    QUARTERLY: 1,
    YEARLY: 2,
  };

  const resolveActionLabel = (targetTier, targetInterval) => {
    if (displayTier === 'FREE') {
      return targetTier === 'FREE' ? 'Current Tier' : 'Upgrade';
    }

    if (displayTier === targetTier) {
      if (subscriptionInterval && subscriptionInterval === targetInterval) {
        return 'Current Tier';
      }

      if (subscriptionInterval) {
        const currentRank = intervalRank[subscriptionInterval] ?? 0;
        const targetRank = intervalRank[targetInterval] ?? 0;
        return targetRank > currentRank ? 'Upgrade' : 'Downgrade';
      }

      return 'Change Plan';
    }

    const currentTierRank = tierRank[displayTier] ?? 0;
    const targetTierRank = tierRank[targetTier] ?? 0;
    return targetTierRank > currentTierRank ? 'Upgrade' : 'Downgrade';
  };

  const premiumActionLabel = resolveActionLabel('PREMIUM', billingCycle);
  const unlimitedActionLabel = resolveActionLabel('UNLIMITED', billingCycle);
  const isPremiumCurrent = premiumActionLabel === 'Current Tier';
  const isUnlimitedCurrent = unlimitedActionLabel === 'Current Tier';
  const cancelScheduled = Boolean(user?.subscriptionCancelAtPeriodEnd);
  const cancelAtDate = user?.subscriptionCancelAt ? new Date(user.subscriptionCancelAt) : null;
  const isResumeLoading = loadingTier === 'PREMIUM' || loadingTier === 'UNLIMITED';

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('success')) {
      setCheckoutStatus('success');
      setErrorMessage('');
      refreshAuth?.();
    }

    if (query.get('canceled')) {
      setCheckoutStatus('canceled');
    }
  }, [refreshAuth]);

  useEffect(() => {
    if (checkoutStatus !== 'success') return;
    if (displayTier !== 'FREE') return;

    let attempts = 0;
    setIsSyncingTier(true);

    const interval = setInterval(async () => {
      attempts += 1;
      await refreshAuth?.();

      if (attempts >= 6) {
        clearInterval(interval);
        setIsSyncingTier(false);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [checkoutStatus, displayTier, refreshAuth]);

  const showBillingErrorToast = (message) => {
    const safeMessage = getUserFacingErrorMessage(
      message,
      'We could not start that billing action right now. Please try again.'
    );

    if (typeof toast.isActive === 'function' && toast.isActive('billing-action-failed')) {
      return;
    }

    toast({
      id: 'billing-action-failed',
      title: 'Billing action failed',
      description: safeMessage,
      status: 'warning',
      duration: 3200,
      isClosable: true,
      position: 'top',
    });
  };

  const handleCheckout = async (tier, interval = billingCycle) => {
    if (!isAuthenticated) {
      const message = 'Please sign in to upgrade your membership.';
      setErrorMessage(message);
      showBillingErrorToast(message);
      return;
    }

    setErrorMessage('');
    setLoadingTier(`${tier}_${interval}`);

    try {
      const response = await api.payments.createCheckoutSession(tier, interval);
      if (response?.url) {
        window.location.href = response.url;
        return;
      }

      if (response?.updated) {
        setCheckoutStatus('success');
        await refreshAuth?.();
        navigate('/profile?payment=success');
        return;
      }

      throw new Error('Checkout session could not be created.');
    } catch (error) {
      const message = error.message || 'Failed to start checkout.';
      setErrorMessage(message);
      showBillingErrorToast(message);
    } finally {
      setLoadingTier(null);
    }
  };

  const handleManageBilling = async () => {
    setErrorMessage('');

    try {
      const response = await api.payments.createPortalSession();
      if (!response?.url) {
        throw new Error('Billing portal could not be opened.');
      }

      window.location.href = response.url;
    } catch (error) {
      const message = error.message || 'Failed to open billing portal.';
      setErrorMessage(message);
      showBillingErrorToast(message);
    }
  };

  const handleResumeSubscription = async () => {
    if (!isAuthenticated) {
      const message = 'Please sign in to manage your subscription.';
      setErrorMessage(message);
      showBillingErrorToast(message);
      return;
    }

    setErrorMessage('');
    const resumeTier = displayTier === 'UNLIMITED' ? 'UNLIMITED' : 'PREMIUM';
    setLoadingTier(`${resumeTier}_${billingCycle}`);

    try {
      const response = await api.payments.createCheckoutSession(resumeTier, billingCycle);
      if (response?.url) {
        window.location.href = response.url;
        return;
      }

      await refreshAuth?.();
      setCheckoutStatus('success');
    } catch (error) {
      const message = error.message || 'Failed to resume subscription.';
      setErrorMessage(message);
      showBillingErrorToast(message);
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <PageTemplate showGiphyBackground giphyOpacity={0.3}>
      <Box position="relative" width="100%" minHeight="100vh" overflow="hidden" bg="transparent">
        <Box
          width="100%"
          maxWidth="728px"
          mx="auto"
          mt={4}
          mb={6}
          display={{ base: 'none', md: 'block' }}
        >
          <TopBannerAd slotId={adSlots.generic.top} />
        </Box>

        <Container
          maxW="container.xl"
          py={{ base: 10, md: 20 }}
          px={{ base: 3, md: 6 }}
          position="relative"
          zIndex="1"
        >
          <VStack spacing={{ base: 8, md: 16 }} align="center">
            <PricingHeader
              isAuthenticated={isAuthenticated}
              displayTier={displayTier}
              cancelScheduled={cancelScheduled}
              cancelAtDate={cancelAtDate}
              onManageBilling={handleManageBilling}
              onResumeSubscription={handleResumeSubscription}
              isResumeLoading={isResumeLoading}
            />

            <StatusBanner
              checkoutStatus={checkoutStatus}
              errorMessage={errorMessage}
              displayTier={displayTier}
              isSyncingTier={isSyncingTier}
            />

            <Box
              className="cg-panel-window"
              w="100%"
              maxW={{ base: '100%', md: '3xl' }}
              overflow="hidden"
            >
              <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
                <Box fontSize="xs" fontWeight="700" letterSpacing="0.08em">
                  store shortcut
                </Box>
              </Box>

              <Box
                px={{ base: 5, md: 6 }}
                py={{ base: 4, md: 5 }}
                bg="rgba(255,255,255,0.14)"
                textAlign="center"
              >
                <Box
                  as={RouterLink}
                  to="/store"
                  color="var(--cg-link)"
                  fontFamily="var(--cg-font-retro-display)"
                  fontWeight="bold"
                  display="inline-flex"
                  alignItems="center"
                  justifyContent="center"
                  width={{ base: '100%', sm: 'auto' }}
                  px={{ base: 3, md: 0 }}
                  py={{ base: 2, md: 0 }}
                  _hover={{ color: 'var(--cg-accent-green)' }}
                >
                  Already earning Data Packets? Visit the Store
                </Box>
              </Box>
            </Box>

            <SupportContactPanel
              title="Questions before you upgrade?"
              description="Use billing support for subscriptions, invoices, and plan changes. Use general support for account help or broader questions."
              showBilling
              showInfo
            />

            <Box
              className="cg-panel-window"
              maxW={{ base: '100%', md: '4xl' }}
              w="100%"
              overflow="hidden"
            >
              <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
                <Box fontSize="xs" fontWeight="700" letterSpacing="0.08em">
                  plan comparison
                </Box>
              </Box>

              <VStack
                spacing={{ base: 5, md: 8 }}
                p={{ base: 4, md: 8 }}
                bg="rgba(255,255,255,0.14)"
              >
                <CurrentStatus displayTier={displayTier} onManageBilling={handleManageBilling} />

                <PlanSelector
                  billingCycle={billingCycle}
                  onBillingCycleChange={setBillingCycle}
                  displayTier={displayTier}
                  premiumActionLabel={premiumActionLabel}
                  unlimitedActionLabel={unlimitedActionLabel}
                  isPremiumCurrent={isPremiumCurrent}
                  isUnlimitedCurrent={isUnlimitedCurrent}
                  loadingTier={loadingTier}
                  onCheckout={handleCheckout}
                />

                <BenefitsSection />
                <ComingSoonSection />
                <CallToAction />
              </VStack>
            </Box>

            <FooterNote />
          </VStack>
        </Container>

        <Box
          width="100%"
          maxWidth="728px"
          mx="auto"
          mt={6}
          mb={4}
          pb={12}
          position="relative"
          zIndex={1}
          display={{ base: 'none', md: 'block' }}
        >
          <BottomBannerAd slotId={adSlots.generic.bottom} />
        </Box>
      </Box>
    </PageTemplate>
  );
};

export default PricingPage;
