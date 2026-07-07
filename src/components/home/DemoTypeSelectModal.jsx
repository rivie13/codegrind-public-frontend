import {
  Box,
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import React, { useState } from 'react';
import { executeRecaptchaAction } from '../../services/recaptchaService';
import { fetchWithError } from '../../services/api/fetcher';

const WINDOW_OUTSET =
  'inset 1px 1px 0 #ffffff, inset 2px 2px 0 #f3f0ea, inset -1px -1px 0 #636363, inset -2px -2px 0 #8e8e8e';
const WINDOW_INSET =
  'inset 1px 1px 0 #636363, inset 2px 2px 0 #8e8e8e, inset -1px -1px 0 #ffffff, inset -2px -2px 0 #f3f0ea';

export default function DemoTypeSelectModal({
  isOpen,
  onClose,
  onSelectQuickDemo,
  onSelectFullExperience,
}) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null

  const isMobileDevice =
    typeof navigator !== 'undefined' &&
    (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 0 && typeof window !== 'undefined' && window.innerWidth < 1024));

  const handleSendLink = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const token = await executeRecaptchaAction('mobile_handoff');
      await fetchWithError('/api/email/mobile-handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, recaptchaToken: token }),
        skipGuestToken: true,
      });
      setSubmitStatus('success');
    } catch (err) {
      console.error(err);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" isCentered>
      <ModalOverlay backdropFilter="blur(4px)" bg="rgba(40, 52, 68, 0.28)" />
      <ModalContent
        bg="#d4d0c8"
        borderRadius="0"
        color="#1f2430"
        overflow="hidden"
        boxShadow="0 0 0 1px #7f7f7f"
      >
        <ModalHeader
          bg="linear-gradient(90deg, #0a2c9a 0%, #1084d0 100%)"
          color="#f5f7ff"
          fontFamily="var(--cg-font-retro-display)"
          fontSize="sm"
          fontWeight="700"
          letterSpacing="0.08em"
          py={2}
          px={4}
          textTransform="uppercase"
        >
          Select Your Experience
        </ModalHeader>
        <ModalCloseButton
          color="#f5f7ff"
          top={0}
          right={3}
          borderRadius="0"
          _hover={{ bg: 'rgba(255,255,255,0.12)' }}
          _active={{ bg: 'rgba(0,0,0,0.12)' }}
        />
        <ModalBody bg="#d4d0c8" px={{ base: 4, md: 5 }} py={{ base: 4, md: 5 }}>
          <VStack align="stretch" spacing={5}>
            {isMobileDevice && (
              <Box
                bg="#efebe7"
                border="2px solid #5d636e"
                boxShadow="inset 1px 1px 0 rgba(255,255,255,0.72), inset -1px -1px 0 rgba(64,64,64,0.22)"
                p={4}
                mb={2}
              >
                <Text
                  color="#c00000"
                  fontFamily="var(--cg-font-retro-display)"
                  fontSize="sm"
                  fontWeight="700"
                  letterSpacing="0.06em"
                  mb={2}
                  textTransform="uppercase"
                >
                  ⚠️ MOBILE ADVISORY
                </Text>
                <Text
                  color="#1f2430"
                  fontFamily="var(--cg-font-retro-terminal)"
                  fontSize="sm"
                  lineHeight="1.6"
                  mb={4}
                >
                  While CodeGrind is mobile-compatible, the full cyberpunk split-screen IDE,
                  automated terminal compilation, and interactive safehouse systems are highly
                  optimized for desktop viewports.
                </Text>

                <VStack align="stretch" spacing={3} mt={2}>
                  <Text
                    color="#0a2c9a"
                    fontFamily="var(--cg-font-retro-display)"
                    fontSize="xs"
                    fontWeight="700"
                    textTransform="uppercase"
                    letterSpacing="0.06em"
                  >
                    Email link to your desktop:
                  </Text>

                  {submitStatus === 'success' ? (
                    <Box
                      p={3}
                      bg="#d4ebd4"
                      border="1px solid #2e7d32"
                      color="#1b5e20"
                      fontFamily="var(--cg-font-retro-terminal)"
                      fontSize="sm"
                    >
                      ✓ Connection link dispatched. Check your inbox to login and resume on desktop!
                    </Box>
                  ) : (
                    <form onSubmit={handleSendLink}>
                      <HStack align="stretch" spacing={2} direction={{ base: 'column', sm: 'row' }}>
                        <Box flex={1}>
                          <input
                            type="email"
                            required
                            placeholder="Enter your email address..."
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isSubmitting}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              backgroundColor: '#ffffff',
                              color: '#1f2430',
                              border: '2px solid #7f7f7f',
                              borderRadius: '0',
                              boxShadow: 'var(--cg-window-inset)',
                              fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
                              fontSize: '14px',
                              outline: 'none',
                            }}
                          />
                        </Box>
                        <Button
                          type="submit"
                          isLoading={isSubmitting}
                          disabled={isSubmitting}
                          h="auto"
                          py={2}
                          px={4}
                          borderRadius="0"
                          bg="#d4d0c8"
                          color="#0a2c9a"
                          border="1px solid #7f7f7f"
                          boxShadow="var(--cg-window-outset)"
                          fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                          fontWeight="700"
                          fontSize="xs"
                          textTransform="uppercase"
                          letterSpacing="0.06em"
                          _hover={{ bg: '#efebe7' }}
                          _active={{
                            boxShadow: 'var(--cg-window-inset)',
                            transform: 'translateY(1px)',
                          }}
                        >
                          Send Link
                        </Button>
                      </HStack>
                      {submitStatus === 'error' && (
                        <Text
                          color="#c00000"
                          fontFamily="var(--cg-font-retro-terminal)"
                          fontSize="xs"
                          mt={1}
                        >
                          ⚠️ Submission failed. Please enter a valid email and try again.
                        </Text>
                      )}
                    </form>
                  )}
                </VStack>
              </Box>
            )}

            <Box bg="#efebe7" border="1px solid #7f7f7f" boxShadow={WINDOW_INSET} p={4}>
              <Text
                color="#0a2c9a"
                fontFamily="var(--cg-font-retro-display)"
                fontSize="sm"
                fontWeight="700"
                letterSpacing="0.06em"
                mb={2}
                textTransform="uppercase"
              >
                Launch Protocol
              </Text>
              <Text
                color="#1f2430"
                fontFamily="var(--cg-font-retro-terminal)"
                fontSize="sm"
                lineHeight="1.7"
              >
                Choose how you want to experience the CodeGrind simulation. You can dive straight
                into the tower defense combat, or play the full prologue including the apartment
                safehouse.
              </Text>
            </Box>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Button
                h="auto"
                minH="160px"
                onClick={onSelectQuickDemo}
                px={4}
                py={4}
                borderRadius="0"
                whiteSpace="normal"
                textAlign="center"
                bg="#efebe7"
                border="1px solid"
                borderColor="#7f7f7f"
                boxShadow={WINDOW_OUTSET}
                _hover={{ bg: '#f7f3ee', borderColor: '#0a2c9a' }}
                _active={{ boxShadow: WINDOW_INSET, bg: '#d8d3cb' }}
              >
                <VStack spacing={3} width="100%">
                  <Text
                    color="#1f2430"
                    fontFamily="var(--cg-font-retro-display)"
                    fontSize="md"
                    fontWeight="700"
                    letterSpacing="0.06em"
                    textTransform="uppercase"
                  >
                    Quick Demo
                  </Text>
                  <Text
                    color="#565e6b"
                    fontFamily="var(--cg-font-retro-terminal)"
                    fontSize="sm"
                    lineHeight="1.6"
                  >
                    Skip the intro sequence and start placing towers immediately. Perfect if you
                    just want to see the gameplay.
                  </Text>
                </VStack>
              </Button>

              <Button
                h="auto"
                minH="160px"
                onClick={onSelectFullExperience}
                px={4}
                py={4}
                borderRadius="0"
                whiteSpace="normal"
                textAlign="center"
                bg="#efebe7"
                border="1px solid"
                borderColor="#7f7f7f"
                boxShadow={WINDOW_OUTSET}
                _hover={{ bg: '#f7f3ee', borderColor: '#0a2c9a' }}
                _active={{ boxShadow: WINDOW_INSET, bg: '#d8d3cb' }}
              >
                <VStack spacing={3} width="100%">
                  <Text
                    color="#1f2430"
                    fontFamily="var(--cg-font-retro-display)"
                    fontSize="md"
                    fontWeight="700"
                    letterSpacing="0.06em"
                    textTransform="uppercase"
                  >
                    Play Full Experience
                  </Text>
                  <Text
                    color="#565e6b"
                    fontFamily="var(--cg-font-retro-terminal)"
                    fontSize="sm"
                    lineHeight="1.6"
                  >
                    Boot the full cyberpunk OS, explore your apartment safehouse, and experience the
                    complete story prologue.
                  </Text>
                </VStack>
              </Button>
            </SimpleGrid>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
