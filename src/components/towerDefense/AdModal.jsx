import { Box, Button, Checkbox, Flex, Spinner, Text } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import adSlots from '../../config/adSlots';
import AdUnit from '../ads/AdUnit';

const UI_FONT_FAMILY = "'Tahoma', 'MS Sans Serif', sans-serif";

const AdModal = ({
  isOpen,
  onClose,
  onAdComplete,
  title = 'AI Enhancement Sponsor',
  ctaLabel = 'Unlock AI Refinement',
  footerText = 'Watching this ad will reset your daily refinement limit',
  processingText = 'Processing neural enhancement...',
  minViewMs = 5000,
  adTypeOptions = null,
  selectedAdType = null,
  onAdTypeChange = null,
  adTypeLabel = 'Select ad length',
  adTypeSelectionDisabled = false,
  requireAdTypeSelection = false,
  adTypeRequiredText = 'Select an ad length to start the sponsor video.',
  showDismissToggle = false,
  dismissToggleLabel = "Don't show this again",
  dismissToggleChecked = false,
  onDismissToggleChange,
  showSkipButton = false,
  skipLabel = 'Use basic version',
  onSkip,
}) => {
  const [adViewed, setAdViewed] = useState(false);

  const canStartAd = !requireAdTypeSelection || Boolean(selectedAdType);

  // Use the video ad slot if available
  const modalAdSlot = adSlots.video?.inArticle || adSlots.generic.sidebar;

  // Set a timer for the minimum ad view time
  useEffect(() => {
    if (!isOpen) return undefined;

    // Reset viewed state when modal opens
    setAdViewed(false);

    if (!canStartAd) return undefined;

    // Wait for a minimum view time
    const timer = setTimeout(() => {
      setAdViewed(true);
    }, minViewMs);

    return () => clearTimeout(timer);
  }, [isOpen, minViewMs, canStartAd]);

  // Handle ad completion
  const handleAdComplete = () => {
    // Close the modal
    setAdViewed(false);

    // Call the completion callback
    if (onAdComplete) {
      onAdComplete();
    }

    // Close the modal
    if (onClose) {
      onClose();
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
      return;
    }
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      backgroundColor="rgba(40, 52, 68, 0.28)"
      backdropFilter="blur(3px)"
      display="flex"
      justifyContent="center"
      alignItems="center"
      zIndex={1000}
      className="refinement-ad-modal-overlay"
    >
      <Box
        className="cg-panel-window refinement-ad-modal"
        width="90%"
        maxWidth="600px"
        backgroundColor="#d4d0c8"
        borderRadius="0"
        overflow="hidden"
      >
        <Flex
          className="cg-titlebar"
          px={3}
          py={2}
          justifyContent="space-between"
          alignItems="center"
        >
          <Text
            color="#f5f7ff"
            fontFamily={UI_FONT_FAMILY}
            fontSize={{ base: 'xs', md: 'sm' }}
            fontWeight="700"
            letterSpacing="0.08em"
            textTransform="uppercase"
          >
            {title}
          </Text>

          {adViewed && (
            <Button onClick={handleAdComplete} size="sm" color="var(--cg-accent-blue)">
              Terminate
            </Button>
          )}
        </Flex>

        <Box padding="20px" bg="#d4d0c8" className="refinement-ad-modal-content">
          <Box
            bg="#efebe7"
            border="1px solid #7f7f7f"
            boxShadow="var(--cg-window-inset)"
            p={{ base: 4, md: 5 }}
          >
            {adTypeOptions && (
              <Box mb={3}>
                <Text
                  fontSize="sm"
                  color="#4a5160"
                  fontFamily={UI_FONT_FAMILY}
                  mb={2}
                  textTransform="uppercase"
                  letterSpacing="0.08em"
                >
                  {adTypeLabel}
                </Text>
                {adTypeSelectionDisabled || !onAdTypeChange ? (
                  <Text fontSize="sm" color="#0a2c9a" fontFamily={UI_FONT_FAMILY} fontWeight="700">
                    {selectedAdType && adTypeOptions[selectedAdType]
                      ? adTypeOptions[selectedAdType].label
                      : 'Selected'}
                  </Text>
                ) : (
                  <Flex gap={2} flexWrap="wrap">
                    {Object.entries(adTypeOptions).map(([type, option]) => (
                      <Button
                        key={type}
                        size="xs"
                        color={
                          selectedAdType === type ? 'var(--cg-accent-green)' : 'var(--cg-text)'
                        }
                        onClick={() => onAdTypeChange(type)}
                        isDisabled={adTypeSelectionDisabled}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </Flex>
                )}
              </Box>
            )}
            <AdUnit
              slotId={modalAdSlot}
              format="fluid"
              style={{
                minHeight: '300px',
                width: '100%',
                margin: '0 auto',
                border: '1px solid #7f7f7f',
                borderRadius: '0',
                overflow: 'hidden',
                opacity: canStartAd ? 1 : 0.6,
                filter: canStartAd ? 'none' : 'grayscale(30%)',
              }}
              adType="video"
              adCategory="reward"
            />

            {!adViewed ? (
              <Flex
                alignItems="center"
                justifyContent="center"
                gap="8px"
                margin="15px 0 0"
                padding="8px"
                background="#efebe7"
                borderRadius="0"
                border="1px solid #7f7f7f"
                boxShadow="var(--cg-window-inset)"
                className="refinement-ad-timer"
              >
                {canStartAd ? (
                  <>
                    <Spinner size="sm" color="#0a2c9a" />
                    <Text fontFamily={UI_FONT_FAMILY} color="#1f2430" fontSize="0.9rem">
                      {processingText}
                    </Text>
                  </>
                ) : (
                  <Text fontFamily={UI_FONT_FAMILY} color="#7a2800" fontSize="0.9rem">
                    {adTypeRequiredText}
                  </Text>
                )}
              </Flex>
            ) : (
              <Button
                onClick={handleAdComplete}
                color="var(--cg-accent-green)"
                width="100%"
                mt={4}
                fontFamily={UI_FONT_FAMILY}
              >
                {ctaLabel}
              </Button>
            )}

            <Box mt={3} textAlign="center">
              <Text fontSize="sm" color="#4a5160" fontFamily={UI_FONT_FAMILY}>
                {footerText}
              </Text>
              {showSkipButton && (
                <Button mt={2} size="sm" color="var(--cg-muted)" onClick={handleSkip}>
                  {skipLabel}
                </Button>
              )}
              {showDismissToggle && (
                <Checkbox
                  mt={3}
                  colorScheme="blue"
                  isChecked={dismissToggleChecked}
                  onChange={onDismissToggleChange}
                >
                  <Text fontSize="xs" color="#4a5160" fontFamily={UI_FONT_FAMILY}>
                    {dismissToggleLabel}
                  </Text>
                </Checkbox>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AdModal;
